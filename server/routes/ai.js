const express = require('express');
const router = express.Router();
const checkCredits = require('../middleware/creditMiddleware');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const User = require('../models/User');

// Multer - store uploaded file in memory so we can forward it
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Middleware to verify token is required for credit check to work
const jwt = require('jsonwebtoken');
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: "Authentication required" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'govi_secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
};

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const ALLOWED_CROPS = new Set(['rice', 'tea', 'chili']);
const AI_PREDICT_COST = 25;

async function refundCreditsIfPossible(userId, amount) {
    if (!userId || !amount || amount <= 0) return;
    try {
        await User.updateOne({ _id: userId }, { $inc: { credits: amount } });
    } catch (err) {
        console.error('Credit refund failed:', err);
    }
}

/**
 * POST /api/ai/predict/:crop
 * AI Doctor endpoint - proxies file upload to Python AI service.
 * Cost: 25 credits.
 */
router.post('/predict/:crop', authMiddleware, checkCredits(AI_PREDICT_COST), upload.single('file'), async (req, res) => {
    try {
        const crop = String(req.params.crop || '').toLowerCase();

        if (!ALLOWED_CROPS.has(crop)) {
            return res.status(400).json({ error: 'Invalid crop type' });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No image file provided" });
        }

        // Forward the uploaded file to the Python AI service
        try {
            const formData = new FormData();
            formData.append('file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });

            const response = await axios.post(
                `${AI_SERVICE_URL}/predict/${crop}`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders()
                    },
                    timeout: 60000, // 60s timeout for large images / model inference
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            res.json(response.data);

        } catch (proxyError) {
            // Forward validation/model errors from AI service to client
            if (proxyError.response) {
                return res.status(proxyError.response.status).json(
                    proxyError.response.data || { error: 'AI service rejected the request' }
                );
            }

            // Fail closed when AI service is unreachable (no fake diagnosis)
            console.warn(`AI Service unreachable (${AI_SERVICE_URL}): ${proxyError.message}`);
            await refundCreditsIfPossible(req.user?.id, AI_PREDICT_COST);
            return res.status(503).json({
                error: 'AI service unavailable',
                msg: 'AI service is temporarily unavailable. Please try again shortly.'
            });
        }

    } catch (err) {
        console.error("AI Route Error:", err);
        await refundCreditsIfPossible(req.user?.id, AI_PREDICT_COST);
        res.status(500).json({ error: "AI Service Error" });
    }
});

module.exports = router;
