const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Notification = require('../models/Notification');
const InstructorSlot = require('../models/InstructorSlot');
const ManualBooking = require('../models/ManualBooking');

const MANUAL_BOOKING_FEE_CREDITS = parseInt(
  process.env.MANUAL_BOOKING_FEE_CREDITS || process.env.ADVICE_FEE_CREDITS || '40',
  10
);

const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id || '');

async function getCurrentUser(decoded) {
  return User.findById(decoded.id || decoded.userId || decoded._id);
}

async function createNotification(recipientUserId, recipientRole, titleEn, titleSi, messageEn, messageSi) {
  await Notification.create({
    recipientUserId,
    recipientRole,
    type: 'system',
    severity: 'info',
    title: { en: titleEn, si: titleSi },
    message: { en: messageEn, si: messageSi }
  });
}

router.get('/instructors', authMiddleware, async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user);
    if (!currentUser) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    const query = { role: 'officer', isApproved: true };

    if (currentUser.role === 'farmer') {
      query.district = currentUser.district;
    }

    const instructors = await User.find(query)
      .select('_id fullName username district dsDivision gnDivision designation officerId')
      .sort({ fullName: 1, username: 1 });

    res.json({ success: true, instructors });
  } catch (err) {
    console.error('Error fetching instructors:', err);
    res.status(500).json({ success: false, msg: 'Failed to fetch instructors' });
  }
});

router.get('/instructors/:instructorId/slots', authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.instructorId)) {
      return res.status(400).json({ success: false, msg: 'Invalid instructor id' });
    }

    const now = new Date();
    const slots = await InstructorSlot.find({
      instructorId: req.params.instructorId,
      status: 'open',
      startAt: { $gt: now }
    }).sort({ startAt: 1 });

    res.json({ success: true, slots });
  } catch (err) {
    console.error('Error fetching instructor slots:', err);
    res.status(500).json({ success: false, msg: 'Failed to fetch slots' });
  }
});

router.post('/slots', authMiddleware, async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user);
    if (!currentUser || currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only agricultural instructors can create slots' });
    }

    const { startAt, endAt, mode, locationText, notes } = req.body;
    if (!startAt || !endAt) {
      return res.status(400).json({ success: false, msg: 'startAt and endAt are required' });
    }

    const parsedStartAt = new Date(startAt);
    const parsedEndAt = new Date(endAt);
    if (Number.isNaN(parsedStartAt.getTime()) || Number.isNaN(parsedEndAt.getTime())) {
      return res.status(400).json({ success: false, msg: 'Invalid date values' });
    }
    if (parsedEndAt <= parsedStartAt) {
      return res.status(400).json({ success: false, msg: 'endAt must be after startAt' });
    }

    const overlapping = await InstructorSlot.findOne({
      instructorId: currentUser._id,
      status: { $in: ['open', 'reserved'] },
      startAt: { $lt: parsedEndAt },
      endAt: { $gt: parsedStartAt }
    });

    if (overlapping) {
      return res.status(409).json({ success: false, msg: 'Slot overlaps an existing active slot' });
    }

    const slot = await InstructorSlot.create({
      instructorId: currentUser._id,
      instructorName: currentUser.fullName || currentUser.username,
      district: currentUser.district,
      dsDivision: currentUser.dsDivision,
      gnDivision: currentUser.gnDivision,
      startAt: parsedStartAt,
      endAt: parsedEndAt,
      mode: ['in_person', 'phone', 'video'].includes(mode) ? mode : 'in_person',
      locationText: locationText || '',
      notes: notes || ''
    });

    res.status(201).json({ success: true, slot });
  } catch (err) {
    console.error('Error creating slot:', err);
    res.status(500).json({ success: false, msg: 'Failed to create slot' });
  }
});

router.get('/slots/mine', authMiddleware, async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user);
    if (!currentUser || currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only agricultural instructors can view own slots' });
    }

    const statusFilter = req.query.status;
    const query = { instructorId: currentUser._id };
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }

    const slots = await InstructorSlot.find(query).sort({ startAt: 1 });
    res.json({ success: true, slots });
  } catch (err) {
    console.error('Error fetching own slots:', err);
    res.status(500).json({ success: false, msg: 'Failed to fetch slots' });
  }
});

router.put('/slots/:slotId', authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.slotId)) {
      return res.status(400).json({ success: false, msg: 'Invalid slot id' });
    }

    const currentUser = await getCurrentUser(req.user);
    if (!currentUser || currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only agricultural instructors can update slots' });
    }

    const slot = await InstructorSlot.findOne({
      _id: req.params.slotId,
      instructorId: currentUser._id
    });

    if (!slot) {
      return res.status(404).json({ success: false, msg: 'Slot not found' });
    }

    if (slot.status !== 'open') {
      return res.status(409).json({ success: false, msg: 'Only open slots can be edited' });
    }

    const { startAt, endAt, mode, locationText, notes } = req.body;
    const parsedStartAt = startAt ? new Date(startAt) : slot.startAt;
    const parsedEndAt = endAt ? new Date(endAt) : slot.endAt;

    if (Number.isNaN(parsedStartAt.getTime()) || Number.isNaN(parsedEndAt.getTime())) {
      return res.status(400).json({ success: false, msg: 'Invalid date values' });
    }
    if (parsedEndAt <= parsedStartAt) {
      return res.status(400).json({ success: false, msg: 'endAt must be after startAt' });
    }

    const overlapping = await InstructorSlot.findOne({
      _id: { $ne: slot._id },
      instructorId: currentUser._id,
      status: { $in: ['open', 'reserved'] },
      startAt: { $lt: parsedEndAt },
      endAt: { $gt: parsedStartAt }
    });

    if (overlapping) {
      return res.status(409).json({ success: false, msg: 'Slot overlaps an existing active slot' });
    }

    slot.startAt = parsedStartAt;
    slot.endAt = parsedEndAt;
    if (mode && ['in_person', 'phone', 'video'].includes(mode)) {
      slot.mode = mode;
    }
    if (typeof locationText === 'string') {
      slot.locationText = locationText;
    }
    if (typeof notes === 'string') {
      slot.notes = notes;
    }

    await slot.save();

    res.json({ success: true, slot });
  } catch (err) {
    console.error('Error updating slot:', err);
    res.status(500).json({ success: false, msg: 'Failed to update slot' });
  }
});

router.delete('/slots/:slotId', authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.slotId)) {
      return res.status(400).json({ success: false, msg: 'Invalid slot id' });
    }

    const currentUser = await getCurrentUser(req.user);
    if (!currentUser || currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only agricultural instructors can remove slots' });
    }

    const slot = await InstructorSlot.findOne({
      _id: req.params.slotId,
      instructorId: currentUser._id
    });

    if (!slot) {
      return res.status(404).json({ success: false, msg: 'Slot not found' });
    }

    if (slot.status !== 'open') {
      return res.status(409).json({ success: false, msg: 'Only open slots can be removed' });
    }

    await slot.deleteOne();
    res.json({ success: true, msg: 'Slot removed' });
  } catch (err) {
    console.error('Error deleting slot:', err);
    res.status(500).json({ success: false, msg: 'Failed to remove slot' });
  }
});

router.post('/bookings', authMiddleware, async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user);
    if (!currentUser || currentUser.role !== 'farmer') {
      return res.status(403).json({ success: false, msg: 'Only farmers can create manual bookings' });
    }

    const { slotId, topic, description } = req.body;
    if (!isValidObjectId(slotId)) {
      return res.status(400).json({ success: false, msg: 'Valid slotId is required' });
    }
    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, msg: 'Booking topic is required' });
    }

    const slot = await InstructorSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, msg: 'Slot not found' });
    }
    if (slot.status !== 'open') {
      return res.status(409).json({ success: false, msg: 'This slot is no longer available' });
    }
    if (slot.startAt <= new Date()) {
      return res.status(409).json({ success: false, msg: 'Cannot book a past slot' });
    }

    const booking = await ManualBooking.create({
      farmerId: currentUser._id,
      farmerName: currentUser.fullName || currentUser.username,
      instructorId: slot.instructorId,
      instructorName: slot.instructorName,
      slotId: slot._id,
      scheduledStartAt: slot.startAt,
      scheduledEndAt: slot.endAt,
      mode: slot.mode,
      locationText: slot.locationText,
      topic: topic.trim(),
      description: description || '',
      feeCredits: MANUAL_BOOKING_FEE_CREDITS
    });

    slot.status = 'reserved';
    slot.reservedByBookingId = booking._id;
    await slot.save();

    await createNotification(
      booking.instructorId,
      'officer',
      'New manual booking request',
      'නව අතින් වෙන්කරවා ගැනීමක්',
      `${booking.farmerName} requested your slot for ${booking.topic}.`,
      `${booking.farmerName} ඔබගේ කාලය ${booking.topic} සඳහා වෙන් කර ඇත.`
    );

    res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error('Error creating manual booking:', err);
    res.status(500).json({ success: false, msg: 'Failed to create booking' });
  }
});

router.get('/bookings/farmer/mine', authMiddleware, async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user);
    if (!currentUser || currentUser.role !== 'farmer') {
      return res.status(403).json({ success: false, msg: 'Only farmers can view own bookings' });
    }

    const bookings = await ManualBooking.find({ farmerId: currentUser._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, bookings });
  } catch (err) {
    console.error('Error fetching farmer bookings:', err);
    res.status(500).json({ success: false, msg: 'Failed to fetch bookings' });
  }
});

router.get('/bookings/instructor/mine', authMiddleware, async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user);
    if (!currentUser || currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only agricultural instructors can view own bookings' });
    }

    const statusFilter = req.query.status;
    const query = { instructorId: currentUser._id };
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }

    const bookings = await ManualBooking.find(query)
      .sort({ scheduledStartAt: 1 })
      .lean();

    res.json({ success: true, bookings });
  } catch (err) {
    console.error('Error fetching instructor bookings:', err);
    res.status(500).json({ success: false, msg: 'Failed to fetch bookings' });
  }
});

router.put('/bookings/:bookingId/respond', authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.bookingId)) {
      return res.status(400).json({ success: false, msg: 'Invalid booking id' });
    }

    const currentUser = await getCurrentUser(req.user);
    if (!currentUser || currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only agricultural instructors can respond to bookings' });
    }

    const { action, note } = req.body;
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, msg: 'Action must be accept or reject' });
    }

    const booking = await ManualBooking.findOne({
      _id: req.params.bookingId,
      instructorId: currentUser._id
    });

    if (!booking) {
      return res.status(404).json({ success: false, msg: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(409).json({ success: false, msg: 'Only pending bookings can be responded to' });
    }

    const slot = await InstructorSlot.findById(booking.slotId);
    if (!slot) {
      return res.status(404).json({ success: false, msg: 'Related slot not found' });
    }

    booking.instructorResponseNote = note || '';

    if (action === 'accept') {
      booking.status = 'accepted';
      booking.acceptedAt = new Date();
      slot.status = 'closed';
    } else {
      booking.status = 'rejected';
      slot.status = 'open';
      slot.reservedByBookingId = null;
    }

    await booking.save();
    await slot.save();

    await createNotification(
      booking.farmerId,
      'farmer',
      action === 'accept' ? 'Booking accepted' : 'Booking rejected',
      action === 'accept' ? 'වෙන්කරවා ගැනීම අනුමත විය' : 'වෙන්කරවා ගැනීම ප්‍රතික්ෂේප විය',
      action === 'accept'
        ? `${booking.instructorName} accepted your booking for ${booking.topic}.`
        : `${booking.instructorName} rejected your booking for ${booking.topic}.`,
      action === 'accept'
        ? `${booking.instructorName} විසින් ${booking.topic} සඳහා ඔබේ වෙන්කරවා ගැනීම අනුමත කරන ලදි.`
        : `${booking.instructorName} විසින් ${booking.topic} සඳහා ඔබේ වෙන්කරවා ගැනීම ප්‍රතික්ෂේප කරන ලදි.`
    );

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Error responding to booking:', err);
    res.status(500).json({ success: false, msg: 'Failed to respond booking' });
  }
});

router.put('/bookings/:bookingId/complete', authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.bookingId)) {
      return res.status(400).json({ success: false, msg: 'Invalid booking id' });
    }

    const currentUser = await getCurrentUser(req.user);
    if (!currentUser || currentUser.role !== 'officer') {
      return res.status(403).json({ success: false, msg: 'Only agricultural instructors can complete bookings' });
    }

    const { adviceText } = req.body;
    if (!adviceText || !adviceText.trim()) {
      return res.status(400).json({ success: false, msg: 'adviceText is required' });
    }

    const booking = await ManualBooking.findOne({
      _id: req.params.bookingId,
      instructorId: currentUser._id
    });

    if (!booking) {
      return res.status(404).json({ success: false, msg: 'Booking not found' });
    }

    if (booking.status !== 'accepted') {
      return res.status(409).json({ success: false, msg: 'Only accepted bookings can be completed' });
    }

    const farmer = await User.findById(booking.farmerId);
    const instructor = await User.findById(booking.instructorId);
    if (!farmer || !instructor) {
      return res.status(404).json({ success: false, msg: 'Farmer or instructor not found' });
    }

    const fee = Math.max(0, parseInt(booking.feeCredits || MANUAL_BOOKING_FEE_CREDITS, 10));
    if ((farmer.credits || 0) < fee) {
      return res.status(400).json({ success: false, msg: `Farmer does not have enough credits. Required: ${fee}` });
    }

    farmer.credits = (farmer.credits || 0) - fee;
    instructor.credits = (instructor.credits || 0) + fee;

    await farmer.save();
    await instructor.save();

    booking.status = 'completed';
    booking.adviceText = adviceText.trim();
    booking.paymentStatus = 'charged';
    booking.chargedAt = new Date();
    booking.completedAt = new Date();
    await booking.save();

    await createNotification(
      booking.farmerId,
      'farmer',
      'Instructor advice is ready',
      'උපදේශනය සූදානම්',
      `${booking.instructorName} completed your booking and submitted advice. ${fee} credits charged.`,
      `${booking.instructorName} ඔබේ වෙන්කරවා ගැනීම සම්පූර්ණ කර උපදෙස් යවා ඇත. ක්‍රෙඩිට් ${fee} අය කර ඇත.`
    );

    res.json({ success: true, booking, chargedCredits: fee });
  } catch (err) {
    console.error('Error completing booking:', err);
    res.status(500).json({ success: false, msg: 'Failed to complete booking' });
  }
});

router.put('/bookings/:bookingId/cancel', authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.bookingId)) {
      return res.status(400).json({ success: false, msg: 'Invalid booking id' });
    }

    const currentUser = await getCurrentUser(req.user);
    if (!currentUser || currentUser.role !== 'farmer') {
      return res.status(403).json({ success: false, msg: 'Only farmers can cancel bookings' });
    }

    const booking = await ManualBooking.findOne({
      _id: req.params.bookingId,
      farmerId: currentUser._id
    });

    if (!booking) {
      return res.status(404).json({ success: false, msg: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(409).json({ success: false, msg: 'Bookings cannot be cancelled after instructor acceptance' });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    const slot = await InstructorSlot.findById(booking.slotId);
    if (slot && slot.status === 'reserved') {
      slot.status = 'open';
      slot.reservedByBookingId = null;
      await slot.save();
    }

    await createNotification(
      booking.instructorId,
      'officer',
      'Booking cancelled by farmer',
      'ගොවියා විසින් වෙන්කරවා ගැනීම අවලංගු කළා',
      `${booking.farmerName} cancelled the booking request for ${booking.topic}.`,
      `${booking.farmerName} විසින් ${booking.topic} සඳහා වෙන්කරවා ගැනීම අවලංගු කර ඇත.`
    );

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ success: false, msg: 'Failed to cancel booking' });
  }
});

router.get('/notifications/farmer', authMiddleware, async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user);
    if (!currentUser || currentUser.role !== 'farmer') {
      return res.status(403).json({ success: false, msg: 'Only farmers can view booking notifications' });
    }

    const notifications = await Notification.find({
      recipientUserId: currentUser._id,
      recipientRole: 'farmer',
      type: 'system'
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = notifications.filter((item) => !item.read).length;
    res.json({ success: true, notifications, unreadCount, count: notifications.length });
  } catch (err) {
    console.error('Error fetching farmer booking notifications:', err);
    res.status(500).json({ success: false, msg: 'Failed to fetch notifications' });
  }
});

router.put('/notifications/farmer/:id/read', authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, msg: 'Invalid notification id' });
    }

    const currentUser = await getCurrentUser(req.user);
    if (!currentUser || currentUser.role !== 'farmer') {
      return res.status(403).json({ success: false, msg: 'Only farmers can update booking notifications' });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipientUserId: currentUser._id,
        recipientRole: 'farmer'
      },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, msg: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (err) {
    console.error('Error marking farmer notification as read:', err);
    res.status(500).json({ success: false, msg: 'Failed to update notification' });
  }
});

module.exports = router;
