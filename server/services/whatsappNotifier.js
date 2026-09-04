const axios = require('axios');

const WhatsAppLink = require('../models/WhatsAppLink');
const User = require('../models/User');

const BOT_URL = process.env.WHATSAPP_BOT_URL || 'http://whatsapp-bot:7000';
const BOT_KEY = process.env.WHATSAPP_BOT_KEY || '';

function isEnabled() {
  return Boolean(BOT_KEY);
}

/**
 * Hands messages to the bot's outbox. Never throws: a WhatsApp delivery
 * problem must not fail the booking or report that triggered it.
 */
async function push(messages) {
  if (!isEnabled() || !messages.length) return { queued: 0 };

  try {
    const { data } = await axios.post(
      `${BOT_URL}/push`,
      { messages },
      { headers: { 'x-bot-key': BOT_KEY }, timeout: 5000 }
    );
    return data;
  } catch (err) {
    // Bot down or mid-redeploy - the in-app notification already succeeded.
    console.warn('WhatsApp push skipped:', err.message);
    return { queued: 0, error: err.message };
  }
}

/** Send one message to a single user, if they have linked WhatsApp. */
async function notifyUser(userId, { en, si }) {
  if (!isEnabled() || !userId) return { queued: 0 };

  try {
    const link = await WhatsAppLink.findOne({ userId, notificationsEnabled: true })
      .select('jid language').lean();
    if (!link) return { queued: 0 };

    return push([{ jid: link.jid, text: link.language === 'si' ? si || en : en }]);
  } catch (err) {
    console.warn('WhatsApp notifyUser failed:', err.message);
    return { queued: 0, error: err.message };
  }
}

/**
 * Fan out to every linked farmer in an area. Narrowest geography wins so a
 * single GN division report does not message an entire district.
 */
async function notifyArea({ district, dsDivision, gnDivision, excludeUserId }, { en, si }) {
  if (!isEnabled()) return { queued: 0 };

  try {
    const where = { role: { $in: ['farmer', 'officer'] } };
    if (gnDivision) where.gnDivision = gnDivision;
    else if (dsDivision) where.dsDivision = dsDivision;
    else if (district) where.district = district;
    else return { queued: 0 };

    if (excludeUserId) where._id = { $ne: excludeUserId };

    const users = await User.find(where).select('_id').lean();
    if (!users.length) return { queued: 0 };

    const links = await WhatsAppLink.find({
      userId: { $in: users.map((u) => u._id) },
      notificationsEnabled: true
    }).select('jid language').lean();

    if (!links.length) return { queued: 0 };

    return push(links.map((l) => ({
      jid: l.jid,
      text: l.language === 'si' ? si || en : en
    })));
  } catch (err) {
    console.warn('WhatsApp notifyArea failed:', err.message);
    return { queued: 0, error: err.message };
  }
}

module.exports = { isEnabled, push, notifyUser, notifyArea };
