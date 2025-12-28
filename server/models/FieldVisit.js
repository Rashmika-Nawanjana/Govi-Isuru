const mongoose = require('mongoose');

// Field Visit Schema - Tracks scheduled and completed field visits
const FieldVisitSchema = new mongoose.Schema({
  // Associated report
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiseaseReport',
    required: true
  },
  
  // Officer who requested/scheduled the visit
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedByUsername: {
    type: String,
    required: true
  },
  
  // Officer assigned to conduct the visit
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedToUsername: {
    type: String,
    default: null
  },
  
  // Visit status
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Location details
  district: {
    type: String,
    required: true
  },
  dsDivision: {
    type: String
  },
  gnDivision: {
    type: String,
    required: true
  },
  
  // Scheduling
  scheduledDate: {
    type: Date,
    default: null
  },
  scheduledTime: {
    type: String,
    default: null
  },
  
  // Visit details
  purpose: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    default: null
  },
  
  // Visit notes (added during/after visit)
  visitNotes: [{
    note: String,
    addedBy: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Photos uploaded during visit
  photos: [{
    url: String,
    caption: String,
    uploadedBy: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Findings from the visit
  findings: {
    diseaseConfirmed: {
      type: Boolean,
      default: null
    },
    severity: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'critical', null],
      default: null
    },
    affectedArea: {
      type: String,
      default: null
    },
    farmerContacted: {
      type: Boolean,
      default: false
    },
    recommendedActions: {
      type: String,
      default: null
    }
  },
  
  // Completion details
  completedAt: {
    type: Date,
    default: null
  },
  completedBy: {
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
FieldVisitSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// Indexes
FieldVisitSchema.index({ reportId: 1 });
FieldVisitSchema.index({ requestedBy: 1, createdAt: -1 });
FieldVisitSchema.index({ assignedTo: 1, status: 1 });
FieldVisitSchema.index({ district: 1, status: 1 });
FieldVisitSchema.index({ status: 1, scheduledDate: 1 });

module.exports = mongoose.model('FieldVisit', FieldVisitSchema);
