const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const reputationService = require('../services/reputationService');
const Listing = require('../models/Listing');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// Auth middleware
const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth attempt - Token present:', !!token);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Use the same secret as login - check if env is loaded
    const secret = process.env.JWT_SECRET || 'govi_secret';
    console.log('Using secret starting with:', secret.substring(0, 10) + '...');
    const decoded = jwt.verify(token, secret);
    console.log('Token decoded successfully, user:', decoded.username || decoded.id);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth failed:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional auth
const optionalAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'govi_secret');
      req.user = decoded;
    }
    next();
  } catch (error) {
    next();
  }
};

/**
 * POST /api/reputation/feedback
 * Submit buyer feedback for a listing
 */
router.post('/feedback', optionalAuth, async (req, res) => {
  try {
    const { listing_id, farmer_id, buyer_name, buyer_phone, rating, comment } = req.body;

    // Validation
    if (!listing_id || !buyer_name || !rating) {
      return res.status(400).json({ 
        error: 'listing_id, buyer_name, and rating are required' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const feedback = await reputationService.submitFeedback({
      listing_id,
      farmer_id,
      buyer_id: req.user?.id,
      buyer_name,
      buyer_phone,
      rating,
      comment
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback._id,
        rating: feedback.rating,
        comment: feedback.comment
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    if (error.message.includes('already submitted')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

/**
 * GET /api/reputation/farmer/:farmerId
 * Get reputation breakdown for a farmer
 */
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const reputation = await reputationService.getReputationBreakdown(farmerId);
    
    res.json({
      success: true,
      reputation
    });
  } catch (error) {
    console.error('Error getting reputation:', error);
    res.status(500).json({ error: 'Failed to get reputation' });
  }
});

/**
 * GET /api/reputation/farmer/:farmerId/feedbacks
 * Get all feedbacks for a farmer
 */
router.get('/farmer/:farmerId/feedbacks', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { limit } = req.query;
    
    const feedbacks = await reputationService.getFarmerFeedbacks(
      farmerId, 
      parseInt(limit) || 10
    );
    
    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks
    });
  } catch (error) {
    console.error('Error getting feedbacks:', error);
    res.status(500).json({ error: 'Failed to get feedbacks' });
  }
});

/**
 * GET /api/reputation/listing/:listingId/feedbacks
 * Get all feedbacks for a specific listing
 */
router.get('/listing/:listingId/feedbacks', async (req, res) => {
  try {
    const { listingId } = req.params;
    const { limit } = req.query;
    
    const feedbacks = await Feedback.find({ listing_id: listingId })
      .populate('listing_id', 'cropType quantity price')
      .sort({ created_at: -1 })
      .limit(parseInt(limit) || 20);
    
    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks
    });
  } catch (error) {
    console.error('Error getting listing feedbacks:', error);
    res.status(500).json({ error: 'Failed to get feedbacks' });
  }
});

/**
 * GET /api/reputation/top-farmers
 * Get top rated farmers
 */
router.get('/top-farmers', async (req, res) => {
  try {
    const { limit } = req.query;
    
    const farmers = await reputationService.getTopFarmers(parseInt(limit) || 10);
    
    res.json({
      success: true,
      count: farmers.length,
      farmers
    });
  } catch (error) {
    console.error('Error getting top farmers:', error);
    res.status(500).json({ error: 'Failed to get top farmers' });
  }
});

/**
 * PUT /api/reputation/listing/:listingId/sold
 * Mark listing as sold (triggers reputation update)
 */
router.put('/listing/:listingId/sold', authMiddleware, async (req, res) => {
  try {
    const { listingId } = req.params;
    console.log(`Mark sold request for listing: ${listingId}, user: ${req.user?.username}`);
    
    // Validate listingId
    if (!listingId || listingId === 'undefined') {
      return res.status(400).json({ error: 'Invalid listing ID' });
    }
    
    const listing = await reputationService.onListingSold(listingId);
    
    console.log(`Listing ${listingId} marked as sold successfully`);
    res.json({
      success: true,
      message: 'Listing marked as sold',
      listing: {
        id: listing._id,
        status: listing.status,
        sold_at: listing.sold_at
      }
    });
  } catch (error) {
    console.error('Error marking listing as sold:', error.message);
    res.status(500).json({ error: error.message || 'Failed to update listing' });
  }
});

/**
 * PUT /api/reputation/listing/:listingId/verify
 * Verify a listing (admin only - simplified for now)
 */
router.put('/listing/:listingId/verify', authMiddleware, async (req, res) => {
  try {
    const { listingId } = req.params;
    const adminUsername = req.user?.username || 'admin';
    
    const listing = await reputationService.onListingVerified(listingId, adminUsername);
    
    res.json({
      success: true,
      message: 'Listing verified',
      listing: {
        id: listing._id,
        verified: listing.verified,
        verified_at: listing.verified_at
      }
    });
  } catch (error) {
    console.error('Error verifying listing:', error);
    res.status(500).json({ error: 'Failed to verify listing' });
  }
});

/**
 * GET /api/reputation/config
 * Get reputation system configuration (for transparency)
 */
router.get('/config', (req, res) => {
  const config = reputationService.REPUTATION_CONFIG;
  
  res.json({
    success: true,
    explanation: {
      en: 'Reputation score is calculated using successful sales (40%), verified listings (30%), and buyer feedback (30%). New farmers start at 3.0 (neutral).',
      si: 'කීර්තිමත් ලකුණු ගණනය කරනු ලබන්නේ සාර්ථක විකුණුම් (40%), සත්‍යාපිත ලැයිස්තුගත කිරීම් (30%), සහ ගැනුම්කරුවන්ගේ ප්‍රතිපෝෂණය (30%) භාවිතයෙනි. නව ගොවීන් 3.0 (මධ්‍යස්ථ) වලින් ආරම්භ කරයි.'
    },
    config: {
      weights: config.weights,
      normalization: config.normalization,
      scoreRange: {
        min: config.minScore,
        max: config.maxScore,
        default: config.defaultScore
      }
    }
  });
});

/**
 * GET /api/reputation/stats
 * Get overall marketplace reputation stats
 */
router.get('/stats', async (req, res) => {
  try {
    const totalFarmers = await User.countDocuments({ total_sales: { $gt: 0 } });
    const totalFeedbacks = await Feedback.countDocuments();
    const totalVerifiedListings = await Listing.countDocuments({ verified: true });
    const totalSales = await Listing.countDocuments({ status: 'sold' });
    
    const avgReputation = await User.aggregate([
      { $match: { total_sales: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$reputation_score' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalFarmers,
        totalFeedbacks,
        totalVerifiedListings,
        totalSales,
        averageReputation: avgReputation[0]?.avg?.toFixed(1) || '3.0'
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
