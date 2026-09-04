const api = require('./api');
const doctor = require('./flows/doctor');
const { suitability, yield: yieldFlow } = require('./flows/forms');
const { booking } = require('./flows/booking');
const {
  t, pick, detectLanguage,
  formatMarketPrices, formatListings, formatAlerts,
  formatWeather, formatCredits, formatHeadlines
} = require('./text');

/** Short rolling chat history per number, so the assistant keeps context. */
const histories = new Map();
const HISTORY_LIMIT = 8;

function remember(jid, role, content) {
  const list = histories.get(jid) || [];
  list.push({ role, content });
  histories.set(jid, list.slice(-HISTORY_LIMIT));
}

function historyFor(jid) {
  return histories.get(jid) || [];
}

const FLOWS = { suitability, yield: yieldFlow, booking, doctor };

const CANCEL = /^(cancel|stop it|nevermind|අවලංගු)$/i;
const MENU = /^(menu|hi|hello|hey|start|0|ආයුබෝවන්|මෙනු)$/i;
const LINK = /^link\s*([0-9]{6})?$/i;

/**
 * One message in, zero or more replies out.
 *
 * `ctx` carries everything the flows need: identity, language, and the send
 * helpers bound to this chat.
 */
async function route(ctx) {
  const body = (ctx.body || '').trim();

  // --- always available escapes -----------------------------------------

  if (CANCEL.test(body)) {
    await api.clearSession(ctx.jid);
    return ctx.reply(t.cancelled(ctx.lang));
  }

  if (/^(stop|unsubscribe)$/i.test(body)) {
    if (!ctx.isGuest) await api.setPrefs(ctx.jid, { notificationsEnabled: false });
    return ctx.reply(t.stopped(ctx.lang));
  }

  if (/^(start alerts|resume|subscribe)$/i.test(body)) {
    if (!ctx.isGuest) await api.setPrefs(ctx.jid, { notificationsEnabled: true });
    return ctx.reply(t.started(ctx.lang));
  }

  if (/^(si|sinhala|සිංහල)$/i.test(body)) {
    if (!ctx.isGuest) await api.setPrefs(ctx.jid, { language: 'si' });
    ctx.lang = 'si';
    return ctx.reply(t.welcome('si', ctx.user?.fullName));
  }

  if (/^(en|english)$/i.test(body)) {
    if (!ctx.isGuest) await api.setPrefs(ctx.jid, { language: 'en' });
    ctx.lang = 'en';
    return ctx.reply(t.welcome('en', ctx.user?.fullName));
  }

  // --- account linking ---------------------------------------------------

  const linkMatch = body.match(LINK);
  if (linkMatch) {
    const code = linkMatch[1];
    if (!code) return ctx.reply(t.linkHelp(ctx.lang));

    try {
      const res = await api.confirmLink(ctx.jid, code);
      api.forgetToken(ctx.jid);
      return ctx.reply(t.linked(ctx.lang, res.user.fullName));
    } catch (err) {
      return ctx.reply(t.linkFailed(ctx.lang));
    }
  }

  if (/^unlink$/i.test(body)) {
    await api.unlink(ctx.jid);
    api.forgetToken(ctx.jid);
    return ctx.reply(pick(ctx.lang, {
      en: '👋 Disconnected. Send *LINK* with a new code to connect again.',
      si: '👋 විසන්ධි කළා. නැවත සම්බන්ධ වීමට *LINK* එවන්න.'
    }));
  }

  // --- mid-flow ----------------------------------------------------------

  const session = await api.getSession(ctx.jid);

  if (session.flow && FLOWS[session.flow]) {
    // A menu command always wins over a half-finished form
    if (!MENU.test(body)) {
      const handled = await FLOWS[session.flow].handle(ctx, session);
      if (handled !== false) return handled;
    }
  }

  // --- menu --------------------------------------------------------------

  if (MENU.test(body)) {
    await api.clearSession(ctx.jid);
    const menu = t.welcome(ctx.lang, ctx.user?.fullName);
    return ctx.reply(ctx.isGuest ? menu + t.guestBanner(ctx.lang) : menu);
  }

  switch (body) {
    case '1':
      return ctx.reply(pick(ctx.lang, {
        en: '📸 Send me a clear photo of the affected leaf and I will tell you what is wrong with it.',
        si: '📸 රෝගී කොළයේ පැහැදිලි ඡායාරූපයක් එවන්න.'
      }));
    case '2': return prices(ctx);
    case '3': return ctx.reply(t.needLocation(ctx.lang));
    case '4': return marketplace(ctx);
    case '5': return alerts(ctx);
    case '6': return suitability.start(ctx);
    case '7': return yieldFlow.start(ctx);
    case '8': return booking.start(ctx);
    case '9': return credits(ctx);
    default: break;
  }

  if (/^(prices?|market prices?|මිල)$/i.test(body)) return prices(ctx);
  if (/^(market|marketplace|listings?|වෙළඳපොළ)$/i.test(body)) return marketplace(ctx);
  if (/^(alerts?|outbreaks?|රෝග)$/i.test(body)) return alerts(ctx);
  if (/^(credits?|balance|ක්‍රෙඩිට්)$/i.test(body)) return credits(ctx);
  if (/^(news|පුවත්)$/i.test(body)) return news(ctx);
  if (/^(weather|කාලගුණ)$/i.test(body)) return ctx.reply(t.needLocation(ctx.lang));
  if (/^report$/i.test(body)) return doctor.onReport(ctx, session);
  if (/^help$/i.test(body)) return ctx.reply(t.welcome(ctx.lang, ctx.user?.fullName));

  // --- anything else goes to the agriculture assistant -------------------

  return assistant(ctx, body);
}

// -------------------------------------------------------------- stateless

async function prices(ctx) {
  await ctx.typing();
  try {
    const rows = await api.marketPrices();
    return ctx.reply(formatMarketPrices(ctx.lang, rows));
  } catch (err) {
    console.warn('Prices failed:', err.message);
    return ctx.reply(t.error(ctx.lang));
  }
}

async function marketplace(ctx) {
  await ctx.typing();
  try {
    const items = await api.listings();
    return ctx.reply(formatListings(ctx.lang, items));
  } catch (err) {
    console.warn('Listings failed:', err.message);
    return ctx.reply(t.error(ctx.lang));
  }
}

async function alerts(ctx) {
  const user = ctx.user || {};
  if (!user.district) {
    return ctx.reply(pick(ctx.lang, {
      en: '🔒 I need to know where you farm. Send *LINK* to connect your account, or share your location.',
      si: '🔒 ඔබ වගා කරන ස්ථානය දැනගත යුතුයි. *LINK* එවන්න හෝ ස්ථානය බෙදාගන්න.'
    }));
  }

  await ctx.typing();
  try {
    const res = await api.activeAlerts({
      gnDivision: user.gnDivision,
      dsDivision: user.dsDivision,
      district: user.district
    });
    return ctx.reply(formatAlerts(ctx.lang, res.alerts || [], user.gnDivision || user.district));
  } catch (err) {
    console.warn('Alerts failed:', err.message);
    return ctx.reply(t.error(ctx.lang));
  }
}

async function credits(ctx) {
  try {
    const token = await ctx.token();
    const balance = await api.creditBalance(token);
    const text = formatCredits(ctx.lang, balance);
    return ctx.reply(ctx.isGuest ? text + t.guestBanner(ctx.lang) : text);
  } catch (err) {
    console.warn('Credits failed:', err.message);
    return ctx.reply(t.error(ctx.lang));
  }
}

async function news(ctx) {
  await ctx.typing();
  try {
    return ctx.reply(formatHeadlines(ctx.lang, await api.headlines()));
  } catch (err) {
    console.warn('News failed:', err.message);
    return ctx.reply(t.error(ctx.lang));
  }
}

async function weatherAt(ctx, lat, lon, place) {
  await ctx.typing();
  try {
    const current = await api.currentWeather(lat, lon);
    return ctx.reply(formatWeather(ctx.lang, current, place || current.name || 'your location'));
  } catch (err) {
    console.warn('Weather failed:', err.message);
    return ctx.reply(t.error(ctx.lang));
  }
}

/** Falls back to the bilingual agriculture assistant, which refuses off-topic input itself. */
async function assistant(ctx, message) {
  await ctx.typing();

  try {
    const res = await api.chat(message, historyFor(ctx.jid), {
      language: ctx.lang,
      channel: 'whatsapp'
    });

    remember(ctx.jid, 'user', message);
    remember(ctx.jid, 'assistant', res.answer);

    return ctx.reply(res.answer);
  } catch (err) {
    console.warn('Assistant failed:', err.message);
    return ctx.reply(pick(ctx.lang, {
      en: '⚠️ I could not reach the assistant. Type *menu* for what I can do offline.',
      si: '⚠️ සහායකයා වෙත ළඟා විය නොහැක. *menu* ටයිප් කරන්න.'
    }));
  }
}

module.exports = { route, weatherAt, assistant, detectLanguage, remember, historyFor };
