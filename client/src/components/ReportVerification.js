import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CheckCircle, XCircle, AlertTriangle, Loader2, MapPin, Phone,
  User, Calendar, FileText, Eye
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

const ReportVerification = ({ lang, user }) => {
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [submittingVerification, setSubmittingVerification] = useState(false);

  const t = {
    en: {
      title: 'Report Verification',
      subtitle: 'Review and verify disease reports from farmers',
      noReports: 'No pending reports to review',
      pending: 'Pending Reports',
      count: 'Report',
      from: 'From Farmer',
      location: 'Location',
      submitted: 'Submitted',
      disease: 'Disease Detected',
      confidence: 'AI Confidence',
      phone: 'Contact Farmer',
      viewReport: 'View Full Report',
      notes: 'Verification Notes',
      severity: 'Severity Level',
      verify: 'Verify & Alert Farmers',
      reject: 'Reject Report',
      cancel: 'Cancel',
      verifying: 'Verifying...',
      verified: 'Report Verified',
      alertSent: 'Alert sent to other farmers in your area',
      rejected: 'Report Rejected'
    },
    si: {
      title: 'වාර්තා සත්‍යාපනය',
      subtitle: 'ගොවීන්ගේ රෝග වාර්තා සමාලෝචනය සහ සත්‍යාපනය කරන්න',
      noReports: 'සමාලෝචනය කිරීමට ඉපැවුණු වාර්තා නොමැත',
      pending: 'ඉපැවුණු වාර්තා',
      count: 'වාර්තාව',
      from: 'ගොවි සිටුවෙත් අනුබද්ධ',
      location: 'ස්ථානය',
      submitted: 'ඉදිරිපත් කරන ලදී',
      disease: 'හඳුනාගත් රෝගය',
      confidence: 'AI විශ්වාසනීයත්වය',
      phone: 'ගොවිතැනට සම්බන්ධ වන්න',
      viewReport: 'සම්පූර්ණ වාර්තාව බලන්න',
      notes: 'සත්‍යාපන සටහන්',
      severity: 'බරපතැකම් මට්ටම',
      verify: 'සත්‍යාපනය කරන්න සහ ගොවීන්ට අනතුරු අවfőඝවීම් කරන්න',
      reject: 'වාර්තාව ප්‍රතිබාධනය කරන්න',
      cancel: 'අවලංඝනය කරන්න',
      verifying: 'සත්‍යාපනය කරමින්...',
      verified: 'වාර්තාව සත්‍යාපිතයි',
      alertSent: 'ඔබගේ ප්‍රදේශයේ අනෙකුත් ගොවීන්ට අනතුරු අවFหඝවීම් යැවුණි',
      rejected: 'වාර්තාව ප්‍රතිබාධනය විය'
    }
  };

  const text = t[lang] || t.en;

  useEffect(() => {
    if (user && user.role === 'officer') {
      fetchPendingReports();
    }
  }, [user]);

  const fetchPendingReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/reports/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPendingReports(response.data.reports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReport = async (reportId, status) => {
    try {
      setSubmittingVerification(true);
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `${API_BASE}/api/reports/${reportId}/verify`,
        {
          status: status, // 'verified' or 'rejected'
          verificationNotes: verificationNotes,
          severity: severity
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Remove verified report from list
        setPendingReports(pendingReports.filter(r => r._id !== reportId));
        setSelectedReport(null);
        setVerificationNotes('');
        setSeverity('medium');

        alert(status === 'verified' 
          ? text.verified + '. ' + text.alertSent
          : text.rejected);
      }
    } catch (error) {
      console.error('Error verifying report:', error);
      alert('Error processing verification');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(lang === 'si' ? 'si-LK' : 'en-LK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (user?.role !== 'officer') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{lang === 'en' ? 'Only officers can access this page' : 'නිලධාරීන් පමණක් මෙම පිටුවට ප්‍රවේශ විය හැක'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{text.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{text.subtitle}</p>
        </div>

        {/* Main Content */}
        {!selectedReport ? (
          // Reports List
          <div className="grid gap-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              </div>
            ) : pendingReports.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">{text.noReports}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{pendingReports.length} {text.pending}</span>
                </div>

                {pendingReports.map((report) => (
                  <div
                    key={report._id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all border-l-4 border-amber-500 cursor-pointer overflow-hidden"
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                      {/* Image Section */}
                      {report.image_url && (
                        <div className="md:col-span-1">
                          <img 
                            src={report.image_url} 
                            alt="Leaf disease" 
                            className="w-full h-48 object-cover rounded-xl shadow-md"
                          />
                        </div>
                      )}
                      
                      {/* Content Section */}
                      <div className={report.image_url ? 'md:col-span-2' : 'md:col-span-3'}>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{report.title}</h3>
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                            {lang === 'en' ? 'Pending' : 'ඉපැවුණු'}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{report.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <User size={16} />
                            <span>{report.farmerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Phone size={16} />
                            <a href={`tel:${report.farmerPhone}`} className="text-blue-600 hover:underline">
                              {report.farmerPhone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin size={16} />
                            <span>{report.gnDivision}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar size={16} />
                            <span>{formatDate(report.createdAt)}</span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 dark:text-gray-300 font-semibold">{text.disease}:</span>
                            <span className="text-gray-600 dark:text-gray-400">{report.ai_prediction}</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              {Math.round(report.confidence_score * 100)}% {text.confidence}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden">
                        <Eye className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          // Report Details & Verification
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
            {/* Report Details */}
            <div className="mb-8 pb-8 border-b dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{selectedReport.title}</h2>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{text.from}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedReport.farmerName}</p>
                  <a href={`tel:${selectedReport.farmerPhone}`} className="text-blue-600 hover:underline text-sm flex items-center gap-1 mt-1">
                    <Phone size={14} />
                    {selectedReport.farmerPhone}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{text.location}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedReport.gnDivision}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedReport.district}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{text.disease}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedReport.ai_prediction}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{text.confidence}</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${selectedReport.confidence_score * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{Math.round(selectedReport.confidence_score * 100)}%</p>
                </div>
              </div>

              {selectedReport.image_url && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">Report Image</p>
                  <img src={selectedReport.image_url} alt="Report" className="w-full h-64 object-cover rounded-xl" />
                </div>
              )}
            </div>

            {/* Verification Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">{text.severity}</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-green-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">🟢 {lang === 'en' ? 'Low' : 'අඩු'}</option>
                  <option value="medium">🟡 {lang === 'en' ? 'Medium' : 'මධ්‍යම'}</option>
                  <option value="high">🔴 {lang === 'en' ? 'High' : 'ඉහල'}</option>
                  <option value="critical">🔴🔴 {lang === 'en' ? 'Critical' : 'සමාලෝචනීය'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">{text.notes}</label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder={lang === 'en' ? 'Add any notes about your verification...' : 'ඔබගේ සත්‍යාපන පිළිබඳ කිසිදු සටහන් එක් කරන්න...'}
                  className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-green-500 focus:outline-none resize-none dark:bg-gray-700 dark:text-white"
                  rows="4"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleVerifyReport(selectedReport._id, 'verified')}
                  disabled={submittingVerification}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
                >
                  {submittingVerification ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {text.verifying}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      {text.verify}
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleVerifyReport(selectedReport._id, 'rejected')}
                  disabled={submittingVerification}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  <XCircle size={20} />
                  {text.reject}
                </button>

                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setVerificationNotes('');
                    setSeverity('medium');
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
                >
                  {text.cancel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportVerification;
