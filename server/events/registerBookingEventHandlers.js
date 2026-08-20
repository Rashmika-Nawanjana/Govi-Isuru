const eventBus = require('../core/EventBus');
const Notification = require('../models/Notification');
const {
  NotificationFactory,
  NOTIFICATION_TYPES
} = require('../factories/NotificationFactory');

const BOOKING_EVENTS = Object.freeze({
  REQUESTED: 'booking.requested',
  ACCEPTED: 'booking.accepted',
  REJECTED: 'booking.rejected',
  COMPLETED: 'booking.completed',
  CANCELLED: 'booking.cancelled'
});

let registered = false;

function registerBookingEventHandlers() {
  if (registered) {
    return;
  }

  const notificationTypeByEvent = {
    [BOOKING_EVENTS.REQUESTED]: NOTIFICATION_TYPES.BOOKING_REQUESTED,
    [BOOKING_EVENTS.ACCEPTED]: NOTIFICATION_TYPES.BOOKING_ACCEPTED,
    [BOOKING_EVENTS.REJECTED]: NOTIFICATION_TYPES.BOOKING_REJECTED,
    [BOOKING_EVENTS.COMPLETED]: NOTIFICATION_TYPES.BOOKING_COMPLETED,
    [BOOKING_EVENTS.CANCELLED]: NOTIFICATION_TYPES.BOOKING_CANCELLED
  };

  Object.entries(notificationTypeByEvent).forEach(([eventName, notificationType]) => {
    eventBus.subscribe(eventName, async (eventData) => {
      const notification = NotificationFactory.create(notificationType, eventData);
      await Notification.create(notification);
    });
  });

  registered = true;
}

module.exports = {
  BOOKING_EVENTS,
  registerBookingEventHandlers
};
