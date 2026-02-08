import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Flag,
  MapPin,
  RefreshCw,
  Calendar,
  BarChart3,
  Target,
  Zap,
  Users,
  Activity
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const OfficerPerformanceDashboard = ({ user, language = 'en' }) => {
  const [performance, setPerformance] = useState(null);
  const [monthlyComparison, setMonthlyComparison] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const t = {
    en: {
      title: 'Performance Dashboard',
      subtitle: 'Track your productivity and performance metrics',
      loading: 'Loading performance data...',
      productivityScore: 'Productivity Score',
      totalActions: 'Total Actions',
      reportsReviewed: 'Reports Reviewed',
      verifications: 'Verifications',
      rejections: 'Rejections',
      flags: 'Flags',
      fieldVisits: 'Field Visit Requests',
      avgResponseTime: 'Avg Response Time',
      hours: 'hours',
      dailyActivity: 'Daily Activity',
      actionBreakdown: 'Action Breakdown',
      monthlyComparison: 'Monthly Comparison',
      leaderboard: 'Officer Leaderboard',
      rank: 'Rank',
      officer: 'Officer',
      district: 'District',
      actions: 'Actions',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      currentMonth: 'Current Month',
      lastMonth: 'Last Month',
      change: 'Change',
      recentActions: 'Recent Actions',
      excellent: 'Excellent',
      good: 'Good',
      average: 'Average',
      needsImprovement: 'Needs Improvement'
    },
    si: {
      title: 'කාර්ය සාධන උපකරණ පුවරුව',
      subtitle: 'ඔබේ ඵලදායිතාව සහ කාර්ය සාධන මිනුම් නිරීක්ෂණය කරන්න',
      loading: 'කාර්ය සාධන දත්ත පූරණය වෙමින්...',
      productivityScore: 'ඵලදායිතා ලකුණු',
      totalActions: 'මුළු ක්‍රියාමාර්ග',
      reportsReviewed: 'සමාලෝචනය කළ වාර්තා',
      verifications: 'සත්‍යාපන',
      rejections: 'ප්‍රතික්ෂේප',
      flags: 'ධජ',
      fieldVisits: 'ක්ෂේත්‍ර සංචාර ඉල්ලීම්',
      avgResponseTime: 'සාමාන්‍ය ප්‍රතිචාර කාලය',
      hours: 'පැය',
      dailyActivity: 'දෛනික ක්‍රියාකාරකම්',
      actionBreakdown: 'ක්‍රියාමාර්ග බෙදීම',
      monthlyComparison: 'මාසික සංසන්දනය',
      leaderboard: 'නිලධාරී ශ්‍රේණිගත කිරීම',
      rank: 'ශ්‍රේණිය',
      officer: 'නිලධාරී',
      district: 'දිස්ත්‍රික්කය',
      actions: 'ක්‍රියාමාර්ග',
      last7Days: 'පසුගිය දින 7',
      last30Days: 'පසුගිය දින 30',
      last90Days: 'පසුගිය දින 90',
      currentMonth: 'මෙම මාසය',
      lastMonth: 'පසුගිය මාසය',
      change: 'වෙනස',
      recentActions: 'මෑත ක්‍රියාමාර්ග',
      excellent: 'විශිෂ්ට',
      good: 'හොඳ',
      average: 'සාමාන්‍ය',
      needsImprovement: 'වැඩිදියුණු කිරීම අවශ්‍යයි'
    }
  };

  const text = t[language] || t.en;
  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [perfRes, monthlyRes, leaderRes] = await Promise.all([
        axios.get(`${API_BASE}/api/officer-workflow/performance`, {
          headers: { Authorization: `Bearer ${getToken()}` },
          params: { days }
        }),
        axios.get(`${API_BASE}/api/officer-workflow/performance/monthly`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        }),
        axios.get(`${API_BASE}/api/officer-workflow/leaderboard`, {
          headers: { Authorization: `Bearer ${getToken()}` },
          params: { days, limit: 10 }
        })
      ]);

      setPerformance(perfRes.data.performance);
      setMonthlyComparison(monthlyRes.data.comparison);
      setLeaderboard(leaderRes.data.leaderboard || []);
    } catch (err) {
      console.error('Error fetching performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return text.excellent;
    if (score >= 60) return text.good;
    if (score >= 40) return text.average;
    return text.needsImprovement;
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-cyan-600';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
        <p className="text-gray-600">{text.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Award className="w-6 h-6" />
              {text.title}
            </h2>
            <p className="text-purple-200 text-sm mt-1">{text.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
            >
              <option value={7} className="text-gray-800">{text.last7Days}</option>
              <option value={30} className="text-gray-800">{text.last30Days}</option>
              <option value={90} className="text-gray-800">{text.last90Days}</option>
            </select>
            <button
              onClick={fetchData}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Productivity Score Card */}
      {performance?.summary && (
        <div className={`bg-gradient-to-r ${getScoreBg(performance.summary.productivityScore)} rounded-2xl p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">{text.productivityScore}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{performance.summary.productivityScore}</span>
                <span className="text-2xl">/100</span>
              </div>
              <p className="text-white/90 mt-1 font-medium">{getScoreLabel(performance.summary.productivityScore)}</p>
            </div>
            <div className="text-right">
              <Target className="w-16 h-16 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {performance?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{text.totalActions}</p>
                <p className="text-2xl font-bold text-gray-800">{performance.summary.totalActions}</p>
              </div>
              <Activity className="text-purple-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">{text.verifications}</p>
                <p className="text-2xl font-bold text-green-700">{performance.summary.verifications}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 font-medium">{text.rejections}</p>
                <p className="text-2xl font-bold text-red-700">{performance.summary.rejections}</p>
              </div>
              <XCircle className="text-red-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">{text.avgResponseTime}</p>
                <p className="text-2xl font-bold text-blue-700">{performance.summary.avgResponseTimeHours}h</p>
              </div>
              <Clock className="text-blue-500" size={24} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        {performance?.dailyActivity && performance.dailyActivity.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              {text.dailyActivity}
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {performance.dailyActivity.map((day, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20">{day._id}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, (day.count / 20) * 100)}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {day.count} actions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Breakdown */}
        {performance?.actionBreakdown && performance.actionBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              {text.actionBreakdown}
            </h3>
            <div className="space-y-3">
              {performance.actionBreakdown.map((action, idx) => {
                const colors = [
                  'bg-green-500', 'bg-red-500', 'bg-orange-500', 
                  'bg-blue-500', 'bg-purple-500', 'bg-pink-500'
                ];
                const total = performance.actionBreakdown.reduce((sum, a) => sum + a.count, 0);
                const percent = Math.round((action.count / total) * 100);
                
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`}></div>
                    <span className="flex-1 text-sm text-gray-700">{action.label}</span>
                    <span className="text-sm font-bold text-gray-800">{action.count}</span>
                    <span className="text-xs text-gray-500 w-12 text-right">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Comparison */}
      {monthlyComparison && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            {text.monthlyComparison}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <p className="text-sm text-indigo-600 font-medium">{monthlyComparison.currentMonth.name}</p>
              <p className="text-3xl font-bold text-indigo-700">{monthlyComparison.currentMonth.actions}</p>
              <p className="text-xs text-indigo-500">{text.currentMonth}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600 font-medium">{monthlyComparison.lastMonth.name}</p>
              <p className="text-3xl font-bold text-gray-700">{monthlyComparison.lastMonth.actions}</p>
              <p className="text-xs text-gray-500">{text.lastMonth}</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${
              monthlyComparison.percentChange >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex items-center justify-center gap-1">
                {monthlyComparison.percentChange >= 0 
                  ? <TrendingUp className="w-5 h-5 text-green-600" />
                  : <TrendingDown className="w-5 h-5 text-red-600" />
                }
              </div>
              <p className={`text-3xl font-bold ${
                monthlyComparison.percentChange >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {monthlyComparison.percentChange > 0 ? '+' : ''}{monthlyComparison.percentChange}%
              </p>
              <p className="text-xs text-gray-500">{text.change}</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            {text.leaderboard}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">{text.rank}</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">{text.officer}</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">{text.district}</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-600">{text.actions}</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-600">{text.verifications}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr key={idx} className={`border-b hover:bg-gray-50 ${
                    entry.username === user?.username ? 'bg-purple-50' : ''
                  }`}>
                    <td className="py-3 px-3">
                      {entry.rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${
                          entry.rank === 1 ? 'bg-amber-500' :
                          entry.rank === 2 ? 'bg-gray-400' :
                          'bg-amber-700'
                        }`}>
                          {entry.rank}
                        </span>
                      ) : (
                        <span className="text-gray-600">{entry.rank}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-800">
                      {entry.username}
                      {entry.username === user?.username && (
                        <span className="ml-2 text-xs text-purple-600">(You)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-600">{entry.district || 'N/A'}</td>
                    <td className="py-3 px-3 text-center font-bold">{entry.totalActions}</td>
                    <td className="py-3 px-3 text-center text-green-600">{entry.verifications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerPerformanceDashboard;
