const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  // Farmer reference
  farmer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false // Optional for backward compatibility
  },
  
  // Basic listing info (existing fields)
  farmerName: { type: String, required: true },
  cropType: { type: String, required: true },
  quantity: { type: String },
  price: { type: String },
  location: { type: String },
  phone: { type: String },
  
  // New fields for reputation system
  verified: { 
    type: Boolean, 
    default: false 
  },
  verified_at: { type: Date },
  verified_by: { type: String }, // Admin username
  
  status: { 
    type: String, 
    enum: ['active', 'sold', 'expired', 'removed'],
    default: 'active' 
  },
  sold_at: { type: Date },
  
  // Quality indicators
  description: { type: String, default: '' },
  images: [{ type: String }], // URLs to images
  harvest_date: { type: Date },
  
  // Location details
  district: { type: String },
  gn_division: { type: String },
  
  // Stats
  view_count: { type: Number, default: 0 },
  inquiry_count: { type: Number, default: 0 },
  
  date: { type: Date, default: Date.now }
});

// Indexes for efficient queries
ListingSchema.index({ farmer_id: 1, status: 1 });
ListingSchema.index({ status: 1, date: -1 });
ListingSchema.index({ verified: 1 });

module.exports = mongoose.model('Listing', ListingSchema);
