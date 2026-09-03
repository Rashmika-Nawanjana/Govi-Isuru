const { getGoogleAuth, getGoogleProjectId, isGoogleConfigured } = require('./googleAuth');
const {
  buildSystemPrompt,
  isOnTopicQuery,
  offTopicRefusal,
  generateMockResponse,
} = require('./chatbotKnowledge');

const LOCATION = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
const DEFAULT_MODEL = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash-001';
const GEMINI_TIMEOUT_MS = parseInt(process.env.GOOGLE_GEMINI_TIMEOUT_MS || '12000', 10);

const MODEL_CANDIDATES = [
  DEFAULT_MODEL,
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite-001',
  'gemini-1.5-flash-002',
].filter((m, i, arr) => m && arr.indexOf(m) === i);

function toGeminiContents(history = [], userMessage = '') {
  const contents = [];
  for (const msg of history.slice(-10)) {
    if (!msg?.content) continue;
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] });
  return contents;
}

async function getAccessToken() {
  const auth = getGoogleAuth();
  if (!auth) throw new Error('Google auth not configured');
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return typeof token === 'string' ? token : token?.token;
}

function endpointFor(model, stream = false) {
  const project = getGoogleProjectId();
  if (!project) throw new Error('Google project id missing');
  const action = stream ? 'streamGenerateContent' : 'generateContent';
  const qs = stream ? '?alt=sse' : '';
  return `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${project}/locations/${LOCATION}/publishers/google/models/${model}:${action}${qs}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = GEMINI_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Gemini request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function generateWithModel(token, model, body) {
  const res = await fetchWithTimeout(endpointFor(model, false), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini error ${res.status} (${model}): ${errText}`);
  }

  const data = await res.json();
  const answer =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('')?.trim() || '';
  if (!answer) throw new Error(`Empty Gemini response (${model})`);
  return answer;
}

async function generateWithFallback(userMessage, history = [], options = {}) {
  const token = await getAccessToken();
  const body = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(options) }] },
    contents: toGeminiContents(history, userMessage),
    generationConfig: {
      temperature: options.temperature || 0.6,
      maxOutputTokens: options.max_tokens || 1024,
    },
  };

  let lastError = null;
  for (const model of MODEL_CANDIDATES) {
    try {
      const answer = await generateWithModel(token, model, body);
      return { answer, model };
    } catch (err) {
      lastError = err;
      console.warn(`Gemini model ${model} failed:`, err.message.slice(0, 240));
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

async function* chunkText(text, size = 24) {
  const value = String(text || '');
  for (let i = 0; i < value.length; i += size) {
    yield value.slice(i, i + size);
    await new Promise((r) => setTimeout(r, 12));
  }
}

async function generateGeminiResponse(userMessage, history = [], options = {}) {
  const language = options.language || 'en';
  const homeView = options.homeView || 'farmerHub';

  if (!isOnTopicQuery(userMessage)) {
    return {
      success: true,
      answer: offTopicRefusal(language, homeView),
      model: 'Guardrail',
      source: 'Topic Guardrail',
    };
  }

  if (!isGoogleConfigured()) {
    return { success: false, error: 'Google service account not configured' };
  }

  try {
    const { answer, model } = await generateWithFallback(userMessage, history, options);
    return {
      success: true,
      answer,
      model,
      source: 'Google Vertex Gemini',
    };
  } catch (err) {
    console.error('Gemini generate error:', err.message);
    return {
      success: true,
      answer: generateMockResponse(userMessage, language, options),
      model: 'Assistant',
      source: 'Local Knowledge Base',
      warning: err.message,
    };
  }
}

/**
 * Prefer timed non-stream generate + chunked yield.
 * Vertex SSE was hanging on unavailable models and freezing voice chat.
 */
async function* streamGeminiResponse(userMessage, history = [], options = {}) {
  const language = options.language || 'en';
  const homeView = options.homeView || 'farmerHub';

  if (!isOnTopicQuery(userMessage)) {
    const refusal = offTopicRefusal(language, homeView);
    for await (const part of chunkText(refusal)) {
      yield { type: 'token', content: part };
    }
    yield { type: 'done', model: 'Guardrail', source: 'Topic Guardrail' };
    return;
  }

  if (!isGoogleConfigured()) {
    yield { type: 'error', content: 'Google service account not configured' };
    return;
  }

  try {
    const { answer, model } = await generateWithFallback(userMessage, history, options);
    for await (const part of chunkText(answer)) {
      yield { type: 'token', content: part };
    }
    yield { type: 'done', model, source: 'Google Vertex Gemini' };
  } catch (err) {
    console.error('Gemini stream error:', err.message);
    const mock = generateMockResponse(userMessage, language, options);
    for await (const part of chunkText(mock)) {
      yield { type: 'token', content: part };
    }
    yield { type: 'done', model: 'Assistant', source: 'Local Knowledge Base' };
  }
}

module.exports = {
  generateGeminiResponse,
  streamGeminiResponse,
  isGoogleConfigured,
  MODEL: DEFAULT_MODEL,
  MODEL_CANDIDATES,
};
