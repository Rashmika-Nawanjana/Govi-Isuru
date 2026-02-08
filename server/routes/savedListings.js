const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Listing = require('../models/Listing');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/saved-listings/toggle/:listingId
// @desc    Toggle save/unsave a listing
// @access  Private (Buyers only)
router.post('/toggle/:listingId', authMiddleware, async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.user.id;

    // Verify listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Find user and check if listing is already saved
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const savedIndex = user.savedListings.indexOf(listingId);
    let isSaved = false;

    if (savedIndex > -1) {
      // Unsave - remove from array
      user.savedListings.splice(savedIndex, 1);
      isSaved = false;
    } else {
      // Save - add to array
      user.savedListings.push(listingId);
      isSaved = true;
    }

    await user.save();

    res.json({ 
      success: true, 
      isSaved,
      message: isSaved ? 'Listing saved successfully' : 'Listing removed from saved'
    });
  } catch (error) {
    console.error('Error toggling saved listing:', error);
    res.status(500).json({ error: 'Failed to toggle saved listing' });
  }
});

// @route   GET /api/saved-listings
// @desc    Get all saved listings for current user
// @access  Private (Buyers only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user and populate saved listings with farmer details
    const user = await User.findById(userId).populate({
      path: 'savedListings',
      populate: {
        path: 'farmer_id',
        select: 'username reputation_score is_verified_farmer total_sales'
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Filter out any null listings (in case listing was deleted)
    const savedListings = user.savedListings.filter(listing => listing !== null);

    res.json({ 
      success: true, 
      listings: savedListings,
      count: savedListings.length
    });
  } catch (error) {
    console.error('Error fetching saved listings:', error);
    res.status(500).json({ error: 'Failed to fetch saved listings' });
  }
});

// @route   GET /api/saved-listings/check/:listingId
// @desc    Check if a specific listing is saved by current user
// @access  Private
router.get('/check/:listingId', authMiddleware, async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isSaved = user.savedListings.includes(listingId);

    res.json({ 
      success: true, 
      isSaved
    });
  } catch (error) {
    console.error('Error checking saved listing:', error);
    res.status(500).json({ error: 'Failed to check saved listing' });
  }
});

module.exports = router;
