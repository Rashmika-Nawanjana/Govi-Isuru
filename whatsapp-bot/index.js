const fs = require('fs');
const path = require('path');

const express = require('express');
const pino = require('pino');
const QRCode = require('qrcode');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const { config, assertConfig } = require('./src/config');
const api = require('./src/api');
const media = require('./src/media');
const doctor = require('./src/flows/doctor');
const { Outbox } = require('./src/outbox');
const { Limiter } = require('./src/limits');
const format = require('./src/format');
const router = require('./src/router');
const { t, detectLanguage } = require('./src/text');

const logger = pino({ level: config.logLevel });

/** Everything the admin endpoints and the reconnect loop need to see. */
const state = {
  sock: null,
  connection: 'starting',
  qr: null,            // data URL, only while unpaired
  jid: null,
  loggedOut: false,    // needs a human to re-pair
  startedAt: Date.now(),
  lastError: null,
  ffmpeg: false,
  reconnectAttempts: 0
};

/**
 * Inbound work is dispatched through this rather than awaited in the socket
 * loop, so one farmer's slow diagnosis cannot hold up everyone behind them.
 */
const limiter = new Limiter({
  concurrency: config.maxConcurrent,
  maxQueuePerUser: config.maxQueuePerUser
});

const outbox = new Outbox(async ({ jid, text }) => {
  if (!state.sock) throw new Error('socket not connected');
  await state.sock.sendMessage(jid, { text });
});

// ===========================================================================
// WhatsApp connection
// ===========================================================================

async function connect() {
  fs.mkdirSync(config.authDir, { recursive: true });

  const { state: authState, saveCreds } = await useMultiFileAuthState(config.authDir);
  const { version } = await fetchLatestBaileysVersion();

  logger.info({ version }, 'Starting WhatsApp socket');

  const sock = makeWASocket({
    version,
    auth: authState,
    logger: pino({ level: 'silent' }), // Baileys is extremely chatty at info
    printQRInTerminal: false,
    browser: ['Govi Isuru', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,        // do not steal notifications from the phone
    syncFullHistory: false
  });

  state.sock = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      state.qr = await QRCode.toDataURL(qr, { margin: 1, width: 512 });
      state.connection = 'awaiting-scan';
      logger.warn('Pairing QR ready. Open /bot/qr?key=… and scan from the bot phone.');
      // Also print to logs so `docker logs govi-whatsapp-bot` is enough
      console.log(await QRCode.toString(qr, { type: 'terminal', small: true }));
    }

    if (connection === 'open') {
      state.connection = 'open';
      state.qr = null;
      state.loggedOut = false;
      state.lastError = null;
      state.reconnectAttempts = 0;
      state.jid = sock.user?.id || null;
      logger.info({ jid: state.jid }, 'WhatsApp connected');
    }

    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode;
      state.connection = 'close';
      state.lastError = lastDisconnect?.error?.message || null;

      if (status === DisconnectReason.loggedOut) {
        // The session is dead. Reconnecting in a loop will not fix it - the
        // auth state has to be cleared and the QR scanned again.
        state.loggedOut = true;
        logger.error('Logged out by WhatsApp. Clear auth_state and re-pair.');
        return;
      }

      state.reconnectAttempts += 1;
      const delay = Math.min(30000, 2000 * state.reconnectAttempts);
      logger.warn({ status, delay }, 'Connection closed, reconnecting');
      setTimeout(() => connect().catch((e) => logger.error(e, 'Reconnect failed')), delay);
    }
  });

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      const jid = msg.key?.remoteJid;
      if (!jid) continue;

      // Deliberately not awaited: the socket must keep reading while this runs.
      limiter.run(jid, () => onMessage(sock, msg)).catch((err) => {
        if (err?.code === 'BUSY') {
          const lang = router.languageFor(jid, config.defaultLanguage);
          sock.sendMessage(jid, { text: t.busy(lang) }).catch(() => {});
          return;
        }
        logger.error({ err: err?.message }, 'Message handling failed');
      });
    }
  });

  return sock;
}

// ===========================================================================
// Inbound messages
// ===========================================================================

function extract(msg) {
  const m = msg.message || {};

  if (m.conversation) return { kind: 'text', body: m.conversation };
  if (m.extendedTextMessage?.text) return { kind: 'text', body: m.extendedTextMessage.text };
  if (m.imageMessage) return { kind: 'image', body: m.imageMessage.caption || '' };
  if (m.audioMessage) return { kind: 'audio', body: '' };
  if (m.locationMessage) {
    return {
      kind: 'location',
      body: '',
      lat: m.locationMessage.degreesLatitude,
      lon: m.locationMessage.degreesLongitude
    };
  }
  if (m.videoMessage) return { kind: 'unsupported', body: '' };
  if (m.documentMessage) return { kind: 'unsupported', body: '' };
  if (m.stickerMessage) return { kind: 'unsupported', body: '' };

  return { kind: 'unknown', body: '' };
}

async function onMessage(sock, msg) {
  const jid = msg.key.remoteJid;

  // Ignore our own echoes, groups, status broadcasts and newsletters
  if (!jid || msg.key.fromMe) return;
  if (jid.endsWith('@g.us') || jid === 'status@broadcast' || jid.endsWith('@newsletter')) return;

  const parsed = extract(msg);
  if (parsed.kind === 'unknown') return;

  // Who is this?
  let identity = { linked: false, hint: null };
  try {
    identity = await api.resolveJid(jid);
  } catch (err) {
    logger.warn({ err: err.message }, 'Identity lookup failed');
  }

  const isGuest = !identity.linked;
  // A linked farmer's stored preference, else what a guest picked this session,
  // else the deployment default (Sinhala).
  const baseLang = identity.language || router.languageFor(jid, config.defaultLanguage);

  const ctx = {
    jid,
    body: parsed.body,
    isGuest,
    user: identity.user || null,
    // Respond in the script the farmer actually used, falling back to their setting
    lang: detectLanguage(parsed.body, baseLang),

    async token() {
      return api.tokenFor(jid, { guest: isGuest });
    },
    async typing() {
      try {
        await sock.sendPresenceUpdate('composing', jid);
      } catch { /* presence is cosmetic */ }
    },
    async reply(text) {
      if (!text) return;
      return sock.sendMessage(jid, { text }, { quoted: msg });
    },
    async sendImage(buffer, caption) {
      return sock.sendMessage(jid, { image: buffer, caption }, { quoted: msg });
    },
    async sendVoice(buffer) {
      return sock.sendMessage(jid, {
        audio: buffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true
      });
    }
  };

  await sock.readMessages([msg.key]).catch(() => {});

  switch (parsed.kind) {
    case 'image': {
      const buffer = await downloadMediaMessage(msg, 'buffer', {}, {
        logger,
        reuploadRequest: sock.updateMediaMessage
      });
      return doctor.onImage(ctx, buffer);
    }

    case 'audio':
      return onVoiceNote(ctx, sock, msg);

    case 'location':
      return router.weatherAt(ctx, parsed.lat, parsed.lon);

    case 'unsupported':
      return ctx.reply(t.welcome(ctx.lang, ctx.user?.fullName));

    default:
      return router.route(ctx);
  }
}

/**
 * Voice note in, voice note out.
 *
 * This is the feature that matters most to farmers who do not type
 * comfortably - and it needed no new AI work, only a transcode either side of
 * the STT and TTS endpoints the web app already uses.
 */
async function onVoiceNote(ctx, sock, msg) {
  if (!state.ffmpeg) {
    return ctx.reply(t.error(ctx.lang));
  }

  await ctx.typing();

  try {
    const ogg = await downloadMediaMessage(msg, 'buffer', {}, {
      logger,
      reuploadRequest: sock.updateMediaMessage
    });

    const wav = await media.voiceNoteToWav(ogg);
    const stt = await api.speechToText(wav, ctx.lang);
    const transcript = (stt.transcript || stt.text || '').trim();

    if (!transcript) {
      return ctx.reply(t.error(ctx.lang));
    }

    // Show what was heard, so a mis-transcription is obvious to the farmer
    await ctx.reply(`🎤 _"${transcript}"_`);

    ctx.body = transcript;
    ctx.lang = detectLanguage(transcript, ctx.lang);

    const answer = await api.chat(transcript, router.historyFor(ctx.jid), { language: ctx.lang });
    router.remember(ctx.jid, 'user', transcript);
    router.remember(ctx.jid, 'assistant', answer.answer);

    const pretty = format.toWhatsApp(answer.answer, ctx.lang);
    await ctx.reply(pretty);

    // Speak it back, but never fail the text reply because TTS was unavailable
    try {
      const spoken = format.toSpeech(pretty).slice(0, 900);
      const mp3 = await api.textToSpeech(spoken, ctx.lang);
      await ctx.sendVoice(await media.mp3ToVoiceNote(mp3));
    } catch (err) {
      logger.warn({ err: err.message }, 'TTS reply skipped');
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Voice note failed');
    await ctx.reply(t.error(ctx.lang));
  }
}

// ===========================================================================
// Admin / health server (behind nginx at /bot/)
// ===========================================================================

function buildAdminServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Unauthenticated: used by the container healthcheck only
  app.get('/health', (req, res) => {
    res.status(state.connection === 'open' ? 200 : 503).json({
      status: state.connection === 'open' ? 'healthy' : 'degraded',
      connection: state.connection
    });
  });

  // Safe to expose - carries no secrets and no message content
  app.get('/status', (req, res) => {
    res.json({
      connected: state.connection === 'open',
      connection: state.connection,
      loggedOut: state.loggedOut,
      awaitingScan: Boolean(state.qr),
      jid: state.jid,
      ffmpeg: state.ffmpeg,
      uptimeSeconds: Math.round((Date.now() - state.startedAt) / 1000),
      lastError: state.lastError,
      outbox: outbox.stats(),
      load: limiter.snapshot(),
      waLink: config.botPhoneNumber
        ? `https://wa.me/${config.botPhoneNumber}?text=${encodeURIComponent('Hi Govi Isuru')}`
        : null
    });
  });

  /**
   * The pairing QR. Scanned once by the team from the bot's phone, never by
   * judges. Closed off entirely once a session exists.
   */
  app.get('/qr', (req, res) => {
    if (!config.adminKey) {
      return res.status(503).send('BOT_ADMIN_KEY is not configured.');
    }
    if (req.query.key !== config.adminKey) {
      return res.status(404).send('Not found');
    }
    if (!state.qr) {
      return res.status(404).json({
        error: 'No pairing QR available',
        connection: state.connection,
        hint: state.loggedOut
          ? 'Session was logged out. Clear the whatsapp_auth volume and restart.'
          : 'Already paired.'
      });
    }

    res.type('html').send(
      `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<body style="font-family:system-ui;text-align:center;padding:32px">` +
      `<h2>Govi Isuru — pair the bot</h2>` +
      `<p>WhatsApp on the bot phone → Linked Devices → Link a Device</p>` +
      `<img src="${state.qr}" alt="Pairing QR" style="max-width:min(90vw,420px)">` +
      `<p style="color:#666">This page refreshes every 20 seconds.</p>` +
      `<script>setTimeout(()=>location.reload(),20000)</script></body>`
    );
  });

  /** Push endpoint the backend's notifier calls. Service key required. */
  app.post('/push', (req, res) => {
    if (req.header('x-bot-key') !== config.botKey) {
      return res.status(401).json({ error: 'Invalid bot key' });
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const valid = messages.filter((m) => m && m.jid && m.text);

    if (state.connection !== 'open') {
      return res.status(503).json({ error: 'WhatsApp not connected', queued: 0 });
    }

    res.json(outbox.enqueue(valid));
  });

  return app;
}

// ===========================================================================
// Boot
// ===========================================================================

async function main() {
  assertConfig();

  state.ffmpeg = await media.probe();
  if (!state.ffmpeg) {
    logger.error('ffmpeg is NOT available - voice notes will be refused. Check the Dockerfile.');
  } else {
    logger.info('ffmpeg available');
  }

  buildAdminServer().listen(config.port, () => {
    logger.info(`Admin server on :${config.port}`);
  });

  setInterval(() => doctor.sweep(), 5 * 60 * 1000).unref();

  await connect();
}

main().catch((err) => {
  logger.error({ err: err.message }, 'Bot failed to start');
  process.exit(1);
});

// Never let one bad message kill the process mid-demo
process.on('unhandledRejection', (err) => {
  logger.error({ err: err?.message || err }, 'Unhandled rejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ err: err.message }, 'Uncaught exception');
});
