const path = require('path');

const config = {
  backendUrl: process.env.BACKEND_URL || 'http://backend:5000',
  botKey: process.env.WHATSAPP_BOT_KEY || '',
  adminKey: process.env.BOT_ADMIN_KEY || '',
  botPhoneNumber: process.env.BOT_PHONE_NUMBER || '',
  port: Number(process.env.BOT_PORT || 7000),
  frontendUrl: process.env.FRONTEND_URL || 'https://govi-isuru.rashmika.dev',

  // Auth state lives on a named Docker volume. If this directory is not
  // mounted, every redeploy destroys the session and forces a new QR scan.
  authDir: process.env.AUTH_DIR || path.join(__dirname, '..', 'auth_state'),

  // Pacing for outbound pushes. WhatsApp bans numbers that behave like
  // broadcasters, so alerts leave one at a time with jitter.
  outboxIntervalMs: Number(process.env.OUTBOX_INTERVAL_MS || 1500),
  outboxJitterMs: Number(process.env.OUTBOX_JITTER_MS || 600),
  outboxDailyCap: Number(process.env.OUTBOX_DAILY_CAP || 800),

  logLevel: process.env.LOG_LEVEL || 'info'
};

function assertConfig() {
  const missing = [];
  if (!config.botKey) missing.push('WHATSAPP_BOT_KEY');
  if (missing.length) {
    throw new Error(`Missing required environment: ${missing.join(', ')}`);
  }
  if (!config.adminKey) {
    console.warn('BOT_ADMIN_KEY is not set - /qr will stay closed.');
  }
  if (!config.botPhoneNumber) {
    console.warn('BOT_PHONE_NUMBER is not set - the poster wa.me link cannot be built.');
  }
}

module.exports = { config, assertConfig };
