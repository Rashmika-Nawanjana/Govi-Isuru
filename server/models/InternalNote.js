const mongoose = require('mongoose');

// Internal Note Schema - Hidden comments and flags for officer coordination
const InternalNoteSchema = new mongoose.Schema({
  // Target entity (report, farmer, location)
  targetType: {
    type: String,
    enum: ['disease_report', 'farmer', 'location', 'alert'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // For farmer-specific notes
  farmerUsername: {
    type: String,
    default: null
  },
  
  // For location-specific notes
  gnDivision: {
    type: String,
    default: null
  },
  district: {
    type: String,
    default: null
  },
  
  // Note content
  noteType: {
    type: String,
    enum: ['general', 'warning', 'flag', 'follow_up', 'coordination', 'abuse_report'],
    default: 'general'
  },
  content: {
    type: String,
    required: true
  },
  
  // Internal flags
  flags: [{
    type: String,
    enum: [
      'repeat_offender',
      'false_reports',
      'suspicious_activity',
      'needs_verification',
      'high_priority',
      'follow_up_required',
      'abuse_suspected',
      'trusted_source',
      'new_farmer',
      'coordination_needed'
    ]
  }],
  
  // Visibility
  visibility: {
    type: String,
    enum: ['all_officers', 'district_only', 'admin_only'],
    default: 'all_officers'
  },
  
  // Officer who created the note
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByUsername: {
    type: String,
    required: true
  },
  createdByDistrict: {
    type: String,
    default: null
  },
  
  // Expiry (optional - for temporary notes)
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: String,
    default: null
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
InternalNoteSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// Indexes
InternalNoteSchema.index({ targetType: 1, targetId: 1 });
InternalNoteSchema.index({ farmerUsername: 1 });
InternalNoteSchema.index({ gnDivision: 1, district: 1 });
InternalNoteSchema.index({ createdBy: 1, createdAt: -1 });
InternalNoteSchema.index({ noteType: 1, isActive: 1 });
InternalNoteSchema.index({ flags: 1 });

module.exports = mongoose.model('InternalNote', InternalNoteSchema);
