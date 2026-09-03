import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';
const INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;

function toWsUrl(httpBase) {
  const base = (httpBase || '').replace(/\/$/, '');
  if (!base) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/api/llama-chatbot/voice/live`;
  }
  return `${base.replace(/^http/, 'ws')}/api/llama-chatbot/voice/live`;
}

function floatTo16BitPcm(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i += 1) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function downsampleBuffer(buffer, inputRate, outputRate) {
  if (outputRate === inputRate) return buffer;
  const ratio = inputRate / outputRate;
  const newLen = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLen);
  for (let i = 0; i < newLen; i += 1) {
    const idx = i * ratio;
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, buffer.length - 1);
    const frac = idx - i0;
    result[i] = buffer[i0] * (1 - frac) + buffer[i1] * frac;
  }
  return result;
}

function int16ToBase64(int16) {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToInt16(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

/**
 * Real-time duplex voice via Vertex Live WebSocket (PCM 16kHz ↔ 24kHz),
 * with HTTP STT→chat→TTS fallback if Live setup fails.
 */
export default function useVoiceConversation({
  language = 'en',
  enabled = false,
  onUserTranscript,
  onAssistantStart,
  onAssistantToken,
  onAssistantDone,
  getHistory,
  role = 'farmer',
  homeView = 'farmerHub',
  onError,
}) {
  const [voiceState, setVoiceState] = useState('idle');
  const [googleReady, setGoogleReady] = useState(false);

  const activeRef = useRef(false);
  const languageRef = useRef(language);
  const modeRef = useRef('live'); // live | http
  const wsRef = useRef(null);
  const micStreamRef = useRef(null);
  const captureCtxRef = useRef(null);
  const processorRef = useRef(null);
  const playbackCtxRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const activeSourcesRef = useRef([]);
  const userPartialRef = useRef('');
  const assistantPartialRef = useRef('');
  const assistantStartedRef = useRef(false);

  // HTTP fallback refs
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const speakingRef = useRef(false);
  const hadSpeechRef = useRef(false);
  const silenceAtRef = useRef(0);
  const audioElRef = useRef(null);
  const loopBusyRef = useRef(false);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/llama-chatbot/voice/status`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setGoogleReady(!!d.googleConfigured);
      })
      .catch(() => {
        if (!cancelled) setGoogleReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const flushPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (_) {
        /* ignore */
      }
    });
    activeSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
  }, []);

  const ensurePlaybackCtx = useCallback(async () => {
    if (!playbackCtxRef.current) {
      playbackCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: OUTPUT_RATE,
      });
    }
    if (playbackCtxRef.current.state === 'suspended') {
      await playbackCtxRef.current.resume();
    }
    return playbackCtxRef.current;
  }, []);

  const enqueuePcmPlayback = useCallback(
    async (int16, sampleRate = OUTPUT_RATE) => {
      const ctx = await ensurePlaybackCtx();
      const float = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i += 1) {
        float[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
      }
      const buffer = ctx.createBuffer(1, float.length, sampleRate);
      buffer.copyToChannel(float, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      const startAt = Math.max(now + 0.02, nextPlayTimeRef.current || now);
      source.start(startAt);
      nextPlayTimeRef.current = startAt + buffer.duration;
      activeSourcesRef.current.push(source);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0 && activeRef.current) {
          setVoiceState('listening');
        }
      };
      setVoiceState('speaking');
    },
    [ensurePlaybackCtx]
  );

  const stopPlaybackHttp = useCallback(() => {
    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
        audioElRef.current.src = '';
      } catch (_) {
        /* ignore */
      }
      audioElRef.current = null;
    }
  }, []);

  const cleanupMicHttp = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch (_) {
        /* ignore */
      }
    }
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (_) {
        /* ignore */
      }
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const stopCapture = useCallback(() => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (_) {
        /* ignore */
      }
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (captureCtxRef.current) {
      try {
        captureCtxRef.current.close();
      } catch (_) {
        /* ignore */
      }
      captureCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
  }, []);

  const stopVoice = useCallback(() => {
    activeRef.current = false;
    loopBusyRef.current = false;

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'stop' }));
        }
        wsRef.current.close();
      } catch (_) {
        /* ignore */
      }
      wsRef.current = null;
    }

    stopCapture();
    flushPlayback();
    stopPlaybackHttp();
    cleanupMicHttp();

    if (playbackCtxRef.current) {
      try {
        playbackCtxRef.current.close();
      } catch (_) {
        /* ignore */
      }
      playbackCtxRef.current = null;
    }

    userPartialRef.current = '';
    assistantPartialRef.current = '';
    assistantStartedRef.current = false;
    setVoiceState('idle');
  }, [cleanupMicHttp, flushPlayback, stopCapture, stopPlaybackHttp]);

  const playTtsHttp = useCallback(async (text) => {
    const res = await fetch(`${API_BASE}/api/llama-chatbot/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: languageRef.current }),
    });
    if (!res.ok) throw new Error('TTS failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    try {
      await new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audioElRef.current = audio;
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('Audio playback failed'));
        audio.play().then(() => {}).catch((e) => {
          if (e.name === 'AbortError') resolve();
          else reject(e);
        });
      });
    } finally {
      URL.revokeObjectURL(url);
      audioElRef.current = null;
    }
  }, []);

  const streamAssistantHttp = useCallback(
    async (message) => {
      onAssistantStart?.();
      const history = getHistory?.() || [];
      const finishWithAnswer = (full, model = 'Assistant') => {
        if (full) onAssistantToken?.(full);
        onAssistantDone?.(full || '', model);
        return full || '';
      };

      try {
        const res = await fetch(`${API_BASE}/api/llama-chatbot/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            history,
            options: {
              language: languageRef.current,
              role,
              homeView,
              temperature: 0.6,
            },
          }),
        });
        if (!res.ok) throw new Error('Chat reply failed');
        const data = await res.json();
        return finishWithAnswer((data.answer || '').trim(), data.model || 'Assistant');
      } catch (err) {
        throw err;
      }
    },
    [getHistory, homeView, onAssistantDone, onAssistantStart, onAssistantToken, role]
  );

  const processUtteranceHttp = useCallback(
    async (blob) => {
      if (!activeRef.current || !blob || blob.size < 1000) return;
      setVoiceState('processing');
      const form = new FormData();
      form.append('audio', blob, 'utterance.webm');
      form.append('language', languageRef.current);

      const sttRes = await fetch(`${API_BASE}/api/llama-chatbot/voice/stt`, {
        method: 'POST',
        body: form,
      });
      if (!sttRes.ok) {
        let detail = 'Speech recognition failed';
        try {
          const errBody = await sttRes.json();
          if (errBody?.message) detail = errBody.message;
          else if (errBody?.error) detail = errBody.error;
        } catch (_) {
          /* keep */
        }
        throw new Error(detail);
      }
      const stt = await sttRes.json();
      const transcript = (stt.transcript || '').trim();
      if (!transcript) {
        setVoiceState('listening');
        return;
      }

      onUserTranscript?.(transcript);
      cleanupMicHttp();
      const answer = await streamAssistantHttp(transcript);
      if (!activeRef.current) return;
      if (answer) {
        setVoiceState('speaking');
        try {
          await playTtsHttp(answer);
        } catch (err) {
          console.warn('TTS play failed', err);
        }
      }
      if (activeRef.current) {
        await new Promise((r) => setTimeout(r, 400));
      }
    },
    [cleanupMicHttp, onUserTranscript, playTtsHttp, streamAssistantHttp]
  );

  const startListeningPassHttp = useCallback(async () => {
    if (!activeRef.current || loopBusyRef.current) return;
    loopBusyRef.current = true;
    try {
      cleanupMicHttp();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = recorder;
      chunksRef.current = [];
      hadSpeechRef.current = false;
      speakingRef.current = false;
      silenceAtRef.current = 0;

      recorder.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.fftSize);

      const monitor = () => {
        if (!activeRef.current || !analyserRef.current) return;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const now = Date.now();
        if (recorder.state === 'recording') {
          if (rms > 0.025) {
            speakingRef.current = true;
            hadSpeechRef.current = true;
            silenceAtRef.current = now;
          } else if (speakingRef.current) {
            if (!silenceAtRef.current) silenceAtRef.current = now;
            if (hadSpeechRef.current && now - silenceAtRef.current > 900) {
              try {
                recorder.stop();
              } catch (_) {
                /* ignore */
              }
              return;
            }
          }
        }
        rafRef.current = requestAnimationFrame(monitor);
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: mime });
          chunksRef.current = [];
          if (activeRef.current && hadSpeechRef.current) {
            await processUtteranceHttp(blob);
          }
        } catch (err) {
          onError?.(err.message || 'Voice processing failed');
        } finally {
          cleanupMicHttp();
          loopBusyRef.current = false;
          if (activeRef.current) {
            setVoiceState('listening');
            setTimeout(() => {
              if (activeRef.current && modeRef.current === 'http') startListeningPassHttp();
            }, 250);
          }
        }
      };

      recorder.start(250);
      setVoiceState('listening');
      rafRef.current = requestAnimationFrame(monitor);
      setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state === 'recording') {
          try {
            recorderRef.current.stop();
          } catch (_) {
            /* ignore */
          }
        }
      }, 12000);
    } catch (err) {
      loopBusyRef.current = false;
      onError?.(err.message || 'Microphone permission denied');
      stopVoice();
    }
  }, [cleanupMicHttp, onError, processUtteranceHttp, stopVoice]);

  const startMicCapture = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
    micStreamRef.current = stream;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    captureCtxRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();

    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(2048, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (event) => {
      if (!activeRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }
      const input = event.inputBuffer.getChannelData(0);
      const down = downsampleBuffer(input, ctx.sampleRate, INPUT_RATE);
      const pcm = floatTo16BitPcm(down);
      wsRef.current.send(JSON.stringify({ type: 'audio', data: int16ToBase64(pcm) }));
    };

    source.connect(processor);
    // Keep processor alive without playing mic into speakers (echo)
    const mute = ctx.createGain();
    mute.gain.value = 0;
    processor.connect(mute);
    mute.connect(ctx.destination);
    setVoiceState('listening');
  }, []);

  const handleLiveMessage = useCallback(
    async (msg) => {
      if (!activeRef.current) return;

      if (msg.type === 'ready') {
        setVoiceState('listening');
        return;
      }

      if (msg.type === 'audio' && msg.data) {
        try {
          const pcm = base64ToInt16(msg.data);
          await enqueuePcmPlayback(pcm, msg.sampleRate || OUTPUT_RATE);
        } catch (err) {
          console.warn('Live playback failed', err);
        }
        return;
      }

      if (msg.type === 'interrupted') {
        flushPlayback();
        setVoiceState('listening');
        return;
      }

      if (msg.type === 'userTranscript' && msg.text) {
        const next = msg.text.trim();
        if (!next) return;
        userPartialRef.current = next;
        if (msg.final) {
          onUserTranscript?.(next);
          userPartialRef.current = '';
        }
        return;
      }

      if (msg.type === 'assistantTranscript' && msg.text) {
        const next = msg.text.trim();
        if (!next) return;
        if (!assistantStartedRef.current) {
          assistantStartedRef.current = true;
          onAssistantStart?.();
        }
        assistantPartialRef.current = next;
        onAssistantToken?.(next);
        return;
      }

      if (msg.type === 'assistantText' && msg.text) {
        if (!assistantStartedRef.current) {
          assistantStartedRef.current = true;
          onAssistantStart?.();
        }
        assistantPartialRef.current += msg.text;
        onAssistantToken?.(assistantPartialRef.current);
        return;
      }

      if (msg.type === 'turnComplete') {
        if (userPartialRef.current) {
          onUserTranscript?.(userPartialRef.current);
          userPartialRef.current = '';
        }
        if (assistantStartedRef.current) {
          onAssistantDone?.(assistantPartialRef.current, 'gemini-live');
          assistantPartialRef.current = '';
          assistantStartedRef.current = false;
        }
        setVoiceState('listening');
        return;
      }

      if (msg.type === 'error') {
        onError?.(msg.message || 'Live voice error');
        return;
      }

      if (msg.type === 'closed' || msg.type === 'goAway') {
        // Session ending — leave active until user stops, reconnect handled by stop
        setVoiceState((s) => (s === 'idle' ? s : 'listening'));
      }
    },
    [
      enqueuePcmPlayback,
      flushPlayback,
      onAssistantDone,
      onAssistantStart,
      onAssistantToken,
      onError,
      onUserTranscript,
    ]
  );

  const startLiveSession = useCallback(async () => {
    modeRef.current = 'live';
    const ws = new WebSocket(toWsUrl(API_BASE));
    wsRef.current = ws;

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Live voice connect timeout')), 12000);
      ws.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Live voice WebSocket failed'));
      };
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Live voice setup timeout')), 20000);

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch (_) {
          return;
        }
        if (msg.type === 'ready') {
          clearTimeout(timer);
          resolve(msg);
        } else if (msg.type === 'error') {
          clearTimeout(timer);
          reject(new Error(msg.message || 'Live setup failed'));
        }
      };

      ws.send(
        JSON.stringify({
          type: 'start',
          language: languageRef.current,
          role,
          homeView,
        })
      );
    });

    ws.onmessage = (event) => {
      try {
        handleLiveMessage(JSON.parse(event.data));
      } catch (_) {
        /* ignore */
      }
    };

    ws.onclose = () => {
      if (activeRef.current && modeRef.current === 'live') {
        onError?.('Live voice session ended');
        stopVoice();
      }
    };

    await startMicCapture();
  }, [handleLiveMessage, homeView, onError, role, startMicCapture, stopVoice]);

  const startVoice = useCallback(async () => {
    if (!googleReady) {
      onError?.('Google voice services are not configured on the server yet.');
      return;
    }
    activeRef.current = true;
    setVoiceState('listening');
    userPartialRef.current = '';
    assistantPartialRef.current = '';
    assistantStartedRef.current = false;

    try {
      await startLiveSession();
    } catch (err) {
      console.warn('Live voice unavailable, falling back to HTTP voice:', err.message);
      modeRef.current = 'http';
      onError?.(`Live mode unavailable (${err.message}). Using turn-based voice.`);
      await startListeningPassHttp();
    }
  }, [googleReady, onError, startListeningPassHttp, startLiveSession]);

  useEffect(() => {
    if (enabled) {
      startVoice();
    } else {
      stopVoice();
    }
    return () => stopVoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    voiceState,
    googleReady,
    startVoice,
    stopVoice,
  };
}
