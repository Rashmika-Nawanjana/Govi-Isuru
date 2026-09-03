const { GoogleAuth } = require('google-auth-library');

let cachedCredentials = null;
let cachedAuth = null;

function getServiceAccountCredentials() {
  if (cachedCredentials) return cachedCredentials;

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw || !String(raw).trim()) {
    return null;
  }

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed?.client_email || !parsed?.private_key) {
      console.warn('GOOGLE_SERVICE_ACCOUNT_JSON missing client_email/private_key');
      return null;
    }
    // Normalize escaped newlines from .env
    if (typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    cachedCredentials = parsed;
    return cachedCredentials;
  } catch (err) {
    console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', err.message);
    return null;
  }
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
