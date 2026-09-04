import React, { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axiosSetup';
import {
  MessageCircle,
  Loader2,
  CheckCircle,
  Copy,
  Check,
  Unlink,
  RefreshCw
} from 'lucide-react';

/**
 * Connects a Govi Isuru account to the WhatsApp bot.
 *
 * A phone number alone cannot identify an account (User.phone is optional and
 * unverified), so linking runs from this authenticated session outward: we
 * issue a short code here and the farmer echoes it to the bot.
 */
const WhatsAppConnect = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [code, setCode] = useState(null);
  const [botNumber, setBotNumber] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const authHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/whatsapp/link/status', { headers: authHeader() });
      setStatus(data);
    } catch (err) {
      setStatus({ linked: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Count the code down so nobody reads a stale one off the screen
  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 0) setCode(null);
  }, [secondsLeft]);

  // While a code is live, poll so the card flips itself once the bot confirms
  useEffect(() => {
    if (!code) return undefined;
    const id = setInterval(async () => {
      const { data } = await axios
        .get('/api/whatsapp/link/status', { headers: authHeader() })
        .catch(() => ({ data: null }));
      if (data?.linked) {
        setStatus(data);
        setCode(null);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [code]);

  const generateCode = async () => {
    setWorking(true);
    setError('');
    try {
      const { data } = await axios.post('/api/whatsapp/link/start', {}, { headers: authHeader() });
      setCode(data.code);
      setBotNumber(data.botNumber);
      setSecondsLeft(data.expiresInSeconds || 600);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create a code. Please try again.');
    } finally {
      setWorking(false);
    }
  };

  const disconnect = async () => {
    setWorking(true);
    setError('');
    try {
      await axios.delete('/api/whatsapp/link', { headers: authHeader() });
      setStatus({ linked: false });
      setCode(null);
    } catch (err) {
      setError('Could not disconnect. Please try again.');
    } finally {
      setWorking(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(`LINK ${code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked in some browsers - the code is on screen anyway
    }
  };

  const mmss = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  const waHref = botNumber
    ? `https://wa.me/${botNumber}?text=${encodeURIComponent(`LINK ${code}`)}`
    : null;

  return (
    <div className="max-w-4xl mx-auto mt-6 p-1">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">

        <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-6 text-white flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <MessageCircle size={26} className="text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">WhatsApp</h3>
            <p className="text-green-50 font-medium opacity-90 text-sm">
              Use Govi Isuru from a chat — crop doctor, prices, alerts
            </p>
          </div>
        </div>

        <div className="p-8">
          {loading && (
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <Loader2 className="animate-spin" size={18} /> Checking connection…
            </div>
          )}

          {error && (
            <div className="mb-5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-800 dark:text-red-200 font-medium">
              {error}
            </div>
          )}

          {!loading && status?.linked && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <CheckCircle className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-green-800 dark:text-green-200 font-bold">
                    Connected to {status.maskedNumber}
                  </p>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Send a leaf photo to the bot and it will diagnose it using your credits.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={disconnect}
                disabled={working}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold hover:border-red-300 hover:text-red-600 transition-all disabled:opacity-60"
              >
                {working ? <Loader2 className="animate-spin" size={18} /> : <Unlink size={18} />}
                Disconnect WhatsApp
              </button>
            </div>
          )}

          {!loading && !status?.linked && !code && (
            <div className="space-y-5">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Link this account to your WhatsApp number to diagnose crop disease from a photo,
                check market prices, and get outbreak alerts for your area — without opening the site.
              </p>
              <button
                type="button"
                onClick={generateCode}
                disabled={working}
                className="bg-gradient-to-r from-emerald-600 to-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-green-200 dark:shadow-none hover:scale-[1.01] transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {working ? <Loader2 className="animate-spin" size={20} /> : <MessageCircle size={20} />}
                Connect WhatsApp
              </button>
            </div>
          )}

          {!loading && !status?.linked && code && (
            <div className="space-y-5">
              <ol className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex gap-3">
                  <span className="font-bold text-green-600">1.</span>
                  <span>Open WhatsApp and start a chat with the Govi Isuru number.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-600">2.</span>
                  <span>Send this message:</span>
                </li>
              </ol>

              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-2xl font-mono font-bold tracking-widest bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-green-300 dark:border-green-800 rounded-xl px-6 py-4 text-gray-900 dark:text-gray-100">
                  LINK {code}
                </code>
                <button
                  type="button"
                  onClick={copyCode}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 font-bold text-gray-700 dark:text-gray-200 hover:border-green-400 transition-all"
                >
                  {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-all"
                  >
                    <MessageCircle size={18} /> Open WhatsApp
                  </a>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Expires in <span className="font-mono font-bold">{mmss}</span>
                </span>
                <button
                  type="button"
                  onClick={generateCode}
                  disabled={working}
                  className="flex items-center gap-1.5 text-green-700 dark:text-green-400 font-bold hover:underline disabled:opacity-60"
                >
                  <RefreshCw size={14} /> New code
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                This page updates automatically once the bot confirms the link.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConnect;
