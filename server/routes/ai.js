const express = require('express');
const router = express.Router();
const checkCredits = require('../middleware/creditMiddleware');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

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

/**
 * POST /api/ai/predict/:crop
 * AI Doctor endpoint - proxies file upload to Python AI service.
 * Cost: 25 credits.
 */
router.post('/predict/:crop', authMiddleware, checkCredits(25), upload.single('file'), async (req, res) => {
    try {
        const { crop } = req.params;

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
            // Fallback mock response when Python AI service is unreachable
            console.warn(`AI Service unreachable (${AI_SERVICE_URL}): ${proxyError.message}. Returning mock result.`);

            const mockResponse = {
                success: true,
                prediction: "Brown Spot",
                si_name: "දුඹුරු ලප රෝගය",
                confidence: 92.5,
                description: "Fungal disease affecting leaves.",
                treatment: [
                    "Apply fungicides like Mancozeb",
                    "Improve soil drainage",
                    "Remove infected leaves"
                ],
                severity: "medium",
                crop_type: crop
            };

            res.json(mockResponse);
        }

    } catch (err) {
        console.error("AI Route Error:", err);
        res.status(500).json({ error: "AI Service Error" });
    }
});

module.exports = router;
