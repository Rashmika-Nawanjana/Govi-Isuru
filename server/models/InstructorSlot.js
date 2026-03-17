const mongoose = require('mongoose');

const InstructorSlotSchema = new mongoose.Schema({
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
  district: {
    type: String,
    required: true,
    index: true
  },
  dsDivision: {
    type: String,
    default: null
  },
  gnDivision: {
    type: String,
    default: null
  },
  startAt: {
    type: Date,
    required: true,
    index: true
  },
  endAt: {
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
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['open', 'reserved', 'closed', 'cancelled'],
    default: 'open',
    index: true
  },
  reservedByBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ManualBooking',
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

InstructorSlotSchema.pre('save', function onSave() {
  this.updatedAt = new Date();
});

InstructorSlotSchema.index({ instructorId: 1, startAt: 1 });
InstructorSlotSchema.index({ status: 1, startAt: 1 });
InstructorSlotSchema.index({ district: 1, status: 1, startAt: 1 });

module.exports = mongoose.model('InstructorSlot', InstructorSlotSchema);
