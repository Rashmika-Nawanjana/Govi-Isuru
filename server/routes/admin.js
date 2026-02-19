const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==========================================
// ADMIN AUTH MIDDLEWARE
// ==========================================
const adminAuthMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'govi_secret');

        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// ==========================================
// GET /api/admin/stats
// Dashboard summary statistics
// ==========================================
router.get('/stats', adminAuthMiddleware, async (req, res) => {
    try {
        const [
            totalUsers,
            totalFarmers,
            totalOfficers,
            totalBuyers,
            pendingOfficers,
            flaggedAccounts,
            recentUsers
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'farmer' }),
            User.countDocuments({ role: 'officer' }),
            User.countDocuments({ role: 'buyer' }),
            User.countDocuments({ role: 'officer', approvalStatus: 'pending' }),
            User.countDocuments({ account_flagged: true }),
            User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
        ]);

        // District breakdown
        const districtBreakdown = await User.aggregate([
            { $group: { _id: '$district', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Role breakdown by district
        const roleByDistrict = await User.aggregate([
            { $group: { _id: { district: '$district', role: '$role' }, count: { $sum: 1 } } },
            { $sort: { '_id.district': 1 } }
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalFarmers,
                totalOfficers,
                totalBuyers,
                pendingOfficers,
                flaggedAccounts,
                recentUsers,
                districtBreakdown,
                roleByDistrict
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// ==========================================
// GET /api/admin/users
// List all users with pagination, search, filters
// ==========================================
router.get('/users', adminAuthMiddleware, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            role,
            district,
            status, // 'active', 'flagged', 'pending'
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter
        const filter = {};

        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { officerId: { $regex: search, $options: 'i' } }
            ];
        }

        if (role && role !== 'all') {
            filter.role = role;
        }

        if (district && district !== 'all') {
            filter.district = district;
        }

        if (status === 'flagged') {
            filter.account_flagged = true;
        } else if (status === 'pending') {
            filter.approvalStatus = 'pending';
            filter.role = 'officer';
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [users, totalCount] = await Promise.all([
            User.find(filter)
                .select('-password -verificationToken -passwordResetToken -verificationTokenExpires -passwordResetExpires')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            User.countDocuments(filter)
        ]);

        res.json({
            success: true,
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ==========================================
// GET /api/admin/users/:id
// Get single user details
// ==========================================
router.get('/users/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -verificationToken -passwordResetToken')
            .lean();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// ==========================================
// PUT /api/admin/users/:id/role
// Change a user's role
// ==========================================
router.put('/users/:id/role', adminAuthMiddleware, async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['farmer', 'officer', 'buyer', 'admin', 'moderator'];

        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }

        // Prevent admins from removing their own admin role
        if (req.params.id === req.user.id && role !== 'admin') {
            return res.status(400).json({ error: 'You cannot remove your own admin role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: `User role updated to ${role}`,
            user
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

// ==========================================
// PUT /api/admin/users/:id/status
// Toggle account_flagged status
// ==========================================
router.put('/users/:id/status', adminAuthMiddleware, async (req, res) => {
    try {
        const { flagged } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { account_flagged: !!flagged }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: flagged ? 'Account flagged' : 'Account unflagged',
            user
        });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// ==========================================
// DELETE /api/admin/users/:id
// Delete a user account
// ==========================================
router.delete('/users/:id', adminAuthMiddleware, async (req, res) => {
    try {
        // Prevent admins from deleting themselves
        if (req.params.id === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: `User ${user.username} deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ==========================================
// GET /api/admin/pending-officers
// List officers awaiting approval
// ==========================================
router.get('/pending-officers', adminAuthMiddleware, async (req, res) => {
    try {
        const pendingOfficers = await User.find({
            role: 'officer',
            approvalStatus: 'pending'
        })
            .select('-password -verificationToken -passwordResetToken')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            count: pendingOfficers.length,
            officers: pendingOfficers
        });
    } catch (error) {
        console.error('Error fetching pending officers:', error);
        res.status(500).json({ error: 'Failed to fetch pending officers' });
    }
});

// ==========================================
// PUT /api/admin/officers/:id/approve
// Approve an officer registration
// ==========================================
router.put('/officers/:id/approve', adminAuthMiddleware, async (req, res) => {
    try {
        const officer = await User.findOne({
            _id: req.params.id,
            role: 'officer'
        });

        if (!officer) {
            return res.status(404).json({ error: 'Officer not found' });
        }

        if (officer.approvalStatus === 'approved') {
            return res.status(400).json({ error: 'Officer is already approved' });
        }

        officer.isApproved = true;
        officer.approvalStatus = 'approved';
        officer.approvedBy = req.user.id;
        officer.approvedAt = new Date();
        officer.rejectionReason = null;
        await officer.save();

        res.json({
            success: true,
            message: `Officer ${officer.fullName} (${officer.officerId}) has been approved`,
            officer: {
                _id: officer._id,
                fullName: officer.fullName,
                username: officer.username,
                officerId: officer.officerId,
                department: officer.department,
                designation: officer.designation,
                district: officer.district,
                approvalStatus: officer.approvalStatus,
                approvedAt: officer.approvedAt
            }
        });
    } catch (error) {
        console.error('Error approving officer:', error);
        res.status(500).json({ error: 'Failed to approve officer' });
    }
});

// ==========================================
// PUT /api/admin/officers/:id/reject
// Reject an officer registration
// ==========================================
router.put('/officers/:id/reject', adminAuthMiddleware, async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const officer = await User.findOne({
            _id: req.params.id,
            role: 'officer'
        });

        if (!officer) {
            return res.status(404).json({ error: 'Officer not found' });
        }

        officer.isApproved = false;
        officer.approvalStatus = 'rejected';
        officer.rejectionReason = reason.trim();
        officer.approvedBy = req.user.id;
        officer.approvedAt = new Date();
        await officer.save();

        res.json({
            success: true,
            message: `Officer ${officer.fullName} (${officer.officerId}) has been rejected`,
            officer: {
                _id: officer._id,
                fullName: officer.fullName,
                username: officer.username,
                officerId: officer.officerId,
                approvalStatus: officer.approvalStatus,
                rejectionReason: officer.rejectionReason
            }
        });
    } catch (error) {
        console.error('Error rejecting officer:', error);
        res.status(500).json({ error: 'Failed to reject officer' });
    }
});

// ==========================================
// GET /api/admin/districts
// Get list of all districts with user counts
// ==========================================
router.get('/districts', adminAuthMiddleware, async (req, res) => {
    try {
        const districts = await User.aggregate([
            { $group: { _id: '$district', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            districts: districts.map(d => ({ name: d._id, count: d.count }))
        });
    } catch (error) {
        console.error('Error fetching districts:', error);
        res.status(500).json({ error: 'Failed to fetch districts' });
    }
});

// ==========================================
// PUT /api/admin/users/:id/credits
// Update user specific credits and limits
// ==========================================
router.put('/users/:id/credits', adminAuthMiddleware, async (req, res) => {
    try {
        const { credits, dailyLimit, isPremium } = req.body;

        // Build update object
        const update = {};
        if (credits !== undefined) update.credits = credits;
        if (dailyLimit !== undefined) update.dailyLimit = dailyLimit;
        if (isPremium !== undefined) update.isPremium = isPremium;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            update
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'User credits updated',
            user: {
                _id: user._id,
                username: user.username,
                credits: user.credits,
                dailyLimit: user.dailyLimit,
                isPremium: user.isPremium
            }
        });
    } catch (error) {
        console.error('Error updating credits:', error);
        res.status(500).json({ error: 'Failed to update credits' });
    }
});

module.exports = router;
