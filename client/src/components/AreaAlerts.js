import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AlertTriangle, Bell, MapPin, Calendar, User, Loader2, Eye,
  Shield, Activity, Leaf, Wind
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AreaAlerts = ({ lang, user }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const t = {
    en: {
      title: 'Area Alerts',
      subtitle: 'Disease and pest alerts verified by government officers in your area',
      noAlerts: 'No active alerts in your area',
      alertsCount: 'active alerts',
      from: 'Published by',
      location: 'Location',
      published: 'Published',
      type: 'Alert Type',
      severity: 'Severity',
      problem: 'Original Problem',
      recommendations: 'Recommendations',
      preventive: 'Preventive Measures',
      treatment: 'Treatment Information',
      close: 'Close',
      contactOfficer: 'Contact Officer',
      viewDetails: 'View Details',
      expires: 'Alert expires',
      active: 'Active',
      low: 'Low Risk',
      medium: 'Medium Risk',
      high: 'High Risk',
      critical: 'Critical'
    },
    si: {
      title: 'ප්‍රදේශ අනතුරු අවඝඝවීම්',
      subtitle: 'ඔබගේ ප්‍රදේශයේ රජයේ නිලධාරීන් විසින් සත්‍යාපිත රෝග සහ කීට අනතුරු අවඝඝවීම්',
      noAlerts: 'ඔබගේ ප්‍රදේශයේ සක්‍රිය අනතුරු අවඝඝවීම් නොමැත',
      alertsCount: 'සක්‍රිය අනතුරු අවඝඝවීම්',
      from: 'විසින් ප්‍රකාශිතයි',
      location: 'ස්ථානය',
      published: 'ප්‍රකාශිතයි',
      type: 'අනතුරු ඇඟවීම් වර්ගය',
      severity: 'බරපතැකම',
      problem: 'මුල් ගැටළුව',
      recommendations: 'නිර්දේශන',
      preventive: 'කෙරුවැඩි ක්‍රම',
      treatment: 'ප්‍රතිකර තොරතුරු',
      close: 'වසන්න',
      contactOfficer: 'නිලධාරීට සම්බන්ධ වන්න',
      viewDetails: 'විස්තර බලන්න',
      expires: 'අනතුරු අවඝඝවීම් කල් ඉකුත් වේ',
      active: 'සක්‍රිය',
      low: 'අඩු අවදානම',
      medium: 'මධ්‍යම අවදානම',
      high: 'ඉහල අවදානම',
      critical: 'සමාලෝචනීය'
    }
  };

  const text = t[lang] || t.en;

  useEffect(() => {
    if (user && user.role === 'farmer') {
      fetchAreaAlerts();
    }
  }, [user]);

  const fetchAreaAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/reports/alerts/my-area`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAlerts(response.data.alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return { bg: 'bg-red-50', border: 'border-red-300', icon: '🔴🔴', label: text.critical, color: 'text-red-700' };
      case 'high':
        return { bg: 'bg-orange-50', border: 'border-orange-300', icon: '🔴', label: text.high, color: 'text-orange-700' };
      case 'medium':
        return { bg: 'bg-yellow-50', border: 'border-yellow-300', icon: '🟡', label: text.medium, color: 'text-yellow-700' };
      case 'low':
        return { bg: 'bg-green-50', border: 'border-green-300', icon: '🟢', label: text.low, color: 'text-green-700' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-300', icon: '⚪', label: 'Unknown', color: 'text-gray-700' };
    }
  };

  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'disease':
        return <AlertTriangle className="h-5 w-5" />;
      case 'pest':
        return <Activity className="h-5 w-5" />;
      case 'weather':
        return <Wind className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(lang === 'si' ? 'si-LK' : 'en-LK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (user?.role !== 'farmer') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{lang === 'en' ? 'Only farmers can view area alerts' : 'ගොවීන් පමණක් ප්‍රදේශ අනතුරු අවඝඝවීම් බැලිය හැක'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Bell className="h-10 w-10 text-amber-500" />
            {text.title}
          </h1>
          <p className="text-gray-600">{text.subtitle}</p>
        </div>

        {/* Alerts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{text.noAlerts}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-gray-700 font-medium">
                {alerts.length} {text.alertsCount}
              </span>
            </div>

            <div className="grid gap-6">
              {alerts.map((alert) => {
                const style = getSeverityStyle(alert.severity);
                return (
                  <div
                    key={alert._id}
                    className={`${style.bg} rounded-2xl shadow-md hover:shadow-lg transition-all p-6 border-l-4 ${style.border} cursor-pointer`}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-white rounded-lg">
                            {getAlertTypeIcon(alert.alert_type)}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{alert.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 bg-white rounded-full text-xs font-semibold ${style.color}`}>
                                {style.icon} {style.label}
                              </span>
                              <span className="px-2 py-1 bg-white rounded-full text-xs font-semibold text-green-700">
                                ✓ {text.active}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4">{alert.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User size={16} />
                            <span>{alert.publishedBy?.fullName || 'Officer'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin size={16} />
                            <span>{alert.gnDivision}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar size={16} />
                            <span>{formatDate(alert.publishedDate)}</span>
                          </div>
                          {alert.expiresAt && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock size={16} />
                              <span>{text.expires} {formatDate(alert.expiresAt)}</span>
                            </div>
                          )}
                        </div>

                        {alert.originalProblem && (
                          <div className="mt-3 p-3 bg-white rounded-lg text-sm">
                            <span className="font-semibold text-gray-700">{text.problem}:</span>
                            <span className="text-gray-600 ml-2">{alert.originalProblem}</span>
                          </div>
                        )}
                      </div>

                      <button className="ml-4 p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors">
                        <Eye className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Alert Details Modal */}
        {selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b flex items-center justify-between p-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedAlert.title}</h2>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Alert Details */}
                <div className="space-y-3">
                  <p className="text-gray-700">{selectedAlert.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">{text.from}</p>
                      <p className="font-semibold text-gray-900">{selectedAlert.publishedBy?.fullName}</p>
                      <p className="text-gray-600 text-xs mt-1">{selectedAlert.publishedBy?.designation}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase tracking-wider text-xs mb-1">{text.severity}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getSeverityStyle(selectedAlert.severity).icon}</span>
                        <span className="font-semibold text-gray-900">{getSeverityStyle(selectedAlert.severity).label}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Problem Details */}
                {selectedAlert.originalProblem && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">{text.problem}</p>
                    <p className="text-gray-900 font-medium">{selectedAlert.originalProblem}</p>
                  </div>
                )}

                {/* Recommendations */}
                {selectedAlert.recommendations && selectedAlert.recommendations.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Shield size={16} />
                      {text.recommendations}
                    </p>
                    <ul className="space-y-2">
                      {selectedAlert.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm">
                          <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                            ✓
                          </span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Preventive Measures */}
                {selectedAlert.preventiveMeasures && selectedAlert.preventiveMeasures.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Leaf size={16} />
                      {text.preventive}
                    </p>
                    <ul className="space-y-2">
                      {selectedAlert.preventiveMeasures.map((measure, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm">
                          <span className="flex-shrink-0 text-blue-500 mt-0.5">→</span>
                          <span>{measure}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Treatment Information */}
                {selectedAlert.treatment && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <p className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-2">{text.treatment}</p>
                    <p className="text-gray-700">{selectedAlert.treatment}</p>
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="w-full bg-gray-200 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  {text.close}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add Clock icon if not imported
const Clock = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export default AreaAlerts;
