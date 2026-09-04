const { config } = require('./config');

/**
 * Bilingual copy. Sinhala is the point of the platform, not a translation
 * afterthought, so every farmer-facing string carries both.
 */

const SINHALA_RANGE = /[඀-෿]/;
const TAMIL_RANGE = /[஀-௿]/;

/** Detects the script the farmer actually typed in, per message. */
function detectLanguage(input, fallback = 'en') {
  if (!input) return fallback;
  if (SINHALA_RANGE.test(input)) return 'si';
  if (TAMIL_RANGE.test(input)) return 'ta';
  return fallback;
}

function pick(lang, strings) {
  return strings[lang] || strings.en;
}

const t = {
  welcome: (lang, name) => pick(lang, {
    en: `🌾 *Govi Isuru* — Farmer's Fortune\n\n${name ? `Hello ${name}! ` : 'Hello! '}I can help you with:\n\n📸 *Send a photo of a sick leaf* — I'll name the disease\n🎤 *Send a voice note* — ask me anything in Sinhala or English\n\nOr type a number:\n\n*1* Crop doctor\n*2* Market prices\n*3* Weather\n*4* Marketplace\n*5* Disease alerts near me\n*6* Which crop suits my land\n*7* Yield & profit\n*8* Book an officer\n*9* My credits\n\nType *menu* any time. Type *si* for Sinhala.`,
    si: `🌾 *ගොවි ඉසුරු*\n\n${name ? `ආයුබෝවන් ${name}! ` : 'ආයුබෝවන්! '}මට ඔබට උදව් කළ හැක:\n\n📸 *රෝගී කොළයක ඡායාරූපයක් එවන්න* — රෝගය හඳුනාගන්නම්\n🎤 *හඬ පණිවිඩයක් එවන්න* — ඕනෑම දෙයක් අසන්න\n\nනැතහොත් අංකයක් ටයිප් කරන්න:\n\n*1* බෝග වෛද්‍යවරයා\n*2* වෙළඳපොළ මිල\n*3* කාලගුණය\n*4* වෙළඳපොළ\n*5* මගේ ප්‍රදේශයේ රෝග\n*6* මගේ ඉඩමට සුදුසු බෝග\n*7* අස්වැන්න සහ ලාභය\n*8* නිලධාරියෙකු වෙන් කරන්න\n*9* මගේ ක්‍රෙඩිට්\n\n*menu* ටයිප් කරන්න. English සඳහා *en*.`
  }),

  guestBanner: (lang) => pick(lang, {
    en: `\n\n_You are using Govi Isuru as a guest. Link your account for your own credits and alerts — open ${config.frontendUrl}, go to Profile → Connect WhatsApp, then send me *LINK* and your code._`,
    si: `\n\n_ඔබ අමුත්තෙකු ලෙස භාවිත කරයි. ඔබේම ක්‍රෙඩිට් සඳහා ${config.frontendUrl} හි Profile → Connect WhatsApp වෙත ගොස්, කේතය සමඟ *LINK* එවන්න._`
  }),

  linked: (lang, name) => pick(lang, {
    en: `✅ Connected! Welcome, ${name}.\n\nYour Govi Isuru account is now linked to this number. Type *menu* to begin.`,
    si: `✅ සම්බන්ධයි! ආයුබෝවන්, ${name}.\n\nඔබේ ගොවි ඉසුරු ගිණුම මෙම අංකයට සම්බන්ධ කර ඇත. *menu* ටයිප් කරන්න.`
  }),

  linkFailed: (lang) => pick(lang, {
    en: `❌ That code is not valid or has expired.\n\nCodes last 10 minutes. Get a fresh one at ${config.frontendUrl} → Profile → Connect WhatsApp, then send *LINK 123456*.`,
    si: `❌ එම කේතය වලංගු නොවේ හෝ කල් ඉකුත් වී ඇත.\n\nකේත මිනිත්තු 10ක් වලංගු වේ. ${config.frontendUrl} → Profile → Connect WhatsApp වෙතින් නව කේතයක් ගෙන *LINK 123456* එවන්න.`
  }),

  linkHelp: (lang) => pick(lang, {
    en: `To connect your account:\n\n1. Open ${config.frontendUrl} and log in\n2. Go to *Profile → Connect WhatsApp*\n3. Send me *LINK* followed by the 6-digit code\n\nExample: *LINK 481203*`,
    si: `ඔබේ ගිණුම සම්බන්ධ කිරීමට:\n\n1. ${config.frontendUrl} වෙත ගොස් පිවිසෙන්න\n2. *Profile → Connect WhatsApp* වෙත යන්න\n3. ඉලක්කම් 6ක කේතය සමඟ *LINK* එවන්න\n\nඋදාහරණය: *LINK 481203*`
  }),

  chooseCrop: (lang) => pick(lang, {
    en: `📸 Got your photo. Which crop is this?\n\n*1* Rice / Paddy\n*2* Tea\n*3* Chili\n\nReply with the number.`,
    si: `📸 ඡායාරූපය ලැබුණි. මෙය කුමන බෝගයද?\n\n*1* වී\n*2* තේ\n*3* මිරිස්\n\nඅංකය එවන්න.`
  }),

  analysing: (lang) => pick(lang, {
    en: '🔬 Checking your leaf… this takes a few seconds.',
    si: '🔬 කොළය පරීක්ෂා කරමින්… තත්පර කිහිපයක් ගතවේ.'
  }),

  noPhotoPending: (lang) => pick(lang, {
    en: '📸 Send me a photo of the affected leaf first, then I will ask which crop it is.',
    si: '📸 මුලින්ම රෝගී කොළයේ ඡායාරූපයක් එවන්න.'
  }),

  insufficientCredits: (lang, credits, cost) => pick(lang, {
    en: `⚠️ Not enough credits. This costs *${cost}* and you have *${credits}*.\n\nCredits reset at midnight, or top up at ${config.frontendUrl}.`,
    si: `⚠️ ක්‍රෙඩිට් ප්‍රමාණවත් නොවේ. මෙයට *${cost}* අවශ්‍යයි, ඔබට ඇත්තේ *${credits}*.\n\nමධ්‍යම රාත්‍රියේ නැවත ලැබේ.`
  }),

  aiUnavailable: (lang) => pick(lang, {
    en: '⚠️ The disease model is not responding right now. Your credits were refunded — please try again in a moment.',
    si: '⚠️ රෝග හඳුනාගැනීමේ සේවාව ප්‍රතිචාර නොදක්වයි. ඔබේ ක්‍රෙඩිට් ආපසු ලබා දී ඇත.'
  }),

  cancelled: (lang) => pick(lang, {
    en: '👍 Cancelled. Type *menu* to start again.',
    si: '👍 අවලංගු කළා. නැවත ආරම්භ කිරීමට *menu* ටයිප් කරන්න.'
  }),

  needLocation: (lang) => pick(lang, {
    en: '📍 Share your location (📎 → Location) or type your district name.',
    si: '📍 ඔබේ ස්ථානය බෙදාගන්න (📎 → Location) හෝ දිස්ත්‍රික්කයේ නම ටයිප් කරන්න.'
  }),

  notLinkedForThis: (lang) => pick(lang, {
    en: `🔒 This needs your own Govi Isuru account.\n\nSend *LINK* to connect, or open ${config.frontendUrl}.`,
    si: `🔒 මෙයට ඔබේම ගොවි ඉසුරු ගිණුමක් අවශ්‍යයි.\n\nසම්බන්ධ කිරීමට *LINK* එවන්න.`
  }),

  guestWriteBlocked: (lang) => pick(lang, {
    en: '🧪 *Demo mode* — I prepared this but did not save it, because guest sessions do not write to real farmer data.\n\nLink your account to do this for real.',
    si: '🧪 *ආදර්ශන ප්‍රකාරය* — මෙය සකස් කළ නමුත් සුරැකුවේ නැත. සැබෑ ලෙස කිරීමට ඔබේ ගිණුම සම්බන්ධ කරන්න.'
  }),

  error: (lang) => pick(lang, {
    en: '⚠️ Something went wrong on my side. Try again, or type *menu*.',
    si: '⚠️ යම් දෝෂයක් විය. නැවත උත්සාහ කරන්න හෝ *menu* ටයිප් කරන්න.'
  }),

  stopped: (lang) => pick(lang, {
    en: '🔕 Alerts off. Send *START* to turn them back on.',
    si: '🔕 දැනුම්දීම් නවතා ඇත. නැවත ලබා ගැනීමට *START* එවන්න.'
  }),

  started: (lang) => pick(lang, {
    en: '🔔 Alerts on. You will hear about disease outbreaks near you.',
    si: '🔔 දැනුම්දීම් ක්‍රියාත්මකයි.'
  })
};

// ------------------------------------------------------------------ builders

function formatDiagnosis(lang, result, cropLabel) {
  const disease = result.disease || result.predicted_class || result.class || 'Unknown';
  const confidence = result.confidence != null
    ? `${(result.confidence <= 1 ? result.confidence * 100 : result.confidence).toFixed(1)}%`
    : null;

  const lines = [];
  lines.push(pick(lang, { en: `🌱 *${cropLabel} — diagnosis*`, si: `🌱 *${cropLabel} — රෝග විනිශ්චය*` }));
  lines.push('');
  lines.push(pick(lang, { en: `*Disease:* ${disease}`, si: `*රෝගය:* ${disease}` }));
  if (confidence) {
    lines.push(pick(lang, { en: `*Confidence:* ${confidence}`, si: `*නිශ්චිතභාවය:* ${confidence}` }));
  }

  const severity = result.severity || result.details?.severity;
  if (severity) {
    lines.push(pick(lang, { en: `*Severity:* ${severity}`, si: `*බරපතලකම:* ${severity}` }));
  }

  const treatment = result.treatment || result.details?.treatment || result.recommendation;
  if (treatment) {
    lines.push('');
    lines.push(pick(lang, { en: '*What to do*', si: '*කළ යුතු දේ*' }));
    lines.push(Array.isArray(treatment) ? treatment.map((x) => `• ${x}`).join('\n') : String(treatment));
  }

  lines.push('');
  lines.push(pick(lang, {
    en: '_Reply *report* to warn other farmers in your area._',
    si: '_ඔබේ ප්‍රදේශයේ අනෙක් ගොවීන්ට දැනුම් දීමට *report* එවන්න._'
  }));

  return lines.join('\n');
}

function formatMarketPrices(lang, rows) {
  const head = pick(lang, { en: '💰 *Market prices* (Rs/kg)', si: '💰 *වෙළඳපොළ මිල* (රු/කි.ග්‍රෑ)' });
  const body = rows.map((r) => {
    const parts = Object.entries(r)
      .filter(([k]) => k !== 'district')
      .map(([k, v]) => `${k} ${v}`)
      .join(' · ');
    return `*${r.district}*\n  ${parts}`;
  }).join('\n');

  return `${head}\n\n${body}`;
}

function formatListings(lang, items, limit = 8) {
  if (!items.length) {
    return pick(lang, { en: '🛒 No active listings right now.', si: '🛒 දැනට ලැයිස්තු නොමැත.' });
  }

  const head = pick(lang, { en: `🛒 *Marketplace* — ${items.length} listings`, si: `🛒 *වෙළඳපොළ* — ලැයිස්තු ${items.length}` });
  const body = items.slice(0, limit).map((l, i) => {
    const badge = l.verified ? ' ✅' : '';
    const bits = [l.quantity, l.price ? `Rs ${l.price}` : null, l.location].filter(Boolean).join(' · ');
    return `*${i + 1}. ${l.cropType}*${badge}\n  ${bits}\n  ${l.farmerName}${l.phone ? ` · ${l.phone}` : ''}`;
  }).join('\n\n');

  const more = items.length > limit
    ? pick(lang, { en: `\n\n_+${items.length - limit} more at ${config.frontendUrl}_`, si: `\n\n_තවත් ${items.length - limit}ක් ${config.frontendUrl} හි_` })
    : '';

  return `${head}\n\n${body}${more}`;
}

function formatAlerts(lang, alerts, area) {
  if (!alerts.length) {
    return pick(lang, {
      en: `✅ No active disease alerts for *${area}*. Your area is clear.`,
      si: `✅ *${area}* සඳහා ක්‍රියාකාරී රෝග අනතුරු ඇඟවීම් නොමැත.`
    });
  }

  const head = pick(lang, {
    en: `🚨 *${alerts.length} active alert${alerts.length > 1 ? 's' : ''}* near ${area}`,
    si: `🚨 *${area}* අවට ක්‍රියාකාරී අනතුරු ඇඟවීම් ${alerts.length}ක්`
  });

  const body = alerts.slice(0, 5).map((a) => {
    const sev = a.severity === 'high' ? '🔴' : a.severity === 'medium' ? '🟠' : '🟡';
    return `${sev} *${a.disease}* (${a.crop})\n  ${a.gnDivision} · ${a.reportCount} report${a.reportCount > 1 ? 's' : ''}${a.recommendation ? `\n  ${a.recommendation}` : ''}`;
  }).join('\n\n');

  return `${head}\n\n${body}`;
}

function formatWeather(lang, current, place) {
  const c = current.main || {};
  const w = (current.weather && current.weather[0]) || {};

  return pick(lang, {
    en: `🌤️ *Weather — ${place}*\n\n*${Math.round(c.temp)}°C*, ${w.description || ''}\nFeels like ${Math.round(c.feels_like)}°C\nHumidity ${c.humidity}%\nWind ${Math.round((current.wind?.speed || 0) * 3.6)} km/h`,
    si: `🌤️ *කාලගුණය — ${place}*\n\n*${Math.round(c.temp)}°C*, ${w.description || ''}\nදැනෙන උෂ්ණත්වය ${Math.round(c.feels_like)}°C\nආර්ද්‍රතාවය ${c.humidity}%\nසුළඟ ${Math.round((current.wind?.speed || 0) * 3.6)} km/h`
  });
}

function formatSuitability(lang, recs, source) {
  const head = pick(lang, { en: '🌱 *Best crops for your land*', si: '🌱 *ඔබේ ඉඩමට හොඳම බෝග*' });

  const body = recs.slice(0, 3).map((r, i) => {
    const medal = ['🥇', '🥈', '🥉'][i] || '•';
    return `${medal} *${r.crop}* — ${r.score.toFixed(0)}/100\n  _${r.reason}_`;
  }).join('\n\n');

  const tag = source === 'ml'
    ? pick(lang, { en: '\n\n_Model-based recommendation._', si: '\n\n_ආකෘතිය මත පදනම්ව._' })
    : pick(lang, { en: '\n\n_Rule-based estimate._', si: '\n\n_නීති මත පදනම්ව._' });

  return `${head}\n\n${body}${tag}`;
}

function formatYield(lang, y) {
  return pick(lang, {
    en: `📊 *Yield forecast*\n\n*${y.district}* · ${y.season} ${y.year} · ${y.area_ha} ha\n\n*${y.predicted_yield} tonnes* (${y.yield_kg_ha} kg/ha)\nRange ${(y.yield_range.min / 1000).toFixed(2)}–${(y.yield_range.max / 1000).toFixed(2)} t/ha\nConfidence ${(y.confidence * 100).toFixed(0)}%\n\nRainfall ${y.factors.rainfall} · Soil ${y.factors.soil} · Temp ${y.factors.temperature}`,
    si: `📊 *අස්වැන්න පුරෝකථනය*\n\n*${y.district}* · ${y.season} ${y.year} · හෙක්ටයාර ${y.area_ha}\n\n*ටොන් ${y.predicted_yield}* (කි.ග්‍රෑ/හෙක් ${y.yield_kg_ha})\nනිශ්චිතභාවය ${(y.confidence * 100).toFixed(0)}%`
  });
}

function formatCredits(lang, b) {
  return pick(lang, {
    en: `💳 *Credits*\n\nAvailable: *${b.credits}* of ${b.dailyLimit}\n${b.isPremium ? 'Premium account' : 'Resets at midnight'}\n\n_Crop doctor 25 · Suitability 20 · Yield 20 · New listing 50_`,
    si: `💳 *ක්‍රෙඩිට්*\n\nඉතිරි: *${b.credits}* / ${b.dailyLimit}\n${b.isPremium ? 'ප්‍රීමියම් ගිණුම' : 'මධ්‍යම රාත්‍රියේ නැවත ලැබේ'}\n\n_වෛද්‍ය 25 · සුදුසුබව 20 · අස්වැන්න 20 · ලැයිස්තුව 50_`
  });
}

function formatHeadlines(lang, payload) {
  const items = payload.articles || payload.headlines || payload.data || [];
  if (!items.length) {
    return pick(lang, { en: '📰 No agriculture news right now.', si: '📰 දැනට කෘෂිකාර්මික පුවත් නොමැත.' });
  }

  const head = pick(lang, { en: '📰 *Agriculture news*', si: '📰 *කෘෂිකාර්මික පුවත්*' });
  const body = items.slice(0, 5)
    .map((a, i) => `*${i + 1}.* ${a.title}${a.source?.name ? `\n  _${a.source.name}_` : ''}`)
    .join('\n\n');

  return `${head}\n\n${body}`;
}

module.exports = {
  t,
  pick,
  detectLanguage,
  formatDiagnosis,
  formatMarketPrices,
  formatListings,
  formatAlerts,
  formatWeather,
  formatSuitability,
  formatYield,
  formatCredits,
  formatHeadlines
};
