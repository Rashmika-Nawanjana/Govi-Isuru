const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  // Report Details
  report_type: { type: String, enum: ['disease', 'pest', 'weather', 'advisory'], required: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmerName: { type: String, required: true },
  farmerPhone: { type: String, required: true }, // Contact number of farmer
  
  // Location
  district: { type: String, required: true },
  dsDivision: { type: String, required: true },
  gnDivision: { type: String, required: true }, // Send to GN officers for this division
  
  // Content
  title: { type: String, required: true },
  description: { type: String, required: true },
  image_url: { type: String }, // URL to uploaded disease/pest image
  
  // AI Analysis
  ai_prediction: { type: String }, // Disease/pest name from AI Doctor
  confidence_score: { type: Number, min: 0, max: 1 },
  
  // Verification Status
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected', 'resolved'],
    default: 'pending'
  },
  
  // Officer Verification
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Officer ID
  verifiedByName: { type: String },
  verificationDate: { type: Date },
  verificationNotes: { type: String },
  
  // Farmer Alert Details
  alertSentToFarmers: { type: Boolean, default: false },
  alertSentDate: { type: Date },
  affectedFarmersCount: { type: Number, default: 0 },
  
  // Metadata
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for querying reports by GN Division and status
ReportSchema.index({ gnDivision: 1, status: 1 });
ReportSchema.index({ farmerId: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', ReportSchema);
