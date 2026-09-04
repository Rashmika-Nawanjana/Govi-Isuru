const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const router = express.Router();

const User = require('../models/User');
const WhatsAppLink = require('../models/WhatsAppLink');
const WhatsAppLinkCode = require('../models/WhatsAppLinkCode');
const WhatsAppSession = require('../models/WhatsAppSession');
const authMiddleware = require('../middleware/authMiddleware');

const BOT_KEY = process.env.WHATSAPP_BOT_KEY || '';
const DEMO_USERNAME = process.env.WHATSAPP_DEMO_USERNAME || 'demo-judge';

/**
 * Guards every /internal route. The bot reaches this over the private Docker
 * network, and nginx denies /api/whatsapp/internal/ from outside - this is the
 * second lock, because one of the two will eventually be misconfigured.
 */
function requireBotKey(req, res, next) {
  if (!BOT_KEY) {
    return res.status(503).json({ error: 'WhatsApp bridge is not configured' });
  }

  const presented = req.header('x-bot-key') || '';
  const expected = Buffer.from(BOT_KEY);
  const actual = Buffer.from(presented);

  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return res.status(401).json({ error: 'Invalid bot key' });
  }

  next();
}

/** Same claim shape the web login issues, so every existing route accepts it. */
function signAccessToken(user) {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      district: user.district,
      dsDivision: user.dsDivision,
      gnDivision: user.gnDivision,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName
    },
    process.env.JWT_SECRET || 'govi_secret',
    { expiresIn: '15m' } // short-lived: the bot re-asks rather than holding a 7 day token
  );
}

function publicProfile(user) {
  return {
    id: user._id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    district: user.district,
    dsDivision: user.dsDivision,
    gnDivision: user.gnDivision,
    credits: user.credits,
    dailyLimit: user.dailyLimit,
    isPremium: user.isPremium
  };
}

// ==========================================================================
// Web-facing routes (normal user JWT)
// ==========================================================================

/**
 * POST /api/whatsapp/link/start
 * Issues a six digit code for the logged-in user to send to the bot.
 */
router.post('/link/start', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // One outstanding code per user
    await WhatsAppLinkCode.deleteMany({ userId: user._id });

    // crypto.randomInt avoids the modulo bias of Math.random for a short code
    const code = String(crypto.randomInt(100000, 1000000));
    await WhatsAppLinkCode.create({ code, userId: user._id });

    res.json({
      code,
      expiresInSeconds: 600,
      botNumber: process.env.BOT_PHONE_NUMBER || null,
      instructions: `Send "LINK ${code}" to the Govi Isuru WhatsApp number.`
    });
  } catch (err) {
    console.error('WhatsApp link/start error:', err);
    res.status(500).json({ error: 'Failed to create link code' });
  }
});

/**
 * GET /api/whatsapp/link/status - is my account connected to WhatsApp?
 */
router.get('/link/status', authMiddleware, async (req, res) => {
  try {
    const link = await WhatsAppLink.findOne({ userId: req.user.id });
    if (!link) return res.json({ linked: false });

    res.json({
      linked: true,
      // Never return the full JID to the browser; last 4 digits is enough to recognise
      maskedNumber: `••••${link.jid.split('@')[0].slice(-4)}`,
      language: link.language,
      notificationsEnabled: link.notificationsEnabled,
      linkedAt: link.linkedAt
    });
  } catch (err) {
    console.error('WhatsApp link/status error:', err);
    res.status(500).json({ error: 'Failed to read link status' });
  }
});

/**
 * DELETE /api/whatsapp/link - disconnect WhatsApp from the web side.
 */
router.delete('/link', authMiddleware, async (req, res) => {
  try {
    const link = await WhatsAppLink.findOneAndDelete({ userId: req.user.id });
    if (link) await WhatsAppSession.deleteOne({ jid: link.jid });
    res.json({ success: true, unlinked: Boolean(link) });
  } catch (err) {
    console.error('WhatsApp unlink error:', err);
    res.status(500).json({ error: 'Failed to unlink' });
  }
});

// ==========================================================================
// Internal routes (bot service key only)
// ==========================================================================

/**
 * POST /api/whatsapp/internal/resolve  { jid }
 * Who is this number? Drives guest mode vs linked mode on every message.
 */
router.post('/internal/resolve', requireBotKey, async (req, res) => {
  try {
    const { jid } = req.body || {};
    if (!jid) return res.status(400).json({ error: 'jid is required' });

    const link = await WhatsAppLink.findOne({ jid });
    if (!link) {
      // Unlinked, but not unknown: does a profile claim this phone number?
      const phone = jid.split('@')[0];
      const local = phone.replace(/^94/, '');
      const candidate = await User.findOne({
        phone: { $in: [phone, `+${phone}`, `0${local}`, local] }
      }).select('fullName district');

      return res.json({
        linked: false,
        // A phone match is a hint for the greeting only - never an auto-link.
        hint: candidate ? { fullName: candidate.fullName, district: candidate.district } : null
      });
    }

    const user = await User.findById(link.userId);
    if (!user) {
      await WhatsAppLink.deleteOne({ _id: link._id });
      return res.json({ linked: false, hint: null });
    }

    link.lastSeenAt = new Date();
    await link.save();

    res.json({
      linked: true,
      language: link.language,
      notificationsEnabled: link.notificationsEnabled,
      user: publicProfile(user)
    });
  } catch (err) {
    console.error('WhatsApp resolve error:', err);
    res.status(500).json({ error: 'Resolve failed' });
  }
});

/**
 * POST /api/whatsapp/internal/link/confirm  { jid, code }
 */
router.post('/internal/link/confirm', requireBotKey, async (req, res) => {
  try {
    const { jid, code } = req.body || {};
    if (!jid || !code) return res.status(400).json({ error: 'jid and code are required' });

    const entry = await WhatsAppLinkCode.findOne({ code: String(code).trim() });
    if (!entry) return res.status(404).json({ error: 'Invalid or expired code' });

    const user = await User.findById(entry.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // One WhatsApp number per account, and one account per number
    await WhatsAppLink.deleteMany({ $or: [{ jid }, { userId: user._id }] });
    await WhatsAppLink.create({ jid, userId: user._id });
    await WhatsAppLinkCode.deleteOne({ _id: entry._id });

    res.json({ success: true, user: publicProfile(user) });
  } catch (err) {
    console.error('WhatsApp link/confirm error:', err);
    res.status(500).json({ error: 'Link failed' });
  }
});

/**
 * POST /api/whatsapp/internal/unlink  { jid }
 */
router.post('/internal/unlink', requireBotKey, async (req, res) => {
  try {
    const { jid } = req.body || {};
    if (!jid) return res.status(400).json({ error: 'jid is required' });

    await WhatsAppLink.deleteOne({ jid });
    await WhatsAppSession.deleteOne({ jid });
    res.json({ success: true });
  } catch (err) {
    console.error('WhatsApp unlink error:', err);
    res.status(500).json({ error: 'Unlink failed' });
  }
});

/**
 * POST /api/whatsapp/internal/token  { jid }
 *
 * Mints a short-lived user JWT so the bot can call the ordinary public API.
 * Credits, roles and officer approval are then enforced exactly where they
 * already are - the bot carries no business logic of its own.
 */
router.post('/internal/token', requireBotKey, async (req, res) => {
  try {
    const { jid, guest } = req.body || {};

    let user = null;

    if (guest) {
      // Judges have no account. Fall back to a shared, seeded demo profile.
      user = await User.findOne({ username: DEMO_USERNAME });
      if (!user) {
        return res.status(503).json({
          error: 'Demo account missing',
          msg: `Seed the ${DEMO_USERNAME} account (npm run seed:whatsapp-demo).`
        });
      }
    } else {
      if (!jid) return res.status(400).json({ error: 'jid is required' });
      const link = await WhatsAppLink.findOne({ jid });
      if (!link) return res.status(404).json({ error: 'Number is not linked' });
      user = await User.findById(link.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      token: signAccessToken(user),
      expiresInSeconds: 900,
      user: publicProfile(user)
    });
  } catch (err) {
    console.error('WhatsApp token error:', err);
    res.status(500).json({ error: 'Token issue failed' });
  }
});

/**
 * PATCH /api/whatsapp/internal/prefs  { jid, language?, notificationsEnabled? }
 */
router.patch('/internal/prefs', requireBotKey, async (req, res) => {
  try {
    const { jid, language, notificationsEnabled } = req.body || {};
    if (!jid) return res.status(400).json({ error: 'jid is required' });

    const update = {};
    if (['en', 'si', 'ta'].includes(language)) update.language = language;
    if (typeof notificationsEnabled === 'boolean') update.notificationsEnabled = notificationsEnabled;
    if (!Object.keys(update).length) return res.status(400).json({ error: 'Nothing to update' });

    const link = await WhatsAppLink.findOneAndUpdate({ jid }, { $set: update });
    if (!link) return res.status(404).json({ error: 'Number is not linked' });

    res.json({ success: true, ...update });
  } catch (err) {
    console.error('WhatsApp prefs error:', err);
    res.status(500).json({ error: 'Preference update failed' });
  }
});

// ---- conversation cursor -------------------------------------------------

router.post('/internal/session/get', requireBotKey, async (req, res) => {
  try {
    const { jid } = req.body || {};
    if (!jid) return res.status(400).json({ error: 'jid is required' });

    const session = await WhatsAppSession.findOne({ jid });
    res.json(session
      ? { flow: session.flow, step: session.step, draft: session.draft || {} }
      : { flow: null, step: 0, draft: {} });
  } catch (err) {
    console.error('WhatsApp session/get error:', err);
    res.status(500).json({ error: 'Session read failed' });
  }
});

router.post('/internal/session/set', requireBotKey, async (req, res) => {
  try {
    const { jid, flow, step, draft } = req.body || {};
    if (!jid) return res.status(400).json({ error: 'jid is required' });

    if (flow === null) {
      await WhatsAppSession.deleteOne({ jid });
      return res.json({ success: true, cleared: true });
    }

    await WhatsAppSession.findOneAndUpdate(
      { jid },
      { $set: { flow, step: step || 0, draft: draft || {}, updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('WhatsApp session/set error:', err);
    res.status(500).json({ error: 'Session write failed' });
  }
});

/**
 * POST /api/whatsapp/internal/audience  { district?, dsDivision?, gnDivision?, excludeUserId? }
 *
 * Which linked numbers should hear about an outbreak in this area?
 * Narrowest geography wins, so an alert does not spam a whole district.
 */
router.post('/internal/audience', requireBotKey, async (req, res) => {
  try {
    const { district, dsDivision, gnDivision, excludeUserId } = req.body || {};

    const where = { role: { $in: ['farmer', 'officer'] } };
    if (gnDivision) where.gnDivision = gnDivision;
    else if (dsDivision) where.dsDivision = dsDivision;
    else if (district) where.district = district;
    else return res.status(400).json({ error: 'A location is required' });

    if (excludeUserId) where._id = { $ne: excludeUserId };

    const users = await User.find(where).select('_id').lean();
    const links = await WhatsAppLink.find({
      userId: { $in: users.map((u) => u._id) },
      notificationsEnabled: true
    }).select('jid language').lean();

    res.json({ recipients: links.map((l) => ({ jid: l.jid, language: l.language })) });
  } catch (err) {
    console.error('WhatsApp audience error:', err);
    res.status(500).json({ error: 'Audience lookup failed' });
  }
});

/**
 * POST /api/whatsapp/internal/recipient  { userId }
 * Single-user lookup, used by booking notifications.
 */
router.post('/internal/recipient', requireBotKey, async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const link = await WhatsAppLink.findOne({ userId, notificationsEnabled: true })
      .select('jid language').lean();

    res.json({ recipient: link ? { jid: link.jid, language: link.language } : null });
  } catch (err) {
    console.error('WhatsApp recipient error:', err);
    res.status(500).json({ error: 'Recipient lookup failed' });
  }
});

module.exports = router;
