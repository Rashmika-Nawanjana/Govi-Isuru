const express = require('express');
const multer = require('multer');
const router = express.Router();
const { generateResponse, streamResponse } = require('../services/llamaChatbot');
const { isGoogleConfigured } = require('../services/googleAuth');
const { transcribeAudio, synthesizeSpeech } = require('../services/googleSpeech');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], options = {} } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        error: 'Message is required and must be a non-empty string',
      });
    }

    if (!Array.isArray(history)) {
      return res.status(400).json({ error: 'History must be an array' });
    }

    const result = await generateResponse(message, history, options);

    if (result.success) {
      return res.json({
        answer: result.answer,
        model: result.model,
        source: result.source,
      });
    }

    return res.status(503).json({
      error: result.error,
      fallback: result.fallback,
    });
  } catch (error) {
    console.error('Llama chatbot route error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

router.post('/chat/stream', async (req, res) => {
  try {
    const { message, history = [], options = {} } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        error: 'Message is required and must be a non-empty string',
      });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    let closed = false;
    req.on('close', () => {
      closed = true;
    });

    for await (const event of streamResponse(message, history, options)) {
      if (closed) break;
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    }

    if (!closed) {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (error) {
    console.error('Llama chatbot stream error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
    res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/llama-chatbot/voice/stt
 * multipart: audio file + language (en|si|ta)
 */
router.post('/voice/stt', upload.single('audio'), async (req, res) => {
  try {
    if (!isGoogleConfigured()) {
      return res.status(503).json({ error: 'Google Speech is not configured' });
    }
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'audio file is required' });
    }

    const language = ['en', 'si', 'ta'].includes(req.body.language) ? req.body.language : 'en';
    const result = await transcribeAudio(req.file.buffer, req.file.mimetype, language);
    return res.json({
      success: true,
      ...result,
      language,
    });
  } catch (error) {
    console.error('Voice STT error:', error);
    return res.status(500).json({ error: 'Speech recognition failed', message: error.message });
  }
});

/**
 * POST /api/llama-chatbot/voice/tts
 * body: { text, language }
 */
router.post('/voice/tts', async (req, res) => {
  try {
    if (!isGoogleConfigured()) {
      return res.status(503).json({ error: 'Google TTS is not configured' });
    }

    const { text, language = 'en' } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'text is required' });
    }

    const lang = ['en', 'si', 'ta'].includes(language) ? language : 'en';
    const audio = await synthesizeSpeech(text, lang);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(audio);
  } catch (error) {
    console.error('Voice TTS error:', error);
    return res.status(500).json({ error: 'Speech synthesis failed', message: error.message });
  }
});

router.get('/voice/status', (req, res) => {
  res.json({
    googleConfigured: isGoogleConfigured(),
    languages: ['en', 'si', 'ta'],
    features: {
      duplexVoice: isGoogleConfigured(),
      stt: isGoogleConfigured(),
      tts: isGoogleConfigured(),
      gemini: isGoogleConfigured(),
    },
  });
});

router.get('/health', async (req, res) => {
  const hasToken = !!process.env.HUGGINGFACE_API_TOKEN;
  const google = isGoogleConfigured();

  res.json({
    configured: hasToken || google,
    huggingface: hasToken,
    google,
    message: google
      ? 'Chatbot ready with Google Gemini + Speech'
      : hasToken
        ? 'Llama chatbot is configured'
        : 'No AI credentials configured',
  });
});

module.exports = router;
