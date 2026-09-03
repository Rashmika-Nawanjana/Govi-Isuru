const { WebSocketServer, WebSocket } = require('ws');
const {
  isGoogleConfigured,
  connectVertexLive,
  sendPcmChunk,
  parseVertexServerMessage,
  LIVE_MODEL,
} = require('../services/vertexLiveVoice');

const PATH = '/api/llama-chatbot/voice/live';

/**
 * Attach browser ↔ Vertex Live WebSocket proxy to the HTTP server.
 * Browser protocol (JSON):
 *   { type: 'start', language, role, homeView }
 *   { type: 'audio', data: '<base64 pcm 16kHz s16le>' }
 *   { type: 'stop' }
 * Server → browser:
 *   { type: 'ready', model }
 *   { type: 'audio', data, sampleRate: 24000 }
 *   { type: 'userTranscript'|'assistantTranscript', text }
 *   { type: 'interrupted'|'turnComplete'|'error'|'closed' }
 */
function attachVoiceLiveProxy(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: PATH,
  });

  wss.on('connection', (browserWs, req) => {
    let vertexWs = null;
    let started = false;
    let closed = false;

    const send = (payload) => {
      if (browserWs.readyState === WebSocket.OPEN) {
        browserWs.send(JSON.stringify(payload));
      }
    };

    const cleanup = () => {
      closed = true;
      if (vertexWs && vertexWs.readyState === WebSocket.OPEN) {
        try {
          vertexWs.close();
        } catch (_) {
          /* ignore */
        }
      }
      vertexWs = null;
    };

    browserWs.on('message', async (raw) => {
      if (closed) return;

      let msg;
      try {
        msg = JSON.parse(String(raw));
      } catch (_) {
        send({ type: 'error', message: 'Invalid JSON message' });
        return;
      }

      if (msg.type === 'stop') {
        cleanup();
        send({ type: 'closed' });
        try {
          browserWs.close();
        } catch (_) {
          /* ignore */
        }
        return;
      }

      if (msg.type === 'audio') {
        if (!vertexWs || !msg.data) return;
        sendPcmChunk(vertexWs, msg.data);
        return;
      }

      if (msg.type === 'start') {
        if (started) return;
        started = true;

        if (!isGoogleConfigured()) {
          send({ type: 'error', message: 'Google voice services are not configured' });
          return;
        }

        try {
          vertexWs = await connectVertexLive({
            language: msg.language || 'en',
            role: msg.role || 'farmer',
            homeView: msg.homeView || 'farmerHub',
          });

          vertexWs.on('message', (vertexRaw) => {
            const events = parseVertexServerMessage(vertexRaw);
            for (const event of events) {
              send(event);
            }
          });

          vertexWs.on('close', () => {
            send({ type: 'closed' });
            if (browserWs.readyState === WebSocket.OPEN) {
              try {
                browserWs.close();
              } catch (_) {
                /* ignore */
              }
            }
          });

          vertexWs.on('error', (err) => {
            console.error('Vertex Live WS error:', err.message);
            send({ type: 'error', message: err.message || 'Vertex Live connection error' });
          });

          send({ type: 'ready', model: LIVE_MODEL, inputRate: 16000, outputRate: 24000 });
        } catch (err) {
          console.error('Voice live start failed:', err.message);
          send({ type: 'error', message: err.message || 'Failed to start live voice session' });
          cleanup();
        }
        return;
      }
    });

    browserWs.on('close', cleanup);
    browserWs.on('error', cleanup);
  });

  console.log(`🎙️ Voice Live WebSocket proxy ready at ${PATH}`);
  return wss;
}

module.exports = { attachVoiceLiveProxy, PATH };
