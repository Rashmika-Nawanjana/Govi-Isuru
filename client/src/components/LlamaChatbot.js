import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Send,
  Loader2,
  Languages,
  Mic,
  MicOff,
  AlertTriangle,
  Stethoscope,
  CloudSun,
  TrendingUp,
  Compass,
  Leaf,
  Sparkles,
} from 'lucide-react';
import ChatMarkdown from './chat/ChatMarkdown';
import { getHomeView } from '../utils/navigation';
import useVoiceConversation from '../hooks/useVoiceConversation';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

const SUGGESTIONS = {
  en: [
    { label: 'Detect crop disease', icon: Stethoscope, prompt: 'How do I detect a crop disease with AI Doctor?' },
    { label: 'Weather advice', icon: CloudSun, prompt: 'How can I check weather and fertilizer timing?' },
    { label: 'Market prices', icon: TrendingUp, prompt: 'Where can I see crop market prices?' },
    { label: 'Navigate the app', icon: Compass, prompt: 'How do I navigate Govi Isuru on mobile and web?' },
    { label: 'Rice farming tips', icon: Leaf, prompt: 'Give me practical rice farming tips for Sri Lanka' },
  ],
  si: [
    { label: 'රෝග හඳුනාගන්න', icon: Stethoscope, prompt: 'AI වෛද්‍ය සමඟ බෝග රෝගයක් හඳුනා ගන්නේ කෙසේද?' },
    { label: 'කාලගුණ උපදෙස්', icon: CloudSun, prompt: 'කාලගුණය සහ පොහොර යෙදීමේ වේලාව බලන්නේ කෙසේද?' },
    { label: 'වෙළඳ මිල', icon: TrendingUp, prompt: 'බෝග මිල බලන්නේ කොහෙන්ද?' },
    { label: 'යෙදුම සංචාලනය', icon: Compass, prompt: 'Govi Isuru ජංගම සහ වෙබ් තුළ සංචාලනය කරන්නේ කෙසේද?' },
    { label: 'වී වගා උපදෙස්', icon: Leaf, prompt: 'ශ්‍රී ලංකාවට ප්‍රායෝගික වී වගා උපදෙස් දෙන්න' },
  ],
  ta: [
    { label: 'பயிர் நோய் கண்டறி', icon: Stethoscope, prompt: 'AI மருத்துவரால் பயிர் நோயை எப்படி கண்டுபிடிப்பது?' },
    { label: 'வானிலை ஆலோசனை', icon: CloudSun, prompt: 'வானிலை மற்றும் உர நேரத்தை எப்படி பார்ப்பது?' },
    { label: 'சந்தை விலை', icon: TrendingUp, prompt: 'பயிர் சந்தை விலைகளை எங்கே பார்க்கலாம்?' },
    { label: 'செயலி வழிகாட்டல்', icon: Compass, prompt: 'Govi Isuru செயலியில் எப்படி செல்ல வேண்டும்?' },
    { label: 'நெல் விவசாயம்', icon: Leaf, prompt: 'இலங்கைக்கான நெல் விவசாய குறிப்புகள் கூறுங்கள்' },
  ],
};

const LANG_LABEL = { en: 'EN', si: 'සිං', ta: 'தமிழ்' };
const NEXT_LANG = { en: 'si', si: 'ta', ta: 'en' };

function ChatOrb({ pulsing = false }) {
  return (
    <div className={`relative mx-auto w-36 h-36 md:w-40 md:h-40 ${pulsing ? 'animate-pulse' : ''}`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-lime-200 via-emerald-300 to-green-500 blur-2xl opacity-70 animate-[pulse_3s_ease-in-out_infinite]" />
      <div className="absolute inset-3 rounded-full bg-gradient-to-br from-emerald-200/80 via-green-400/90 to-teal-600 shadow-[0_0_40px_rgba(34,197,94,0.45)]" />
      <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-white/50 via-lime-100/30 to-transparent" />
      <div className="absolute inset-[42%] rounded-full bg-white/70 blur-[2px]" />
    </div>
  );
}

function VoiceSessionView({ voiceState = 'listening', lang = 'en' }) {
  const labels = {
    en: {
      listening: 'Listening… speak freely',
      processing: 'Thinking…',
      speaking: 'Speaking… tap mic to stop',
      idle: 'Starting voice chat…',
      tip: 'Voice-only mode — chat history is hidden',
    },
    si: {
      listening: 'සවන් දෙමින්… කතා කරන්න',
      processing: 'සිතමින්…',
      speaking: 'කතා කරමින්… නැවැත්වීමට mic',
      idle: 'හඬ සංවාදය ආරම්භ වෙමින්…',
      tip: 'හඬ පමණි — පෙළ ඉතිහාසය සඟවා ඇත',
    },
    ta: {
      listening: 'கேட்கிறேன்… பேசுங்கள்',
      processing: 'யோசிக்கிறேன்…',
      speaking: 'பேசுகிறேன்… நிறுத்த mic',
      idle: 'குரல் அரட்டை தொடங்குகிறது…',
      tip: 'குரல் மட்டும் — உரையாடல் மறைக்கப்பட்டது',
    },
  };
  const t = labels[lang] || labels.en;
  const status = t[voiceState] || t.idle;
  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const isProcessing = voiceState === 'processing';

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4">
      <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
        {/* Outer reactive rings */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-emerald-300/40 ${
            isListening || isSpeaking ? 'animate-ping' : ''
          }`}
          style={{ animationDuration: isSpeaking ? '1.4s' : '2.2s' }}
        />
        <div
          className={`absolute inset-4 rounded-full border border-lime-400/50 ${
            isListening || isSpeaking ? 'animate-pulse' : ''
          }`}
        />
        <div
          className={`absolute inset-8 rounded-full bg-gradient-to-br from-lime-200/50 via-emerald-400/30 to-green-600/20 blur-xl ${
            isSpeaking ? 'scale-110' : isListening ? 'scale-105' : 'scale-100'
          } transition-transform duration-500`}
        />
        {/* Core bubble */}
        <div
          className={`relative z-10 w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.45)] transition-all duration-300 ${
            isSpeaking
              ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-700 scale-110'
              : isProcessing
                ? 'bg-gradient-to-br from-lime-300 via-emerald-400 to-green-600'
                : 'bg-gradient-to-br from-lime-200 via-emerald-400 to-green-600'
          }`}
        >
          <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-white/40 to-transparent" />
          {isSpeaking ? (
            <div className="relative z-10 flex items-end gap-1 h-8">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-1.5 rounded-full bg-white/90 animate-pulse"
                  style={{
                    height: `${10 + (i % 3) * 8}px`,
                    animationDelay: `${i * 0.12}s`,
                    animationDuration: '0.7s',
                  }}
                />
              ))}
            </div>
          ) : isProcessing ? (
            <Loader2 size={28} className="relative z-10 text-white animate-spin" />
          ) : (
            <Mic size={28} className="relative z-10 text-white" />
          )}
        </div>
      </div>

      <p className="mt-8 text-base md:text-lg font-bold text-slate-800 dark:text-white tracking-tight">
        {status}
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-gray-400 max-w-[16rem]">
        {t.tip}
      </p>
    </div>
  );
}

export default function LlamaChatbot({ lang = 'en', user = null, onNavigate = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatLang, setChatLang] = useState(lang === 'si' ? 'si' : lang === 'ta' ? 'ta' : 'en');
  const [voiceMode, setVoiceMode] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const lastAiResponseRef = useRef(null);
  const abortRef = useRef(null);
  const revealTimerRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const scrollRafRef = useRef(null);
  const messagesRef = useRef([]);

  const suggestions = SUGGESTIONS[chatLang] || SUGGESTIONS.en;
  const hasConversation = messages.length > 0;
  const homeView = getHomeView(user?.role);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const isNearBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const smoothScrollToBottom = () => {
    if (!stickToBottomRef.current) return;
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = messagesContainerRef.current;
      if (!el) return;
      const target = el.scrollHeight - el.clientHeight;
      const distance = target - el.scrollTop;
      if (distance <= 1) return;
      el.scrollTop += Math.max(1, distance * 0.28);
      if (el.scrollHeight - el.scrollTop - el.clientHeight > 2) {
        smoothScrollToBottom();
      }
    });
  };

  const clearRevealTimer = () => {
    if (revealTimerRef.current) {
      clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  };

  const startPacedReveal = (assistantId) => {
    clearRevealTimer();
    const state = { buffer: '', shown: 0, done: false, model: 'Assistant' };

    revealTimerRef.current = setInterval(() => {
      if (state.shown < state.buffer.length) {
        const backlog = state.buffer.length - state.shown;
        const step = backlog > 80 ? 5 : backlog > 30 ? 3 : 2;
        state.shown = Math.min(state.buffer.length, state.shown + step);
        const snapshot = state.buffer.slice(0, state.shown);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: snapshot, streaming: true } : m))
        );
        smoothScrollToBottom();
      } else if (state.done) {
        clearRevealTimer();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: state.buffer, streaming: false, model: state.model }
              : m
          )
        );
        smoothScrollToBottom();
      }
    }, 28);

    return {
      push(chunk) {
        state.buffer += chunk;
      },
      finish(model) {
        state.done = true;
        if (model) state.model = model;
      },
      setFull(text, model) {
        state.buffer = text;
        state.done = true;
        if (model) state.model = model;
      },
    };
  };

  const handleNavigateFromChat = (viewId) => {
    if (onNavigate) {
      onNavigate(viewId);
      if (window.matchMedia('(max-width: 767px)').matches) {
        setIsOpen(false);
      }
    }
  };

  const {
    voiceState,
    googleReady,
  } = useVoiceConversation({
    language: chatLang,
    enabled: isOpen && voiceMode,
    role: user?.role || 'farmer',
    homeView,
    getHistory: () =>
      messagesRef.current.map((m) => ({ role: m.role, content: m.content })),
    // Keep text chat clean — don't append live voice transcripts to the message list
    onUserTranscript: () => {},
    onAssistantStart: () => {
      setIsLoading(true);
    },
    onAssistantToken: () => {},
    onAssistantDone: () => {
      setIsLoading(false);
    },
    onError: (msg) => {
      setError(msg);
      setIsLoading(false);
      setTimeout(() => setError(null), 5000);
    },
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearRevealTimer();
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  const sendMessage = async (rawText) => {
    const text = (rawText ?? input).trim();
    if (!text || isLoading || voiceMode) return;

    const userMessage = { role: 'user', content: text, timestamp: new Date() };
    const history = messages.map((msg) => ({ role: msg.role, content: msg.content }));

    stickToBottomRef.current = true;
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    requestAnimationFrame(() => smoothScrollToBottom());

    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), streaming: true },
    ]);

    const reveal = startPacedReveal(assistantId);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${API_BASE}/api/llama-chatbot/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          options: {
            temperature: 0.6,
            language: chatLang,
            role: user?.role || 'farmer',
            homeView,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let model = 'Assistant';

      while (true) {
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
          let event;
          try {
            event = JSON.parse(data);
          } catch {
            continue;
          }
          if (event.type === 'token' && event.content) reveal.push(event.content);
          else if (event.type === 'done') model = event.model || model;
          else if (event.type === 'error') throw new Error(event.content || 'Stream error');
        }
      }

      reveal.finish(model);
    } catch (err) {
      if (err.name === 'AbortError') {
        clearRevealTimer();
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/llama-chatbot/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history,
            options: {
              temperature: 0.6,
              language: chatLang,
              role: user?.role || 'farmer',
              homeView,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Chat failed');
        reveal.setFull(data.answer || '', data.model);
      } catch (_) {
        clearRevealTimer();
        const errorMessage =
          chatLang === 'si'
            ? 'සමාවන්න, දෝෂයක් ඇති විය. නැවත උත්සාහ කරන්න.'
            : chatLang === 'ta'
              ? 'மன்னிக்கவும், பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
              : 'Sorry, I encountered an error. Please try again.';
        setError(errorMessage);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: errorMessage, streaming: false, isError: true } : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const toggleVoiceMode = useCallback(() => {
    if (!googleReady && !voiceMode) {
      setError(
        chatLang === 'si'
          ? 'හඬ සේවා සක්‍රිය කිරීමට Google සේවා ගිණුම අවශ්‍යයි.'
          : chatLang === 'ta'
            ? 'குரல் சேவைக்கு Google கணக்கு தேவை.'
            : 'Google voice services are not configured on the server yet.'
      );
      setTimeout(() => setError(null), 5000);
      return;
    }
    setVoiceMode((v) => !v);
  }, [chatLang, googleReady, voiceMode]);

  const voiceStatusText = {
    en: {
      listening: 'Listening… speak now',
      processing: 'Understanding…',
      speaking: 'Speaking… tap mic to stop',
      idle: 'Voice chat',
    },
    si: {
      listening: 'සවන් දෙමින්… කතා කරන්න',
      processing: 'තේරුම් ගනිමින්…',
      speaking: 'කතා කරමින්… නැවැත්වීමට mic',
      idle: 'හඬ සංවාදය',
    },
    ta: {
      listening: 'கேட்கிறேன்… பேசுங்கள்',
      processing: 'புரிந்துகொள்கிறேன்…',
      speaking: 'பேசுகிறேன்… நிறுத்த mic',
      idle: 'குரல் உரையாடல்',
    },
  }[chatLang];

  const placeholder =
    voiceMode
      ? voiceStatusText[voiceState] || voiceStatusText.idle
      : chatLang === 'si'
        ? 'ඕනෑම දෙයක් අසන්න...'
        : chatLang === 'ta'
          ? 'எதையும் கேளுங்கள்...'
          : 'Ask me anything...';

  const assistantSubtitle =
    chatLang === 'si' ? 'ගොවි සහායක' : chatLang === 'ta' ? 'விவசாய உதவியாளர்' : 'Farming assistant';

  const emptyTitle =
    chatLang === 'si'
      ? 'අද මට ඔබට කුමක් කළ හැකිද?'
      : chatLang === 'ta'
        ? 'இன்று நான் உங்களுக்கு என்ன உதவட்டும்?'
        : 'What can I help you with today?';

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 group"
          aria-label="Open AI Chat"
        >
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-lime-300 via-emerald-500 to-green-700 shadow-lg shadow-green-500/30 flex items-center justify-center text-white border border-white/30 hover:scale-105 transition-transform">
            <div className="absolute inset-0 rounded-full bg-emerald-400/40 blur-md animate-pulse" />
            <Sparkles size={22} className="relative z-10" />
          </div>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[420px] md:h-[680px] w-full h-full z-50 flex flex-col overflow-hidden md:rounded-[28px] shadow-2xl border-0 md:border md:border-green-100 dark:md:border-gray-700 bg-gradient-to-b from-[#eef8f0] via-white to-[#f3faf5] dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
          <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lime-300 to-green-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                GI
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight">Govi Isuru AI</h3>
                <p className="text-[11px] text-green-700/80 dark:text-green-300 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${voiceMode ? 'bg-red-500 animate-pulse' : 'bg-green-500 animate-pulse'}`} />
                  {voiceMode ? voiceStatusText[voiceState] || assistantSubtitle : assistantSubtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setChatLang(NEXT_LANG[chatLang] || 'en')}
                className="px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-white/80 dark:bg-gray-800 border border-green-100 dark:border-gray-700 text-green-800 dark:text-green-200"
                title="Switch language EN / සිං / தமிழ்"
              >
                <span className="inline-flex items-center gap-1">
                  <Languages size={13} />
                  {LANG_LABEL[chatLang]}
                </span>
              </button>
              <button
                onClick={() => {
                  setVoiceMode(false);
                  setIsOpen(false);
                }}
                className="p-2 rounded-full bg-white/80 dark:bg-gray-800 border border-green-100 dark:border-gray-700 text-slate-600 dark:text-gray-300"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            ref={messagesContainerRef}
            onScroll={() => {
              stickToBottomRef.current = isNearBottom();
            }}
            className="flex-1 overflow-y-auto px-4 md:px-5 pb-3 scroll-smooth"
          >
            {voiceMode ? (
              <VoiceSessionView voiceState={voiceState} lang={chatLang} />
            ) : !hasConversation ? (
              <div className="h-full flex flex-col items-center justify-center text-center pt-4 pb-8">
                <ChatOrb pulsing={false} />
                <h2 className="mt-6 text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight max-w-[16rem]">
                  {emptyTitle}
                </h2>
                <p className="mt-2 text-xs text-slate-500 dark:text-gray-400 max-w-xs">
                  {chatLang === 'si'
                    ? 'ටයිප් කරන්න හෝ හඬ බොත්තම ඔබා සංවාදයක් පටන් ගන්න'
                    : chatLang === 'ta'
                      ? 'தட்டச்சு செய்யுங்கள் அல்லது மைக்கை அழுத்தி பேசுங்கள்'
                      : 'Type a message or tap the mic for a voice conversation'}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-sm">
                  {suggestions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => sendMessage(item.prompt)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 dark:bg-gray-800 border border-green-100 dark:border-gray-700 text-[12px] font-semibold text-slate-700 dark:text-gray-200 shadow-sm hover:border-green-400 active:scale-95 transition"
                      >
                        <Icon size={13} className="text-green-600" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {messages.map((message, index) => {
                  const isUser = message.role === 'user';
                  const isLastAssistant = !isUser && index === messages.length - 1;
                  return (
                    <div
                      key={message.id || index}
                      ref={isLastAssistant ? lastAiResponseRef : null}
                      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-300 to-green-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          AI
                        </div>
                      )}
                      <div className={`max-w-[82%] ${isUser ? '' : 'flex-1'}`}>
                        {isUser ? (
                          <div className="bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 px-4 py-2.5 rounded-2xl rounded-br-md shadow-sm border border-green-50 dark:border-gray-700 text-sm leading-relaxed">
                            {message.content}
                          </div>
                        ) : (
                          <div className={`${message.isError ? 'text-red-600 dark:text-red-300' : ''}`}>
                            {message.content ? (
                              <ChatMarkdown content={message.content} onNavigate={handleNavigateFromChat} />
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
                                <Loader2 size={14} className="animate-spin text-green-600" />
                                {chatLang === 'si' ? 'සිතමින්...' : chatLang === 'ta' ? 'யோசிக்கிறேன்...' : 'Thinking...'}
                              </div>
                            )}
                            {message.streaming && message.content && (
                              <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-green-500 animate-pulse rounded-sm" />
                            )}
                          </div>
                        )}
                      </div>
                      {isUser && (
                        <div className="w-8 h-8 rounded-full bg-green-700 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {(user?.username || 'U').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="px-3 md:px-4 pb-3 md:pb-4 pt-1" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            {error && (
              <div className="mb-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 p-2 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full border border-green-100 dark:border-gray-700 shadow-md px-2 py-1.5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={placeholder}
                className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-none"
                disabled={isLoading || voiceMode}
              />
              <button
                type="button"
                onClick={toggleVoiceMode}
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                  voiceMode
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                aria-label={voiceMode ? 'Stop voice conversation' : 'Start voice conversation'}
                title={voiceMode ? 'Stop voice chat' : 'Start voice chat (EN / SI / TA)'}
              >
                {voiceMode ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading || voiceMode}
                className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center flex-shrink-0 disabled:bg-slate-300 disabled:text-slate-500 hover:bg-green-800 transition"
                aria-label="Send message"
              >
                {isLoading && !voiceMode ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
