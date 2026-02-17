import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Shield,
  CheckCircle,
  XCircle,
  Flag,
  User,
  Calendar,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Search,
  Filter,
  Clock,
  History
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Status configuration with colors and icons
const STATUS_CONFIG = {
  pending: { 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
    icon: Clock, 
    label: 'Pending',
    labelSi: 'පොරොත්තුවේ'
  },
  under_review: { 
    color: 'bg-blue-100 text-blue-800 border-blue-300', 
    icon: Eye, 
    label: 'Under Review',
    labelSi: 'සමාලෝචනය වෙමින්'
  },
  verified: { 
    color: 'bg-green-100 text-green-800 border-green-300', 
    icon: CheckCircle, 
    label: 'Verified',
    labelSi: 'සත්‍යාපිත'
  },
  rejected: { 
    color: 'bg-red-100 text-red-800 border-red-300', 
    icon: XCircle, 
    label: 'Rejected',
    labelSi: 'ප්‍රතික්ෂේප කළ'
  },
  flagged: { 
    color: 'bg-orange-100 text-orange-800 border-orange-300', 
    icon: Flag, 
    label: 'Flagged',
    labelSi: 'සලකුණු කළ'
  },
  needs_field_visit: { 
    color: 'bg-purple-100 text-purple-800 border-purple-300', 
    icon: MapPin, 
    label: 'Needs Field Visit',
    labelSi: 'ක්ෂේත්‍ර සංචාරය අවශ්‍යයි'
  }
};

// Priority configuration with colors
const PRIORITY_CONFIG = {
  emergency: { 
    color: 'bg-red-600 text-white', 
    borderColor: 'border-l-red-600',
    label: 'Emergency',
    labelSi: 'හදිසි'
  },
  high: { 
    color: 'bg-orange-500 text-white', 
    borderColor: 'border-l-orange-500',
    label: 'High',
    labelSi: 'ඉහළ'
  },
  medium: { 
    color: 'bg-yellow-500 text-white', 
    borderColor: 'border-l-yellow-500',
    label: 'Medium',
    labelSi: 'මධ්‍යම'
  },
  low: { 
    color: 'bg-blue-500 text-white', 
    borderColor: 'border-l-blue-500',
    label: 'Low',
    labelSi: 'අඩු'
  },
  info: { 
    color: 'bg-gray-500 text-white', 
    borderColor: 'border-l-gray-500',
    label: 'Info',
    labelSi: 'තොරතුරු'
  }
};

// Trust score color coding
const getTrustColor = (score) => {
  if (score >= 70) return 'text-green-600 bg-green-100';
  if (score >= 50) return 'text-yellow-600 bg-yellow-100';
  if (score >= 30) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
};

const ReportVerificationPanel = ({ user, language = 'en', onActionTaken }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedReport, setExpandedReport] = useState(null);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  const [reportHistory, setReportHistory] = useState([]);
  const [stats, setStats] = useState(null);

  const t = {
    en: {
      title: 'Report Verification',
      subtitle: 'Review and verify disease reports with full audit trail',
      loading: 'Loading reports...',
      noReports: 'No reports to review',
      all: 'All',
      pending: 'Pending',
      underReview: 'Under Review',
      verified: 'Verified',
      rejected: 'Rejected',
      flagged: 'Flagged',
      needsFieldVisit: 'Field Visit',
      search: 'Search by disease or location...',
      trustScore: 'Trust Score',
      confidence: 'AI Confidence',
      priority: 'Priority',
      actions: 'Actions',
      startReview: 'Start Review',
      verify: 'Verify',
      reject: 'Reject',
      flag: 'Flag',
      requestFieldVisit: 'Request Field Visit',
      viewHistory: 'View History',
      addNote: 'Add Note',
      reportedBy: 'Reported by',
      location: 'Location',
      reviewedBy: 'Reviewed by',
      reason: 'Reason',
      enterReason: 'Enter reason...',
      refresh: 'Refresh',
      todayReviewed: 'Reviewed Today',
      pendingCount: 'Pending Review',
      emergency: 'Emergency',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      info: 'Info'
    },
    si: {
      title: 'වාර්තා සත්‍යාපනය',
      subtitle: 'සම්පූර්ණ විගණන මාර්ගය සමඟ රෝග වාර්තා සමාලෝචනය සහ සත්‍යාපනය',
      loading: 'වාර්තා පූරණය වෙමින්...',
      noReports: 'සමාලෝචනය කිරීමට වාර්තා නැත',
      all: 'සියල්ල',
      pending: 'පොරොත්තුවේ',
      underReview: 'සමාලෝචනය වෙමින්',
      verified: 'සත්‍යාපිත',
      rejected: 'ප්‍රතික්ෂේප කළ',
      flagged: 'සලකුණු කළ',
      needsFieldVisit: 'ක්ෂේත්‍ර සංචාරය',
      search: 'රෝගය හෝ ස්ථානය අනුව සොයන්න...',
      trustScore: 'විශ්වාස ලකුණු',
      confidence: 'AI විශ්වාසය',
      priority: 'ප්‍රමුඛතාව',
      actions: 'ක්‍රියාමාර්ග',
      startReview: 'සමාලෝචනය ආරම්භ කරන්න',
      verify: 'සත්‍යාපනය',
      reject: 'ප්‍රතික්ෂේප',
      flag: 'සලකුණු',
      requestFieldVisit: 'ක්ෂේත්‍ර සංචාරය ඉල්ලන්න',
      viewHistory: 'ඉතිහාසය බලන්න',
      addNote: 'සටහනක් එක් කරන්න',
      reportedBy: 'වාර්තා කළේ',
      location: 'ස්ථානය',
      reviewedBy: 'සමාලෝචනය කළේ',
      reason: 'හේතුව',
      enterReason: 'හේතුව ඇතුළත් කරන්න...',
      refresh: 'නැවුම් කරන්න',
      todayReviewed: 'අද සමාලෝචනය කළ',
      pendingCount: 'පොරොත්තු සමාලෝචනය',
      emergency: 'හදිසි',
      high: 'ඉහළ',
      medium: 'මධ්‍යම',
      low: 'අඩු',
      info: 'තොරතුරු'
    }
  };

  const text = t[language] || t.en;
  const getToken = () => localStorage.getItem('token');

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/officer/reports`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { 
          status: filter !== 'all' ? filter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined
        }
      });
      setReports(response.data.reports || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, priorityFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/officer/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [fetchReports, fetchStats, filter, priorityFilter]);

  // Update report status
  const updateStatus = async (reportId, newStatus, reason = null) => {
    try {
      setActionLoading(reportId);
      await axios.put(
        `${API_BASE}/api/officer/reports/${reportId}/status`,
        { status: newStatus, reason },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      
      // If status is needs_field_visit, create a field visit record
      if (newStatus === 'needs_field_visit') {
        try {
          const report = reports.find(r => r._id === reportId);
          await axios.post(
            `${API_BASE}/api/officer-workflow/field-visits`,
            {
              reportId,
              purpose: `Verify disease report: ${report?.disease || 'Unknown disease'}`,
              priority: 'medium',
              instructions: reason || 'Field verification required'
            },
            { headers: { Authorization: `Bearer ${getToken()}` } }
          );
        } catch (fieldVisitError) {
          console.error('Error creating field visit:', fieldVisitError);
          // Don't fail the status update if field visit creation fails
        }
      }
      
      // Update local state
      setReports(reports.map(r => 
        r._id === reportId 
          ? { ...r, verificationStatus: newStatus, adminReviewed: true }
          : r
      ));
      
      fetchStats();
      
      // Notify parent component that an action was taken
      if (onActionTaken) {
        onActionTaken();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  // Update priority
  const updatePriority = async (reportId, newPriority) => {
    try {
      setActionLoading(reportId);
      await axios.put(
        `${API_BASE}/api/officer/reports/${reportId}/priority`,
        { priority: newPriority },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      
      setReports(reports.map(r => 
        r._id === reportId ? { ...r, priority: newPriority } : r
      ));
    } catch (err) {
      console.error('Error updating priority:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Fetch report history
  const fetchHistory = async (reportId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/officer/report/${reportId}/history`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setReportHistory(response.data.history || []);
      setShowHistory(reportId);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchTerm || 
      report.disease?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.gnDivision?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.district?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get action type label
  const getActionLabel = (actionType) => {
    const labels = {
      verify_report: 'Verified',
      reject_report: 'Rejected',
      flag_report: 'Flagged',
      request_field_visit: 'Requested Field Visit',
      start_review: 'Started Review',
      add_note: 'Added Note',
      update_priority: 'Updated Priority'
    };
    return labels[actionType] || actionType;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              {text.title}
            </h2>
            <p className="text-indigo-200 text-sm mt-1">{text.subtitle}</p>
          </div>
          <button
            onClick={() => { fetchReports(); fetchStats(); }}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title={text.refresh}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.pendingCount || 0}</div>
              <div className="text-xs text-indigo-200">{text.pendingCount}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.reviewedToday || 0}</div>
              <div className="text-xs text-indigo-200">{text.todayReviewed}</div>
            </div>
            {['emergency', 'high', 'medium'].map(priority => (
              <div key={priority} className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">
                  {stats.priorityBreakdown?.[priority] || 0}
                </div>
                <div className="text-xs text-indigo-200 capitalize">{text[priority]}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={text.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{text.all}</option>
            <option value="pending">{text.pending}</option>
            <option value="under_review">{text.underReview}</option>
            <option value="flagged">{text.flagged}</option>
            <option value="needs_field_visit">{text.needsFieldVisit}</option>
            <option value="verified">{text.verified}</option>
            <option value="rejected">{text.rejected}</option>
          </select>
        </div>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">{text.priority}: {text.all}</option>
          <option value="emergency">{text.emergency}</option>
          <option value="high">{text.high}</option>
          <option value="medium">{text.medium}</option>
          <option value="low">{text.low}</option>
          <option value="info">{text.info}</option>
        </select>
      </div>

      {/* Reports List */}
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            {text.loading}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
            {text.noReports}
          </div>
        ) : (
          filteredReports.map(report => {
            const isExpanded = expandedReport === report._id;
            const statusConfig = STATUS_CONFIG[report.verificationStatus] || STATUS_CONFIG.pending;
            const priorityConfig = PRIORITY_CONFIG[report.priority] || PRIORITY_CONFIG.medium;
            const StatusIcon = statusConfig.icon;

            return (
              <div 
                key={report._id} 
                className={`hover:bg-gray-50 transition-colors border-l-4 ${priorityConfig.borderColor}`}
              >
                {/* Report Summary Row */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedReport(isExpanded ? null : report._id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Priority Badge */}
                    <div className={`px-2 py-1 rounded text-xs font-bold ${priorityConfig.color}`}>
                      {language === 'si' ? priorityConfig.labelSi : priorityConfig.label}
                    </div>

                    {/* Status Badge */}
                    <div className={`p-2 rounded-lg border ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>

                    {/* Disease & Location */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800">{report.disease}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                          {language === 'si' ? statusConfig.labelSi : statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {report.gnDivision}, {report.district}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(report.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Trust Score */}
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getTrustColor(report.trustScore)}`}>
                      {report.trustScore}%
                    </div>

                    {/* AI Confidence */}
                    <div className="text-center hidden md:block">
                      <div className="text-lg font-bold text-gray-700">
                        {Math.round((report.confidence || 0) * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">{text.confidence}</div>
                    </div>

                    {/* Expand Toggle */}
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-gray-50 border-t">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                      <div className="bg-white p-3 rounded-lg border">
                        <div className="text-xs text-gray-500 mb-1">{text.reportedBy}</div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{report.farmerUsername || 'Anonymous'}</span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border">
                        <div className="text-xs text-gray-500 mb-1">Severity</div>
                        <div className={`font-bold capitalize ${
                          report.severity === 'high' || report.severity === 'critical' 
                            ? 'text-red-600' 
                            : report.severity === 'medium' 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
                        }`}>
                          {report.severity || 'Unknown'}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border">
                        <div className="text-xs text-gray-500 mb-1">Confirmations</div>
                        <div className="font-bold text-lg">{report.communityConfirmations || 0}</div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border">
                        <div className="text-xs text-gray-500 mb-1">{text.priority}</div>
                        <select
                          value={report.priority || 'medium'}
                          onChange={(e) => updatePriority(report._id, e.target.value)}
                          disabled={actionLoading === report._id}
                          className="w-full px-2 py-1 border rounded text-sm font-medium"
                        >
                          <option value="emergency">{text.emergency}</option>
                          <option value="high">{text.high}</option>
                          <option value="medium">{text.medium}</option>
                          <option value="low">{text.low}</option>
                          <option value="info">{text.info}</option>
                        </select>
                      </div>
                    </div>

                    {/* Flag Reason if exists */}
                    {report.flaggedReason && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                        <div className="text-xs text-orange-600 font-medium mb-1">{text.reason}</div>
                        <p className="text-sm text-orange-800">{report.flaggedReason}</p>
                      </div>
                    )}

                    {/* Review info if reviewed */}
                    {report.adminReviewed && report.reviewedBy && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="text-xs text-blue-600 font-medium mb-1">{text.reviewedBy}</div>
                        <p className="text-sm text-blue-800">
                          {report.reviewedBy} • {report.reviewedAt ? formatDate(report.reviewedAt) : 'N/A'}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {/* Start Review - only for pending */}
                      {report.verificationStatus === 'pending' && (
                        <button
                          onClick={() => updateStatus(report._id, 'under_review')}
                          disabled={actionLoading === report._id}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Eye className="w-4 h-4" />
                          {text.startReview}
                        </button>
                      )}

                      {/* Verify */}
                      {['pending', 'under_review', 'flagged', 'needs_field_visit'].includes(report.verificationStatus) && (
                        <button
                          onClick={() => updateStatus(report._id, 'verified')}
                          disabled={actionLoading === report._id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {text.verify}
                        </button>
                      )}

                      {/* Reject */}
                      {['pending', 'under_review', 'flagged'].includes(report.verificationStatus) && (
                        <button
                          onClick={() => {
                            const reason = prompt(text.enterReason);
                            if (reason) updateStatus(report._id, 'rejected', reason);
                          }}
                          disabled={actionLoading === report._id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          {text.reject}
                        </button>
                      )}

                      {/* Flag */}
                      {['pending', 'under_review'].includes(report.verificationStatus) && (
                        <button
                          onClick={() => {
                            const reason = prompt(text.enterReason);
                            if (reason) updateStatus(report._id, 'flagged', reason);
                          }}
                          disabled={actionLoading === report._id}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                        >
                          <Flag className="w-4 h-4" />
                          {text.flag}
                        </button>
                      )}

                      {/* Request Field Visit */}
                      {['pending', 'under_review', 'flagged'].includes(report.verificationStatus) && (
                        <button
                          onClick={() => updateStatus(report._id, 'needs_field_visit')}
                          disabled={actionLoading === report._id}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                          <MapPin className="w-4 h-4" />
                          {text.requestFieldVisit}
                        </button>
                      )}

                      {/* View History */}
                      <button
                        onClick={() => fetchHistory(report._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        {text.viewHistory}
                      </button>
                    </div>

                    {/* History Panel */}
                    {showHistory === report._id && reportHistory.length > 0 && (
                      <div className="mt-4 bg-white border rounded-lg p-4">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <History className="w-4 h-4" />
                          Action History
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {reportHistory.map((log, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm border-l-2 border-indigo-200 pl-3 py-1">
                              <div className="flex-1">
                                <span className="font-medium text-indigo-600">
                                  {getActionLabel(log.actionType)}
                                </span>
                                {log.previousStatus && log.newStatus && (
                                  <span className="text-gray-500">
                                    {' '}({log.previousStatus} → {log.newStatus})
                                  </span>
                                )}
                                {log.notes && (
                                  <p className="text-gray-600 text-xs mt-1">"{log.notes}"</p>
                                )}
                              </div>
                              <div className="text-right text-xs text-gray-500">
                                <div>{log.officerUsername}</div>
                                <div>{formatDate(log.createdAt)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReportVerificationPanel;
