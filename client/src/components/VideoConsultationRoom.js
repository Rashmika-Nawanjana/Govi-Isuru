import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { PhoneOff, Video, Loader2 } from 'lucide-react';

/**
 * In-app Daily.co video consultation room.
 * Expects session: { roomUrl, token, topic, userName }
 */
export default function VideoConsultationRoom({ session, onLeave, lang = 'en' }) {
  const containerRef = useRef(null);
  const callRef = useRef(null);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');

  const labels = {
    en: {
      title: 'Video consultation',
      connecting: 'Connecting to Daily.co…',
      leave: 'Leave call',
      failed: 'Could not start the video call'
    },
    si: {
      title: 'වීඩියෝ උපදේශනය',
      connecting: 'Daily.co වෙත සම්බන්ධ වෙමින්…',
      leave: 'ඇමතුමෙන් ඉවත් වන්න',
      failed: 'වීඩියෝ ඇමතුම අරඹිය නොහැකි විය'
    }
  };
  const t = labels[lang] || labels.en;

  useEffect(() => {
    if (!session?.roomUrl || !session?.token || !containerRef.current) {
      return undefined;
    }

    let cancelled = false;

    const start = async () => {
      try {
        // Avoid duplicate frames if React Strict Mode remounts
        if (DailyIframe.getCallInstance()) {
          try {
            DailyIframe.getCallInstance().destroy();
          } catch {
            /* ignore */
          }
        }

        const call = DailyIframe.createFrame(containerRef.current, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '12px'
          },
          showLeaveButton: false,
          showFullscreenButton: true
        });

        callRef.current = call;

        call.on('joined-meeting', () => {
          if (!cancelled) setStatus('joined');
        });
        call.on('left-meeting', () => {
          if (!cancelled) {
            setStatus('left');
            onLeave?.();
          }
        });
        call.on('error', (event) => {
          if (!cancelled) {
            setError(event?.errorMsg || t.failed);
            setStatus('error');
          }
        });

        await call.join({
          url: session.roomUrl,
          token: session.token,
          userName: session.userName
        });
      } catch (err) {
        if (!cancelled) {
          console.error('Daily join failed', err);
          setError(err.message || t.failed);
          setStatus('error');
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      const call = callRef.current;
      callRef.current = null;
      if (call) {
        call.leave().catch(() => {}).finally(() => {
          try {
            call.destroy();
          } catch {
            /* ignore */
          }
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.roomUrl, session?.token]);

  const handleLeave = async () => {
    const call = callRef.current;
    if (call) {
      try {
        await call.leave();
      } catch {
        /* ignore */
      }
      try {
        call.destroy();
      } catch {
        /* ignore */
      }
      callRef.current = null;
    }
    onLeave?.();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-5xl h-[85vh] bg-gray-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-800">
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-900 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <Video className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{t.title}</p>
              <p className="text-xs text-gray-400 truncate">{session?.topic || ''}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLeave}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold"
          >
            <PhoneOff className="w-4 h-4" />
            {t.leave}
          </button>
        </div>

        <div className="relative flex-1 bg-black">
          {(status === 'connecting' || status === 'error') && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white bg-black/80">
              {status === 'connecting' ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                  <p className="text-sm text-gray-200">{t.connecting}</p>
                </>
              ) : (
                <p className="text-sm text-rose-300 px-6 text-center">{error || t.failed}</p>
              )}
            </div>
          )}
          <div ref={containerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
