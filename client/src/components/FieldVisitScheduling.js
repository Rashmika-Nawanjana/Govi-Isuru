import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MapPin,
  Calendar,
  Clock,
  RefreshCw,
  Plus,
  Camera,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  Navigation,
  ClipboardList
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Status configuration
const STATUS_CONFIG = {
  scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled', labelSi: 'නියමිත' },
  in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress', labelSi: 'ප්‍රගතියේ' },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed', labelSi: 'සම්පූර්ණයි' },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', labelSi: 'අවලංගුයි' },
  postponed: { color: 'bg-gray-100 text-gray-800', label: 'Postponed', labelSi: 'කල් දමා ඇත' }
};

// Priority configuration
const PRIORITY_CONFIG = {
  low: { color: 'bg-gray-500', label: 'Low', labelSi: 'අඩු' },
  medium: { color: 'bg-blue-500', label: 'Medium', labelSi: 'මධ්‍යම' },
  high: { color: 'bg-orange-500', label: 'High', labelSi: 'ඉහළ' },
  urgent: { color: 'bg-red-500', label: 'Urgent', labelSi: 'හදිසි' }
};

const FieldVisitScheduling = ({ user, language = 'en' }) => {
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedVisit, setExpandedVisit] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showAddNote, setShowAddNote] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [showFindings, setShowFindings] = useState(null);
  const [findings, setFindings] = useState({
    diseaseConfirmed: null,
    severity: '',
    affectedArea: '',
    farmerContacted: false,
    recommendedActions: ''
  });

  const t = {
    en: {
      title: 'Field Visit Scheduling',
      subtitle: 'Manage and track field visits for report verification',
      loading: 'Loading field visits...',
      noVisits: 'No field visits scheduled',
      scheduled: 'Scheduled',
      inProgress: 'In Progress',
      completed: 'Completed',
      pending: 'Pending',
      total: 'Total',
      all: 'All',
      purpose: 'Purpose',
      instructions: 'Instructions',
      scheduledDate: 'Scheduled Date',
      requestedBy: 'Requested By',
      assignedTo: 'Assigned To',
      visitNotes: 'Visit Notes',
      addNote: 'Add Note',
      photos: 'Photos',
      findings: 'Findings',
      recordFindings: 'Record Findings',
      diseaseConfirmed: 'Disease Confirmed',
      severity: 'Severity',
      affectedArea: 'Affected Area',
      farmerContacted: 'Farmer Contacted',
      recommendedActions: 'Recommended Actions',
      save: 'Save',
      cancel: 'Cancel',
      startVisit: 'Start Visit',
      completeVisit: 'Complete Visit',
      cancelVisit: 'Cancel Visit',
      yes: 'Yes',
      no: 'No',
      notSet: 'Not Set'
    },
    si: {
      title: 'ක්ෂේත්‍ර සංචාර කාලසටහන',
      subtitle: 'වාර්තා සත්‍යාපනය සඳහා ක්ෂේත්‍ර සංචාර කළමනාකරණය සහ නිරීක්ෂණය',
      loading: 'ක්ෂේත්‍ර සංචාර පූරණය වෙමින්...',
      noVisits: 'ක්ෂේත්‍ර සංචාර නියමිත නැත',
      scheduled: 'නියමිත',
      inProgress: 'ප්‍රගතියේ',
      completed: 'සම්පූර්ණයි',
      pending: 'පොරොත්තුවේ',
      total: 'මුළු',
      all: 'සියල්ල',
      purpose: 'අරමුණ',
      instructions: 'උපදෙස්',
      scheduledDate: 'නියමිත දිනය',
      requestedBy: 'ඉල්ලා ඇත්තේ',
      assignedTo: 'පවරා ඇත්තේ',
      visitNotes: 'සංචාර සටහන්',
      addNote: 'සටහනක් එක් කරන්න',
      photos: 'ඡායාරූප',
      findings: 'සොයාගැනීම්',
      recordFindings: 'සොයාගැනීම් වාර්තා කරන්න',
      diseaseConfirmed: 'රෝගය තහවුරු කළා',
      severity: 'බරපතලකම',
      affectedArea: 'බලපෑමට ලක්වූ ප්‍රදේශය',
      farmerContacted: 'ගොවියා සම්බන්ධ කර ගත්තා',
      recommendedActions: 'නිර්දේශිත ක්‍රියාමාර්ග',
      save: 'සුරකින්න',
      cancel: 'අවලංගු කරන්න',
      startVisit: 'සංචාරය ආරම්භ කරන්න',
      completeVisit: 'සංචාරය සම්පූර්ණ කරන්න',
      cancelVisit: 'සංචාරය අවලංගු කරන්න',
      yes: 'ඔව්',
      no: 'නැත',
      notSet: 'සකසා නැත'
    }
  };

  const text = t[language] || t.en;
  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [visitsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/officer-workflow/field-visits`, {
          headers: { Authorization: `Bearer ${getToken()}` },
          params: { status: filter !== 'all' ? filter : undefined }
        }),
        axios.get(`${API_BASE}/api/officer-workflow/field-visit-stats`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
      ]);

      setVisits(visitsRes.data.visits || []);
      setStats(statsRes.data.stats);
    } catch (err) {
      console.error('Error fetching field visits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const updateStatus = async (visitId, status) => {
    try {
      await axios.put(
        `${API_BASE}/api/officer-workflow/field-visits/${visitId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const addNote = async (visitId) => {
    if (!newNote.trim()) return;
    
    try {
      await axios.post(
        `${API_BASE}/api/officer-workflow/field-visits/${visitId}/notes`,
        { note: newNote },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setNewNote('');
      setShowAddNote(null);
      fetchData();
    } catch (err) {
      console.error('Error adding note:', err);
      alert(err.response?.data?.error || 'Failed to add note');
    }
  };

  const saveFindings = async (visitId) => {
    try {
      await axios.put(
        `${API_BASE}/api/officer-workflow/field-visits/${visitId}/findings`,
        findings,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setShowFindings(null);
      setFindings({
        diseaseConfirmed: null,
        severity: '',
        affectedArea: '',
        farmerContacted: false,
        recommendedActions: ''
      });
      fetchData();
    } catch (err) {
      console.error('Error saving findings:', err);
      alert(err.response?.data?.error || 'Failed to save findings');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-teal-600" />
        <p className="text-gray-600">{text.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Navigation className="w-6 h-6" />
              {text.title}
            </h2>
            <p className="text-teal-200 text-sm mt-1">{text.subtitle}</p>
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-teal-200">{text.total}</div>
            </div>
            <div className="bg-blue-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.scheduled}</div>
              <div className="text-xs text-teal-200">{text.scheduled}</div>
            </div>
            <div className="bg-yellow-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.in_progress}</div>
              <div className="text-xs text-teal-200">{text.inProgress}</div>
            </div>
            <div className="bg-green-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-xs text-teal-200">{text.completed}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-xs text-teal-200">{text.pending}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm p-2 flex flex-wrap gap-2">
        {['all', 'scheduled', 'in_progress', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === status
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status === 'all' ? text.all : STATUS_CONFIG[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Visits List */}
      {visits.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600">{text.noVisits}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => {
            const statusConfig = STATUS_CONFIG[visit.status] || STATUS_CONFIG.scheduled;
            const priorityConfig = PRIORITY_CONFIG[visit.priority] || PRIORITY_CONFIG.medium;
            const isExpanded = expandedVisit === visit._id;

            return (
              <div 
                key={visit._id}
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
              >
                {/* Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedVisit(isExpanded ? null : visit._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${priorityConfig.color}`}>
                          {language === 'si' ? priorityConfig.labelSi : priorityConfig.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                          {language === 'si' ? statusConfig.labelSi : statusConfig.label}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-800">{visit.purpose}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {visit.gnDivision}, {visit.district}
                        </span>
                        {visit.scheduledDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(visit.scheduledDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronUp /> : <ChevronDown />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{text.requestedBy}</p>
                        <p className="text-sm text-gray-800">{visit.requestedByUsername}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{text.assignedTo}</p>
                        <p className="text-sm text-gray-800">{visit.assignedToUsername || text.notSet}</p>
                      </div>
                      {visit.instructions && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500 font-medium">{text.instructions}</p>
                          <p className="text-sm text-gray-800">{visit.instructions}</p>
                        </div>
                      )}
                    </div>

                    {/* Visit Notes */}
                    {visit.visitNotes && visit.visitNotes.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 font-medium mb-2">{text.visitNotes}</p>
                        <div className="space-y-2">
                          {visit.visitNotes.map((note, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                              <p className="text-sm text-gray-800">{note.note}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {note.addedBy} • {new Date(note.addedAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Note Form */}
                    {showAddNote === visit._id ? (
                      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Enter your note..."
                          className="w-full p-2 border rounded-lg text-sm resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => addNote(visit._id)}
                            className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                          >
                            {text.save}
                          </button>
                          <button
                            onClick={() => { setShowAddNote(null); setNewNote(''); }}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                          >
                            {text.cancel}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Findings Form */}
                    {showFindings === visit._id ? (
                      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                        <h5 className="font-bold text-gray-800 mb-3">{text.recordFindings}</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-gray-600">{text.diseaseConfirmed}</label>
                            <div className="flex gap-3 mt-1">
                              <button
                                onClick={() => setFindings({...findings, diseaseConfirmed: true})}
                                className={`px-4 py-2 rounded-lg text-sm ${
                                  findings.diseaseConfirmed === true 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {text.yes}
                              </button>
                              <button
                                onClick={() => setFindings({...findings, diseaseConfirmed: false})}
                                className={`px-4 py-2 rounded-lg text-sm ${
                                  findings.diseaseConfirmed === false 
                                    ? 'bg-red-600 text-white' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {text.no}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">{text.severity}</label>
                            <select
                              value={findings.severity}
                              onChange={(e) => setFindings({...findings, severity: e.target.value})}
                              className="w-full mt-1 p-2 border rounded-lg text-sm"
                            >
                              <option value="">Select...</option>
                              <option value="none">None</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">{text.affectedArea}</label>
                            <input
                              type="text"
                              value={findings.affectedArea}
                              onChange={(e) => setFindings({...findings, affectedArea: e.target.value})}
                              className="w-full mt-1 p-2 border rounded-lg text-sm"
                              placeholder="e.g., 2 acres"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                              <input
                                type="checkbox"
                                checked={findings.farmerContacted}
                                onChange={(e) => setFindings({...findings, farmerContacted: e.target.checked})}
                              />
                              {text.farmerContacted}
                            </label>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">{text.recommendedActions}</label>
                            <textarea
                              value={findings.recommendedActions}
                              onChange={(e) => setFindings({...findings, recommendedActions: e.target.value})}
                              className="w-full mt-1 p-2 border rounded-lg text-sm resize-none"
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveFindings(visit._id)}
                              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                            >
                              {text.save}
                            </button>
                            <button
                              onClick={() => setShowFindings(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                            >
                              {text.cancel}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Existing Findings Display */}
                    {visit.findings && visit.findings.diseaseConfirmed !== null && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="font-bold text-blue-800 mb-2">{text.findings}</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-blue-600">{text.diseaseConfirmed}:</span>{' '}
                            <span className={visit.findings.diseaseConfirmed ? 'text-red-600' : 'text-green-600'}>
                              {visit.findings.diseaseConfirmed ? text.yes : text.no}
                            </span>
                          </div>
                          {visit.findings.severity && (
                            <div>
                              <span className="text-blue-600">{text.severity}:</span>{' '}
                              <span className="text-gray-800">{visit.findings.severity}</span>
                            </div>
                          )}
                          {visit.findings.affectedArea && (
                            <div>
                              <span className="text-blue-600">{text.affectedArea}:</span>{' '}
                              <span className="text-gray-800">{visit.findings.affectedArea}</span>
                            </div>
                          )}
                        </div>
                        {visit.findings.recommendedActions && (
                          <div className="mt-2">
                            <span className="text-blue-600">{text.recommendedActions}:</span>
                            <p className="text-gray-800">{visit.findings.recommendedActions}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {visit.status === 'scheduled' && (
                        <button
                          onClick={() => updateStatus(visit._id, 'in_progress')}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
                        >
                          <Clock className="w-4 h-4" />
                          {text.startVisit}
                        </button>
                      )}
                      
                      {visit.status === 'in_progress' && (
                        <>
                          <button
                            onClick={() => setShowFindings(visit._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                          >
                            <ClipboardList className="w-4 h-4" />
                            {text.recordFindings}
                          </button>
                          <button
                            onClick={() => updateStatus(visit._id, 'completed')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {text.completeVisit}
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => setShowAddNote(visit._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                      >
                        <FileText className="w-4 h-4" />
                        {text.addNote}
                      </button>
                      
                      {['scheduled', 'in_progress'].includes(visit.status) && (
                        <button
                          onClick={() => updateStatus(visit._id, 'cancelled')}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                          {text.cancelVisit}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FieldVisitScheduling;
