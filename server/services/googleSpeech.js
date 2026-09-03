const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const { getServiceAccountCredentials, isGoogleConfigured } = require('./googleAuth');

const LANG = {
  en: {
    stt: ['en-US', 'en-IN', 'si-LK', 'ta-IN'],
    tts: 'en-US',
    voice: 'en-US-Neural2-C',
  },
  si: {
    stt: ['si-LK', 'en-US', 'ta-IN'],
    tts: 'si-LK',
    voice: 'si-LK-Standard-A',
  },
  ta: {
    stt: ['ta-IN', 'en-US', 'si-LK'],
    tts: 'ta-IN',
    voice: 'ta-IN-Wavenet-A',
  },
};

let speechClient = null;
let ttsClient = null;

function getSpeechClient() {
  const credentials = getServiceAccountCredentials();
  if (!credentials) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured');
  if (!speechClient) {
    speechClient = new speech.SpeechClient({ credentials, projectId: credentials.project_id });
  }
  return speechClient;
}

function getTtsClient() {
  const credentials = getServiceAccountCredentials();
  if (!credentials) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured');
  if (!ttsClient) {
    ttsClient = new textToSpeech.TextToSpeechClient({ credentials, projectId: credentials.project_id });
  }
  return ttsClient;
}

function resolveEncoding(mimeType = '') {
  const mt = String(mimeType).toLowerCase();
  if (mt.includes('webm')) return 'WEBM_OPUS';
  if (mt.includes('ogg')) return 'OGG_OPUS';
  if (mt.includes('wav') || mt.includes('wave')) return 'LINEAR16';
  if (mt.includes('mp3') || mt.includes('mpeg')) return 'MP3';
  if (mt.includes('flac')) return 'FLAC';
  return 'WEBM_OPUS';
}

/**
 * Transcribe audio buffer with preferred language + auto alternatives.
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/webm', language = 'en') {
  if (!isGoogleConfigured()) {
    throw new Error('Google Speech is not configured');
  }

  const lang = LANG[language] || LANG.en;
  const client = getSpeechClient();
  const encoding = resolveEncoding(mimeType);

  const [response] = await client.recognize({
    audio: { content: audioBuffer.toString('base64') },
    config: {
      encoding,
      languageCode: lang.stt[0],
      alternativeLanguageCodes: lang.stt.slice(1),
      enableAutomaticPunctuation: true,
      model: 'latest_long',
      useEnhanced: true,
    },
  });

  const results = response.results || [];
  const transcript = results
    .map((r) => r.alternatives?.[0]?.transcript || '')
    .join(' ')
    .trim();

  const detected =
    results[0]?.languageCode ||
    results[0]?.alternatives?.[0]?.words?.[0]?.languageCode ||
    lang.stt[0];

  return {
    transcript,
    detectedLanguage: detected,
    confidence: results[0]?.alternatives?.[0]?.confidence ?? null,
  };
}

/**
 * Synthesize speech audio (MP3) for chatbot replies.
 */
async function synthesizeSpeech(text, language = 'en') {
  if (!isGoogleConfigured()) {
    throw new Error('Google TTS is not configured');
  }
  if (!text || !String(text).trim()) {
    throw new Error('Text is required for TTS');
  }

  // Strip markdown / nav links for cleaner speech
  const spoken = String(text)
    .replace(/\[([^\]]+)\]\(govi-nav:\/\/[^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`#>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4500);

  const lang = LANG[language] || LANG.en;
  const client = getTtsClient();

  const request = {
    input: { text: spoken },
    voice: {
      languageCode: lang.tts,
      name: lang.voice,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: language === 'si' || language === 'ta' ? 0.95 : 1.0,
      pitch: 0,
    },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    return Buffer.from(response.audioContent);
  } catch (err) {
    // Fallback voice if Neural/Wavenet name unavailable
    if (String(err.message || '').includes('voice') || err.code === 3) {
      const [response] = await client.synthesizeSpeech({
        ...request,
        voice: { languageCode: lang.tts },
      });
      return Buffer.from(response.audioContent);
    }
    throw err;
  }
}

module.exports = {
  transcribeAudio,
  synthesizeSpeech,
  isGoogleConfigured,
  LANG,
};
