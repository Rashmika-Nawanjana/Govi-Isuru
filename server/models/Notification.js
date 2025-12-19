const mongoose = require('mongoose');

// Notification Schema - Individual farmer notifications
const NotificationSchema = new mongoose.Schema({
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false
  },
  // Target location for broadcast notifications
  targetDistrict: String,
  targetDsDivision: String,
  targetGnDivision: String,
  
  type: {
    type: String,
    enum: ['disease_alert', 'weather_warning', 'market_update', 'system'],
    default: 'disease_alert'
  },
  
  title: {
    en: { type: String, required: true },
    si: { type: String, required: true }
  },
  
  message: {
    en: { type: String, required: true },
    si: { type: String, required: true }
  },
  
  // Reference to the alert that triggered this notification
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityAlert'
  },
  
  severity: {
    type: String,
    enum: ['info', 'warning', 'danger'],
    default: 'warning'
  },
  
  read: { 
    type: Boolean, 
    default: false 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
});

// Index for fetching user notifications
NotificationSchema.index({ targetGnDivision: 1, createdAt: -1 });
NotificationSchema.index({ farmerId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
