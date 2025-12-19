import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Send, Bot, User, Leaf, HelpCircle, X, Minimize2, Maximize2 } from 'lucide-react';

const translations = {
  en: {
    title: "Crop Assistant",
    subtitle: "Ask me about farming!",
    placeholder: "Ask about fertilizer, diseases, planting...",
    send: "Send",
    typing: "Thinking...",
    source: "Source",
    suggestions: [
      "What fertilizer for rice in Yala?",
      "How to treat rice blast disease?",
      "When to harvest rice?",
      "Water management tips"
    ],
    welcome: "👋 Hello! I'm your Govi Isuru farming assistant. Ask me about fertilizers, diseases, planting, or harvesting!"
  },
  si: {
    title: "බෝග සහායක",
    subtitle: "ගොවිතැන් ගැන මගෙන් අහන්න!",
    placeholder: "පොහොර, රෝග, වගාව ගැන අහන්න...",
    send: "යවන්න",
    typing: "සිතමින්...",
    source: "මූලාශ්‍රය",
    suggestions: [
      "යාල කන්නයේ වී සඳහා පොහොර?",
      "වී බ්ලාස්ට් රෝගයට ප්‍රතිකාර?",
      "වී අස්වනු නෙලන්නේ කවදාද?",
      "ජල කළමනාකරණ ඉඟි"
    ],
    welcome: "👋 ආයුබෝවන්! මම ඔබේ ගොවි ඉසුරු ගොවිතැන් සහායකයා. පොහොර, රෝග, වගා කිරීම හෝ අස්වනු නෙලීම ගැන මගෙන් අහන්න!"
  }
};

export default function CropChatbot({ lang = 'en' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const t = translations[lang] || translations.en;

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 1,
        type: 'bot',
        text: t.welcome,
        timestamp: new Date()
      }]);
    }
  }, [lang]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text = input) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chatbot/chat', {
        message: text.trim(),
        language: lang
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response.data.answer,
        source: response.data.source,
        intent: response.data.intent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: lang === 'si' 
          ? 'සමාවෙන්න, දෝෂයක් ඇති විය. කරුණාකර නැවත උත්සාහ කරන්න.'
          : 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  // Floating chat button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 z-50 flex items-center gap-2"
        title={t.title}
      >
        <MessageCircle size={24} />
        <span className="hidden md:inline font-bold">{t.title}</span>
      </button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-2xl shadow-2xl z-50 flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-green-700"
           onClick={() => setIsMinimized(false)}>
        <Bot size={20} />
        <span className="font-bold">{t.title}</span>
        <Maximize2 size={16} />
      </div>
    );
  }

  // Full chat window
  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-200"
         style={{ height: '500px', maxHeight: 'calc(100vh - 6rem)' }}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Leaf size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{t.title}</h3>
            <p className="text-xs text-green-100">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMinimized(true)} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <Minimize2 size={18} />
          </button>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.type === 'user' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'
              }`}>
                {msg.type === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              {/* Message bubble */}
              <div className={`rounded-2xl px-4 py-3 ${
                msg.type === 'user' 
                  ? 'bg-green-600 text-white rounded-br-md' 
                  : 'bg-white text-slate-700 rounded-bl-md shadow-sm border border-slate-100'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                {msg.source && (
                  <p className={`text-xs mt-2 pt-2 border-t ${
                    msg.type === 'user' ? 'border-green-500 text-green-100' : 'border-slate-100 text-slate-400'
                  }`}>
                    📚 {t.source}: {msg.source}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs">{t.typing}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2 bg-slate-50">
          {t.suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors border border-green-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t.placeholder}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-xl transition-colors flex items-center gap-2"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
