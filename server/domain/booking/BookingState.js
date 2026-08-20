class BookingDomainError extends Error {
  constructor(message, statusCode = 409) {
    super(message);
    this.name = 'BookingDomainError';
    this.statusCode = statusCode;
  }
}

class BookingState {
  constructor(booking) {
    this.booking = booking;
  }

  accept() {
    this.invalidTransition('accepted');
  }

  reject() {
    this.invalidTransition('rejected');
  }

  cancel() {
    this.invalidTransition('cancelled');
  }

  complete() {
    this.invalidTransition('completed');
  }

  invalidTransition(targetStatus) {
    throw new BookingDomainError(
      `Booking cannot move from ${this.booking.status} to ${targetStatus}`
    );
  }
}

class PendingBookingState extends BookingState {
  accept({ slot, note = '', now = new Date() }) {
    this.ensureSlot(slot);
    this.booking.status = 'accepted';
    this.booking.acceptedAt = now;
    this.booking.instructorResponseNote = note;
    slot.status = 'closed';
  }

  reject({ slot, note = '' }) {
    this.ensureSlot(slot);
    this.booking.status = 'rejected';
    this.booking.instructorResponseNote = note;
    slot.status = 'open';
    slot.reservedByBookingId = null;
  }

  cancel({ slot, now = new Date() }) {
    this.booking.status = 'cancelled';
    this.booking.cancelledAt = now;

    if (slot && slot.status === 'reserved') {
      slot.status = 'open';
      slot.reservedByBookingId = null;
    }
  }

  ensureSlot(slot) {
    if (!slot) {
      throw new BookingDomainError('Related slot not found', 404);
    }
  }
}

class AcceptedBookingState extends BookingState {
  complete({
    adviceText,
    farmer,
    instructor,
    fee,
    now = new Date()
  }) {
    if (!adviceText || !adviceText.trim()) {
      throw new BookingDomainError('adviceText is required', 400);
    }

    if (!farmer || !instructor) {
      throw new BookingDomainError('Farmer or instructor not found', 404);
    }

    const chargedCredits = Math.max(0, Number.parseInt(fee, 10) || 0);
    if ((farmer.credits || 0) < chargedCredits) {
      throw new BookingDomainError(
        `Farmer does not have enough credits. Required: ${chargedCredits}`,
        400
      );
    }

    farmer.credits = (farmer.credits || 0) - chargedCredits;
    instructor.credits = (instructor.credits || 0) + chargedCredits;

    this.booking.status = 'completed';
    this.booking.adviceText = adviceText.trim();
    this.booking.paymentStatus = 'charged';
    this.booking.chargedAt = now;
    this.booking.completedAt = now;

    return { chargedCredits };
  }
}

class RejectedBookingState extends BookingState {}
class CancelledBookingState extends BookingState {}
class CompletedBookingState extends BookingState {}

const STATE_BY_STATUS = Object.freeze({
  pending: PendingBookingState,
  accepted: AcceptedBookingState,
  rejected: RejectedBookingState,
  cancelled: CancelledBookingState,
  completed: CompletedBookingState
});

function createBookingState(booking) {
  const StateClass = STATE_BY_STATUS[booking.status];
  if (!StateClass) {
    throw new BookingDomainError(`Unknown booking status: ${booking.status}`, 500);
  }
  return new StateClass(booking);
}

module.exports = {
  BookingDomainError,
  BookingState,
  PendingBookingState,
  AcceptedBookingState,
  RejectedBookingState,
  CancelledBookingState,
  CompletedBookingState,
  createBookingState
};
