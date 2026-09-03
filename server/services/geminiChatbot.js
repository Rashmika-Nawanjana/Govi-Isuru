const { getGoogleAuth, getGoogleProjectId, isGoogleConfigured } = require('./googleAuth');
const {
  buildSystemPrompt,
  isOnTopicQuery,
  offTopicRefusal,
  generateMockResponse,
} = require('./chatbotKnowledge');

const LOCATION = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
const MODEL = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash-001';

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

function endpoint(stream = false) {
  const project = getGoogleProjectId();
  if (!project) throw new Error('Google project id missing');
  const action = stream ? 'streamGenerateContent' : 'generateContent';
  const qs = stream ? '?alt=sse' : '';
  return `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${project}/locations/${LOCATION}/publishers/google/models/${MODEL}:${action}${qs}`;
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
    const token = await getAccessToken();
    const body = {
      systemInstruction: { parts: [{ text: buildSystemPrompt(options) }] },
      contents: toGeminiContents(history, userMessage),
      generationConfig: {
        temperature: options.temperature || 0.6,
        maxOutputTokens: options.max_tokens || 1024,
      },
    };

    const res = await fetch(endpoint(false), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const answer =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('')?.trim() || '';
    if (!answer) throw new Error('Empty Gemini response');

    return {
      success: true,
      answer,
      model: MODEL,
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

async function* streamGeminiResponse(userMessage, history = [], options = {}) {
  const language = options.language || 'en';
  const homeView = options.homeView || 'farmerHub';

  if (!isOnTopicQuery(userMessage)) {
    yield { type: 'token', content: offTopicRefusal(language, homeView) };
    yield { type: 'done', model: 'Guardrail', source: 'Topic Guardrail' };
    return;
  }

  if (!isGoogleConfigured()) {
    yield { type: 'error', content: 'Google service account not configured' };
    return;
  }

  try {
    const token = await getAccessToken();
    const body = {
      systemInstruction: { parts: [{ text: buildSystemPrompt(options) }] },
      contents: toGeminiContents(history, userMessage),
      generationConfig: {
        temperature: options.temperature || 0.6,
        maxOutputTokens: options.max_tokens || 1024,
      },
    };

    const res = await fetch(endpoint(true), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini stream error ${res.status}: ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const parts = parsed?.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.text) yield { type: 'token', content: part.text };
          }
        } catch {
          /* ignore */
        }
      }
    }

    yield { type: 'done', model: MODEL, source: 'Google Vertex Gemini' };
  } catch (err) {
    console.error('Gemini stream error:', err.message);
    yield { type: 'token', content: generateMockResponse(userMessage, language, options) };
    yield { type: 'done', model: 'Assistant', source: 'Local Knowledge Base' };
  }
}

module.exports = {
  generateGeminiResponse,
  streamGeminiResponse,
  isGoogleConfigured,
  MODEL,
};
