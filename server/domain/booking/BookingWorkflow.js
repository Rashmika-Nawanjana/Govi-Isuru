const { createBookingState } = require('./BookingState');

/**
 * Context for the booking State pattern.
 *
 * Route handlers ask the workflow to perform an action without containing the
 * transition rules for every possible booking status.
 */
class BookingWorkflow {
  constructor(booking) {
    this.booking = booking;
    this.state = createBookingState(booking);
  }

  accept(context) {
    return this.state.accept(context);
  }

  reject(context) {
    return this.state.reject(context);
  }

  cancel(context) {
    return this.state.cancel(context);
  }

  complete(context) {
    return this.state.complete(context);
  }
}

module.exports = BookingWorkflow;
