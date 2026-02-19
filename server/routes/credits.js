const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to verify token (using existing auth middleware if available, or custom check)
// Since we don't have a global auth middleware exported readily, we'll assume the request 
// already has user info or we verify token here. 
// For now, let's rely on the fact that the frontend checks auth, but for security 
// we really should use the auth middleware.
// Let's import the one from admin.js if possible, or just decode here.
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: "Authentication required" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'govi_secret');
        req.user = decoded; // { id, role, ... }
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
};

/**
 * GET /api/credits/balance
 * Get current credit balance and daily limit
 */
router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('credits dailyLimit lastCreditReset isPremium');
        if (!user) return res.status(404).json({ error: "User not found" });

        // Check if reset is needed (display purposes mainly, but good to show accurate future)
        // The middleware does the actual reset on consumption, but here we can simulate it 
        // or just return what's in DB. Lazy reset means DB might be stale "physically" 
        // but logically it resets on next use. 
        // Let's show the user what they WILL have if they use it now.

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        let effectiveCredits = user.credits;
        if (user.lastCreditReset < startOfToday) {
            effectiveCredits = Math.max(user.credits, user.dailyLimit);
        }

        res.json({
            credits: effectiveCredits,
            dailyLimit: user.dailyLimit,
            isPremium: user.isPremium
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/credits/purchase
 * Mock payment endpoint to buy credits
 */
router.post('/purchase', authMiddleware, async (req, res) => {
    try {
        const { amount, packId } = req.body;

        // In a real app, verify Stripe/Payment gateway here.
        // Sandbox: Just add credits.

        const creditsToAdd = Number(amount) || 100;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $inc: { credits: creditsToAdd } },
            { new: true }
        );

        res.json({
            success: true,
            msg: `Successfully purchased ${creditsToAdd} credits`,
            newBalance: user.credits
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
