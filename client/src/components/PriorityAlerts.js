import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  AlertOctagon,
  Bell,
  Info,
  Clock,
  MapPin,
  RefreshCw,
  ChevronRight,
  Zap,
  Timer,
  TrendingUp
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Priority configuration
const PRIORITY_CONFIG = {
  emergency: {
    icon: AlertOctagon,
    bgColor: 'bg-gradient-to-r from-red-600 to-red-700',
    borderColor: 'border-red-500',
    textColor: 'text-red-600',
    badgeColor: 'bg-red-600 text-white',
    pulseColor: 'bg-red-500',
    label: 'EMERGENCY',
    labelSi: 'හදිසි',
    slaHours: 2,
    description: 'Immediate action required',
    descriptionSi: 'ක්ෂණික ක්‍රියාමාර්ග අවශ්‍යයි'
  },
  high: {
    icon: AlertTriangle,
    bgColor: 'bg-gradient-to-r from-orange-500 to-orange-600',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-600',
    badgeColor: 'bg-orange-500 text-white',
    pulseColor: 'bg-orange-500',
    label: 'HIGH PRIORITY',
    labelSi: 'ඉහළ ප්‍රමුඛතාව',
    slaHours: 12,
    description: 'Respond within 12 hours',
    descriptionSi: 'පැය 12 ක් ඇතුළත ප්‍රතිචාර දක්වන්න'
  },
  medium: {
    icon: Bell,
    bgColor: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-600',
    badgeColor: 'bg-yellow-500 text-white',
    pulseColor: 'bg-yellow-500',
    label: 'MEDIUM',
    labelSi: 'මධ්‍යම',
    slaHours: 48,
    description: 'Respond within 48 hours',
    descriptionSi: 'පැය 48 ක් ඇතුළත ප්‍රතිචාර දක්වන්න'
  },
  low: {
    icon: Info,
    bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-600',
    badgeColor: 'bg-blue-500 text-white',
    pulseColor: 'bg-blue-500',
    label: 'LOW',
    labelSi: 'අඩු',
    slaHours: null,
    description: 'Review when available',
    descriptionSi: 'ලබා ගත හැකි විට සමාලෝචනය කරන්න'
  },
  info: {
    icon: Info,
    bgColor: 'bg-gradient-to-r from-gray-500 to-gray-600',
    borderColor: 'border-gray-400',
    textColor: 'text-gray-600',
    badgeColor: 'bg-gray-500 text-white',
    pulseColor: 'bg-gray-500',
    label: 'INFO',
    labelSi: 'තොරතුරු',
    slaHours: null,
    description: 'For information only',
    descriptionSi: 'තොරතුරු සඳහා පමණි'
  }
};

// Countdown Timer Component
const CountdownTimer = ({ createdAt, slaHours, language }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!slaHours) return;

    const calculateTimeLeft = () => {
      const created = new Date(createdAt);
      const deadline = new Date(created.getTime() + slaHours * 60 * 60 * 1000);
      const now = new Date();
      const diff = deadline - now;

      if (diff <= 0) {
        setIsOverdue(true);
        const overdueDiff = Math.abs(diff);
        const hours = Math.floor(overdueDiff / (1000 * 60 * 60));
        const minutes = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft({ hours, minutes, overdue: true });
      } else {
        setIsOverdue(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft({ hours, minutes, overdue: false });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [createdAt, slaHours]);

  if (!slaHours || !timeLeft) return null;

  return (
    <div className={`flex items-center gap-1 text-xs font-bold ${
      isOverdue ? 'text-red-600 animate-pulse' : 'text-gray-600'
    }`}>
      <Timer className="w-3 h-3" />
      {isOverdue ? (
        <span>{language === 'si' ? 'ප්‍රමාද වී ඇත' : 'OVERDUE'} {timeLeft.hours}h {timeLeft.minutes}m</span>
      ) : (
        <span>{timeLeft.hours}h {timeLeft.minutes}m {language === 'si' ? 'ඉතිරියි' : 'left'}</span>
      )}
    </div>
  );
};

const PriorityAlerts = ({ user, language = 'en', onViewReport }) => {
  const [alerts, setAlerts] = useState({
    emergency: [],
    high: [],
    medium: [],
    low: [],
    info: []
  });
  const [loading, setLoading] = useState(true);
  const [escalations, setEscalations] = useState([]);

  const t = {
    en: {
      title: 'Priority Alerts',
      subtitle: 'Reports requiring immediate attention',
      loading: 'Loading alerts...',
      noAlerts: 'No priority alerts',
      viewAll: 'View All',
      escalations: 'Overdue Escalations',
      hoursOverdue: 'hours overdue',
      refresh: 'Refresh',
      reports: 'reports',
      viewReport: 'View Report'
    },
    si: {
      title: 'ප්‍රමුඛතා අනතුරු ඇඟවීම්',
      subtitle: 'ක්ෂණික අවධානය අවශ්‍ය වාර්තා',
      loading: 'අනතුරු ඇඟවීම් පූරණය වෙමින්...',
      noAlerts: 'ප්‍රමුඛතා අනතුරු ඇඟවීම් නැත',
      viewAll: 'සියල්ල බලන්න',
      escalations: 'ප්‍රමාද වූ උත්සන්නයන්',
      hoursOverdue: 'පැය ප්‍රමාදයි',
      refresh: 'නැවුම් කරන්න',
      reports: 'වාර්තා',
      viewReport: 'වාර්තාව බලන්න'
    }
  };

  const text = t[language] || t.en;
  const getToken = () => localStorage.getItem('token');

  // Fetch priority alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      
      // Fetch reports grouped by priority
      const [reportsRes, escalationsRes] = await Promise.all([
        axios.get(`${API_BASE}/officer/reports`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        }),
        axios.get(`${API_BASE}/officer/escalations`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        }).catch(() => ({ data: { escalations: [] } }))
      ]);

      const reports = reportsRes.data.reports || [];
      
      // Group by priority
      const grouped = {
        emergency: reports.filter(r => r.priority === 'emergency'),
        high: reports.filter(r => r.priority === 'high'),
        medium: reports.filter(r => r.priority === 'medium'),
        low: reports.filter(r => r.priority === 'low'),
        info: reports.filter(r => r.priority === 'info')
      };

      setAlerts(grouped);
      setEscalations(escalationsRes.data.escalations || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Priority Card Component
  const PriorityCard = ({ priority, reports }) => {
    const config = PRIORITY_CONFIG[priority];
    const Icon = config.icon;
    const count = reports.length;

    if (count === 0) return null;

    return (
      <div className={`rounded-xl overflow-hidden shadow-lg border-l-4 ${config.borderColor}`}>
        {/* Header */}
        <div className={`${config.bgColor} p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {language === 'si' ? config.labelSi : config.label}
                </h3>
                <p className="text-white/80 text-xs">
                  {language === 'si' ? config.descriptionSi : config.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{count}</div>
              <div className="text-xs text-white/80">{text.reports}</div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white divide-y max-h-48 overflow-y-auto">
          {reports.slice(0, 5).map((report, idx) => (
            <div 
              key={report._id || idx}
              className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onViewReport && onViewReport(report._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">
                    {report.disease}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{report.gnDivision}, {report.district}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <CountdownTimer 
                    createdAt={report.createdAt} 
                    slaHours={config.slaHours}
                    language={language}
                  />
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        {count > 5 && (
          <div className="bg-gray-50 p-2 text-center border-t">
            <button className={`text-sm font-medium ${config.textColor} hover:underline`}>
              {text.viewAll} ({count - 5} more)
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            {text.title}
          </h2>
          <p className="text-gray-500 text-sm">{text.subtitle}</p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Escalations Banner */}
      {escalations.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertOctagon className="w-5 h-5 text-red-600 animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-800">{text.escalations}</h3>
              <p className="text-sm text-red-600">
                {escalations.length} {text.reports} {language === 'si' ? 'ප්‍රමාද වී ඇත' : 'are overdue'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {escalations.slice(0, 3).map((esc, idx) => (
                <div 
                  key={idx}
                  className="bg-red-100 px-3 py-1 rounded-full text-xs font-medium text-red-700"
                >
                  {esc.disease} ({esc.hoursOverdue}h {text.hoursOverdue})
                </div>
              ))}
              {escalations.length > 3 && (
                <div className="bg-red-200 px-3 py-1 rounded-full text-xs font-bold text-red-800">
                  +{escalations.length - 3} more
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
          {text.loading}
        </div>
      ) : (
        <>
          {/* Priority Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PriorityCard priority="emergency" reports={alerts.emergency} />
            <PriorityCard priority="high" reports={alerts.high} />
            <PriorityCard priority="medium" reports={alerts.medium} />
          </div>

          {/* Lower Priority Row */}
          {(alerts.low.length > 0 || alerts.info.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PriorityCard priority="low" reports={alerts.low} />
              <PriorityCard priority="info" reports={alerts.info} />
            </div>
          )}

          {/* No Alerts State */}
          {Object.values(alerts).every(arr => arr.length === 0) && (
            <div className="text-center py-12 bg-green-50 rounded-xl border border-green-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-green-800 text-lg">{text.noAlerts}</h3>
              <p className="text-green-600 text-sm mt-1">
                {language === 'si' 
                  ? 'සියලුම වාර්තා සමාලෝචනය කර ඇත' 
                  : 'All reports have been reviewed'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PriorityAlerts;
