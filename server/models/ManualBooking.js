const mongoose = require('mongoose');

const ManualBookingSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  farmerName: {
    type: String,
    required: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  instructorName: {
    type: String,
    required: true
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InstructorSlot',
    required: true,
    unique: true
  },
  scheduledStartAt: {
    type: Date,
    required: true
  },
  scheduledEndAt: {
    type: Date,
    required: true
  },
  mode: {
    type: String,
    enum: ['in_person', 'phone', 'video'],
    default: 'in_person'
  },
  locationText: {
    type: String,
    default: null
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
    default: 'pending',
    index: true
  },
  instructorResponseNote: {
    type: String,
    default: ''
  },
  adviceText: {
    type: String,
    default: ''
  },
  feeCredits: {
    type: Number,
    default: 40
  },
  paymentStatus: {
    type: String,
    enum: ['not_charged', 'charged'],
    default: 'not_charged'
  },
  chargedAt: {
    type: Date,
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ManualBookingSchema.pre('save', function onSave() {
  this.updatedAt = new Date();
});

ManualBookingSchema.index({ farmerId: 1, createdAt: -1 });
ManualBookingSchema.index({ instructorId: 1, status: 1, scheduledStartAt: 1 });

module.exports = mongoose.model('ManualBooking', ManualBookingSchema);
