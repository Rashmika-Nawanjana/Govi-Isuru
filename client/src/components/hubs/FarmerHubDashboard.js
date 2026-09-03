import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  CalendarDays,
  Coins,
  Droplets,
  FileText,
  Leaf,
  MapPin,
  RefreshCw,
  ShoppingBag,
  Stethoscope,
  Users,
  CloudSun,
  ChevronRight,
  Bell,
  Package,
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

const FarmerHubDashboard = ({ lang, user, onNavigate }) => {
  const isEnglish = lang === 'en';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creditInfo, setCreditInfo] = useState({
    credits: user?.credits ?? 0,
    dailyLimit: user?.dailyLimit ?? 200,
    isPremium: user?.isPremium ?? false,
  });
  const [reports, setReports] = useState([]);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const t = isEnglish
    ? {
        welcome: 'Welcome back',
        dashboard: 'Your dashboard',
        credits: 'Credits',
        dailyLimit: 'Daily limit',
        remaining: 'remaining today',
        buyCredits: 'Buy credits',
        premium: 'Premium',
        reports: 'My reports',
        listings: 'My listings',
        bookings: 'Bookings',
        areaAlerts: 'Area alerts',
        quickActions: 'Quick actions',
        recentAlerts: 'Recent notifications',
        recentActivity: 'Recent reports',
        noAlerts: 'No active alerts in your area',
        noReports: 'No disease reports yet',
        noBookings: 'No upcoming bookings',
        refresh: 'Refresh',
        viewAll: 'View all',
        pending: 'Pending',
        active: 'Active',
        aiDoctor: 'AI Doctor',
        weather: 'Weather',
        market: 'Marketplace',
        consult: 'Book officer',
        cropCare: 'Crop care',
        marketHub: 'Market hub',
        consultation: 'Consultation',
        location: 'Location',
        used: 'used',
      }
    : {
        welcome: 'ආයුබෝවන්',
        dashboard: 'ඔබේ උපකරණ පුවරුව',
        credits: 'ණය',
        dailyLimit: 'දෛනික සීමාව',
        remaining: 'අද ඉතිරි',
        buyCredits: 'ණය මිලදී ගන්න',
        premium: 'ප්‍රිමියම්',
        reports: 'මගේ වාර්තා',
        listings: 'මගේ ලැයිස්තු',
        bookings: 'වෙන්කිරීම්',
        areaAlerts: 'ප්‍රදේශ අනතුරු',
        quickActions: 'ක්ෂණික ක්‍රියා',
        recentAlerts: 'මෑත දැනුම්දීම්',
        recentActivity: 'මෑත වාර්තා',
        noAlerts: 'ඔබේ ප්‍රදේශයේ සක්‍රීය අනතුරු නැත',
        noReports: 'තවම රෝග වාර්තා නැත',
        noBookings: 'ඉදිරි වෙන්කිරීම් නැත',
        refresh: 'නැවුම් කරන්න',
        viewAll: 'සියල්ල බලන්න',
        pending: 'පොරොත්තු',
        active: 'සක්‍රීය',
        aiDoctor: 'AI වෛද්‍ය',
        weather: 'කාලගුණය',
        market: 'වෙළඳසැල',
        consult: 'නිලධාරියා',
        cropCare: 'බෝග රැකවරණ',
        marketHub: 'වෙළඳ හබ්',
        consultation: 'උපදෙස්',
        location: 'ස්ථානය',
        used: 'භාවිතා',
      };

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const requests = [
        axios.get(`${API_BASE}/api/credits/balance`, { headers: authHeaders }).catch(() => null),
        axios.get(`${API_BASE}/api/reports/my-reports`, { headers: authHeaders }).catch(() => null),
        axios.get(`${API_BASE}/api/listings`).catch(() => null),
        axios.get(`${API_BASE}/api/manual-bookings/bookings/farmer/mine`, { headers: authHeaders }).catch(() => null),
      ];

      if (user?.gnDivision || user?.district) {
        const params = new URLSearchParams();
        if (user.gnDivision) params.set('gnDivision', user.gnDivision);
        if (user.district) params.set('district', user.district);
        requests.push(
          axios.get(`${API_BASE}/api/alerts/active?${params.toString()}`).catch(() => null)
        );
      } else {
        requests.push(Promise.resolve(null));
      }

      const [creditRes, reportsRes, listingsRes, bookingsRes, alertsRes] = await Promise.all(requests);

      if (creditRes?.data) {
        setCreditInfo({
          credits: creditRes.data.credits ?? user?.credits ?? 0,
          dailyLimit: creditRes.data.dailyLimit ?? user?.dailyLimit ?? 200,
          isPremium: !!creditRes.data.isPremium,
        });
      }

      const reportList = reportsRes?.data?.reports || reportsRes?.data || [];
      setReports(Array.isArray(reportList) ? reportList : []);

      const allListings = Array.isArray(listingsRes?.data) ? listingsRes.data : [];
      const mine = allListings.filter((item) => {
        const farmerId = item.farmer_id?._id || item.farmer_id;
        return (
          farmerId === user?._id ||
          farmerId === user?.id ||
          item.farmerName === user?.username
        );
      });
      setListings(mine);

      const bookingList = bookingsRes?.data?.bookings || [];
      setBookings(Array.isArray(bookingList) ? bookingList : []);

      const alertList = alertsRes?.data?.alerts || [];
      setAlerts(Array.isArray(alertList) ? alertList : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authHeaders, user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const creditPct = Math.min(
    100,
    Math.round(((creditInfo.credits || 0) / Math.max(creditInfo.dailyLimit || 1, 1)) * 100)
  );
  const pendingReports = reports.filter((r) =>
    ['pending', 'instructor_pending', 'claimed', 'under_review'].includes(r.status)
  ).length;
  const openBookings = bookings.filter((b) =>
    ['pending', 'accepted'].includes(b.status)
  ).length;

  const quickActions = [
    { id: 'doctor', label: t.aiDoctor, icon: Stethoscope, color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' },
    { id: 'weather', label: t.weather, icon: CloudSun, color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800' },
    { id: 'market', label: t.market, icon: ShoppingBag, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' },
    { id: 'manualBooking', label: t.consult, icon: Users, color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' },
  ];

  const hubShortcuts = [
    { id: 'cropCareHub', label: t.cropCare, icon: Droplets },
    { id: 'marketHub', label: t.marketHub, icon: Package },
    { id: 'consultationHub', label: t.consultation, icon: Users },
  ];

  const formatDate = (value) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString(isEnglish ? 'en-LK' : 'si-LK', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-green-700 dark:text-green-300">
        <RefreshCw className="animate-spin mr-2" size={20} />
        <span className="text-sm font-semibold">{isEnglish ? 'Loading dashboard...' : 'පූරණය වෙමින්...'}</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 md:space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-green-100">{t.welcome}</p>
            <h1 className="text-xl md:text-3xl font-black truncate">{user?.username || 'Farmer'}</h1>
            <p className="text-[11px] md:text-sm text-green-100 mt-1 flex items-center gap-1">
              <MapPin size={14} className="flex-shrink-0" />
              <span className="truncate">
                {[user?.gnDivision, user?.district].filter(Boolean).join(', ') || t.location}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition"
            aria-label={t.refresh}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-[11px] md:text-sm text-white/80 mt-3 flex items-center gap-1.5">
          <Leaf size={14} />
          {t.dashboard}
        </p>
      </div>

      {/* Credits */}
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl border border-yellow-200/80 dark:border-yellow-800/40 p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
              <Coins size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">{t.credits}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                {creditInfo.credits}
                <span className="text-sm font-semibold text-slate-400 dark:text-gray-500">
                  {' '}/ {creditInfo.dailyLimit}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {creditInfo.isPremium && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {t.premium}
              </span>
            )}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('open-credit-purchase'))}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 active:scale-95 transition"
            >
              {t.buyCredits}
            </button>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all"
            style={{ width: `${creditPct}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-2">
          {creditInfo.credits} {t.remaining} · {t.dailyLimit}: {creditInfo.dailyLimit}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[
          { label: t.reports, value: reports.length, sub: pendingReports ? `${pendingReports} ${t.pending}` : null, icon: FileText, onClick: () => onNavigate('myReports'), tone: 'green' },
          { label: t.listings, value: listings.length, sub: null, icon: Package, onClick: () => onNavigate('market'), tone: 'amber' },
          { label: t.bookings, value: openBookings || bookings.length, sub: openBookings ? t.active : null, icon: CalendarDays, onClick: () => onNavigate('manualBooking'), tone: 'blue' },
          { label: t.areaAlerts, value: alerts.length, sub: alerts.length ? t.active : null, icon: AlertTriangle, onClick: () => onNavigate('alerts'), tone: 'red' },
        ].map((stat) => {
          const Icon = stat.icon;
          const tones = {
            green: 'border-green-200 bg-green-50/80 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300',
            amber: 'border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
            blue: 'border-blue-200 bg-blue-50/80 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
            red: 'border-red-200 bg-red-50/80 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
          };
          return (
            <button
              key={stat.label}
              type="button"
              onClick={stat.onClick}
              className={`text-left rounded-xl border p-3 md:p-4 shadow-sm active:scale-[0.98] transition ${tones[stat.tone]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon size={16} />
                <ChevronRight size={14} className="opacity-60" />
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
              <p className="text-[11px] md:text-xs font-semibold opacity-80">{stat.label}</p>
              {stat.sub && <p className="text-[10px] mt-1 opacity-70">{stat.sub}</p>}
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl border border-slate-200 dark:border-gray-700 p-3 md:p-4 shadow-sm">
        <h2 className="text-sm md:text-base font-bold text-slate-800 dark:text-white mb-3">{t.quickActions}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onNavigate(action.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold active:scale-95 transition ${action.color}`}
              >
                <Icon size={16} />
                <span className="truncate">{action.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-gray-700">
          {hubShortcuts.map((hub) => {
            const Icon = hub.icon;
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => onNavigate(hub.id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-900 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 hover:border-green-400 transition"
              >
                <Icon size={13} />
                {hub.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Notifications / alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl border border-slate-200 dark:border-gray-700 p-3 md:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm md:text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Bell size={16} className="text-red-500" />
              {t.recentAlerts}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('alerts')}
              className="text-[11px] font-semibold text-green-700 dark:text-green-400"
            >
              {t.viewAll}
            </button>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-gray-400 py-6 text-center">{t.noAlerts}</p>
          ) : (
            <ul className="space-y-2">
              {alerts.slice(0, 4).map((alert) => (
                <li
                  key={alert.id || alert._id}
                  className="rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10 p-2.5"
                >
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                    {alert.disease || alert.title || 'Alert'}
                    {alert.crop ? ` · ${alert.crop}` : ''}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                    {alert.severity ? `${String(alert.severity).toUpperCase()} · ` : ''}
                    {alert.gnDivision || alert.district || user?.gnDivision}
                    {alert.reportCount ? ` · ${alert.reportCount} ${isEnglish ? 'cases' : 'අවස්ථා'}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent reports */}
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl border border-slate-200 dark:border-gray-700 p-3 md:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm md:text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText size={16} className="text-green-600" />
              {t.recentActivity}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('myReports')}
              className="text-[11px] font-semibold text-green-700 dark:text-green-400"
            >
              {t.viewAll}
            </button>
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-gray-400 py-6 text-center">{t.noReports}</p>
          ) : (
            <ul className="space-y-2">
              {reports.slice(0, 4).map((report) => (
                <li
                  key={report._id}
                  className="rounded-lg border border-slate-100 dark:border-gray-700 bg-slate-50/70 dark:bg-gray-900/40 p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {report.ai_prediction || report.title || (isEnglish ? 'Disease report' : 'රෝග වාර්තාව')}
                    </p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-400 flex-shrink-0">
                      {report.status || 'pending'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                    {formatDate(report.createdAt || report.submittedAt || report.date)}
                    {report.gnDivision ? ` · ${report.gnDivision}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerHubDashboard;
