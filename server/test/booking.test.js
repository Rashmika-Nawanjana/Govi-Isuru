const test = require('node:test');
const assert = require('node:assert/strict');

const BookingWorkflow = require('../domain/booking/BookingWorkflow');
const { BookingDomainError } = require('../domain/booking/BookingState');

test('pending booking can be accepted', () => {
  const booking = { status: 'pending' };
  const slot = { status: 'reserved', reservedByBookingId: 'booking-id' };
  const now = new Date('2026-08-20T10:00:00.000Z');

  new BookingWorkflow(booking).accept({ slot, note: 'See you then', now });

  assert.equal(booking.status, 'accepted');
  assert.equal(booking.instructorResponseNote, 'See you then');
  assert.equal(booking.acceptedAt, now);
  assert.equal(slot.status, 'closed');
});

test('pending booking can be rejected and releases its slot', () => {
  const booking = { status: 'pending' };
  const slot = { status: 'reserved', reservedByBookingId: 'booking-id' };

  new BookingWorkflow(booking).reject({ slot, note: 'Not available' });

  assert.equal(booking.status, 'rejected');
  assert.equal(booking.instructorResponseNote, 'Not available');
  assert.equal(slot.status, 'open');
  assert.equal(slot.reservedByBookingId, null);
});

test('pending booking can be cancelled and releases its slot', () => {
  const booking = { status: 'pending' };
  const slot = { status: 'reserved', reservedByBookingId: 'booking-id' };
  const now = new Date('2026-08-20T10:00:00.000Z');

  new BookingWorkflow(booking).cancel({ slot, now });

  assert.equal(booking.status, 'cancelled');
  assert.equal(booking.cancelledAt, now);
  assert.equal(slot.status, 'open');
  assert.equal(slot.reservedByBookingId, null);
});

test('accepted booking can be completed and transfers credits', () => {
  const booking = { status: 'accepted' };
  const farmer = { credits: 100 };
  const instructor = { credits: 20 };
  const now = new Date('2026-08-20T10:00:00.000Z');

  const result = new BookingWorkflow(booking).complete({
    adviceText: '  Apply treatment in the evening.  ',
    farmer,
    instructor,
    fee: 40,
    now
  });

  assert.deepEqual(result, { chargedCredits: 40 });
  assert.equal(farmer.credits, 60);
  assert.equal(instructor.credits, 60);
  assert.equal(booking.status, 'completed');
  assert.equal(booking.adviceText, 'Apply treatment in the evening.');
  assert.equal(booking.paymentStatus, 'charged');
  assert.equal(booking.chargedAt, now);
  assert.equal(booking.completedAt, now);
});

test('completion fails without enough credits and changes no balances', () => {
  const booking = { status: 'accepted' };
  const farmer = { credits: 10 };
  const instructor = { credits: 20 };

  assert.throws(
    () => new BookingWorkflow(booking).complete({
      adviceText: 'Advice',
      farmer,
      instructor,
      fee: 40
    }),
    (error) => error instanceof BookingDomainError && error.statusCode === 400
  );

  assert.equal(farmer.credits, 10);
  assert.equal(instructor.credits, 20);
  assert.equal(booking.status, 'accepted');
});

test('terminal booking states reject further transitions', () => {
  const booking = { status: 'completed' };

  assert.throws(
    () => new BookingWorkflow(booking).cancel({}),
    (error) => (
      error instanceof BookingDomainError
      && error.statusCode === 409
      && /completed to cancelled/.test(error.message)
    )
  );
});
