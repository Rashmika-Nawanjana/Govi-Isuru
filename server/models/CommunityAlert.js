const mongoose = require('mongoose');

// Community Alert Schema - Stores active outbreak alerts
const CommunityAlertSchema = new mongoose.Schema({
  crop: { 
    type: String, 
    required: true 
  },
  disease: { 
    type: String, 
    required: true 
  },
  district: {
    type: String,
    required: true
  },
  dsDivision: {
    type: String,
    required: true
  },
  gnDivision: { 
    type: String, 
    required: true 
  },
  reportCount: { 
    type: Number, 
    required: true,
    min: 1
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: { 
    type: String, 
    enum: ['active', 'monitoring', 'resolved'],
    default: 'active'
  },
  // Track when alert was first triggered and last updated
  firstReportedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  },
  // Recommendations for farmers
  recommendation: {
    en: String,
    si: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound index for finding active alerts by location
CommunityAlertSchema.index({ gnDivision: 1, status: 1, createdAt: -1 });
CommunityAlertSchema.index({ district: 1, status: 1 });

module.exports = mongoose.model('CommunityAlert', CommunityAlertSchema);
