import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  History,
  RefreshCw,
  Filter,
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Flag,
  Eye,
  MapPin,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Action type configuration
const ACTION_CONFIG = {
  verify_report: { 
    icon: CheckCircle, 
    color: 'text-green-600 bg-green-100',
    label: 'Verified Report',
    labelSi: 'වාර්තාව සත්‍යාපනය කළා'
  },
  reject_report: { 
    icon: XCircle, 
    color: 'text-red-600 bg-red-100',
    label: 'Rejected Report',
    labelSi: 'වාර්තාව ප්‍රතික්ෂේප කළා'
  },
  flag_report: { 
    icon: Flag, 
    color: 'text-orange-600 bg-orange-100',
    label: 'Flagged Report',
    labelSi: 'වාර්තාව සලකුණු කළා'
  },
  request_field_visit: { 
    icon: MapPin, 
    color: 'text-purple-600 bg-purple-100',
    label: 'Requested Field Visit',
    labelSi: 'ක්ෂේත්‍ර සංචාරය ඉල්ලා සිටියා'
  },
  start_review: { 
    icon: Eye, 
    color: 'text-blue-600 bg-blue-100',
    label: 'Started Review',
    labelSi: 'සමාලෝචනය ආරම්භ කළා'
  },
  resolve_alert: { 
    icon: CheckCircle, 
    color: 'text-teal-600 bg-teal-100',
    label: 'Resolved Alert',
    labelSi: 'අනතුරු ඇඟවීම විසඳා ඇත'
  },
  escalate_alert: { 
    icon: AlertTriangle, 
    color: 'text-red-600 bg-red-100',
    label: 'Escalated Alert',
    labelSi: 'අනතුරු ඇඟවීම උත්සන්න කළා'
  },
  add_note: { 
    icon: FileText, 
    color: 'text-gray-600 bg-gray-100',
    label: 'Added Note',
    labelSi: 'සටහනක් එක් කළා'
  },
  update_priority: { 
    icon: AlertTriangle, 
    color: 'text-yellow-600 bg-yellow-100',
    label: 'Updated Priority',
    labelSi: 'ප්‍රමුඛතාව යාවත්කාලීන කළා'
  }
};

const OfficerActionLogs = ({ user, language = 'en', refreshTrigger = 0 }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [days, setDays] = useState(7);
  const [expandedLog, setExpandedLog] = useState(null);

  const t = {
    en: {
      title: 'Officer Action Logs',
      subtitle: 'Complete audit trail of all officer actions',
      loading: 'Loading logs...',
      noLogs: 'No actions recorded',
      all: 'All Actions',
      verifications: 'Verifications',
      rejections: 'Rejections',
      flags: 'Flags',
      fieldVisits: 'Field Visits',
      notes: 'Notes',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      officer: 'Officer',
      action: 'Action',
      target: 'Target',
      timestamp: 'Timestamp',
      details: 'Details',
      previousStatus: 'Previous Status',
      newStatus: 'New Status',
      reason: 'Reason',
      notesLabel: 'Notes',
      refresh: 'Refresh',
      totalActions: 'Total Actions',
      todayActions: 'Today'
    },
    si: {
      title: 'නිලධාරී ක්‍රියාමාර්ග ලොග්',
      subtitle: 'සියලුම නිලධාරී ක්‍රියාමාර්ගවල සම්පූර්ණ විගණන මාර්ගය',
      loading: 'ලොග් පූරණය වෙමින්...',
      noLogs: 'ක්‍රියාමාර්ග වාර්තා කර නැත',
      all: 'සියලු ක්‍රියාමාර්ග',
      verifications: 'සත්‍යාපන',
      rejections: 'ප්‍රතික්ෂේප',
      flags: 'සලකුණු',
      fieldVisits: 'ක්ෂේත්‍ර සංචාර',
      notes: 'සටහන්',
      last7Days: 'පසුගිය දින 7',
      last30Days: 'පසුගිය දින 30',
      last90Days: 'පසුගිය දින 90',
      officer: 'නිලධාරී',
      action: 'ක්‍රියාමාර්ගය',
      target: 'ඉලක්කය',
      timestamp: 'කාල මුද්‍රාව',
      details: 'විස්තර',
      previousStatus: 'පෙර තත්ත්වය',
      newStatus: 'නව තත්ත්වය',
      reason: 'හේතුව',
      notesLabel: 'සටහන්',
      refresh: 'නැවුම් කරන්න',
      totalActions: 'මුළු ක්‍රියාමාර්ග',
      todayActions: 'අද'
    }
  };

  const text = t[language] || t.en;
  const getToken = () => localStorage.getItem('token');

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { days };
      
      if (filter !== 'all') {
        params.actionType = filter;
      }
      
      const response = await axios.get(`${API_BASE}/api/officer/action-logs`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params
      });
      setLogs(response.data.logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [days, filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, filter, days, refreshTrigger]);

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Get today's count
  const todayCount = logs.filter(log => {
    const logDate = new Date(log.createdAt);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }).length;

  // Group logs by date
  const groupedLogs = logs.reduce((groups, log) => {
    const date = new Date(log.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {});

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <History className="w-6 h-6" />
              {text.title}
            </h2>
            <p className="text-slate-300 text-sm mt-1">{text.subtitle}</p>
          </div>
          <button
            onClick={fetchLogs}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title={text.refresh}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{logs.length}</div>
            <div className="text-xs text-slate-300">{text.totalActions}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{todayCount}</div>
            <div className="text-xs text-slate-300">{text.todayActions}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-3 items-center">
        {/* Action Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-slate-500"
          >
            <option value="all">{text.all}</option>
            <option value="verify_report">{text.verifications}</option>
            <option value="reject_report">{text.rejections}</option>
            <option value="flag_report">{text.flags}</option>
            <option value="request_field_visit">{text.fieldVisits}</option>
            <option value="add_note">{text.notesLabel}</option>
          </select>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-slate-500"
          >
            <option value={7}>{text.last7Days}</option>
            <option value={30}>{text.last30Days}</option>
            <option value={90}>{text.last90Days}</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            {text.loading}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <History className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            {text.noLogs}
          </div>
        ) : (
          Object.entries(groupedLogs).map(([date, dateLogs]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="sticky top-0 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 border-b">
                {date}
              </div>
              
              {/* Logs for this date */}
              <div className="divide-y">
                {dateLogs.map((log, idx) => {
                  const config = ACTION_CONFIG[log.actionType] || ACTION_CONFIG.add_note;
                  const ActionIcon = config.icon;
                  const isExpanded = expandedLog === log._id;

                  return (
                    <div 
                      key={log._id || idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <div 
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedLog(isExpanded ? null : log._id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Action Icon */}
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <ActionIcon className="w-4 h-4" />
                          </div>

                          {/* Action Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">
                                {language === 'si' ? config.labelSi : config.label}
                              </span>
                              {log.previousStatus && log.newStatus && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  {log.previousStatus} → {log.newStatus}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {log.officerUsername}
                              </span>
                              {log.officerDistrict && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {log.officerDistrict}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Timestamp */}
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-600">
                              {formatDate(log.createdAt)}
                            </div>
                            <div className="text-xs text-gray-400">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(log.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>

                          {/* Expand Toggle */}
                          <div className="text-gray-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 bg-gray-50 border-t">
                          <div className="grid grid-cols-2 gap-4 py-3">
                            {log.previousStatus && (
                              <div className="bg-white p-3 rounded-lg border">
                                <div className="text-xs text-gray-500 mb-1">{text.previousStatus}</div>
                                <div className="font-medium capitalize">{log.previousStatus}</div>
                              </div>
                            )}
                            {log.newStatus && (
                              <div className="bg-white p-3 rounded-lg border">
                                <div className="text-xs text-gray-500 mb-1">{text.newStatus}</div>
                                <div className="font-medium capitalize">{log.newStatus}</div>
                              </div>
                            )}
                          </div>
                          
                          {log.reason && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                              <div className="text-xs text-orange-600 font-medium mb-1">{text.reason}</div>
                              <p className="text-sm text-orange-800">{log.reason}</p>
                            </div>
                          )}
                          
                          {log.notes && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="text-xs text-blue-600 font-medium mb-1">{text.notesLabel}</div>
                              <p className="text-sm text-blue-800">{log.notes}</p>
                            </div>
                          )}

                          <div className="mt-3 text-xs text-gray-400">
                            Target ID: {log.targetId} • Type: {log.targetType}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OfficerActionLogs;
