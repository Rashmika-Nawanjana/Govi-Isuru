const User = require('../models/User');

/**
 * Middleware to check and deduct credits for API usage
 * Implements "Lazy Reset" pattern with Atomic Updates for thread safety
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

            // 2. Lazy Reset: Atomic check-and-set
            // If lastCreditReset is before today 00:00:00, reset credits to dailyLimit
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            // Try to reset. Use updateOne with filter for lastCreditReset < startOfToday.
            // This ensures it only happens once per day, even with concurrent requests.
            await User.updateOne(
                {
                    _id: userId,
                    lastCreditReset: { $lt: startOfToday }
                },
                [
                    // Use aggregation pipeline for update to reference dailyLimit field
                    {
                        $set: {
                            credits: { $max: ["$credits", "$dailyLimit"] },
                            lastCreditReset: new Date()
                        }
                    }
                ]
            );

            // 3. Atomic Deduction: Check balance and deduct in one go
            // This prevents race conditions where two requests check balance simultaneously
            const user = await User.findOneAndUpdate(
                {
                    _id: userId,
                    credits: { $gte: cost }
                },
                { $inc: { credits: -cost } },
                { new: true } // Return updated document
            );

            if (!user) {
                // If user is null, it means either user not found OR credits < cost
                // Let's check which one it is for better error message
                const userExists = await User.findById(userId);
                if (!userExists) {
                    return res.status(404).json({ error: "User not found" });
                }

                return res.status(403).json({
                    error: "Insufficient credits",
                    msg: "You have used your daily credit limit. Please upgrade or wait for midnight reset.",
                    credits: userExists.credits,
                    cost: cost
                });
            }

            // 4. Attach user to request (optional, but convenient) and proceed
            req.user = user; // Update req.user with latest data
            next();

        } catch (err) {
            console.error("Credit check error:", err);
            res.status(500).json({ error: "Server error during credit check" });
        }
    };
};

module.exports = checkCredits;
