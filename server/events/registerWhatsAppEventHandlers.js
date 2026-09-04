const eventBus = require('../core/EventBus');
const notifier = require('../services/whatsappNotifier');
const { BOOKING_EVENTS } = require('./registerBookingEventHandlers');

/**
 * Mirrors booking lifecycle events into WhatsApp for users who linked a number.
 *
 * This is a second, independent subscriber - it does not replace the in-app
 * Notification documents. New booking behaviour belongs here or in a state
 * method, never as an `if` on booking.status in a route.
 */

let registered = false;

const WHATSAPP_MESSAGE_BY_EVENT = {
  [BOOKING_EVENTS.REQUESTED]: ({ booking }) => ({
    to: booking.instructorId,
    en: `📋 *New booking request*\n\n${booking.farmerName} requested your slot for "${booking.topic}".\n\nOpen Govi Isuru to accept or decline.`,
    si: `📋 *නව වෙන්කරවා ගැනීමක්*\n\n${booking.farmerName} "${booking.topic}" සඳහා ඔබගේ කාලය ඉල්ලා ඇත.\n\nඅනුමත කිරීමට Govi Isuru විවෘත කරන්න.`
  }),
  [BOOKING_EVENTS.ACCEPTED]: ({ booking }) => ({
    to: booking.farmerId,
    en: `✅ *Booking accepted*\n\n${booking.instructorName} accepted your booking for "${booking.topic}".`,
    si: `✅ *වෙන්කරවා ගැනීම අනුමතයි*\n\n${booking.instructorName} විසින් "${booking.topic}" සඳහා ඔබේ ඉල්ලීම අනුමත කරන ලදි.`
  }),
  [BOOKING_EVENTS.REJECTED]: ({ booking }) => ({
    to: booking.farmerId,
    en: `❌ *Booking declined*\n\n${booking.instructorName} could not take your booking for "${booking.topic}".\n\nSend *book* to try another instructor.`,
    si: `❌ *වෙන්කරවා ගැනීම ප්‍රතික්ෂේපයි*\n\n${booking.instructorName} විසින් "${booking.topic}" සඳහා ඉල්ලීම භාර ගත නොහැකි විය.\n\nවෙනත් උපදේශකයෙකු සඳහා *book* යවන්න.`
  }),
  [BOOKING_EVENTS.COMPLETED]: ({ booking, chargedCredits }) => ({
    to: booking.farmerId,
    en: `🎓 *Advice is ready*\n\n${booking.instructorName} completed your consultation on "${booking.topic}".\n\n${chargedCredits} credits charged. Open Govi Isuru to read the advice.`,
    si: `🎓 *උපදෙස් සූදානම්*\n\n${booking.instructorName} විසින් "${booking.topic}" පිළිබඳ උපදේශනය සම්පූර්ණ කර ඇත.\n\nක්‍රෙඩිට් ${chargedCredits} අය කර ඇත.`
  }),
  [BOOKING_EVENTS.CANCELLED]: ({ booking }) => ({
    to: booking.instructorId,
    en: `🚫 *Booking cancelled*\n\n${booking.farmerName} cancelled the request for "${booking.topic}". Your slot is open again.`,
    si: `🚫 *වෙන්කරවා ගැනීම අවලංගුයි*\n\n${booking.farmerName} විසින් "${booking.topic}" ඉල්ලීම අවලංගු කර ඇත.`
  })
};

function registerWhatsAppEventHandlers() {
  if (registered) return;

  if (!notifier.isEnabled()) {
    console.log('WhatsApp notifications disabled (WHATSAPP_BOT_KEY not set)');
    return;
  }

  Object.entries(WHATSAPP_MESSAGE_BY_EVENT).forEach(([eventName, build]) => {
    eventBus.subscribe(eventName, async (eventData) => {
      try {
        const { to, en, si } = build(eventData);
        await notifier.notifyUser(to, { en, si });
      } catch (err) {
        // A WhatsApp failure must never break the booking transition itself
        console.warn(`WhatsApp handler for ${eventName} failed:`, err.message);
      }
    });
  });

  registered = true;
  console.log('✅ WhatsApp event handlers registered');
}

module.exports = { registerWhatsAppEventHandlers };
