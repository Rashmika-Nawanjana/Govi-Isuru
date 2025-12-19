const mongoose = require('mongoose');

// Disease Report Schema - Logs every AI prediction
const DiseaseReportSchema = new mongoose.Schema({
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false // Allow anonymous reports
  },
  farmerUsername: {
    type: String,
    required: false
  },
  crop: { 
    type: String, 
    required: true,
    default: 'rice'
  },
  disease: { 
    type: String, 
    required: true 
  },
  confidence: { 
    type: Number, 
    required: true,
    min: 0,
    max: 1
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
  // Optional: Store treatment given
  treatment: {
    type: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true // Index for faster time-based queries
  }
});

// Compound index for efficient alert queries
DiseaseReportSchema.index({ crop: 1, disease: 1, gnDivision: 1, createdAt: -1 });

module.exports = mongoose.model('DiseaseReport', DiseaseReportSchema);
