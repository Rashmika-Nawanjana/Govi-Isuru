const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  // Reference to the listing
  listing_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing',
    required: true 
  },
  
  // Reference to the farmer (seller)
  farmer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false // Optional for backward compatibility with old listings
  },
  
  // Buyer information
  buyer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false // Optional - can be anonymous
  },
  buyer_name: { 
    type: String, 
    required: true 
  },
  buyer_phone: { 
    type: String, 
    default: '' 
  },
  
  // Rating and feedback
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5 
  },
  comment: { 
    type: String, 
    default: '',
    maxlength: 500 
  },
  
  // Categories for detailed feedback
  quality_rating: { type: Number, min: 1, max: 5 },
  price_fairness: { type: Number, min: 1, max: 5 },
  communication: { type: Number, min: 1, max: 5 },
  
  // Verification
  is_verified_purchase: { type: Boolean, default: false },
  
  created_at: { type: Date, default: Date.now }
});

// Index for efficient queries (not unique - allow multiple feedbacks from different users)
FeedbackSchema.index({ listing_id: 1 });
FeedbackSchema.index({ farmer_id: 1, created_at: -1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
