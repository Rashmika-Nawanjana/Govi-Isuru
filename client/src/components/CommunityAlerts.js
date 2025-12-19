import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, 
  Bell, 
  MapPin, 
  Calendar, 
  TrendingUp,
  Shield,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Severity configuration
const severityConfig = {
  critical: {
    color: 'bg-red-100 border-red-500 text-red-800',
    icon: AlertTriangle,
    badge: 'bg-red-500 text-white',
    label: { en: 'Critical', si: 'බරපතල' }
  },
  high: {
    color: 'bg-orange-100 border-orange-500 text-orange-800',
    icon: AlertCircle,
    badge: 'bg-orange-500 text-white',
    label: { en: 'High', si: 'ඉහළ' }
  },
  medium: {
    color: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    icon: Info,
    badge: 'bg-yellow-500 text-white',
    label: { en: 'Medium', si: 'මධ්‍යම' }
  },
  low: {
    color: 'bg-blue-100 border-blue-500 text-blue-800',
    icon: Info,
    badge: 'bg-blue-500 text-white',
    label: { en: 'Low', si: 'අඩු' }
  }
};

// Alert Card Component
const AlertCard = ({ alert, language, expanded, onToggle }) => {
  const config = severityConfig[alert.severity] || severityConfig.medium;
  const SeverityIcon = config.icon;
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-LK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 mb-3 ${config.color} shadow-sm transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <SeverityIcon className="w-6 h-6 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-lg">{alert.disease}</h4>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
                {config.label[language]}
              </span>
              <span className="text-sm opacity-75">
                • {alert.crop}
              </span>
            </div>
            
            <div className="flex items-center gap-4 mt-1 text-sm opacity-75 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {alert.gnDivision}, {alert.dsDivision}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {alert.reportCount} {language === 'si' ? 'වාර්තා' : 'reports'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(alert.lastUpdatedAt)}
              </span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onToggle}
          className="p-1 hover:bg-white/50 rounded transition-colors"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>
      
      {expanded && alert.recommendation && (
        <div className="mt-4 pt-4 border-t border-current/20">
          <h5 className="font-medium mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {language === 'si' ? 'නිර්දේශිත ක්‍රියාමාර්ග' : 'Recommended Actions'}
          </h5>
          <p className="text-sm leading-relaxed">
            {alert.recommendation[language] || alert.recommendation.en}
          </p>
        </div>
      )}
    </div>
  );
};

// Notification Bell Component
const NotificationBell = ({ count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
      title="Disease Alerts"
    >
      <Bell className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
};

// Main Community Alerts Component
const CommunityAlerts = ({ user, language = 'en' }) => {
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [stats, setStats] = useState(null);

  // Fetch active alerts for user's location
  const fetchAlerts = useCallback(async () => {
    if (!user?.gnDivision) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [alertsRes, notifRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/alerts/active`, {
          params: {
            gnDivision: user.gnDivision,
            dsDivision: user.dsDivision,
            district: user.district
          }
        }),
        axios.get(`${API_BASE}/api/alerts/notifications`, {
          params: { gnDivision: user.gnDivision }
        }),
        axios.get(`${API_BASE}/api/alerts/stats`, {
          params: { district: user.district }
        })
      ]);

      setAlerts(alertsRes.data.alerts || []);
      setNotifications(notifRes.data.notifications || []);
      setStats(statsRes.data.stats || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(language === 'si' 
        ? 'අනතුරු ඇඟවීම් පූරණය කිරීමට අසමත් විය' 
        : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [user, language]);

  useEffect(() => {
    fetchAlerts();
    
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const activeAlertCount = alerts.filter(a => 
    a.severity === 'critical' || a.severity === 'high'
  ).length;

  const texts = {
    en: {
      title: 'Community Disease Alerts',
      subtitle: 'Early warning system for your area',
      noAlerts: 'No active disease alerts in your area',
      noLocation: 'Set your location in profile to receive alerts',
      refresh: 'Refresh',
      activeAlerts: 'Active Alerts',
      recentActivity: 'Recent Activity',
      reportsThisWeek: 'Reports This Week',
      close: 'Close'
    },
    si: {
      title: 'ප්‍රජා රෝග අනතුරු ඇඟවීම්',
      subtitle: 'ඔබගේ ප්‍රදේශය සඳහා පූර්ව අනතුරු ඇඟවීමේ පද්ධතිය',
      noAlerts: 'ඔබගේ ප්‍රදේශයේ ක්‍රියාකාරී රෝග අනතුරු ඇඟවීම් නැත',
      noLocation: 'අනතුරු ඇඟවීම් ලබා ගැනීමට ඔබගේ පැතිකඩෙහි ස්ථානය සකසන්න',
      refresh: 'නැවුම් කරන්න',
      activeAlerts: 'ක්‍රියාකාරී අනතුරු ඇඟවීම්',
      recentActivity: 'මෑත ක්‍රියාකාරකම්',
      reportsThisWeek: 'මෙම සතියේ වාර්තා',
      close: 'වසන්න'
    }
  };

  const t = texts[language] || texts.en;

  // Inline alerts panel for dashboard
  if (!showPanel) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{t.title}</h3>
              <p className="text-sm text-gray-500">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell count={activeAlertCount} onClick={() => setShowPanel(true)} />
            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
              title={t.refresh}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {!user?.gnDivision ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t.noLocation}</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>{t.noAlerts}</p>
          </div>
        ) : (
          <div>
            {/* Stats Summary */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-800">{alerts.length}</p>
                  <p className="text-xs text-gray-500">{t.activeAlerts}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-800">{stats.totalReportsThisWeek || 0}</p>
                  <p className="text-xs text-gray-500">{t.reportsThisWeek}</p>
                </div>
                {stats.topDiseases?.[0] && (
                  <div className="bg-gray-50 rounded-lg p-3 text-center col-span-2 md:col-span-1">
                    <p className="text-lg font-bold text-gray-800">{stats.topDiseases[0]._id}</p>
                    <p className="text-xs text-gray-500">{t.recentActivity}</p>
                  </div>
                )}
              </div>
            )}

            {/* Alert Cards - Show top 3 */}
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  language={language}
                  expanded={expandedAlert === alert.id}
                  onToggle={() => setExpandedAlert(
                    expandedAlert === alert.id ? null : alert.id
                  )}
                />
              ))}
            </div>

            {alerts.length > 3 && (
              <button
                onClick={() => setShowPanel(true)}
                className="w-full mt-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
              >
                {language === 'si' 
                  ? `තවත් අනතුරු ඇඟවීම් ${alerts.length - 3}ක් බලන්න` 
                  : `View ${alerts.length - 3} more alerts`}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full screen panel
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">{t.title}</h2>
                <p className="text-green-100 text-sm">
                  {user?.gnDivision}, {user?.dsDivision}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPanel(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title={t.close}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-10 h-10 animate-spin text-green-600" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <p className="text-lg">{t.noAlerts}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  language={language}
                  expanded={expandedAlert === alert.id}
                  onToggle={() => setExpandedAlert(
                    expandedAlert === alert.id ? null : alert.id
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </button>
          <button
            onClick={() => setShowPanel(false)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityAlerts;
