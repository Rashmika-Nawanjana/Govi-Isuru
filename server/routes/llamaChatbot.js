const express = require('express');
const router = express.Router();
const { generateResponse } = require('../services/llamaChatbot');

/**
 * POST /api/llama-chatbot/chat
 * Chat endpoint using Llama 3.1 via Hugging Face Inference API
 * 
 * Request body:
 * {
 *   "message": "What's the best fertilizer for rice?",
 *   "history": [
 *     {"role": "user", "content": "Hello"},
 *     {"role": "assistant", "content": "Hi! How can I help?"}
 *   ],
 *   "options": {
 *     "temperature": 0.7,
 *     "max_tokens": 512
 *   }
 * }
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], options = {} } = req.body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        error: 'Message is required and must be a non-empty string',
      });
    }

    // Validate history format
    if (!Array.isArray(history)) {
      return res.status(400).json({
        error: 'History must be an array',
      });
    }

    // Generate response using Llama 3.1
    const result = await generateResponse(message, history, options);

    console.log('Generation Result:', result);

    if (result.success) {
      const responseData = {
        answer: result.answer,
        model: result.model,
        source: result.source,
      };
      console.log('Sending response to frontend:', responseData);
      return res.json(responseData);
    } else {
      // Return fallback message
      return res.status(503).json({
        error: result.error,
        fallback: result.fallback,
      });
    }
  } catch (error) {
    console.error('Llama chatbot route error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/llama-chatbot/health
 * Check if Hugging Face API is configured and accessible
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
