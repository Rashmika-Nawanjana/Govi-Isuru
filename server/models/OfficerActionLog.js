const mongoose = require('mongoose');

// Officer Action Log Schema - Audit trail for all officer actions
const OfficerActionLogSchema = new mongoose.Schema({
  // Officer who performed the action
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  officerUsername: {
    type: String,
    required: true
  },
  officerDistrict: {
    type: String,
    required: false,
    default: 'Unknown'
  },
  
  // Action details
  actionType: {
    type: String,
    enum: [
      'verify_report',
      'reject_report', 
      'flag_report',
      'request_field_visit',
      'start_review',
      'resolve_alert',
      'escalate_alert',
      'add_note',
      'update_priority'
    ],
    required: true
  },
  
  // Target of the action
  targetType: {
    type: String,
    enum: ['disease_report', 'community_alert', 'notification'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // Previous and new status (for status changes)
  previousStatus: {
    type: String,
    default: null
  },
  newStatus: {
    type: String,
    default: null
  },
  
  // Additional details
  reason: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  
  // Metadata
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  
  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for efficient querying
OfficerActionLogSchema.index({ officerId: 1, createdAt: -1 });
OfficerActionLogSchema.index({ targetId: 1, targetType: 1 });
OfficerActionLogSchema.index({ actionType: 1, createdAt: -1 });
OfficerActionLogSchema.index({ officerDistrict: 1, createdAt: -1 });

module.exports = mongoose.model('OfficerActionLog', OfficerActionLogSchema);
