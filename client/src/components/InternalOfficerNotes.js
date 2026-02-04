import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MessageSquare,
  Flag,
  AlertTriangle,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  AlertOctagon,
  FileText
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Note type configuration
const NOTE_TYPE_CONFIG = {
  general: { color: 'bg-gray-100 text-gray-800', icon: MessageSquare, label: 'General', labelSi: 'සාමාන්‍ය' },
  warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Warning', labelSi: 'අනතුරු ඇඟවීම' },
  flag: { color: 'bg-red-100 text-red-800', icon: Flag, label: 'Flag', labelSi: 'ධජය' },
  follow_up: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Follow Up', labelSi: 'පසු විපරම' },
  coordination: { color: 'bg-purple-100 text-purple-800', icon: User, label: 'Coordination', labelSi: 'සම්බන්ධීකරණය' },
  abuse_report: { color: 'bg-orange-100 text-orange-800', icon: AlertOctagon, label: 'Abuse Report', labelSi: 'අපයෝජන වාර්තාව' }
};

// Flag configuration
const FLAG_CONFIG = {
  repeat_offender: { color: 'bg-red-600', label: 'Repeat Offender', labelSi: 'නැවත නැවත වැරදිකරු' },
  false_reports: { color: 'bg-orange-600', label: 'False Reports', labelSi: 'ව්‍යාජ වාර්තා' },
  suspicious_activity: { color: 'bg-yellow-600', label: 'Suspicious Activity', labelSi: 'සැක සහිත ක්‍රියාකාරකම්' },
  needs_verification: { color: 'bg-blue-600', label: 'Needs Verification', labelSi: 'සත්‍යාපනය අවශ්‍යයි' },
  high_priority: { color: 'bg-purple-600', label: 'High Priority', labelSi: 'ඉහළ ප්‍රමුඛතාව' },
  follow_up_required: { color: 'bg-indigo-600', label: 'Follow Up Required', labelSi: 'පසු විපරම අවශ්‍යයි' },
  abuse_suspected: { color: 'bg-red-700', label: 'Abuse Suspected', labelSi: 'අපයෝජනය සැක කෙරේ' },
  trusted_source: { color: 'bg-green-600', label: 'Trusted Source', labelSi: 'විශ්වාසනීය මූලාශ්‍රය' },
  new_farmer: { color: 'bg-teal-600', label: 'New Farmer', labelSi: 'නව ගොවියා' },
  coordination_needed: { color: 'bg-pink-600', label: 'Coordination Needed', labelSi: 'සම්බන්ධීකරණය අවශ්‍යයි' }
};

const InternalOfficerNotes = ({ user, language = 'en' }) => {
  const [flaggedEntities, setFlaggedEntities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [newNote, setNewNote] = useState({
    targetType: 'farmer',
    targetId: '',
    farmerUsername: '',
    gnDivision: '',
    district: '',
    noteType: 'general',
    content: '',
    flags: [],
    visibility: 'all_officers'
  });

  const t = {
    en: {
      title: 'Internal Officer Notes',
      subtitle: 'Hidden comments and flags for officer coordination',
      loading: 'Loading notes...',
      noNotes: 'No flagged entities found',
      flaggedEntities: 'Flagged Entities',
      createNote: 'Create Note',
      targetType: 'Target Type',
      farmer: 'Farmer',
      location: 'Location',
      report: 'Disease Report',
      farmerUsername: 'Farmer Username',
      gnDivision: 'GN Division',
      district: 'District',
      noteType: 'Note Type',
      content: 'Content',
      flags: 'Flags',
      visibility: 'Visibility',
      allOfficers: 'All Officers',
      districtOnly: 'District Only',
      adminOnly: 'Admin Only',
      save: 'Save',
      cancel: 'Cancel',
      noteCount: 'Notes',
      latestNote: 'Latest',
      byType: 'By Type',
      byFlag: 'By Flag',
      total: 'Total Notes',
      resolve: 'Resolve',
      addFlag: 'Add Flag',
      selectFlag: 'Select Flag'
    },
    si: {
      title: 'අභ්‍යන්තර නිලධාරී සටහන්',
      subtitle: 'නිලධාරී සම්බන්ධීකරණය සඳහා සැඟවුණු අදහස් සහ ධජ',
      loading: 'සටහන් පූරණය වෙමින්...',
      noNotes: 'ධජ සහිත ආයතන හමු නොවීය',
      flaggedEntities: 'ධජ සහිත ආයතන',
      createNote: 'සටහනක් සාදන්න',
      targetType: 'ඉලක්ක වර්ගය',
      farmer: 'ගොවියා',
      location: 'ස්ථානය',
      report: 'රෝග වාර්තාව',
      farmerUsername: 'ගොවි පරිශීලක නාමය',
      gnDivision: 'GN කොට්ඨාසය',
      district: 'දිස්ත්‍රික්කය',
      noteType: 'සටහන් වර්ගය',
      content: 'අන්තර්ගතය',
      flags: 'ධජ',
      visibility: 'දෘශ්‍යතාව',
      allOfficers: 'සියලුම නිලධාරීන්',
      districtOnly: 'දිස්ත්‍රික්කය පමණි',
      adminOnly: 'පරිපාලක පමණි',
      save: 'සුරකින්න',
      cancel: 'අවලංගු කරන්න',
      noteCount: 'සටහන්',
      latestNote: 'නවතම',
      byType: 'වර්ගය අනුව',
      byFlag: 'ධජය අනුව',
      total: 'මුළු සටහන්',
      resolve: 'විසඳන්න',
      addFlag: 'ධජයක් එක් කරන්න',
      selectFlag: 'ධජයක් තෝරන්න'
    }
  };

  const text = t[language] || t.en;
  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [entitiesRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/officer-workflow/flagged-entities`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        }),
        axios.get(`${API_BASE}/officer-workflow/internal-notes/stats`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
      ]);

      setFlaggedEntities(entitiesRes.data.entities || []);
      setStats(statsRes.data.stats);
    } catch (err) {
      console.error('Error fetching notes data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createNote = async () => {
    if (!newNote.content.trim()) {
      alert('Content is required');
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/officer-workflow/internal-notes`,
        {
          ...newNote,
          targetId: newNote.targetId || '000000000000000000000000' // Placeholder for farmer/location notes
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      
      setShowCreateNote(false);
      setNewNote({
        targetType: 'farmer',
        targetId: '',
        farmerUsername: '',
        gnDivision: '',
        district: '',
        noteType: 'general',
        content: '',
        flags: [],
        visibility: 'all_officers'
      });
      fetchData();
    } catch (err) {
      console.error('Error creating note:', err);
      alert(err.response?.data?.error || 'Failed to create note');
    }
  };

  const toggleFlag = (flag) => {
    if (newNote.flags.includes(flag)) {
      setNewNote({ ...newNote, flags: newNote.flags.filter(f => f !== flag) });
    } else {
      setNewNote({ ...newNote, flags: [...newNote.flags, flag] });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-rose-600" />
        <p className="text-gray-600">{text.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              {text.title}
            </h2>
            <p className="text-rose-200 text-sm mt-1">{text.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateNote(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {text.createNote}
            </button>
            <button
              onClick={fetchData}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-rose-200">{text.total}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-xs text-rose-200 mb-1">{text.byType}</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(stats.byType || {}).slice(0, 3).map(([type, count]) => (
                  <span key={type} className="text-xs bg-white/20 px-2 py-0.5 rounded">
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 md:col-span-2">
              <div className="text-xs text-rose-200 mb-1">{text.byFlag}</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(stats.byFlag || {}).slice(0, 4).map(([flag, count]) => (
                  <span key={flag} className="text-xs bg-white/20 px-2 py-0.5 rounded">
                    {flag.replace(/_/g, ' ')}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Note Modal */}
      {showCreateNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">{text.createNote}</h3>
              
              <div className="space-y-4">
                {/* Target Type */}
                <div>
                  <label className="text-sm text-gray-600 font-medium">{text.targetType}</label>
                  <select
                    value={newNote.targetType}
                    onChange={(e) => setNewNote({ ...newNote, targetType: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg"
                  >
                    <option value="farmer">{text.farmer}</option>
                    <option value="location">{text.location}</option>
                    <option value="disease_report">{text.report}</option>
                  </select>
                </div>

                {/* Farmer Username (if farmer type) */}
                {newNote.targetType === 'farmer' && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">{text.farmerUsername}</label>
                    <input
                      type="text"
                      value={newNote.farmerUsername}
                      onChange={(e) => setNewNote({ ...newNote, farmerUsername: e.target.value })}
                      className="w-full mt-1 p-2 border rounded-lg"
                      placeholder="Enter farmer username"
                    />
                  </div>
                )}

                {/* Location fields (if location type) */}
                {newNote.targetType === 'location' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-600 font-medium">{text.gnDivision}</label>
                      <input
                        type="text"
                        value={newNote.gnDivision}
                        onChange={(e) => setNewNote({ ...newNote, gnDivision: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 font-medium">{text.district}</label>
                      <input
                        type="text"
                        value={newNote.district}
                        onChange={(e) => setNewNote({ ...newNote, district: e.target.value })}
                        className="w-full mt-1 p-2 border rounded-lg"
                      />
                    </div>
                  </>
                )}

                {/* Note Type */}
                <div>
                  <label className="text-sm text-gray-600 font-medium">{text.noteType}</label>
                  <select
                    value={newNote.noteType}
                    onChange={(e) => setNewNote({ ...newNote, noteType: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg"
                  >
                    {Object.entries(NOTE_TYPE_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {language === 'si' ? config.labelSi : config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Content */}
                <div>
                  <label className="text-sm text-gray-600 font-medium">{text.content}</label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg resize-none"
                    rows={4}
                    placeholder="Enter note content..."
                  />
                </div>

                {/* Flags */}
                <div>
                  <label className="text-sm text-gray-600 font-medium mb-2 block">{text.flags}</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(FLAG_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => toggleFlag(key)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          newNote.flags.includes(key)
                            ? `${config.color} text-white`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {language === 'si' ? config.labelSi : config.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="text-sm text-gray-600 font-medium">{text.visibility}</label>
                  <select
                    value={newNote.visibility}
                    onChange={(e) => setNewNote({ ...newNote, visibility: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg"
                  >
                    <option value="all_officers">{text.allOfficers}</option>
                    <option value="district_only">{text.districtOnly}</option>
                    <option value="admin_only">{text.adminOnly}</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={createNote}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  {text.save}
                </button>
                <button
                  onClick={() => setShowCreateNote(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {text.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flagged Entities List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Flag className="w-5 h-5 text-rose-600" />
          {text.flaggedEntities}
        </h3>

        {flaggedEntities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{text.noNotes}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flaggedEntities.map((entity, idx) => (
              <div 
                key={idx}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {entity.targetType === 'farmer' && <User className="w-4 h-4 text-gray-500" />}
                      {entity.targetType === 'location' && <MapPin className="w-4 h-4 text-gray-500" />}
                      {entity.targetType === 'disease_report' && <FileText className="w-4 h-4 text-gray-500" />}
                      <span className="font-bold text-gray-800">
                        {entity.farmerUsername || entity.gnDivision || `Report ${entity.targetId?.slice(-6)}`}
                      </span>
                    </div>
                    {entity.district && (
                      <p className="text-sm text-gray-500">{entity.gnDivision}, {entity.district}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{entity.noteCount} {text.noteCount}</div>
                  </div>
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-2">
                  {entity.flags.map((flag, i) => {
                    const config = FLAG_CONFIG[flag] || { color: 'bg-gray-500', label: flag };
                    return (
                      <span 
                        key={i}
                        className={`px-2 py-1 rounded-full text-xs font-medium text-white ${config.color}`}
                      >
                        {language === 'si' ? config.labelSi : config.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternalOfficerNotes;
