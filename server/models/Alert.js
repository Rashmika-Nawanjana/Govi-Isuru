const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  // Alert Details
  alert_type: { type: String, enum: ['disease', 'pest', 'weather', 'advisory', 'warning'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Source
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  originalProblem: { type: String }, // Disease/pest name
  
  // Location (for this alert)
  district: { type: String, required: true },
  dsDivision: { type: String },
  gnDivision: { type: String, required: true },
  
  // Severity
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  
  // Recommendations
  recommendations: [{ type: String }], // Array of suggested actions
  treatment: { type: String }, // Pesticide/treatment details
  preventiveMeasures: [{ type: String }],
  
  // Recipients
  targetFarmers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Farmer IDs in this GN division
  viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Farmers who have viewed
  
  // Publishing
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Officer ID
  publishedDate: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // When alert is no longer relevant
  
  // Status
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for location-based queries
AlertSchema.index({ gnDivision: 1, isActive: 1 });
AlertSchema.index({ district: 1 });
AlertSchema.index({ publishedDate: -1 });

module.exports = mongoose.model('Alert', AlertSchema);
