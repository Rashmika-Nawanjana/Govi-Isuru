const express = require('express');
const router = express.Router();
const { generateResponse, streamResponse } = require('../services/llamaChatbot');

/**
 * POST /api/llama-chatbot/chat
 */
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

/**
 * POST /api/llama-chatbot/chat/stream
 * Server-Sent Events token stream
 */
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
 * GET /api/llama-chatbot/health
 */
router.get('/health', async (req, res) => {
  const hasToken = !!process.env.HUGGINGFACE_API_TOKEN;

  res.json({
    configured: hasToken,
    message: hasToken
      ? 'Llama chatbot is configured and ready'
      : 'HUGGINGFACE_API_TOKEN not set in environment',
  });
});

module.exports = router;
