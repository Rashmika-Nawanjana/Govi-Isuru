import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, AlertCircle, CheckCircle, Clock, Eye, X } from 'lucide-react';

const MyReports = ({ user, lang }) => {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const t = {
    en: {
      title: 'My Disease Reports',
      noReports: 'No reports submitted yet',
      loading: 'Loading reports...',
      submitted: 'Submitted',
      pending: 'Pending Review',
      verified: 'Verified',
      rejected: 'Rejected',
      status: 'Status',
      date: 'Date',
      disease: 'Disease Detected',
      confidence: 'Confidence',
      location: 'Location',
      verifiedBy: 'Verified By',
      notes: 'Officer Notes',
      close: 'Close',
      noNotes: 'No additional notes'
    },
    si: {
      title: 'මගේ රෝග වාර්තා',
      noReports: 'තවමත් කිසිවක් වාර්තා ඉදිරිපත් කර නැත',
      loading: 'වාර්තා පූරණය කරමින්...',
      submitted: 'ඉදිරිපත් කරන ලද',
      pending: 'සමීක්ෂණයට බලාපොරොත්තුවෙන්',
      verified: 'සත්‍යාපිත',
      rejected: 'ප්‍රතික්ෂේප',
      status: 'තත්ත්වය',
      date: 'දිනය',
      disease: 'හඳුනාගත් රෝගය',
      confidence: 'විශ්වාසනීයත්වය',
      location: 'ස්ථානය',
      verifiedBy: 'සත්‍යාපිත කරමින්',
      notes: 'නිලධාරී සටහන්',
      close: 'වසන්න',
      noNotes: 'අතිරේක සටහන් නොමាතර'
    }
  };

  const text = t[lang] || t.en;

  useEffect(() => {
    fetchMyReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyReports = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        `${API_BASE}/api/reports/my-reports`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setReports(response.data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'verified':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(lang === 'si' ? 'si-LK' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">{text.loading}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FileText className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-600">{text.noReports}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <FileText className="w-6 h-6 text-green-600" />
        {text.title}
      </h2>

      <div className="grid gap-4">
        {reports.map((report) => (
          <div
            key={report._id}
            className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-gray-800">{report.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    {text[report.status] || report.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs font-semibold">{text.date}</p>
                    <p className="text-gray-700">{formatDate(report.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-semibold">{text.disease}</p>
                    <p className="text-gray-700">{report.ai_prediction}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-semibold">{text.confidence}</p>
                    <p className="text-gray-700">{Math.round(report.confidence_score * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-semibold">{text.location}</p>
                    <p className="text-gray-700">{report.gnDivision}</p>
                  </div>
                </div>

                {report.description && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">{report.description}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedReport(report)}
                className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold">{selectedReport.title}</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {selectedReport.image_url && (
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={selectedReport.image_url} 
                    alt="Disease sample" 
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold">{text.disease}</p>
                  <p className="font-semibold text-gray-800">{selectedReport.ai_prediction}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">{text.confidence}</p>
                  <p className="font-semibold text-gray-800">{Math.round(selectedReport.confidence_score * 100)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">{text.status}</p>
                  <p className={`font-semibold ${selectedReport.status === 'verified' ? 'text-green-600' : selectedReport.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {text[selectedReport.status]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">{text.date}</p>
                  <p className="font-semibold text-gray-800">{formatDate(selectedReport.createdAt)}</p>
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Description</p>
                  <p className="text-gray-700">{selectedReport.description}</p>
                </div>
              )}

              {selectedReport.verifiedBy && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-semibold mb-1">{text.verifiedBy}</p>
                  <p className="font-semibold text-gray-800">{selectedReport.verifiedBy}</p>
                  {selectedReport.verificationNotes && (
                    <p className="text-sm text-gray-700 mt-2">{selectedReport.verificationNotes}</p>
                  )}
                </div>
              )}

              {!selectedReport.verifiedBy && selectedReport.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">⏳ {lang === 'en' ? 'Awaiting verification from government officers' : 'රජයේ නිලධාරීන්ගෙන් සත්‍යාපනයේ බලාපොරොත්තුවෙන්'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReports;
