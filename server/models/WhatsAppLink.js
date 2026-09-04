const mongoose = require('mongoose');

/**
 * Binds a WhatsApp JID to a Govi Isuru account.
 *
 * User.phone is optional, non-unique and never verified, so an incoming
 * number proves nothing on its own. A link is only created after the farmer
 * echoes a code generated inside an authenticated web session.
 */
const WhatsAppLinkSchema = new mongoose.Schema({
  // e.g. 94771234567@s.whatsapp.net
  jid: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  language: { type: String, enum: ['en', 'si', 'ta'], default: 'en' },

  // Push notification preferences (STOP / START in chat)
  notificationsEnabled: { type: Boolean, default: true },

  linkedAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now }
});

WhatsAppLinkSchema.index({ userId: 1 });

module.exports = mongoose.model('WhatsAppLink', WhatsAppLinkSchema);
