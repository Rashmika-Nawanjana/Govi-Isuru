const NOTIFICATION_TYPES = Object.freeze({
  BOOKING_REQUESTED: 'BOOKING_REQUESTED',
  BOOKING_ACCEPTED: 'BOOKING_ACCEPTED',
  BOOKING_REJECTED: 'BOOKING_REJECTED',
  BOOKING_COMPLETED: 'BOOKING_COMPLETED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED'
});

class NotificationFactory {
  static create(type, data) {
    const creators = {
      [NOTIFICATION_TYPES.BOOKING_REQUESTED]: this.bookingRequested,
      [NOTIFICATION_TYPES.BOOKING_ACCEPTED]: this.bookingAccepted,
      [NOTIFICATION_TYPES.BOOKING_REJECTED]: this.bookingRejected,
      [NOTIFICATION_TYPES.BOOKING_COMPLETED]: this.bookingCompleted,
      [NOTIFICATION_TYPES.BOOKING_CANCELLED]: this.bookingCancelled
    };

    const creator = creators[type];
    if (!creator) {
      throw new Error(`Unsupported notification type: ${type}`);
    }

    return creator.call(this, data);
  }

  static bookingRequested({ booking }) {
    return this.systemNotification({
      recipientUserId: booking.instructorId,
      recipientRole: 'officer',
      titleEn: 'New manual booking request',
      titleSi: 'නව අතින් වෙන්කරවා ගැනීමක්',
      messageEn: `${booking.farmerName} requested your slot for ${booking.topic}.`,
      messageSi: `${booking.farmerName} ඔබගේ කාලය ${booking.topic} සඳහා වෙන් කර ඇත.`
    });
  }

  static bookingAccepted({ booking }) {
    return this.systemNotification({
      recipientUserId: booking.farmerId,
      recipientRole: 'farmer',
      titleEn: 'Booking accepted',
      titleSi: 'වෙන්කරවා ගැනීම අනුමත විය',
      messageEn: `${booking.instructorName} accepted your booking for ${booking.topic}.`,
      messageSi: `${booking.instructorName} විසින් ${booking.topic} සඳහා ඔබේ වෙන්කරවා ගැනීම අනුමත කරන ලදි.`
    });
  }

  static bookingRejected({ booking }) {
    return this.systemNotification({
      recipientUserId: booking.farmerId,
      recipientRole: 'farmer',
      titleEn: 'Booking rejected',
      titleSi: 'වෙන්කරවා ගැනීම ප්‍රතික්ෂේප විය',
      messageEn: `${booking.instructorName} rejected your booking for ${booking.topic}.`,
      messageSi: `${booking.instructorName} විසින් ${booking.topic} සඳහා ඔබේ වෙන්කරවා ගැනීම ප්‍රතික්ෂේප කරන ලදි.`
    });
  }

  static bookingCompleted({ booking, chargedCredits }) {
    return this.systemNotification({
      recipientUserId: booking.farmerId,
      recipientRole: 'farmer',
      titleEn: 'Instructor advice is ready',
      titleSi: 'උපදේශනය සූදානම්',
      messageEn: `${booking.instructorName} completed your booking and submitted advice. ${chargedCredits} credits charged.`,
      messageSi: `${booking.instructorName} ඔබේ වෙන්කරවා ගැනීම සම්පූර්ණ කර උපදෙස් යවා ඇත. ක්‍රෙඩිට් ${chargedCredits} අය කර ඇත.`
    });
  }

  static bookingCancelled({ booking }) {
    return this.systemNotification({
      recipientUserId: booking.instructorId,
      recipientRole: 'officer',
      titleEn: 'Booking cancelled by farmer',
      titleSi: 'ගොවියා විසින් වෙන්කරවා ගැනීම අවලංගු කළා',
      messageEn: `${booking.farmerName} cancelled the booking request for ${booking.topic}.`,
      messageSi: `${booking.farmerName} විසින් ${booking.topic} සඳහා වෙන්කරවා ගැනීම අවලංගු කර ඇත.`
    });
  }

  static systemNotification({
    recipientUserId,
    recipientRole,
    titleEn,
    titleSi,
    messageEn,
    messageSi
  }) {
    return {
      recipientUserId,
      recipientRole,
      type: 'system',
      severity: 'info',
      title: { en: titleEn, si: titleSi },
      message: { en: messageEn, si: messageSi }
    };
  }
}

module.exports = {
  NotificationFactory,
  NOTIFICATION_TYPES
};
