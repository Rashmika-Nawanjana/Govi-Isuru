const WebSocket = require('ws');
const { getGoogleAuth, getGoogleProjectId, isGoogleConfigured } = require('./googleAuth');
const { buildSystemPrompt } = require('./chatbotKnowledge');

const LOCATION = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
const LIVE_MODEL =
  process.env.GOOGLE_GEMINI_LIVE_MODEL || 'gemini-live-2.5-flash-native-audio';

function liveServiceUrl() {
  return `wss://${LOCATION}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1.LlmBidiService/BidiGenerateContent`;
}

function modelResource() {
  const project = getGoogleProjectId();
  if (!project) throw new Error('Google project id missing');
  return `projects/${project}/locations/${LOCATION}/publishers/google/models/${LIVE_MODEL}`;
}

async function getAccessToken() {
  const auth = getGoogleAuth();
  if (!auth) throw new Error('Google auth not configured');
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return typeof token === 'string' ? token : token?.token;
}

function voiceNameForLanguage(language = 'en') {
  // Native-audio voices; Kore is multilingual and works well for EN/SI/TA prompts
  if (language === 'si' || language === 'ta') return 'Kore';
  return 'Kore';
}

function buildSetupMessage({ language, role, homeView }) {
  return {
    setup: {
      model: modelResource(),
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceNameForLanguage(language),
            },
          },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: `${buildSystemPrompt({ language, role, homeView })}

## Voice conversation rules
- Keep spoken answers short (1–3 sentences) unless the farmer asks for detail.
- Prefer plain speech over markdown. Do not read raw govi-nav URLs aloud; say the feature name instead.
- If interrupted, stop and listen immediately.`,
          },
        ],
      },
      // Request transcripts so the UI can show what was said
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  };
}

/**
 * Open a Vertex Live API WebSocket and run the setup handshake.
 * Returns { vertexWs, ready } once setupComplete arrives.
 */
async function connectVertexLive(options = {}) {
  if (!isGoogleConfigured()) {
    throw new Error('Google service account is not configured');
  }

  const token = await getAccessToken();
  if (!token) throw new Error('Failed to obtain Google OAuth access token');

  const vertexWs = new WebSocket(liveServiceUrl(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Vertex Live connect timeout')), 15000);
    vertexWs.once('open', () => {
      clearTimeout(timer);
      resolve();
    });
    vertexWs.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  const setup = buildSetupMessage(options);
  vertexWs.send(JSON.stringify(setup));

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Vertex Live setup timeout')), 20000);

    const onMessage = (raw) => {
      let data;
      try {
        data = JSON.parse(String(raw));
      } catch (_) {
        return;
      }
      if (data.setupComplete !== undefined) {
        clearTimeout(timer);
        vertexWs.off('message', onMessage);
        resolve(data);
      } else if (data.error) {
        clearTimeout(timer);
        vertexWs.off('message', onMessage);
        reject(new Error(data.error.message || 'Vertex Live setup failed'));
      }
    };

    vertexWs.on('message', onMessage);
    vertexWs.once('close', (code, reason) => {
      clearTimeout(timer);
      reject(new Error(`Vertex Live closed during setup (${code}): ${reason || ''}`));
    });
  });

  return vertexWs;
}

/**
 * Forward browser PCM chunks as Vertex realtimeInput.
 */
function sendPcmChunk(vertexWs, base64Pcm) {
  if (!vertexWs || vertexWs.readyState !== WebSocket.OPEN) return;
  vertexWs.send(
    JSON.stringify({
      realtimeInput: {
        audio: {
          mimeType: 'audio/pcm;rate=16000',
          data: base64Pcm,
        },
      },
    })
  );
}

/**
 * Normalize Vertex server messages into browser-friendly events.
 */
function parseVertexServerMessage(raw) {
  let data;
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(raw.toString());
  } catch (_) {
    return [];
  }

  const events = [];

  if (data.error) {
    events.push({ type: 'error', message: data.error.message || 'Vertex Live error' });
    return events;
  }

  const content = data.serverContent;
  if (content) {
    if (content.interrupted) {
      events.push({ type: 'interrupted' });
    }

    const parts = content.modelTurn?.parts || [];
    for (const part of parts) {
      const inline = part.inlineData || part.inline_data;
      if (inline?.data) {
        events.push({
          type: 'audio',
          data: inline.data,
          mimeType: inline.mimeType || inline.mime_type || 'audio/pcm;rate=24000',
          sampleRate: 24000,
        });
      }
      if (part.text) {
        events.push({ type: 'assistantText', text: part.text });
      }
    }

    const inputTx =
      content.inputTranscription?.text ||
      content.input_transcription?.text ||
      data.inputTranscription?.text;
    if (inputTx) {
      events.push({ type: 'userTranscript', text: inputTx, final: !!content.turnComplete });
    }

    const outputTx =
      content.outputTranscription?.text ||
      content.output_transcription?.text ||
      data.outputTranscription?.text;
    if (outputTx) {
      events.push({ type: 'assistantTranscript', text: outputTx });
    }

    if (content.turnComplete || content.turn_complete) {
      events.push({ type: 'turnComplete' });
    }
  }

  // Top-level transcription fields (some API versions)
  if (data.inputTranscription?.text) {
    events.push({ type: 'userTranscript', text: data.inputTranscription.text });
  }
  if (data.outputTranscription?.text) {
    events.push({ type: 'assistantTranscript', text: data.outputTranscription.text });
  }

  if (data.goAway) {
    events.push({ type: 'goAway', timeLeft: data.goAway.timeLeft || null });
  }

  return events;
}

module.exports = {
  LIVE_MODEL,
  LOCATION,
  isGoogleConfigured,
  connectVertexLive,
  sendPcmChunk,
  parseVertexServerMessage,
};
