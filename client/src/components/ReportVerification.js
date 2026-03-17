import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  Loader2,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle,
  PlayCircle,
  Send,
  RefreshCw
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

const ReportVerification = ({ lang, user }) => {
  const [queue, setQueue] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adviceText, setAdviceText] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const t = {
    en: {
      title: 'Instructor Case Booking',
      subtitle: 'Claim low-confidence farmer cases and provide paid advice',
      queue: 'Open Queue (All Sri Lanka)',
      mine: 'My Claimed Cases',
      noQueue: 'No open cases in queue',
      noMine: 'No claimed cases yet',
      confidence: 'AI Confidence',
      fee: 'Advice Fee',
      claim: 'Claim Case',
      start: 'Start Analysis',
      submitAdvice: 'Submit Paid Advice',
      advicePlaceholder: 'Write practical, step-by-step advice for the farmer...',
      notesPlaceholder: 'Optional verification notes',
      refresh: 'Refresh',
      onlyInstructors: 'Only agricultural instructors can access this page',
      queuedBy: 'Farmer',
      location: 'Location'
    },
    si: {
      title: 'උපදේශක නඩු වෙන්කිරීම්',
      subtitle: 'අඩු විශ්වාසනීයතා නඩු භාරගෙන ගෙවන උපදෙස් ලබාදෙන්න',
      queue: 'විවෘත නඩු (ශ්‍රී ලංකාව පුරා)',
      mine: 'මා භාරගත් නඩු',
      noQueue: 'විවෘත නඩු නොමැත',
      noMine: 'භාරගත් නඩු නොමැත',
      confidence: 'AI විශ්වාසය',
      fee: 'උපදෙස් ගාස්තුව',
      claim: 'නඩුව භාරගන්න',
      start: 'විශ්ලේෂණය ආරම්භ කරන්න',
      submitAdvice: 'ගෙවන උපදෙස් යවන්න',
      advicePlaceholder: 'ගොවියාට ක්‍රියාකාරී පියවර සමඟ උපදෙස් ලියන්න...',
      notesPlaceholder: 'විකල්ප සත්‍යාපන සටහන්',
      refresh: 'නැවුම් කරන්න',
      onlyInstructors: 'කෘෂිකාර්මික උපදේශකයින්ට පමණක් ප්‍රවේශ විය හැක',
      queuedBy: 'ගොවියා',
      location: 'ස්ථානය'
    }
  };

  const text = t[lang] || t.en;
  const token = localStorage.getItem('token');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [queueRes, mineRes] = await Promise.all([
        axios.get(`${API_BASE}/api/reports/pending`, { headers }),
        axios.get(`${API_BASE}/api/reports/instructor/my-cases`, { headers })
      ]);
      setQueue(queueRes.data.reports || []);
      setMyCases(mineRes.data.reports || []);
    } catch (err) {
      console.error('Error loading instructor cases:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user?.role === 'officer') {
      fetchData();
    }
  }, [user, fetchData]);

  const allCases = useMemo(() => {
    const mineIds = new Set(myCases.map((c) => c._id));
    return [...myCases, ...queue.filter((c) => !mineIds.has(c._id))];
  }, [queue, myCases]);

  const claimCase = async (id) => {
    try {
      setActionLoading(true);
      await axios.post(`${API_BASE}/api/reports/${id}/claim`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData();
      if (selectedReport?._id === id) {
        const refreshed = await axios.get(`${API_BASE}/api/reports/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedReport(refreshed.data.report);
      }
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to claim case');
    } finally {
      setActionLoading(false);
    }
  };

  const startAnalysis = async (id) => {
    try {
      setActionLoading(true);
      await axios.post(`${API_BASE}/api/reports/${id}/start-analysis`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to start analysis');
    } finally {
      setActionLoading(false);
    }
  };

  const submitAdvice = async (id) => {
    try {
      if (!adviceText.trim()) {
        alert('Advice text is required');
        return;
      }
      setActionLoading(true);
      await axios.post(`${API_BASE}/api/reports/${id}/submit-advice`, {
        adviceText,
        verificationNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdviceText('');
      setVerificationNotes('');
      await fetchData();
      setSelectedReport(null);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to submit advice');
    } finally {
      setActionLoading(false);
    }
  };

  if (user?.role !== 'officer') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{text.onlyInstructors}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{text.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{text.subtitle}</p>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-2 rounded-lg bg-green-600 text-white flex items-center gap-2 hover:bg-green-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {text.refresh}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
            <h2 className="font-bold mb-3">{text.queue} ({queue.length})</h2>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : queue.length === 0 ? <p className="text-sm text-gray-500">{text.noQueue}</p> : (
              <div className="space-y-3">
                {queue.map((r) => (
                  <button key={r._id} onClick={() => setSelectedReport(r)} className="w-full text-left border rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-xs text-gray-500">{text.confidence}: {Math.round((r.confidence_score || 0) * 100)}%</p>
                    <p className="text-xs text-gray-500">{text.location}: {r.gnDivision}, {r.district}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
            <h2 className="font-bold mb-3">{text.mine} ({myCases.length})</h2>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : myCases.length === 0 ? <p className="text-sm text-gray-500">{text.noMine}</p> : (
              <div className="space-y-3">
                {myCases.map((r) => (
                  <button key={r._id} onClick={() => setSelectedReport(r)} className="w-full text-left border rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-xs text-gray-500">{r.assignmentStatus}</p>
                    <p className="text-xs text-gray-500">{text.fee}: {r.adviceFeeCredits || 0} credits</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedReport && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{selectedReport.title}</h3>
              <button onClick={() => setSelectedReport(null)} className="text-sm text-gray-500">Close</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2"><User className="w-4 h-4" /> {text.queuedBy}: {selectedReport.farmerName}</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {selectedReport.farmerPhone}</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {selectedReport.gnDivision}, {selectedReport.district}</div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {text.confidence}: {Math.round((selectedReport.confidence_score || 0) * 100)}%</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {text.fee}: {selectedReport.adviceFeeCredits || 0} credits</div>
            </div>

            {selectedReport.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300">{selectedReport.description}</p>
            )}

            {selectedReport.assignmentStatus === 'unassigned' && (
              <button
                onClick={() => claimCase(selectedReport._id)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {text.claim}
              </button>
            )}

            {['claimed', 'analysing'].includes(selectedReport.assignmentStatus) && (
              <div className="space-y-3">
                {selectedReport.assignmentStatus === 'claimed' && (
                  <button
                    onClick={() => startAnalysis(selectedReport._id)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" /> {text.start}
                  </button>
                )}

                <textarea
                  value={adviceText}
                  onChange={(e) => setAdviceText(e.target.value)}
                  placeholder={text.advicePlaceholder}
                  className="w-full p-3 border rounded-lg min-h-[120px]"
                />
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder={text.notesPlaceholder}
                  className="w-full p-3 border rounded-lg min-h-[80px]"
                />

                <button
                  onClick={() => submitAdvice(selectedReport._id)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> {text.submitAdvice}
                </button>
              </div>
            )}

            {selectedReport.assignmentStatus === 'advice_submitted' && (
              <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">
                Advice already submitted for this case.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportVerification;
