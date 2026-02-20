import React, { useState, useEffect } from 'react';
import { Leaf, ShoppingBag, CloudSun, TrendingUp, LogOut, AlertTriangle, Newspaper, BarChart3, BookOpen, X, FileText, Bookmark, Shield, Sun, Moon, Menu, Search, User, Droplets, ClipboardCheck, Globe } from 'lucide-react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import CropSuitability from './components/CropSuitability';
import AIDoctor from './components/AIDoctor';
import Marketplace from './components/Marketplace';
import WeatherAdvisor from './components/WeatherAdvisor';
import MarketTrends from './components/MarketTrends';
import Register from './components/Register';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import VerifyEmail from './components/VerifyEmail';
import LlamaChatbot from './components/LlamaChatbot';
import CreditPurchaseModal from './components/CreditPurchaseModal';

import AlertsDashboard from './components/AlertsDashboard';
import AgriNews from './components/AgriNews';

import YieldPrediction from './components/YieldPrediction';
import HomePage from './components/HomePage';
import OfficerDashboard from './components/OfficerDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import UserProfile from './components/UserProfile';
import TraditionalRice from './components/TraditionalRice';
import ReportVerification from './components/ReportVerification';
import AdminDashboard from './components/AdminDashboard';

import MyReports from './components/MyReports';
import SavedListings from './components/SavedListings';
import NationwideDiseaseMap from './components/NationwideDiseaseMap';
import { districtCoordinates } from './data/sriLankaCoordinates';

const translations = {
  en: {
    title: "Govi Isuru",
    doctor: "AI Doctor",
    market: "Marketplace",
    trends: "Market Trends",
    weather: "Weather Advisory",
    alerts: "Disease Alerts",
    nationwideDiseases: "Nationwide Diseases",
    news: "Agri News",
    yieldForecast: "Yield Forecast",
    suitability: "Crop Suitability",
    riceVarieties: "Rice Varieties",
    logout: "Logout",
    footer: "Empowering Sri Lankan Farmers",
    // Officer-specific translations
    diseaseAlerts: "Disease Alerts",
    areaReports: "Area Reports",
    outbreak: "Outbreak Management",
    areaAnalytics: "Area Reports & Analytics",
    buyerDashboard: "Buyer Dashboard",
    marketplace: "Marketplace",
    savedListings: "Saved Listings",
    agriNews: "Agri News",
    // Admin-specific translations
    adminDashboard: "Admin Dashboard",
    userManagement: "User Management",
    officerApprovals: "Officer Approvals"
  },
  si: {
    title: "ගොවි ඉසුරු",
    doctor: "AI වෛද්‍යවරයා",
    market: "අලෙවිසැල",
    trends: "මිල ප්‍රවණතා",
    weather: "කාලගුණ උපදෙස්",
    alerts: "රෝග අනතුරු ඇඟවීම්",
    nationwideDiseases: "දිවයින පුරා රෝග",
    news: "ගොවි ප්‍රවෘත්ති",
    yieldForecast: "අස්වැන්න අනාවැකි",
    suitability: "බෝග සුදුසුකම",
    riceVarieties: "සහල් වර්ග",
    logout: "පද්ධතියෙන් ඉවත් වන්න",
    footer: "ශ්‍රී ලාංකීය ගොවීන් සවිබල ගැන්වීම",
    // Officer-specific translations
    diseaseAlerts: "රෝග අනතුරු ඇඟවීම්",
    areaReports: "ප්‍රදේශ වාර්තා",
    outbreak: "පිපිරීම් කළමනාකරණ",
    areaAnalytics: "ප්‍රදේශ වාර්තා හා විශ්ලේෂණ",
    buyerDashboard: "ගැණුම්කරු උපකරණ පුවරුව",
    marketplace: "වෙළඳසැල",
    savedListings: "සුරක්ෂිත ලැයිස්තු",
    agriNews: "ගොවි ප්‍රවෘත්ති",
    // Admin-specific translations
    adminDashboard: "පරිපාලක උපකරණ පුවරුව",
    userManagement: "පරිශීලක කළමනාකරණය",
    officerApprovals: "නිලධාරී අනුමැතිය"
  }
};

// Verify Email Page Component
const VerifyEmailPage = () => {
  const [lang] = useState('en');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center text-white animate-in fade-in zoom-in duration-1000">
        <Leaf className="h-16 w-16 text-green-300 mx-auto mb-2" />
        <h1 className="text-4xl font-black tracking-tighter">GOVI ISURU</h1>
      </div>
      <VerifyEmail
        switchToLogin={() => navigate('/')}
        lang={lang}
      />
    </div>
  );
};

// Reset Password Page Component
const ResetPasswordPage = () => {
  const [lang] = useState('en');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center text-white animate-in fade-in zoom-in duration-1000">
        <Leaf className="h-16 w-16 text-green-300 mx-auto mb-2" />
        <h1 className="text-4xl font-black tracking-tighter">GOVI ISURU</h1>
      </div>
      <ResetPassword
        switchToLogin={() => navigate('/')}
        lang={lang}
      />
    </div>
  );
};

// Main App Component
function MainApp() {
  // 1. ALL HOOKS AT THE VERY TOP (Crucial for React Rules)
  const [view, setView] = useState('home');
  const [lang, setLang] = useState('en');
  const [coords, setCoords] = useState({ lat: 8.3114, lon: 80.4037 }); // Default to Anuradhapura
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Apply dark class to document
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const t = translations[lang];

  const fetchCredits = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      // Use relative path in production (assumed if no env var), or localhost for local dev
      const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
      const res = await fetch(`${API_URL}/api/credits/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.credits !== undefined) {
          const updatedUser = { ...user, credits: data.credits, dailyLimit: data.dailyLimit };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      console.error("Failed to fetch credits", err);
    }
  };

  useEffect(() => {
    // Location is obtained from user profile during registration, no need to ask on homepage
    // Default to Anuradhapura for map/weather features

    // Fetch latest credits
    fetchCredits();

    // Listen for open-credit-purchase event from other components
    const handleOpenCreditModal = () => setShowCreditModal(true);
    window.addEventListener('open-credit-purchase', handleOpenCreditModal);

    // Listen for session expired event (from axios interceptor)
    const handleSessionExpired = () => {
      setUser(null);
      setView('home');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    };
    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('open-credit-purchase', handleOpenCreditModal);
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [user?.username]); // Depend on username to avoid infinite loop with user object update

  // Map logged-in user's GN division or district to coordinates for weather (case-insensitive)
  const resolveUserCoords = (usr) => {
    if (!usr?.district) return null;

    const norm = (v) => (v || '').toString().trim().toLowerCase();
    const userDistrict = norm(usr.district);
    const userGN = norm(usr.gnDivision);

    // Find matching district (case-insensitive)
    const districtKey = Object.keys(districtCoordinates).find(
      (d) => norm(d) === userDistrict
    );
    if (!districtKey) return null;

    const district = districtCoordinates[districtKey];

    // Try GN match first (case-insensitive)
    if (userGN && district.gnDivisions) {
      const gnKey = Object.keys(district.gnDivisions).find(
        (g) => norm(g) === userGN
      );
      if (gnKey) {
        const gn = district.gnDivisions[gnKey];
        return { lat: gn.lat, lon: gn.lng };
      }
    }

    // Fallback to district center
    return district.center ? { lat: district.center.lat, lon: district.center.lng } : null;
  };

  useEffect(() => {
    const resolved = resolveUserCoords(user);
    if (resolved) setCoords(resolved);
  }, [user]);

  // Set initial view based on user role (for localStorage-loaded users or on user state change)
  useEffect(() => {
    // If user exists and view hasn't been set to a dashboard yet, set it based on role
    if (user && (view === 'home' || view === 'login' || view === 'register')) {
      let initialView = 'doctor';
      if (user?.role === 'admin') initialView = 'adminDashboard';
      else if (user?.role === 'officer') initialView = 'officerDashboard';
      else if (user?.role === 'buyer') initialView = 'buyerDashboard';
      setView(initialView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, view]);

  // 2. HELPER FUNCTIONS
  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    // Set initial view based on role
    let initialView = 'doctor';
    if (userData?.role === 'admin') initialView = 'adminDashboard';
    else if (userData?.role === 'officer') initialView = 'officerDashboard';
    else if (userData?.role === 'buyer') initialView = 'buyerDashboard';
    setView(initialView);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.reload(); // Refresh to show Register screen
  };

  // 3. CONDITIONAL RENDER FOR REGISTRATION OR HOME PAGE
  if (!user) {
    // Show HomePage if no user is logged in and view is 'home'
    if (view === 'home') {
      return (
        <HomePage
          onLogin={() => setView('login')}
          onRegister={() => setView('register')}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      );
    }

    // Show Login, Register, Forgot Password, etc.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{
        backgroundImage: 'url(/backgrounds/farming-training.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        {/* Dark overlay */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 0
        }} />
        <div className="mb-8 text-center text-white animate-in fade-in zoom-in duration-1000" style={{ position: 'relative', zIndex: 1 }}>
          <Leaf className="h-16 w-16 text-green-300 mx-auto mb-2" />
          <h1 className="text-4xl font-black tracking-tighter">GOVI ISURU</h1>
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px' }}>
          {view === 'login' && (
            <Login
              onLoginSuccess={handleRegisterSuccess}
              switchToRegister={() => setView('register')}
              switchToForgotPassword={() => setView('forgotPassword')}
              lang={lang}
            />
          )}

          {view === 'register' && (
            <Register
              onRegisterSuccess={handleRegisterSuccess}
              switchToLogin={() => setView('login')}
              lang={lang}
            />
          )}

          {view === 'forgotPassword' && (
            <ForgotPassword
              switchToLogin={() => setView('login')}
              lang={lang}
            />
          )}

          {view === 'resetPassword' && (
            <ResetPassword
              switchToLogin={() => setView('login')}
              lang={lang}
            />
          )}

          {view === 'verifyEmail' && (
            <VerifyEmail
              switchToLogin={() => setView('login')}
              lang={lang}
            />
          )}
        </div>

        {/* Back to Home button */}
        <button
          onClick={() => {
            setView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="mt-6 text-white/80 hover:text-white text-sm font-medium transition-colors"
          style={{ position: 'relative', zIndex: 1 }}
        >
          ← {lang === 'si' ? 'මුල් පිටුවට' : 'Back to Home'}
        </button>
      </div>
    );
  }

  // Navigation items config - role-based
  const getNavItems = () => {
    const isFarmer = !user?.role || user?.role === 'farmer';
    const isBuyer = user?.role === 'buyer';
    const isAdmin = user?.role === 'admin';
    // Add profile tab for all users
    const profileTab = { id: 'profile', icon: User, label: lang === 'si' ? 'පැතිකඩ' : 'Profile', emoji: '👤' };
    if (isAdmin) {
      // Admin tabs
      return [
        { id: 'adminDashboard', icon: Shield, label: t.adminDashboard, emoji: '🛡️' },
        { id: 'news', icon: Newspaper, label: t.news, emoji: '📰' },
        profileTab,
      ];
    } else if (isFarmer) {
      // Farmer tabs
      return [
        { id: 'doctor', icon: Search, label: t.doctor, emoji: '🩺' },
        { id: 'myReports', icon: FileText, label: lang === 'si' ? 'මගේ වාර්තා' : 'My Reports', emoji: '📋' },
        { id: 'yield', icon: BarChart3, label: t.yieldForecast, emoji: '🌾' },
        { id: 'trends', icon: TrendingUp, label: t.trends, emoji: '📈' },
        { id: 'market', icon: ShoppingBag, label: t.market, emoji: '🛒' },
        { id: 'weather', icon: CloudSun, label: t.weather, emoji: '🌤️' },
        { id: 'alerts', icon: AlertTriangle, label: t.alerts, emoji: '⚠️' },
        { id: 'nationwideDiseases', icon: Globe, label: t.nationwideDiseases, emoji: '🌍' },
        { id: 'news', icon: Newspaper, label: t.news, emoji: '📰' },
        { id: 'suitability', icon: Droplets, label: t.suitability, emoji: '🌱' },
        { id: 'riceVarieties', icon: BookOpen, label: t.riceVarieties, emoji: '🌾' },
        profileTab,
      ];
    } else if (isBuyer) {
      // Buyer tabs
      return [
        { id: 'buyerDashboard', icon: ShoppingBag, label: t.buyerDashboard, emoji: '🛍️' },
        { id: 'marketplace', icon: ShoppingBag, label: t.marketplace, emoji: '🛒' },
        { id: 'savedListings', icon: Bookmark, label: t.savedListings, emoji: '🔖' },
        { id: 'news', icon: Newspaper, label: t.agriNews, emoji: '📰' },
        { id: 'riceVarieties', icon: BookOpen, label: t.riceVarieties, emoji: '🌾' },
        profileTab,
      ];
    } else {
      // Government Officer tabs
      return [
        { id: 'officerDashboard', icon: ClipboardCheck, label: 'Area Dashboard', emoji: '📊' },
        { id: 'reportVerification', icon: FileText, label: 'Verify Reports', emoji: '✅' },
        { id: 'alerts', icon: AlertTriangle, label: t.diseaseAlerts, emoji: '⚠️' },
        { id: 'nationwideDiseases', icon: Globe, label: t.nationwideDiseases || 'Nationwide Diseases', emoji: '🌍' },
        { id: 'news', icon: Newspaper, label: t.news, emoji: '📰' },
        { id: 'riceVarieties', icon: BookOpen, label: t.riceVarieties, emoji: '🌾' },
        profileTab,
      ];
    }
  };

  const navItems = getNavItems();

  // Get background image based on user role
  const getBackgroundImage = () => {
    if (user?.role === 'admin') {
      return '/backgrounds/farmer-dashboard-bg.jpg';
    } else if (user?.role === 'officer') {
      return '/backgrounds/officer-dashboard-bg.jpg';
    } else if (user?.role === 'buyer') {
      return '/backgrounds/buyer-dashboard-bg.jpg';
    } else {
      // Farmer or no specific role
      return '/backgrounds/farmer-dashboard-bg.jpg';
    }
  };

  // 4. MAIN APP DASHBOARD
  return (
    <div
      className="min-h-screen font-sans flex flex-col md:flex-row relative"
      style={{
        backgroundImage: darkMode
          ? `linear-gradient(rgba(17, 24, 39, 0.85), rgba(17, 24, 39, 0.85)), url(${getBackgroundImage()})`
          : `linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), url(${getBackgroundImage()})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
        />
      )}

      {/* Sidebar Navigation - Modern Mobile Drawer */}
      <nav
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 md:w-80 max-w-[85%] md:max-w-none text-white shadow-2xl flex-shrink-0 flex flex-col transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        style={{ background: 'linear-gradient(180deg, #166534 0%, #14532d 40%, #052e16 100%)' }}
      >
        {/* Logo Header */}
        <div className="sticky top-0 z-10 p-3 md:p-5 flex items-center gap-2.5 md:gap-3 border-b border-green-600/30" style={{ background: 'linear-gradient(135deg, rgba(22,101,52,0.95) 0%, rgba(21,128,61,0.9) 100%)', backdropFilter: 'blur(8px)' }}>
          <div className="p-1.5 md:p-2.5 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg md:rounded-xl shadow-lg shadow-green-500/20">
            <Leaf className="h-5 w-5 md:h-7 md:w-7 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-base md:text-xl font-black tracking-tight leading-tight block">{t.title}</span>
            <span className="text-[9px] md:text-xs text-green-300/80 font-medium">{lang === 'si' ? 'ස්මාර්ට් ගොවිතැන' : "Smart Farming Platform"}</span>
          </div>
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items - Scrollable */}
        <div className="flex-1 overflow-y-auto p-2 md:p-3 flex flex-col gap-0.5">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`group flex items-center gap-2 md:gap-3 w-full px-3 md:px-4 py-2.5 md:py-2.5 rounded-lg md:rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] shimmer-hover ${isActive
                  ? 'bg-white/95 text-green-800 shadow-lg shadow-green-900/20'
                  : 'text-green-100/90 hover:bg-white/10 hover:text-white'
                  }`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className={`p-1 md:p-1.5 rounded-lg transition-all flex-shrink-0 ${isActive ? 'bg-gradient-to-br from-green-100 to-emerald-100 shadow-sm' : 'bg-white/10'}`}>
                  <Icon size={16} className={`md:w-[18px] md:h-[18px] ${isActive ? 'text-green-700' : 'text-green-300'}`} />
                </div>
                <span className="flex-grow text-left truncate">{item.label}</span>
                {isActive && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* User Info Card */}
        {user && (
          <div className="mx-2 md:mx-3 mb-2 p-3 rounded-xl border border-green-500/20" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.1) 100%)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-sm shadow-md flex-shrink-0">
                {user?.role === 'admin' ? '🛡️' : user?.role === 'officer' ? '🏛️' : user?.role === 'buyer' ? '🛒' : '👨‍🌾'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-bold text-white truncate">{user.username}</p>
                <p className="text-[10px] text-green-300/80 font-medium truncate">
                  {user?.role === 'officer'
                    ? `📋 ${user.officerId || user.district}`
                    : user?.role === 'admin'
                      ? 'Administrator'
                      : user?.role === 'buyer'
                        ? `📍 ${user.district}`
                        : `📍 ${user.gnDivision}`}
                </p>
              </div>
              <div className="flex-shrink-0 bg-yellow-400/20 px-2 py-1 rounded-lg">
                <span className="text-[10px] font-bold text-yellow-200">🪙 {user.credits ?? 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="p-2 md:p-3 border-t border-green-600/20 space-y-1 md:space-y-1.5">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-2 md:gap-3 w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl font-semibold border border-green-600/50 hover:bg-green-700/50 hover:border-green-500 text-xs md:text-sm text-green-100 transition-all active:scale-95"
          >
            {darkMode ? <Sun size={16} className="md:w-[18px] md:h-[18px]" /> : <Moon size={16} className="md:w-[18px] md:h-[18px]" />}
            <span>{darkMode ? (lang === 'si' ? 'ආලෝක ප්‍රකාරය' : 'Light Mode') : (lang === 'si' ? 'අඳුරු ප්‍රකාරය' : 'Dark Mode')}</span>
            <span className="ml-auto text-[9px] md:text-xs bg-green-700 px-1.5 md:px-2 py-0.5 rounded-full font-bold">{darkMode ? '☀️' : '🌙'}</span>
          </button>

          <button
            onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
            className="flex items-center gap-2 md:gap-3 w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl font-semibold border border-green-600/50 hover:bg-green-700/50 hover:border-green-500 text-xs md:text-sm text-green-100 transition-all active:scale-95"
          >
            <Globe size={16} className="md:w-[18px] md:h-[18px]" />
            <span>{lang === 'en' ? 'සිංහල' : 'English'}</span>
            <span className="ml-auto text-[9px] md:text-xs bg-green-700 px-1.5 md:px-2 py-0.5 rounded-full font-bold">{lang === 'en' ? 'EN' : 'SI'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 md:gap-3 w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 text-xs md:text-sm transition-all active:scale-95"
          >
            <LogOut size={16} className="md:w-[18px] md:h-[18px]" /> {t.logout}
          </button>
        </div>
      </nav>

      {/* Main Content Area - Clean Mobile Layout */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900" style={{ position: 'relative', zIndex: 1 }}>
        <div className="w-full h-full flex flex-col">
          {/* Mobile Top Bar - Hamburger Menu */}
          <div className="md:hidden sticky top-0 z-20 bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Hamburger Button */}
              <button
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors active:scale-95"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={22} className="text-white" />
              </button>

              {/* Center - App Title & Current View */}
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded-lg">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white leading-tight">{t.title}</p>
                  <p className="text-[9px] text-green-100 font-medium">
                    {navItems.find(n => n.id === view)?.label || 'Dashboard'}
                  </p>
                </div>
              </div>

              {/* Right - Credits & Language */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowCreditModal(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-100 text-xs font-bold active:scale-95"
                >
                  🪙 {user.credits ?? 0}
                </button>
                <button
                  onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
                  className="p-1.5 rounded-lg bg-white/15 text-white text-[10px] font-bold active:scale-95"
                >
                  {lang === 'en' ? 'SI' : 'EN'}
                </button>
              </div>
            </div>
          </div>

          {/* Content Wrapper - Direct Content Access */}
          <div className="flex-1 overflow-y-auto relative z-10 bg-white/25 dark:bg-gray-900/90">
            <div className="w-full mx-auto">
              {/* Desktop Welcome Header */}
              <div className="hidden md:block md:m-4 md:rounded-2xl overflow-hidden">
                <div className="relative p-5" style={{ background: darkMode ? 'linear-gradient(135deg, rgba(22,101,52,0.3) 0%, rgba(6,78,59,0.2) 100%)' : 'linear-gradient(135deg, rgba(240,253,244,0.9) 0%, rgba(220,252,231,0.7) 100%)' }}>
                  <div className="absolute inset-0 backdrop-blur-sm border border-green-200/30 dark:border-green-800/30 rounded-2xl" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">
                        {lang === 'si' ? 'ආයුබෝවන්' : 'Welcome back'},
                      </p>
                      <p className="text-xl font-black text-slate-800 dark:text-white truncate">{user.username}</p>
                      <span className="text-xs text-slate-400 dark:text-gray-500 font-medium mt-1 block">
                        {new Date().toLocaleDateString(lang === 'si' ? 'si-LK' : 'en-LK', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button onClick={() => setShowCreditModal(true)} className="hidden md:flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/20 text-yellow-700 dark:text-yellow-300 px-4 py-2.5 rounded-xl text-sm font-bold border border-yellow-200/80 dark:border-yellow-700/30 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer">
                        <span className="text-lg">🪙</span>
                        <span>{user.credits ?? 0}</span>
                      </button>
                      {user?.role === 'officer' ? (
                        <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg font-semibold border border-blue-100 dark:border-blue-800/30">
                          📍 {user.district}
                        </span>
                      ) : (
                        <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-lg font-semibold border border-green-100 dark:border-green-800/30">
                          📍 {user.gnDivision}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content - Immediate Access */}
              <div className="px-3 py-2 md:px-8 md:py-6 space-y-3 md:space-y-6">
                {/* Farmer Views */}
                {(!user?.role || user?.role === 'farmer') && (
                  <>
                    {view === 'doctor' && <AIDoctor lang={lang} user={user} onInteraction={fetchCredits} />}
                    {view === 'myReports' && <MyReports user={user} lang={lang} />}
                    {view === 'market' && <Marketplace lang={lang} currentUser={user} onInteraction={fetchCredits} />}
                    {view === 'weather' && <WeatherAdvisor lang={lang} lat={coords.lat} lon={coords.lon} user={user} />}
                    {view === 'trends' && <MarketTrends lang={lang} />}
                    {view === 'alerts' && <AlertsDashboard user={user} language={lang} />}
                    {view === 'nationwideDiseases' && <NationwideDiseaseMap user={user} language={lang} />}
                    {view === 'news' && <AgriNews lang={lang} user={user} />}
                    {view === 'yield' && <YieldPrediction lang={lang} onInteraction={fetchCredits} />}
                    {view === 'suitability' && <CropSuitability lang={lang} user={user} coords={coords} onInteraction={fetchCredits} />}
                    {view === 'riceVarieties' && <TraditionalRice lang={lang} />}
                    {view === 'profile' && <UserProfile />}
                  </>
                )}

                {/* Buyer Views */}
                {user?.role === 'buyer' && (
                  <>
                    {view === 'buyerDashboard' && <BuyerDashboard user={user} language={lang} onNavigate={setView} />}
                    {view === 'marketplace' && <Marketplace lang={lang} currentUser={user} />}
                    {view === 'savedListings' && <SavedListings lang={lang} currentUser={user} onNavigate={setView} />}
                    {view === 'news' && <AgriNews lang={lang} user={user} />}
                    {view === 'riceVarieties' && <TraditionalRice lang={lang} />}
                    {view === 'profile' && <UserProfile />}
                  </>
                )}

                {/* Officer Views */}
                {user?.role === 'officer' && (
                  <>
                    {view === 'officerDashboard' && <OfficerDashboard user={user} language={lang} />}
                    {view === 'reportVerification' && <ReportVerification user={user} lang={lang} />}
                    {view === 'alerts' && <AlertsDashboard user={user} language={lang} />}
                    {view === 'nationwideDiseases' && <NationwideDiseaseMap user={user} language={lang} />}
                    {view === 'news' && <AgriNews lang={lang} user={user} />}
                    {view === 'riceVarieties' && <TraditionalRice lang={lang} />}
                    {view === 'profile' && <UserProfile />}
                  </>
                )}

                {/* Admin Views */}
                {user?.role === 'admin' && (
                  <>
                    {view === 'adminDashboard' && <AdminDashboard user={user} language={lang} />}
                    {view === 'news' && <AgriNews lang={lang} user={user} />}
                    {view === 'profile' && <UserProfile />}
                  </>
                )}
              </div>

              {/* Footer - Compact */}
              <footer className="text-center text-slate-400 dark:text-gray-500 text-[10px] md:text-xs py-4 md:py-6 px-4 border-t border-slate-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50">
                <p>© 2026 <span className="font-semibold text-green-600">{t.title}</span> — {t.footer}</p>
              </footer>
            </div>
          </div>
        </div>
      </main>

      {/* Llama 3.1 AI Chatbot - Available on all pages */}
      <LlamaChatbot lang={lang} />
      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onPurchaseSuccess={() => {
          fetchCredits(); // Refresh credits
          // Also maybe show a toast?
        }}
        lang={lang}
      />
    </div>
  );
}

// Main App Export with Router
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Special auth routes that need URL parameters */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Main app route */}
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}