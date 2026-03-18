import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Leaf,
  ArrowRight,
  Globe,
  CheckCircle,
  Newspaper,
  ExternalLink,
  Clock,
  Sun,
  Moon,
  ChevronDown,
  Play
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

// Animated counter hook
const useCounter = (end, duration = 2000, shouldStart = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!shouldStart) return;
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(end * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, shouldStart]);
  return count;
};

// Intersection observer hook
const useInView = (threshold = 0.2) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
};

const HomePage = ({ onLogin, onRegister, darkMode, setDarkMode }) => {
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [lang, setLang] = useState('en');
  const [statsRef, statsInView] = useInView(0.3);
  const [featuresRef, featuresInView] = useInView(0.1);
  const [howItWorksRef, howItWorksInView] = useInView(0.2);
  const [techRef, techInView] = useInView(0.2);
  const [diseaseRef, diseaseInView] = useInView(0.2);

  const mlModels = useCounter(3, 1500, statsInView);
  const districts = useCounter(25, 1800, statsInView);
  const cropDiseases = useCounter(17, 2000, statsInView);
  const yearsData = useCounter(10, 1600, statsInView);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { fetchLatestNews(); }, []);

  const fetchLatestNews = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/news/agriculture`);
      setNews(response.data.articles.slice(0, 3));
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoadingNews(false);
    }
  };

  const translations = {
    en: {
      hero: {
        badge: "Smart Farming for a Smarter Tomorrow",
        title1: "Grow Smarter,",
        titleHighlight: "Harvest Better",
        title2: "with Govi Isuru",
        subtitle: "Detect crop diseases instantly with AI, track real-time market prices, forecast your yield, and connect with a thriving farming community — everything a modern Sri Lankan farmer needs, in one place.",
        cta1: "Start for Free",
        cta2: "See How It Works",
      },
      nav: { login: "Login", register: "Register" },
      stats: {
        title: "Platform at a Glance",
        subtitle: "Real numbers, real impact",
        items: [
          { value: 3, suffix: "", label: "ML Models", sub: "Rice • Tea • Chili" },
          { value: 25, suffix: "", label: "Districts", sub: "Complete Coverage" },
          { value: 17, suffix: "", label: "Crop Diseases", sub: "AI Detection" },
          { value: 10, suffix: "yr", label: "Yield Data", sub: "2015–2024" }
        ]
      },
      howItWorks: {
        title: "How It Works",
        subtitle: "Three simple steps to protect your crops",
        steps: [
          { emoji: "📸", title: "Upload Photo", desc: "Take a photo of your crop leaf and upload it to the AI Doctor", num: "01" },
          { emoji: "🔬", title: "AI Analysis", desc: "Our deep learning model analyzes the image using Grad-CAM explainability", num: "02" },
          { emoji: "💊", title: "Get Treatment", desc: "Receive diagnosis, confidence score, and bilingual treatment recommendations", num: "03" }
        ]
      },
      features: {
        title: "Powerful Features for Modern Farmers",
        subtitle: "Everything you need to maximize your agricultural success",
        items: [
          { emoji: "🔬", title: "AI Crop Doctor", description: "Multi-crop disease detection for Rice (8 classes), Tea (5 classes), and Chili (4 classes) with Grad-CAM heatmap visualization", color: "emerald", tag: "Deep Learning" },
          { emoji: "📊", title: "Yield Prediction", description: "ML-powered paddy yield forecasting trained on 10 years of data across all 25 districts with profit calculator & ROI analysis", color: "blue", tag: "Machine Learning" },
          { emoji: "📈", title: "Market Intelligence", description: "Real-time crop prices across Dambulla, Colombo, Kandy & more with 6-month trend analysis and interactive charts", color: "purple", tag: "Real-time Data" },
          { emoji: "🛒", title: "AgroLink Marketplace", description: "Peer-to-peer trading with reputation system, star ratings, verified badges, WhatsApp & call integration", color: "orange", tag: "Community" },
          { emoji: "🌦️", title: "Weather Advisory", description: "5-day forecasts with humidity-based fungal warnings, rain alerts for fertilizer timing, and temperature advisories", color: "cyan", tag: "OpenWeatherMap" },
          { emoji: "🚨", title: "Disease Alerts", description: "GN Division-based outbreak detection with severity indicators and automatic community alert broadcasting", color: "red", tag: "Location-based" },
          { emoji: "💬", title: "AI Crop Chatbot", description: "24/7 farming assistant with voice input, in-chat image diagnosis, conversation memory, and smart follow-up suggestions", color: "indigo", tag: "LLM Powered" },
          { emoji: "🌱", title: "Crop Suitability", description: "ML recommendations based on soil type, pH, drainage, climate zone, rainfall patterns, and irrigation availability", color: "green", tag: "Advisory" }
        ]
      },
      diseases: {
        title: "Crop Disease Coverage",
        subtitle: "Our AI models detect 17 conditions across 3 major Sri Lankan crops",
        crops: [
          { name: "Rice", emoji: "🌾", count: 8, diseases: ["Bacterial Leaf Blight", "Brown Spot", "Leaf Blast", "Leaf Scald", "Narrow Brown Spot", "Rice Hispa", "Sheath Blight", "Healthy"], color: "emerald" },
          { name: "Tea", emoji: "🍵", count: 5, diseases: ["Blister Blight", "Brown Blight", "Gray Blight", "Red Rust", "Healthy"], color: "teal" },
          { name: "Chili", emoji: "🌶️", count: 4, diseases: ["Leaf Spot", "Thrips Damage", "Yellow Virus", "Healthy"], color: "red" }
        ]
      },
      tech: {
        title: "Built with Modern Technology",
        subtitle: "Enterprise-grade stack powering intelligent agriculture",
        items: [
          { name: "TensorFlow 2.20", desc: "Deep Learning", emoji: "🧠" },
          { name: "React 19", desc: "Frontend UI", emoji: "⚛️" },
          { name: "FastAPI", desc: "AI Service", emoji: "⚡" },
          { name: "MongoDB Atlas", desc: "Cloud Database", emoji: "🗃️" },
          { name: "Express 5", desc: "REST API", emoji: "🔗" },
          { name: "MobileNetV2", desc: "Transfer Learning", emoji: "📱" }
        ]
      },
      roles: {
        title: "Built for Every Stakeholder",
        subtitle: "Tailored dashboards for every role in the agricultural ecosystem",
        items: [
          { role: "Farmers", emoji: "👨‍🌾", features: ["AI Disease Detection", "Yield Prediction", "Weather Advisory", "Marketplace", "Community Alerts"], color: "green" },
          { role: "Buyers", emoji: "🛍️", features: ["Browse Marketplace", "Save Listings", "Contact Sellers", "Rate & Review", "Market Trends"], color: "blue" },
          { role: "Officers", emoji: "🏛️", features: ["Verify Reports", "Field Visit Scheduling", "Performance Dashboard", "Outbreak Management", "Action Audit Trail"], color: "purple" }
        ]
      },
      news: {
        title: "Latest Agricultural News",
        subtitle: "Stay informed with real-time updates",
        readMore: "Read Full Article",
        viewAll: "View All News"
      },
      benefits: {
        title: "Why Farmers Choose Govi Isuru",
        items: [
          { emoji: "⚡", text: "Instant AI-powered disease diagnosis in seconds", sub: "Deep learning with Grad-CAM explainability" },
          { emoji: "🆓", text: "100% Free for all Sri Lankan farmers", sub: "No hidden charges, ever" },
          { emoji: "🤝", text: "Thriving community with reputation system", sub: "Star ratings, verified badges & reviews" },
          { emoji: "🇱🇰", text: "Full Sinhala & English bilingual support", sub: "Voice input & TTS in both languages" },
          { emoji: "📍", text: "All 25 districts covered", sub: "GN Division level precision" },
          { emoji: "🎯", text: "3 specialized ML models", sub: "Rice, Tea & Chili disease detection" }
        ]
      },
      cta: {
        title: "Ready to Transform Your Farming?",
        subtitle: "Join Sri Lankan farmers using AI technology to protect crops, predict yields, and connect with markets",
        button: "Create Free Account"
      },
      footer: {
        tagline: "Empowering Sri Lankan Farmers with Technology",
        copyright: "© 2026 Govi Isuru",
        madeBy: "A Project by University of Moratuwa Students"
      }
    },
    si: {
      hero: {
        badge: "හෙට දවසට වඩා හොඳ ගොවිතැනක්",
        title1: "නුවණින් වගා කරන්න,",
        titleHighlight: "වැඩිපුර අස්වනු",
        title2: "නෙළන්න ගොවි ඉසුරු සමඟ",
        subtitle: "AI බලයෙන් බෝග රෝග ක්ෂණිකව හඳුනාගන්න, තත්‍ය කාලීන වෙළඳපල මිල ගණන් බලන්න, අස්වැන්න අනාවැකි කියන්න, සහ ගොවි ප්‍රජාව සමඟ සම්බන්ධ වන්න — නවීන ශ්‍රී ලාංකික ගොවියාට අවශ්‍ය සියල්ල එක තැනක.",
        cta1: "නොමිලේ ආරම්භ කරන්න",
        cta2: "ක්‍රියාකාරීත්වය බලන්න",
      },
      nav: { login: "පිවිසෙන්න", register: "ලියාපදිංචි වන්න" },
      stats: {
        title: "වේදිකාව එක බැල්මකින්",
        subtitle: "සැබෑ සංඛ්‍යා, සැබෑ බලපෑම",
        items: [
          { value: 3, suffix: "", label: "ML ආකෘති", sub: "වී • තේ • මිරිස්" },
          { value: 25, suffix: "", label: "දිස්ත්‍රික්ක", sub: "සම්පූර්ණ ආවරණය" },
          { value: 17, suffix: "", label: "බෝග රෝග", sub: "AI හඳුනාගැනීම" },
          { value: 10, suffix: "වර්ෂ", label: "අස්වැන්න දත්ත", sub: "2015–2024" }
        ]
      },
      howItWorks: {
        title: "ක්‍රියා කරන ආකාරය",
        subtitle: "ඔබේ බෝග ආරක්ෂා කිරීමට සරල පියවර තුනක්",
        steps: [
          { emoji: "📸", title: "ඡායාරූපය උඩුගත කරන්න", desc: "ඔබේ බෝග කොළයේ ඡායාරූපයක් ගෙන AI වෛද්‍යවරයාට උඩුගත කරන්න", num: "01" },
          { emoji: "🔬", title: "AI විශ්ලේෂණය", desc: "අපගේ ගැඹුරු ඉගෙනීම් ආකෘතිය Grad-CAM පැහැදිලි කිරීම භාවිතයෙන් රූපය විශ්ලේෂණය කරයි", num: "02" },
          { emoji: "💊", title: "ප්‍රතිකාරය ලබාගන්න", desc: "රෝග විනිශ්චය, විශ්වාස ලකුණු, සහ ද්විභාෂා ප්‍රතිකාර නිර්දේශ ලබා ගන්න", num: "03" }
        ]
      },
      features: {
        title: "නවීන ගොවීන් සඳහා බලගතු විශේෂාංග",
        subtitle: "ඔබේ කෘෂිකාර්මික සාර්ථකත්වය උපරිම කිරීමට අවශ්‍ය සියල්ල",
        items: [
          { emoji: "🔬", title: "AI බෝග වෛද්‍යවරයා", description: "වී (පංති 8), තේ (පංති 5), සහ මිරිස් (පංති 4) සඳහා Grad-CAM හීට්මැප් දෘශ්‍යකරණය සහිත බහු-බෝග රෝග හඳුනාගැනීම", color: "emerald", tag: "ගැඹුරු ඉගෙනීම" },
          { emoji: "📊", title: "අස්වැන්න අනාවැකි", description: "දිස්ත්‍රික්ක 25 හි වසර 10ක දත්ත මත පුහුණු කරන ලද ML බලයෙන් යුත් වී අස්වැන්න අනාවැකි සහ ලාභ කැල්කියුලේටරය", color: "blue", tag: "යන්ත්‍ර ඉගෙනීම" },
          { emoji: "📈", title: "වෙළඳපල බුද්ධිය", description: "දඹුල්ල, කොළඹ, මහනුවර සහ තවත් ස්ථානවල මාස 6ක ප්‍රවණතා විශ්ලේෂණය සමඟ තත්‍ය කාලීන බෝග මිල", color: "purple", tag: "තත්‍ය කාලීන" },
          { emoji: "🛒", title: "AgroLink වෙළඳපොල", description: "කීර්ති නාම පද්ධතිය, තරු ශ්‍රේණිගත කිරීම්, WhatsApp සහ ඇමතුම් ඒකාබද්ධ කිරීම සමඟ peer-to-peer වෙළඳාම", color: "orange", tag: "ප්‍රජාව" },
          { emoji: "🌦️", title: "කාලගුණ උපදේශනය", description: "දින 5ක අනාවැකි සහ තෙතමන පාදක දිලීර අනතුරු ඇඟවීම්, වැසි සහ උෂ්ණත්ව උපදෙස්", color: "cyan", tag: "OpenWeatherMap" },
          { emoji: "🚨", title: "රෝග අනතුරු ඇඟවීම්", description: "ප්‍රජා අනතුරු ඇඟවීම් විකාශනය සහිත ග්‍රාම නිලධාරී කොට්ඨාස මට්ටමේ පිපිරීම් හඳුනාගැනීම", color: "red", tag: "ස්ථාන පදනම්" },
          { emoji: "💬", title: "AI බෝග චැට්බොට්", description: "හඬ ආදානය, චැට් තුළ රූප විනිශ්චය, සංවාද මතකය සහ ස්මාර්ට් පසු-විපරම් යෝජනා සහිත 24/7 ගොවිතැන් සහායක", color: "indigo", tag: "LLM බලගන්වා" },
          { emoji: "🌱", title: "බෝග සුදුසුකම", description: "පස් වර්ගය, pH, ජලාපවහනය, දේශගුණ කලාපය, වර්ෂාපතන රටාව සහ වාරිමාර්ග ලබා ගැනීම මත ML නිර්දේශ", color: "green", tag: "උපදේශන" }
        ]
      },
      diseases: {
        title: "බෝග රෝග ආවරණය",
        subtitle: "අපගේ AI ආකෘති ප්‍රධාන ශ්‍රී ලාංකික බෝග 3ක තත්ත්වයන් 17ක් හඳුනා ගනී",
        crops: [
          { name: "වී", emoji: "🌾", count: 8, diseases: ["බැක්ටීරියා කොළ පිළිස්සුම", "දුඹුරු පුල්ලි", "කොළ පිපිරීම", "කොළ පිළිස්සුම", "පටු දුඹුරු පුල්ලි", "වී හිස්පා", "කොපුව පිළිස්සුම", "නිරෝගී"], color: "emerald" },
          { name: "තේ", emoji: "🍵", count: 5, diseases: ["බිබිලි පිළිස්සුම", "දුඹුරු පිළිස්සුම", "අළු පිළිස්සුම", "රතු මලකඩ", "නිරෝගී"], color: "teal" },
          { name: "මිරිස්", emoji: "🌶️", count: 4, diseases: ["කොළ පුල්ලි", "තිරිප්ස් හානි", "කහ වෛරසය", "නිරෝගී"], color: "red" }
        ]
      },
      tech: {
        title: "නවීන තාක්ෂණයෙන් නිර්මාණය කර ඇත",
        subtitle: "බුද්ධිමත් කෘෂිකර්මය බලගන්වන ව්‍යවසාය-ශ්‍රේණියේ තාක්ෂණ",
        items: [
          { name: "TensorFlow 2.20", desc: "ගැඹුරු ඉගෙනීම", emoji: "🧠" },
          { name: "React 19", desc: "Frontend UI", emoji: "⚛️" },
          { name: "FastAPI", desc: "AI සේවාව", emoji: "⚡" },
          { name: "MongoDB Atlas", desc: "Cloud DB", emoji: "🗃️" },
          { name: "Express 5", desc: "REST API", emoji: "🔗" },
          { name: "MobileNetV2", desc: "Transfer Learning", emoji: "📱" }
        ]
      },
      roles: {
        title: "සෑම පාර්ශ්වකරුවෙකුටම සාදා ඇත",
        subtitle: "කෘෂිකාර්මික පරිසර පද්ධතියේ සෑම භූමිකාවක් සඳහාම විශේෂිත උපකරණ පුවරු",
        items: [
          { role: "ගොවීන්", emoji: "👨‍🌾", features: ["AI රෝග හඳුනාගැනීම", "අස්වැන්න අනාවැකි", "කාලගුණ උපදේශනය", "වෙළඳපොල", "ප්‍රජා අනතුරු ඇඟවීම්"], color: "green" },
          { role: "ගැණුම්කරුවන්", emoji: "🛍️", features: ["වෙළඳපොල බ්‍රවුස් කරන්න", "ලැයිස්තු සුරකින්න", "විකුණුම්කරුවන් අමතන්න", "ශ්‍රේණිගත කිරීම", "වෙළඳපල ප්‍රවණතා"], color: "blue" },
          { role: "නිලධාරීන්", emoji: "🏛️", features: ["වාර්තා සත්‍යාපනය", "ක්ෂේත්‍ර චාරිකා", "කාර්ය සාධන පුවරුව", "පිපිරීම් කළමනාකරණ", "විගණන මාර්ගය"], color: "purple" }
        ]
      },
      news: {
        title: "නවතම කෘෂිකාර්මික පුවත්",
        subtitle: "තත්‍ය කාලීන යාවත්කාලීන සමඟ දැනුවත්ව සිටින්න",
        readMore: "සම්පූර්ණ ලිපිය කියවන්න",
        viewAll: "සියලුම පුවත් බලන්න"
      },
      benefits: {
        title: "ගොවීන් ගොවි ඉසුරු තෝරා ගන්නේ ඇයි",
        items: [
          { emoji: "⚡", text: "තත්පර කිහිපයකින් ක්ෂණික AI රෝග විනිශ්චය", sub: "Grad-CAM පැහැදිලි කිරීම සහිත ගැඹුරු ඉගෙනීම" },
          { emoji: "🆓", text: "සියලුම ශ්‍රී ලාංකික ගොවීන් සඳහා 100% නොමිලේ", sub: "සැඟවුණු ගාස්තු නැත" },
          { emoji: "🤝", text: "කීර්ති නාම පද්ධතිය සහිත සමෘද්ධිමත් ප්‍රජාව", sub: "තරු ශ්‍රේණිගත කිරීම්, සත්‍යාපිත සංකේත සහ සමාලෝචන" },
          { emoji: "🇱🇰", text: "සම්පූර්ණ සිංහල සහ ඉංග්‍රීසි ද්විභාෂා සහාය", sub: "භාෂා දෙකෙන්ම හඬ ආදානය සහ TTS" },
          { emoji: "📍", text: "දිස්ත්‍රික්ක 25ම ආවරණය", sub: "ග්‍රා.නි. කොට්ඨාස මට්ටමේ නිරවද්‍යතාව" },
          { emoji: "🎯", text: "විශේෂිත ML ආකෘති 3ක්", sub: "වී, තේ සහ මිරිස් රෝග හඳුනාගැනීම" }
        ]
      },
      cta: {
        title: "ඔබේ ගොවිතැන වෙනස් කිරීමට සූදානම්ද?",
        subtitle: "බෝග ආරක්ෂා කිරීමට, අස්වැන්න අනාවැකි කීමට සහ වෙළඳපොලවල් සමඟ සම්බන්ධ වීමට AI භාවිතා කරන ශ්‍රී ලාංකික ගොවීන් සමඟ එක්වන්න",
        button: "නොමිලේ ගිණුමක් සාදන්න"
      },
      footer: {
        tagline: "තාක්ෂණය සමඟ ශ්‍රී ලාංකීය ගොවීන් සවිබල ගැන්වීම",
        copyright: "© 2026 ගොවි ඉසුරු",
        madeBy: "මොරටුව විශ්ව විද්‍යාලයේ සිසුන්ගේ ව්‍යාපෘතියකි"
      }
    }
  };

  const t = translations[lang];

  const colorMap = {
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600', gradient: 'from-emerald-500 to-green-600', tag: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
    blue: { bg: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600', gradient: 'from-blue-500 to-indigo-600', tag: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
    purple: { bg: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600', gradient: 'from-purple-500 to-violet-600', tag: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
    orange: { bg: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600', gradient: 'from-orange-500 to-amber-600', tag: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
    cyan: { bg: 'bg-cyan-500', light: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600', gradient: 'from-cyan-500 to-sky-600', tag: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' },
    red: { bg: 'bg-red-500', light: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600', gradient: 'from-red-500 to-rose-600', tag: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
    indigo: { bg: 'bg-indigo-500', light: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600', gradient: 'from-indigo-500 to-purple-600', tag: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' },
    green: { bg: 'bg-green-500', light: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600', gradient: 'from-green-500 to-emerald-600', tag: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
    teal: { bg: 'bg-teal-500', light: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600', gradient: 'from-teal-500 to-cyan-600', tag: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' }
  };

  const counters = [mlModels, districts, cropDiseases, yearsData];

  return (
    <div style={{
      backgroundImage: 'url(/backgrounds/farming-training.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }} className="min-h-screen">
      {/* Dark overlay */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: darkMode ? 'rgba(17, 24, 39, 0.88)' : 'rgba(255, 255, 255, 0.35)',
        zIndex: 0, pointerEvents: 'none'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* ===== NAVIGATION BAR ===== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrollY > 50 
          ? (darkMode ? 'bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/10' : 'bg-white/95 backdrop-blur-xl shadow-2xl shadow-green-900/5') 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
              <div className="relative p-1.5 sm:p-2.5 bg-gradient-to-br from-green-500 to-emerald-700 rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-green-500/25 transition-all group-hover:scale-105 overflow-hidden">
                <Leaf className="h-5 w-5 sm:h-7 sm:w-7 text-white relative z-10" />
              </div>
              <div>
                <span className={`text-lg sm:text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  {lang === 'si' ? 'ගොවි ඉසුරු' : 'Govi Isuru'}
                </span>
                <div className={`text-[10px] sm:text-xs font-medium hidden sm:block ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {lang === 'si' ? 'ගොවියාගේ වාසනාව' : "Farmer's Fortune"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 sm:p-2.5 rounded-xl transition-all ${darkMode ? 'text-yellow-300 hover:bg-yellow-300/10' : 'text-slate-600 hover:bg-slate-100'}`}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => setLang(lang === 'en' ? 'si' : 'en')} className={`p-2 sm:p-2.5 rounded-xl transition-all flex items-center gap-1.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Globe size={18} />
                <span className="text-xs font-semibold hidden sm:inline">{lang === 'en' ? 'සිංහල' : 'English'}</span>
              </button>
              <button onClick={onLogin} className={`px-3 py-2 sm:px-5 sm:py-2.5 text-sm font-semibold rounded-xl transition-all ${darkMode ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-slate-700 hover:text-green-700 hover:bg-green-50'}`}>
                {t.nav.login}
              </button>
              <button onClick={onRegister} className="group px-3 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold rounded-xl hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-600/25 hover:shadow-green-500/40 transition-all hover:scale-[1.02] flex items-center gap-1.5">
                {t.nav.register}
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="pt-28 sm:pt-32 pb-8 sm:pb-16 px-3 sm:px-6 lg:px-8 relative overflow-hidden min-h-[90vh] sm:min-h-[85vh] flex items-center">
        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[5%] w-64 sm:w-[500px] h-64 sm:h-[500px] bg-green-400/15 rounded-full blur-[100px] homepage-pulse-slow" />
          <div className="absolute bottom-20 right-[5%] w-72 sm:w-[600px] h-72 sm:h-[600px] bg-emerald-400/15 rounded-full blur-[120px] homepage-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-300/10 rounded-full blur-[80px] homepage-pulse-slow" style={{ animationDelay: '4s' }} />
        </div>

        <div className="max-w-7xl mx-auto relative w-full">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-5 sm:space-y-8">
              {/* Badge */}
              <div className={`inline-flex items-center gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 backdrop-blur-md border rounded-full ${darkMode ? 'bg-green-900/40 border-green-600/40' : 'bg-white/80 border-green-200'}`}>
                <span className="text-sm">🌿</span>
                <span className={`text-xs sm:text-sm font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{t.hero.badge}</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.2rem] xl:text-7xl font-black leading-[1.1] tracking-tight text-black">
                {t.hero.title1}{' '}
                <span className="text-black">
                  {t.hero.titleHighlight}
                </span>
                <br />
                {t.hero.title2}
              </h1>

              {/* Subtitle */}
              <p className={`text-sm sm:text-lg lg:text-xl leading-relaxed max-w-xl ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                {t.hero.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <button onClick={onRegister} className="group w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-500 hover:to-emerald-500 shadow-xl shadow-green-600/25 hover:shadow-green-500/40 transition-all hover:scale-[1.02] flex items-center justify-center gap-2.5 text-sm sm:text-lg">
                  {t.hero.cta1}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className={`group w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 backdrop-blur-md font-bold rounded-2xl border-2 transition-all flex items-center justify-center gap-2.5 text-sm sm:text-lg ${darkMode ? 'bg-white/5 text-gray-200 border-gray-600/50 hover:border-green-500/50 hover:bg-green-900/20' : 'bg-white/70 text-slate-700 border-slate-200 hover:border-green-400 hover:bg-green-50/50'}`}>
                  <Play size={16} className="group-hover:scale-110 transition-transform" />
                  {t.hero.cta2}
                </button>
              </div>

              {/* Scroll indicator */}
              <div className="hidden sm:flex items-center gap-2 pt-8 homepage-bounce-slow">
                <ChevronDown className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`} />
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  {lang === 'si' ? 'පහළට අනුචලනය කරන්න' : 'Scroll to explore'}
                </span>
              </div>
            </div>

            {/* Right Visual - Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-[2rem] shadow-2xl shadow-green-900/20 overflow-hidden ring-1 ring-white/10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTIwIDYwaDEyMHY0aC0xMjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDgpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white p-8">
                      <div className="w-28 h-28 mx-auto mb-6 bg-white/15 backdrop-blur-sm rounded-[1.5rem] flex items-center justify-center ring-1 ring-white/20 shadow-inner">
                        <Leaf className="h-14 w-14 drop-shadow-lg" />
                      </div>
                      <div className="text-3xl font-black mb-2 drop-shadow-md">AI-Powered</div>
                      <div className="text-lg opacity-90 font-medium">Crop Disease Detection</div>
                      <div className="mt-4 text-sm opacity-70">Rice • Tea • Chili</div>
                    </div>
                  </div>
                </div>

                {/* Floating Card - Accuracy */}
                <div className={`absolute -top-4 -left-4 p-3.5 rounded-2xl shadow-2xl border homepage-float backdrop-blur-md ${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/95 border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>80% Accuracy</div>
                      <div className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Disease Detection</div>
                    </div>
                  </div>
                </div>

                {/* Floating Card - Models */}
                <div className={`absolute -bottom-4 -right-4 p-3.5 rounded-2xl shadow-2xl border homepage-float backdrop-blur-md ${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/95 border-slate-100'}`} style={{ animationDelay: '1.5s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <span className="text-xl">🧠</span>
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>3 ML Models</div>
                      <div className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>TensorFlow 2.20</div>
                    </div>
                  </div>
                </div>

                {/* Floating Card - Districts */}
                <div className={`absolute top-1/2 -right-8 p-3 rounded-xl shadow-xl border homepage-float backdrop-blur-md ${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/95 border-slate-100'}`} style={{ animationDelay: '3s' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">📍</span>
                    <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>25 Districts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ANIMATED STATS BAR ===== */}
      <section ref={statsRef} className={`py-10 sm:py-14 px-3 sm:px-6 lg:px-8 relative overflow-hidden ${darkMode ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-sm`}>
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 via-transparent to-emerald-600/5" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className={`text-xl sm:text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.stats.title}</h2>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{t.stats.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {t.stats.items.map((stat, idx) => (
              <div key={idx} className={`group relative text-center p-4 sm:p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${darkMode ? 'bg-gray-800/60 border-gray-700/50 hover:border-green-600/50' : 'bg-white/80 border-slate-100 hover:border-green-200'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 rounded-2xl transition-all" />
                <div className="relative">
                  <div className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-500 to-emerald-600 mb-1">
                    {counters[idx]}{stat.suffix}
                  </div>
                  <div className={`text-sm sm:text-base font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{stat.label}</div>
                  <div className={`text-[11px] sm:text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{stat.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" ref={howItWorksRef} className={`py-14 sm:py-20 px-3 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-800/50' : 'bg-gradient-to-br from-green-50/80 to-emerald-50/50'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <div className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full mb-4 ${darkMode ? 'bg-gray-800 border-green-700' : 'bg-white border-green-200'}`}>
              <span className="text-sm">⚙️</span>
              <span className="text-xs sm:text-sm font-bold text-green-600">{lang === 'si' ? 'සරල ක්‍රියාවලිය' : 'Simple Process'}</span>
            </div>
            <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.howItWorks.title}</h2>
            <p className={`text-sm sm:text-lg mt-3 max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{t.howItWorks.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-green-300 via-emerald-400 to-teal-300 dark:from-green-700 dark:via-emerald-600 dark:to-teal-700 opacity-50" />
            
            {t.howItWorks.steps.map((step, idx) => (
              <div key={idx} className={`relative text-center transition-all duration-700 ${howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${idx * 200}ms` }}>
                <div className="relative inline-block mb-6">
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-500/20 mx-auto ring-4 ${darkMode ? 'ring-gray-800' : 'ring-white'}`}>
                    <span className="text-3xl sm:text-4xl">{step.emoji}</span>
                  </div>
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white text-xs font-black shadow-lg ring-2 ${darkMode ? 'ring-gray-800' : 'ring-white'}`}>
                    {step.num.slice(-1)}
                  </div>
                </div>
                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{step.title}</h3>
                <p className={`text-sm leading-relaxed max-w-xs mx-auto ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" ref={featuresRef} className={`py-14 sm:py-20 px-3 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-black mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.features.title}</h2>
            <p className={`text-sm sm:text-lg max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{t.features.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {t.features.items.map((feature, idx) => {
              const colors = colorMap[feature.color];
              return (
                <div key={idx}
                  className={`group relative p-5 sm:p-6 rounded-2xl border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer overflow-hidden ${
                    featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  } ${darkMode ? 'bg-gray-800/80 border-gray-700/50 hover:border-green-600/50' : 'bg-white border-slate-100 hover:border-green-200'}`}
                  style={{ transitionDelay: `${idx * 80}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                  
                  <div className={`inline-flex px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold mb-4 ${colors.tag}`}>
                    {feature.tag}
                  </div>

                  <div className={`w-12 h-12 sm:w-14 sm:h-14 ${colors.light} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm`}>
                    <span className="text-2xl sm:text-3xl">{feature.emoji}</span>
                  </div>
                  <h3 className={`text-base sm:text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{feature.title}</h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CROP DISEASE COVERAGE ===== */}
      <section ref={diseaseRef} className={`py-14 sm:py-20 px-3 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-800/50' : 'bg-gradient-to-br from-slate-50 to-green-50/30'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className={`text-2xl sm:text-4xl font-black mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.diseases.title}</h2>
            <p className={`text-sm sm:text-lg max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{t.diseases.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {t.diseases.crops.map((crop, idx) => {
              const colors = colorMap[crop.color];
              return (
                <div key={idx} className={`relative rounded-2xl border overflow-hidden transition-all duration-700 hover:shadow-xl hover:-translate-y-1 ${
                  diseaseInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                } ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}
                  style={{ transitionDelay: `${idx * 150}ms` }}
                >
                  <div className={`bg-gradient-to-r ${colors.gradient} p-5 sm:p-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl mb-1">{crop.emoji}</div>
                        <h3 className="text-xl font-bold text-white">{crop.name}</h3>
                      </div>
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <span className="text-2xl font-black text-white">{crop.count}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 space-y-2">
                    {crop.diseases.map((disease, dIdx) => (
                      <div key={dIdx} className={`flex items-center gap-2.5 py-1.5 ${dIdx < crop.diseases.length - 1 ? (darkMode ? 'border-b border-gray-700/50' : 'border-b border-slate-100') : ''}`}>
                        <CheckCircle className={`h-3.5 w-3.5 flex-shrink-0 ${disease.includes('Healthy') || disease.includes('නිරෝගී') ? 'text-green-500' : colors.text}`} />
                        <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{disease}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== USER ROLES ===== */}
      <section className={`py-14 sm:py-20 px-3 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className={`text-2xl sm:text-4xl font-black mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.roles.title}</h2>
            <p className={`text-sm sm:text-lg max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{t.roles.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {t.roles.items.map((role, idx) => {
              const colors = colorMap[role.color];
              return (
                <div key={idx} className={`group p-5 sm:p-7 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-green-600/50' : 'bg-white border-slate-100 hover:border-green-200'}`}>
                  <div className="text-4xl mb-3">{role.emoji}</div>
                  <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{role.role}</h3>
                  <div className="space-y-2.5">
                    {role.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md ${colors.light} flex items-center justify-center flex-shrink-0`}>
                          <CheckCircle className={`h-3 w-3 ${colors.text}`} />
                        </div>
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== TECH STACK ===== */}
      <section ref={techRef} className={`py-14 sm:py-20 px-3 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-800/50' : 'bg-gradient-to-br from-green-50/50 to-emerald-50/30'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className={`text-2xl sm:text-4xl font-black mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.tech.title}</h2>
            <p className={`text-sm sm:text-lg max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{t.tech.subtitle}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
            {t.tech.items.map((tech, idx) => (
              <div key={idx} className={`group p-4 sm:p-5 rounded-2xl border text-center transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${
                techInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              } ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-green-600/50' : 'bg-white border-slate-100 hover:border-green-200'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/15 group-hover:scale-110 group-hover:shadow-green-500/25 transition-all">
                  <span className="text-2xl">{tech.emoji}</span>
                </div>
                <h4 className={`text-sm sm:text-base font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{tech.name}</h4>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LATEST NEWS ===== */}
      <section className={`py-14 sm:py-20 px-3 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full mb-4 ${darkMode ? 'bg-gray-800 border-green-700' : 'bg-green-50 border-green-200'}`}>
              <Newspaper className="h-4 w-4 text-green-500" />
              <span className="text-xs sm:text-sm font-bold text-green-600">{t.news.subtitle}</span>
            </div>
            <h2 className={`text-2xl sm:text-4xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.news.title}</h2>
          </div>

          {loadingNews ? (
            <div className="flex justify-center py-16">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-green-200 dark:border-green-800" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-500 animate-spin" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {news.map((article, idx) => (
                <div key={idx} className={`group rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${darkMode ? 'bg-gray-800 border-gray-700/50 hover:border-green-600/40' : 'bg-white border-slate-100 hover:border-green-200'}`}>
                  {article.urlToImage && (
                    <div className="aspect-video overflow-hidden relative">
                      <img src={article.urlToImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  <div className="p-4 sm:p-6">
                    <div className={`flex items-center gap-2 text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                      <Clock size={13} />
                      <span>{new Date(article.publishedAt).toLocaleDateString(lang === 'si' ? 'si-LK' : 'en-LK')}</span>
                    </div>
                    <h3 className={`font-bold text-sm sm:text-base mb-3 line-clamp-2 group-hover:text-green-600 transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {article.title}
                    </h3>
                    <p className={`text-xs sm:text-sm mb-4 line-clamp-3 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                      {article.description}
                    </p>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-green-600 hover:text-green-500 group/link">
                      {t.news.readMore}
                      <ExternalLink size={13} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            <button onClick={onRegister} className="group px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-600/20 hover:shadow-green-500/30 transition-all hover:scale-[1.02] inline-flex items-center gap-2">
              {t.news.viewAll}
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section className={`py-14 sm:py-20 px-3 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-800/50' : 'bg-gradient-to-br from-green-50/60 to-emerald-50/40'}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-2xl sm:text-4xl font-black text-center mb-10 sm:mb-14 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.benefits.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {t.benefits.items.map((benefit, idx) => (
              <div key={idx} className={`group flex flex-col p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${darkMode ? 'bg-gray-800 border-gray-700/50 hover:border-green-600/40' : 'bg-white border-slate-100 hover:border-green-200'}`}>
                <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/15 group-hover:scale-110 group-hover:shadow-green-500/25 transition-all">
                  <span className="text-xl">{benefit.emoji}</span>
                </div>
                <p className={`text-sm sm:text-base font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{benefit.text}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>{benefit.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-16 sm:py-24 px-3 sm:px-6 lg:px-8 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.06),transparent_50%)]" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6">
            <span className="text-lg">⭐</span>
            <span className="text-sm font-bold text-white/90">{lang === 'si' ? '100% නොමිලේ' : '100% Free Platform'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            {t.cta.title}
          </h2>
          <p className="text-sm sm:text-lg lg:text-xl text-green-100/90 mb-8 sm:mb-10 max-w-2xl mx-auto">
            {t.cta.subtitle}
          </p>
          <button onClick={onRegister} className="group w-full sm:w-auto px-10 sm:px-12 py-4 sm:py-5 bg-white text-green-700 font-black rounded-2xl hover:bg-green-50 shadow-2xl shadow-black/10 transition-all hover:scale-[1.03] inline-flex items-center justify-center gap-3 text-base sm:text-lg">
            {t.cta.button}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className={`py-10 sm:py-14 px-3 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-950' : 'bg-slate-900'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-black text-white">{lang === 'si' ? 'ගොවි ඉසුරු' : 'Govi Isuru'}</div>
                <div className="text-xs text-slate-400">{t.footer.tagline}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onLogin} className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t.nav.login}</button>
              <button onClick={onRegister} className="text-sm bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-500 transition-colors font-bold">{t.nav.register}</button>
            </div>
          </div>
          <div className={`border-t ${darkMode ? 'border-gray-800' : 'border-slate-800'} pt-6 flex flex-col sm:flex-row justify-between items-center gap-3`}>
            <div className="text-xs text-slate-500 text-center sm:text-left">{t.footer.copyright}</div>
            <div className="text-xs text-slate-600">{t.footer.madeBy}</div>
          </div>
        </div>
      </footer>

      {/* Custom animations */}
      <style>{`
        @keyframes homepageFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes homepageGradientX { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes homepagePulseSlow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes homepageBounceSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        .homepage-float { animation: homepageFloat 3s ease-in-out infinite; }
        .homepage-gradient-text { background: linear-gradient(90deg, #22c55e, #10b981, #14b8a6, #22c55e); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: homepageGradientX 4s ease infinite; }
        .homepage-pulse-slow { animation: homepagePulseSlow 6s ease-in-out infinite; }
        .homepage-bounce-slow { animation: homepageBounceSlow 2s ease-in-out infinite; }
      `}</style>
      </div>
    </div>
  );
};

export default HomePage;
