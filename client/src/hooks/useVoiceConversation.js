import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

/**
 * Conversational voice mode with STT → chat text → AI → TTS,
 * plus barge-in (interrupt AI speech by talking again).
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
  const [voiceState, setVoiceState] = useState('idle'); // idle|listening|processing|speaking
  const [googleReady, setGoogleReady] = useState(false);

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
  const activeRef = useRef(false);
  const loopBusyRef = useRef(false);
  const languageRef = useRef(language);

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

  const stopPlayback = useCallback(() => {
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

  const cleanupMic = useCallback(() => {
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

  const stopVoice = useCallback(() => {
    activeRef.current = false;
    loopBusyRef.current = false;
    stopPlayback();
    cleanupMic();
    setVoiceState('idle');
  }, [cleanupMic, stopPlayback]);

  const playTts = useCallback(async (text, bargeInStream = null) => {
    const res = await fetch(`${API_BASE}/api/llama-chatbot/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: languageRef.current }),
    });
    if (!res.ok) throw new Error('TTS failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    let bargeRaf = null;
    let localCtx = null;

    const stopBargeMonitor = () => {
      if (bargeRaf) cancelAnimationFrame(bargeRaf);
      bargeRaf = null;
      if (localCtx) {
        try {
          localCtx.close();
        } catch (_) {
          /* ignore */
        }
        localCtx = null;
      }
    };

    if (bargeInStream) {
      try {
        localCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = localCtx.createMediaStreamSource(bargeInStream);
        const analyser = localCtx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i += 1) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          if (rms > 0.05 && audioElRef.current && !audioElRef.current.paused) {
            stopPlayback();
            stopBargeMonitor();
            return;
          }
          bargeRaf = requestAnimationFrame(tick);
        };
        bargeRaf = requestAnimationFrame(tick);
      } catch (_) {
        /* barge-in optional */
      }
    }

    try {
      await new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audioElRef.current = audio;
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('Audio playback failed'));
        audio.play().catch(reject);
      });
    } finally {
      stopBargeMonitor();
      URL.revokeObjectURL(url);
      audioElRef.current = null;
    }
  }, [stopPlayback]);

  const streamAssistant = useCallback(
    async (message) => {
      onAssistantStart?.();
      const history = getHistory?.() || [];

      const finishWithAnswer = (full, model = 'Assistant') => {
        if (full) onAssistantToken?.(full);
        onAssistantDone?.(full || '', model);
        return full || '';
      };

      try {
        const res = await fetch(`${API_BASE}/api/llama-chatbot/chat/stream`, {
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

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let full = '';
          let model = 'Assistant';
          const deadline = Date.now() + 25000;

          while (Date.now() < deadline) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n');
            buffer = parts.pop() || '';
            for (const raw of parts) {
              const line = raw.trim();
              if (!line.startsWith('data:')) continue;
              const data = line.slice(5).trim();
              if (!data || data === '[DONE]') continue;
              try {
                const event = JSON.parse(data);
                if (event.type === 'token' && event.content) {
                  full += event.content;
                  onAssistantToken?.(full);
                } else if (event.type === 'done') {
                  model = event.model || model;
                }
              } catch (_) {
                /* ignore */
              }
            }
          }

          try {
            reader.cancel();
          } catch (_) {
            /* ignore */
          }

          if (full.trim()) return finishWithAnswer(full.trim(), model);
        }
      } catch (err) {
        console.warn('Voice stream failed, trying non-stream chat', err);
      }

      // Reliable fallback so voice mode can still speak a reply
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
    },
    [getHistory, homeView, onAssistantDone, onAssistantStart, onAssistantToken, role]
  );

  const processUtterance = useCallback(
    async (blob, liveStream = null) => {
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
          /* keep default */
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
      const answer = await streamAssistant(transcript);
      if (!activeRef.current) return;

      if (answer) {
        setVoiceState('speaking');
        try {
          await playTts(answer, liveStream);
        } catch (err) {
          console.warn('TTS play failed', err);
          onError?.(err.message || 'Could not play spoken reply');
        }
      }
    },
    [onError, onUserTranscript, playTts, streamAssistant]
  );

  const startListeningPass = useCallback(async () => {
    if (!activeRef.current || loopBusyRef.current) return;
    loopBusyRef.current = true;

    try {
      cleanupMic();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
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

        // Barge-in while AI audio is playing
        if (audioElRef.current && !audioElRef.current.paused) {
          if (rms > 0.045) {
            stopPlayback();
            setVoiceState('listening');
          }
        }

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
        const liveStream = streamRef.current;
        try {
          const blob = new Blob(chunksRef.current, { type: mime });
          chunksRef.current = [];
          if (activeRef.current && hadSpeechRef.current) {
            await processUtterance(blob, liveStream);
          }
        } catch (err) {
          onError?.(err.message || 'Voice processing failed');
        } finally {
          cleanupMic();
          loopBusyRef.current = false;
          if (activeRef.current) {
            setVoiceState('listening');
            setTimeout(() => {
              if (activeRef.current) startListeningPass();
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
  }, [cleanupMic, onError, processUtterance, stopPlayback, stopVoice]);

  const startVoice = useCallback(async () => {
    if (!googleReady) {
      onError?.('Google voice services are not configured on the server yet.');
      return;
    }
    activeRef.current = true;
    setVoiceState('listening');
    await startListeningPass();
  }, [googleReady, onError, startListeningPass]);

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
