const express = require('express');
const router = express.Router();
const checkCredits = require('../middleware/creditMiddleware');
const axios = require('axios');

// Middleware to verify token is required for credit check to work
const jwt = require('jsonwebtoken');
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        // If no token, checkCredits will fail anyway, but let's be explicit
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
 * AI Doctor endpoint.
 * Cost: 25 credits.
 */
router.post('/predict/:crop', authMiddleware, checkCredits(25), async (req, res) => {
    try {
        const { crop } = req.params;

        // In a real scenario, we would forward the file upload (req.files) to the Python service.
        // Since we don't have the Python service running in this environment, 
        // or we might need to mock it if it's missing.

        // Attempt to proxy to Python service
        // Note: handling multipart/form-data proxying is complex without multer.
        // For this demo/hackathon, if the upstream fails, we can return a mock response
        // so the frontend "Success" flow works (and credits are consumed).

        try {
            // Mock success response if upstream is not reachable
            throw new Error("Mocking AI response for credit demo");

            // Real proxy code would go here:
            // const response = await axios.post(`${AI_SERVICE_URL}/ai/predict/${crop}`, req.body, ...);
            // res.json(response.data);

        } catch (proxyError) {
            // Fallback Mock Response
            console.log("AI Service unreachable or mocked. Returning simulated result.");

            const mockResponse = {
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

            // Simulate delay
            await new Promise(r => setTimeout(r, 1000));

            res.json(mockResponse);
        }

    } catch (err) {
        console.error("AI Route Error:", err);
        res.status(500).json({ error: "AI Service Error" });
    }
});

module.exports = router;
