const axios = require('axios');
const FormData = require('form-data');

const { config } = require('./config');

const http = axios.create({
  baseURL: config.backendUrl,
  timeout: 20000,
  validateStatus: () => true // handled explicitly - a 403 for credits is data, not a crash
});

const botHeaders = () => ({ 'x-bot-key': config.botKey });

/** Short-lived user tokens, cached until a minute before they expire. */
const tokenCache = new Map();

class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || body?.msg || `Request failed with ${status}`);
    this.status = status;
    this.body = body || {};
  }
}

function unwrap(res) {
  if (res.status >= 200 && res.status < 300) return res.data;
  throw new ApiError(res.status, res.data);
}

// ---------------------------------------------------------------- internal

async function resolveJid(jid) {
  return unwrap(await http.post('/api/whatsapp/internal/resolve', { jid }, { headers: botHeaders() }));
}

async function confirmLink(jid, code) {
  return unwrap(await http.post('/api/whatsapp/internal/link/confirm', { jid, code }, { headers: botHeaders() }));
}

async function unlink(jid) {
  return unwrap(await http.post('/api/whatsapp/internal/unlink', { jid }, { headers: botHeaders() }));
}

async function setPrefs(jid, prefs) {
  return unwrap(await http.patch('/api/whatsapp/internal/prefs', { jid, ...prefs }, { headers: botHeaders() }));
}

async function getSession(jid) {
  return unwrap(await http.post('/api/whatsapp/internal/session/get', { jid }, { headers: botHeaders() }));
}

async function setSession(jid, flow, step, draft) {
  return unwrap(await http.post('/api/whatsapp/internal/session/set', { jid, flow, step, draft }, { headers: botHeaders() }));
}

async function clearSession(jid) {
  return setSession(jid, null);
}

/**
 * A user JWT for this number. Guests fall back to the shared demo account so
 * a judge without a Govi Isuru profile still gets a working bot.
 */
async function tokenFor(jid, { guest = false } = {}) {
  const key = guest ? '__guest__' : jid;
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAt > Date.now() + 60000) return cached.token;

  const data = unwrap(await http.post(
    '/api/whatsapp/internal/token',
    { jid, guest },
    { headers: botHeaders() }
  ));

  tokenCache.set(key, {
    token: data.token,
    expiresAt: Date.now() + data.expiresInSeconds * 1000
  });

  return data.token;
}

function forgetToken(jid) {
  tokenCache.delete(jid);
  tokenCache.delete('__guest__');
}

// ------------------------------------------------------------ authenticated

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function creditBalance(token) {
  return unwrap(await http.get('/api/credits/balance', { headers: auth(token) }));
}

/**
 * Identifies the real image type from its magic bytes.
 *
 * WhatsApp does not only send JPEG - a forwarded sticker or a screenshot can
 * arrive as WebP or PNG. Labelling those as image/jpeg makes the decoder
 * reject a perfectly good photo, so trust the bytes over any declared type.
 */
function sniffImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

/** AI crop doctor. 25 credits, refunded server-side if the model is unreachable. */
async function predictDisease(token, crop, buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new ApiError(0, { error: 'EMPTY_IMAGE' });
  }

  const kind = sniffImage(buffer) || { ext: 'jpg', mime: 'image/jpeg' };

  const form = new FormData();
  form.append('file', buffer, {
    filename: `leaf.${kind.ext}`,
    contentType: kind.mime,
    knownLength: buffer.length
  });

  const res = await http.post(`/api/ai/predict/${crop}`, form, {
    headers: {
      ...auth(token),
      ...form.getHeaders(),
      // form-data can compute this because knownLength was supplied. Without
      // an explicit length the request goes out chunked, and the upstream
      // multipart parser can end up seeing no fields at all.
      'Content-Length': form.getLengthSync()
    },
    timeout: 90000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  if (res.status < 200 || res.status >= 300) {
    console.warn(
      `predictDisease ${crop} failed: status=${res.status} bytes=${buffer.length} ` +
      `mime=${kind.mime} body=${JSON.stringify(res.data).slice(0, 300)}`
    );
  }

  return unwrap(res);
}

async function chat(message, history = [], options = {}) {
  return unwrap(await http.post('/api/llama-chatbot/chat', { message, history, options }, { timeout: 45000 }));
}

async function speechToText(buffer, language = 'en', filename = 'note.wav') {
  const form = new FormData();
  form.append('audio', buffer, { filename, contentType: 'audio/wav' });
  form.append('language', language);

  return unwrap(await http.post('/api/llama-chatbot/voice/stt', form, {
    headers: form.getHeaders(),
    timeout: 45000
  }));
}

async function textToSpeech(text, language = 'en') {
  const res = await http.post(
    '/api/llama-chatbot/voice/tts',
    { text, language },
    { responseType: 'arraybuffer', timeout: 45000 }
  );
  if (res.status < 200 || res.status >= 300) throw new ApiError(res.status, {});
  return Buffer.from(res.data);
}

async function marketPrices() {
  return unwrap(await http.get('/api/market-prices'));
}

async function priceTrends() {
  return unwrap(await http.get('/api/price-trends'));
}

async function listings() {
  return unwrap(await http.get('/api/listings'));
}

async function activeAlerts({ gnDivision, dsDivision, district }) {
  return unwrap(await http.get('/api/alerts/active', { params: { gnDivision, dsDivision, district } }));
}

async function reportDisease(token, payload) {
  return unwrap(await http.post('/api/alerts/disease-report', payload, { headers: auth(token) }));
}

async function suitability(token, payload) {
  return unwrap(await http.post('/api/suitability/recommend', payload, { headers: auth(token), timeout: 30000 }));
}

async function predictYield(token, params) {
  return unwrap(await http.get('/api/yield/predict', { params, headers: auth(token) }));
}

async function geocode(query) {
  return unwrap(await http.get('/api/weather/geocode', { params: { query } }));
}

async function currentWeather(lat, lon) {
  return unwrap(await http.get('/api/weather/current', { params: { lat, lon } }));
}

async function forecast(lat, lon) {
  return unwrap(await http.get('/api/weather/forecast', { params: { lat, lon } }));
}

async function headlines() {
  return unwrap(await http.get('/api/news/headlines'));
}

async function instructors(token) {
  return unwrap(await http.get('/api/manual-bookings/instructors', { headers: auth(token) }));
}

async function instructorSlots(token, instructorId) {
  return unwrap(await http.get(`/api/manual-bookings/instructors/${instructorId}/slots`, { headers: auth(token) }));
}

async function createBooking(token, payload) {
  return unwrap(await http.post('/api/manual-bookings/bookings', payload, { headers: auth(token) }));
}

async function myBookings(token) {
  return unwrap(await http.get('/api/manual-bookings/bookings/farmer/mine', { headers: auth(token) }));
}

module.exports = {
  ApiError,
  resolveJid,
  confirmLink,
  unlink,
  setPrefs,
  getSession,
  setSession,
  clearSession,
  tokenFor,
  forgetToken,
  creditBalance,
  predictDisease,
  chat,
  speechToText,
  textToSpeech,
  marketPrices,
  priceTrends,
  listings,
  activeAlerts,
  reportDisease,
  suitability,
  predictYield,
  geocode,
  currentWeather,
  forecast,
  headlines,
  instructors,
  instructorSlots,
  createBooking,
  myBookings
};
