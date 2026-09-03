const axios = require('axios');

const DAILY_API_BASE = 'https://api.daily.co/v1';

function getDailyApiKey() {
  return process.env.DAILY_API_KEY || '';
}

function isDailyConfigured() {
  return Boolean(getDailyApiKey());
}

function dailyClient() {
  const apiKey = getDailyApiKey();
  if (!apiKey) {
    const error = new Error(
      'Daily.co is not configured. Add DAILY_API_KEY to server/.env (from https://dashboard.daily.co/developers).'
    );
    error.statusCode = 503;
    throw error;
  }

  return axios.create({
    baseURL: DAILY_API_BASE,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 15000
  });
}

/**
 * Create a private Daily room for a booking, or return existing room metadata.
 */
async function ensureRoomForBooking(booking) {
  if (booking.videoRoomName && booking.videoRoomUrl) {
    return {
      name: booking.videoRoomName,
      url: booking.videoRoomUrl,
      created: false
    };
  }

  const client = dailyClient();
  const roomName = `govi-${String(booking._id)}`.toLowerCase();
  const endMs = new Date(booking.scheduledEndAt).getTime();
  const expSeconds = Math.floor((Number.isNaN(endMs) ? Date.now() : endMs) / 1000) + 2 * 60 * 60;

  try {
    const { data } = await client.post('/rooms', {
      name: roomName,
      privacy: 'private',
      properties: {
        exp: expSeconds,
        enable_chat: true,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
        eject_at_room_exp: true
      }
    });

    return {
      name: data.name,
      url: data.url,
      created: true
    };
  } catch (err) {
    // Room may already exist from a previous attempt
    if (err.response?.status === 400 || err.response?.status === 409) {
      const { data } = await client.get(`/rooms/${roomName}`);
      return {
        name: data.name,
        url: data.url,
        created: false
      };
    }
    throw normalizeDailyError(err, 'Failed to create Daily room');
  }
}

async function createMeetingToken({ roomName, userName, isOwner = false, userId }) {
  const client = dailyClient();
  const exp = Math.floor(Date.now() / 1000) + 2 * 60 * 60;

  try {
    const { data } = await client.post('/meeting-tokens', {
      properties: {
        room_name: roomName,
        user_name: userName || 'Govi Isuru user',
        user_id: userId ? String(userId) : undefined,
        is_owner: Boolean(isOwner),
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
        exp
      }
    });

    return data.token;
  } catch (err) {
    throw normalizeDailyError(err, 'Failed to create Daily meeting token');
  }
}

function normalizeDailyError(err, fallbackMessage) {
  const status = err.statusCode || err.response?.status || 502;
  const detail =
    err.response?.data?.info ||
    err.response?.data?.error ||
    err.response?.data?.message ||
    err.message;
  const error = new Error(typeof detail === 'string' ? detail : fallbackMessage);
  error.statusCode = status >= 400 && status < 600 ? status : 502;
  return error;
}

module.exports = {
  isDailyConfigured,
  ensureRoomForBooking,
  createMeetingToken
};
