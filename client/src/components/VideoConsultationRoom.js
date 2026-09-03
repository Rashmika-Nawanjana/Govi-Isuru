import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DailyIframe from '@daily-co/daily-js';
import { PhoneOff, Video, Loader2 } from 'lucide-react';

/**
 * In-app Daily.co video consultation room.
 * Expects session: { roomUrl, token, topic, userName }
 *
 * Rendered via portal to document.body so the app sidebar cannot sit above the call.
 */
export default function VideoConsultationRoom({ session, onLeave, lang = 'en' }) {
  const containerRef = useRef(null);
  const callRef = useRef(null);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');

  const labels = {
    en: {
      title: 'Video consultation',
      connecting: 'Loading video room…',
      lobbyHint: 'Click Join in the video panel when you are ready',
      leave: 'Leave call',
      failed: 'Could not start the video call'
    },
    si: {
      title: 'වීඩියෝ උපදේශනය',
      connecting: 'වීඩියෝ කාමරය පූරණය වෙමින්…',
      lobbyHint: 'සූදානම් වූ පසු වීඩියෝ පැනලයේ Join ඔබන්න',
      leave: 'ඇමතුමෙන් ඉවත් වන්න',
      failed: 'වීඩියෝ ඇමතුම අරඹිය නොහැකි විය'
    }
  };
  const t = labels[lang] || labels.en;

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('video-call-active');
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove('video-call-active');
    };
  }, []);

  useEffect(() => {
    if (!session?.roomUrl || !session?.token || !containerRef.current) {
      return undefined;
    }

    let cancelled = false;

    const start = async () => {
      try {
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
          showLeaveButton: true,
          showFullscreenButton: true
        });

        callRef.current = call;

        call.on('loaded', () => {
          if (!cancelled) setStatus('lobby');
        });
        call.on('joining-meeting', () => {
          if (!cancelled) setStatus('lobby');
        });
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

        if (!cancelled) setStatus('lobby');

        await call.join({
          url: session.roomUrl,
          token: session.token,
          userName: session.userName
        });

        if (!cancelled) {
          setStatus((prev) => (prev === 'connecting' ? 'joined' : prev));
        }
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

  const showBlockingOverlay = status === 'connecting' || status === 'error';

  const ui = (
    <div
      className="fixed inset-0 z-[9999] bg-gray-950 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-900 text-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Video className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{t.title}</p>
            <p className="text-xs text-gray-400 truncate">
              {session?.topic || ''}
              {status === 'lobby' ? ` · ${t.lobbyHint}` : ''}
            </p>
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

      <div className="relative flex-1 bg-black min-h-0">
        {showBlockingOverlay && (
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
  );

  return createPortal(ui, document.body);
}
