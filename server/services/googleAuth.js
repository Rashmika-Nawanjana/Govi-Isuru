const fs = require('fs');
const { GoogleAuth } = require('google-auth-library');

let cachedCredentials = null;
let cachedAuth = null;

function stripWrappingQuotes(value) {
  const s = String(value).trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1);
  }
  return s;
}

function parseServiceAccountJson(raw) {
  if (!raw) return null;
  const text = stripWrappingQuotes(raw);
  try {
    const parsed = JSON.parse(text);
    if (!parsed?.client_email || !parsed?.private_key) {
      console.warn('Google credentials missing client_email/private_key');
      return null;
    }
    if (typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  } catch (err) {
    console.error('Failed to parse Google service account JSON:', err.message);
    return null;
  }
}

function getServiceAccountCredentials() {
  if (cachedCredentials) return cachedCredentials;

  // 1) Base64 (most reliable in Docker Compose)
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
  if (b64 && String(b64).trim()) {
    try {
      const decoded = Buffer.from(stripWrappingQuotes(b64), 'base64').toString('utf8');
      cachedCredentials = parseServiceAccountJson(decoded);
      if (cachedCredentials) return cachedCredentials;
    } catch (err) {
      console.error('Failed to decode GOOGLE_SERVICE_ACCOUNT_JSON_B64:', err.message);
    }
  }

  // 2) Raw JSON string
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw && String(raw).trim()) {
    cachedCredentials = parseServiceAccountJson(raw);
    if (cachedCredentials) return cachedCredentials;
  }

  // 3) Credentials file path (GOOGLE_APPLICATION_CREDENTIALS or custom)
  const filePath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  if (filePath && fs.existsSync(filePath)) {
    try {
      const fileRaw = fs.readFileSync(filePath, 'utf8');
      cachedCredentials = parseServiceAccountJson(fileRaw);
      if (cachedCredentials) return cachedCredentials;
    } catch (err) {
      console.error('Failed to read Google credentials file:', err.message);
    }
  }

  return null;
}

function getGoogleAuth(scopes = ['https://www.googleapis.com/auth/cloud-platform']) {
  const credentials = getServiceAccountCredentials();
  if (!credentials) return null;

  if (!cachedAuth) {
    cachedAuth = new GoogleAuth({
      credentials,
      scopes,
      projectId: credentials.project_id,
    });
  }
  return cachedAuth;
}

function isGoogleConfigured() {
  return !!getServiceAccountCredentials();
}

function getGoogleProjectId() {
  return getServiceAccountCredentials()?.project_id || process.env.GOOGLE_CLOUD_PROJECT || null;
}

module.exports = {
  getServiceAccountCredentials,
  getGoogleAuth,
  isGoogleConfigured,
  getGoogleProjectId,
};
