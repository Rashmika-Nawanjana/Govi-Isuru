const { getGoogleAuth, getGoogleProjectId, isGoogleConfigured } = require('./googleAuth');
const {
  buildSystemPrompt,
  isOnTopicQuery,
  offTopicRefusal,
  generateMockResponse,
} = require('./chatbotKnowledge');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const LOCATION = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
const DEFAULT_MODEL = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_TIMEOUT_MS = parseInt(process.env.GOOGLE_GEMINI_TIMEOUT_MS || '10000', 10);

function useGeminiApiKey() {
  return Boolean(GEMINI_API_KEY);
}

function isGeminiAvailable() {
  return useGeminiApiKey() || isGoogleConfigured();
}

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

function endpointForApiKey(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

function endpointForVertex(model) {
  const project = getGoogleProjectId();
  if (!project) throw new Error('Google project id missing');
  return `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${project}/locations/${LOCATION}/publishers/google/models/${model}:generateContent`;
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

async function callGemini(model, body) {
  let url, headers;

  if (useGeminiApiKey()) {
    url = endpointForApiKey(model);
    headers = { 'Content-Type': 'application/json' };
  } else {
    const token = await getAccessToken();
    url = endpointForVertex(model);
    headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini error ${res.status} (${model}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const answer =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('')?.trim() || '';
  if (!answer) throw new Error(`Empty Gemini response (${model})`);
  return answer;
}

async function generateWithFallback(userMessage, history = [], options = {}) {
  const body = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(options) }] },
    contents: toGeminiContents(history, userMessage),
    generationConfig: {
      temperature: options.temperature || 0.6,
      maxOutputTokens: options.max_tokens || 1024,
    },
  };

  const model = DEFAULT_MODEL;
  try {
    const answer = await callGemini(model, body);
    return { answer, model };
  } catch (err) {
    console.warn(`Gemini model ${model} failed:`, err.message.slice(0, 240));
    throw err;
  }
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

  if (!isGeminiAvailable()) {
    return { success: false, error: 'Gemini is not configured (set GEMINI_API_KEY or Google service account)' };
  }

  try {
    const { answer, model } = await generateWithFallback(userMessage, history, options);
    return {
      success: true,
      answer,
      model,
      source: useGeminiApiKey() ? 'Google Gemini API' : 'Google Vertex Gemini',
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

  if (!isGeminiAvailable()) {
    yield { type: 'error', content: 'Gemini is not configured' };
    return;
  }

  try {
    const { answer, model } = await generateWithFallback(userMessage, history, options);
    for await (const part of chunkText(answer)) {
      yield { type: 'token', content: part };
    }
    yield { type: 'done', model, source: useGeminiApiKey() ? 'Google Gemini API' : 'Google Vertex Gemini' };
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
  isGoogleConfigured: isGeminiAvailable,
  MODEL: DEFAULT_MODEL,
};
