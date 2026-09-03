const {
  buildSystemPrompt,
  isOnTopicQuery,
  offTopicRefusal,
  generateMockResponse,
} = require('./chatbotKnowledge');
const { isGoogleConfigured } = require('./googleAuth');

const HUGGINGFACE_API_URL = 'https://router.huggingface.co/v1/chat/completions';
const PRIMARY_MODEL = 'meta-llama/Llama-3.3-70B-Instruct';
const FALLBACK_MODEL = 'meta-llama/Llama-3.1-8B-Instruct';
const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';

function getGemini() {
  // Lazy require avoids circular dependency
  return require('./geminiChatbot');
}

function buildMessages(userMessage, history = [], options = {}) {
  const messages = [];
  for (const msg of history.slice(-10)) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: 'user', content: userMessage });
  return [{ role: 'system', content: buildSystemPrompt(options) }, ...messages];
}

async function callModelAPI(messages, options = {}, modelName = PRIMARY_MODEL) {
  if (!HF_API_TOKEN) {
    throw new Error('HUGGINGFACE_API_TOKEN not set in environment variables');
  }

  const payload = {
    model: modelName,
    messages,
    max_tokens: options.max_tokens || 4096,
    temperature: options.temperature || 0.6,
    top_p: options.top_p || 0.9,
  };

  const response = await fetch(HUGGINGFACE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 503) {
    throw new Error('Model is loading, please try again in 20 seconds');
  }
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Hugging Face API Error: ${response.status} ${errBody}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Unexpected response format from Hugging Face Router API');
  return content.trim();
}

async function* streamModelAPI(messages, options = {}, modelName = PRIMARY_MODEL) {
  if (!HF_API_TOKEN) {
    throw new Error('HUGGINGFACE_API_TOKEN not set in environment variables');
  }

  const payload = {
    model: modelName,
    messages,
    max_tokens: options.max_tokens || 4096,
    temperature: options.temperature || 0.6,
    top_p: options.top_p || 0.9,
    stream: true,
  };

  const response = await fetch(HUGGINGFACE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 503) {
    throw new Error('Model is loading, please try again in 20 seconds');
  }
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Hugging Face API Error: ${response.status} ${errBody}`);
  }
  if (!response.body) throw new Error('No stream body from Hugging Face API');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        /* ignore */
      }
    }
  }
}

async function* streamMockResponse(text) {
  const parts = text.match(/.{1,4}|(\s+)/g) || [text];
  for (const part of parts) {
    yield part;
    await new Promise((r) => setTimeout(r, 22));
  }
}

async function generateResponse(userMessage, history = [], options = {}) {
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

  // Prefer Gemini via Google service account when configured
  if (isGoogleConfigured()) {
    try {
      const gemini = getGemini();
      const result = await gemini.generateGeminiResponse(userMessage, history, options);
      if (result?.success && result.answer) return result;
    } catch (err) {
      console.warn('Gemini unavailable, falling back:', err.message);
    }
  }

  const messages = buildMessages(userMessage, history, options);
  let response;
  let modelUsed = PRIMARY_MODEL;

  try {
    try {
      response = await callModelAPI(messages, options, PRIMARY_MODEL);
    } catch (error) {
      if (
        error.message.includes('loading') ||
        error.message.includes('503') ||
        error.message.includes('Model is loading')
      ) {
        try {
          response = await callModelAPI(messages, options, FALLBACK_MODEL);
          modelUsed = FALLBACK_MODEL;
        } catch {
          response = generateMockResponse(userMessage, language, options);
          modelUsed = 'MOCK';
        }
      } else if (!HF_API_TOKEN || error.message.includes('HUGGINGFACE_API_TOKEN')) {
        response = generateMockResponse(userMessage, language, options);
        modelUsed = 'MOCK';
      } else {
        throw error;
      }
    }

    return {
      success: true,
      answer: response,
      model: modelUsed === 'MOCK' ? 'Assistant' : modelUsed.split('/')[1],
      source: modelUsed === 'MOCK' ? 'Local Knowledge Base' : 'Hugging Face Router API',
    };
  } catch (error) {
    console.error('Chatbot error:', error.message);
    return {
      success: true,
      answer: generateMockResponse(userMessage, language, options),
      model: 'Assistant',
      source: 'Local Knowledge Base',
    };
  }
}

async function* streamResponse(userMessage, history = [], options = {}) {
  const language = options.language || 'en';
  const homeView = options.homeView || 'farmerHub';

  if (!isOnTopicQuery(userMessage)) {
    for await (const chunk of streamMockResponse(offTopicRefusal(language, homeView))) {
      yield { type: 'token', content: chunk };
    }
    yield { type: 'done', model: 'Guardrail', source: 'Topic Guardrail' };
    return;
  }

  if (isGoogleConfigured()) {
    try {
      const gemini = getGemini();
      // Non-stream generate (with internal mock fallback) — Vertex SSE was hanging voice chat
      const result = await Promise.race([
        gemini.generateGeminiResponse(userMessage, history, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini overall timeout')), 12000)
        ),
      ]);
      if (result?.success && result.answer) {
        for await (const chunk of streamMockResponse(result.answer)) {
          yield { type: 'token', content: chunk };
        }
        yield {
          type: 'done',
          model: result.model || 'Assistant',
          source: result.source || 'Google Vertex Gemini',
        };
        return;
      }
    } catch (err) {
      console.warn('Gemini stream failed, falling back:', err.message);
    }
  }

  const messages = buildMessages(userMessage, history, options);
  let modelUsed = PRIMARY_MODEL;

  try {
    try {
      for await (const chunk of streamModelAPI(messages, options, PRIMARY_MODEL)) {
        yield { type: 'token', content: chunk };
      }
    } catch (error) {
      try {
        for await (const chunk of streamModelAPI(messages, options, FALLBACK_MODEL)) {
          modelUsed = FALLBACK_MODEL;
          yield { type: 'token', content: chunk };
        }
      } catch {
        modelUsed = 'MOCK';
        const mock = generateMockResponse(userMessage, language, options);
        for await (const chunk of streamMockResponse(mock)) {
          yield { type: 'token', content: chunk };
        }
      }
    }
  } catch (error) {
    console.error('Stream chatbot error:', error.message);
    modelUsed = 'MOCK';
    const mock = generateMockResponse(userMessage, language, options);
    for await (const chunk of streamMockResponse(mock)) {
      yield { type: 'token', content: chunk };
    }
  }

  yield {
    type: 'done',
    model: modelUsed === 'MOCK' ? 'Assistant' : modelUsed.split('/')[1],
    source: modelUsed === 'MOCK' ? 'Local Knowledge Base' : 'Hugging Face Router API',
  };
}

module.exports = {
  generateResponse,
  streamResponse,
  callModelAPI,
  buildSystemPrompt,
  generateMockResponse,
  isOnTopicQuery,
  offTopicRefusal,
};
