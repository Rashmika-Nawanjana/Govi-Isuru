const User = require('../models/User');

/**
 * Middleware to check and deduct credits for API usage
 * Implements "Lazy Reset" pattern - compatible with Mongoose 9 / Express 5
 * @param {number} cost - Number of credits to deduct
 */
const checkCredits = (cost) => {
    return async (req, res, next) => {
        try {
            // 1. Get user ID from JWT (assumes auth middleware ran first)
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Authentication required for credit check" });
            }

            // 2. Lazy Reset: read user, check if daily reset is needed
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const currentUser = await User.findById(userId);
            if (!currentUser) {
                return res.status(404).json({ error: "User not found" });
            }

            // Auto-initialize credits for legacy users who don't have these fields
            if (currentUser.credits === undefined || currentUser.credits === null) {
                currentUser.credits = 200;
            }
            if (currentUser.dailyLimit === undefined || currentUser.dailyLimit === null) {
                currentUser.dailyLimit = 200;
            }

            // If lastCreditReset is before today, reset credits
            if (!currentUser.lastCreditReset || currentUser.lastCreditReset < startOfToday) {
                const resetCredits = Math.max(currentUser.credits, currentUser.dailyLimit);
                await User.updateOne(
                    { _id: userId },
                    { $set: { credits: resetCredits, lastCreditReset: new Date() } }
                );
                currentUser.credits = resetCredits;
            }

            // 3. Check if user has enough credits
            if (currentUser.credits < cost) {
                return res.status(403).json({
                    error: "Insufficient credits",
                    msg: "You have used your daily credit limit. Please upgrade or wait for midnight reset.",
                    credits: currentUser.credits,
                    cost: cost
                });
            }

            // 4. Atomic Deduction (Mongoose 9: returns updated doc by default)
            const updatedUser = await User.findOneAndUpdate(
                { _id: userId, credits: { $gte: cost } },
                { $inc: { credits: -cost } }
            );

            if (!updatedUser) {
                // Race condition: credits were consumed between check and deduction
                return res.status(403).json({
                    error: "Insufficient credits",
                    msg: "Credits were consumed by a concurrent request. Please try again.",
                    credits: 0,
                    cost: cost
                });
            }

            // 5. Attach updated credit info and proceed
            req.user = { ...req.user, credits: updatedUser.credits };
            next();

        } catch (err) {
            console.error("Credit check error:", err);
            res.status(500).json({ error: "Server error during credit check" });
        }
    };
};

module.exports = checkCredits;
