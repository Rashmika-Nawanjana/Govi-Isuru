const mongoose = require('mongoose');

/**
 * Short-lived six digit code issued to a logged-in web session and echoed
 * back to the bot as "LINK 481203". Mongo expires the document itself, so
 * there is no sweeper job to forget about.
 */
const WhatsAppLinkCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// TTL index - document is removed 10 minutes after creation
WhatsAppLinkCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.model('WhatsAppLinkCode', WhatsAppLinkCodeSchema);
