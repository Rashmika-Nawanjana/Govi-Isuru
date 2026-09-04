const mongoose = require('mongoose');

/**
 * Conversation cursor for a guided flow (suitability, listing, booking...).
 * Kept server-side rather than in bot memory so a bot restart mid-deploy
 * does not strand a farmer halfway through a form.
 */
const WhatsAppSessionSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true, index: true },

  flow: { type: String, default: null },   // 'suitability' | 'listing' | 'yield' | 'booking' | 'report'
  step: { type: Number, default: 0 },
  draft: { type: mongoose.Schema.Types.Mixed, default: {} },

  updatedAt: { type: Date, default: Date.now }
});

// TTL index - an abandoned half-filled form clears itself after 30 minutes
WhatsAppSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 1800 });

module.exports = mongoose.model('WhatsAppSession', WhatsAppSessionSchema);
