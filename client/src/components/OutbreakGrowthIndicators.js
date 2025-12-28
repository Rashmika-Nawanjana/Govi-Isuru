import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  RefreshCw,
  Activity,
  MapPin,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Trend configuration
const TREND_CONFIG = {
  increasing: {
    icon: TrendingUp,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    label: 'Increasing',
    labelSi: 'වැඩි වෙමින්'
  },
  decreasing: {
    icon: TrendingDown,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    label: 'Decreasing',
    labelSi: 'අඩු වෙමින්'
  },
  stable: {
    icon: Minus,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    label: 'Stable',
    labelSi: 'ස්ථාවර'
  },
  new: {
    icon: Sparkles,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    label: 'New Outbreak',
    labelSi: 'නව පිපිරීම'
  }
};

// Risk level colors
const RISK_COLORS = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-green-500 text-white'
};

const OutbreakGrowthIndicators = ({ user, language = 'en' }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const t = {
    en: {
      title: 'Outbreak Growth Indicators',
      subtitle: 'Track disease spread trends and growth rates',
      loading: 'Analyzing outbreak data...',
      noData: 'No outbreak data available',
      percentChange: '% change',
      currentPeriod: 'Current Period',
      previousPeriod: 'Previous Period',
      affectedAreas: 'Affected Areas',
      riskLevel: 'Risk Level',
      districtSummary: 'District Summary',
      overallStats: 'Overall Statistics',
      increasingDiseases: 'Increasing',
      decreasingDiseases: 'Decreasing',
      newOutbreaks: 'New Outbreaks',
      totalReports: 'Total Reports',
      last7Days: 'Last 7 Days',
      last14Days: 'Last 14 Days',
      last30Days: 'Last 30 Days',
      reports: 'reports',
      gnDivisions: 'GN Divisions',
      districts: 'Districts'
    },
    si: {
      title: 'පිපිරීම් වර්ධන දර්ශක',
      subtitle: 'රෝග පැතිරීමේ ප්‍රවණතා සහ වර්ධන අනුපාත නිරීක්ෂණය',
      loading: 'පිපිරීම් දත්ත විශ්ලේෂණය කරමින්...',
      noData: 'පිපිරීම් දත්ත නොමැත',
      percentChange: '% වෙනස',
      currentPeriod: 'වත්මන් කාලය',
      previousPeriod: 'පෙර කාලය',
      affectedAreas: 'බලපෑමට ලක්වූ ප්‍රදේශ',
      riskLevel: 'අවදානම් මට්ටම',
      districtSummary: 'දිස්ත්‍රික් සාරාංශය',
      overallStats: 'සමස්ත සංඛ්‍යාලේඛන',
      increasingDiseases: 'වැඩි වෙමින්',
      decreasingDiseases: 'අඩු වෙමින්',
      newOutbreaks: 'නව පිපිරීම්',
      totalReports: 'මුළු වාර්තා',
      last7Days: 'පසුගිය දින 7',
      last14Days: 'පසුගිය දින 14',
      last30Days: 'පසුගිය දින 30',
      reports: 'වාර්තා',
      gnDivisions: 'GN කොට්ඨාස',
      districts: 'දිස්ත්‍රික්ක'
    }
  };

  const text = t[language] || t.en;
  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/analytics/growth-indicators`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { days }
      });
      setData(response.data);
    } catch (err) {
      console.error('Error fetching growth indicators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-gray-600">{text.loading}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">{text.noData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              {text.title}
            </h2>
            <p className="text-indigo-200 text-sm mt-1">{text.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
            >
              <option value={7} className="text-gray-800">{text.last7Days}</option>
              <option value={14} className="text-gray-800">{text.last14Days}</option>
              <option value={30} className="text-gray-800">{text.last30Days}</option>
            </select>
            <button
              onClick={fetchData}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Overall Stats */}
        {data.overallStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{data.overallStats.totalCurrentReports}</div>
              <div className="text-xs text-indigo-200">{text.totalReports}</div>
              <div className={`text-sm mt-1 flex items-center justify-center gap-1 ${
                data.overallStats.totalCurrentReports > data.overallStats.totalPreviousReports 
                  ? 'text-red-300' : 'text-green-300'
              }`}>
                {data.overallStats.totalCurrentReports > data.overallStats.totalPreviousReports 
                  ? <ArrowUpRight className="w-4 h-4" /> 
                  : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(Math.round(((data.overallStats.totalCurrentReports - data.overallStats.totalPreviousReports) / 
                  (data.overallStats.totalPreviousReports || 1)) * 100))}%
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-300">{data.overallStats.increasingDiseases}</div>
              <div className="text-xs text-indigo-200">{text.increasingDiseases}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-300">{data.overallStats.decreasingDiseases}</div>
              <div className="text-xs text-indigo-200">{text.decreasingDiseases}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-300">{data.overallStats.newOutbreaks}</div>
              <div className="text-xs text-indigo-200">{text.newOutbreaks}</div>
            </div>
          </div>
        )}
      </div>

      {/* Disease Growth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.diseaseGrowth?.map((disease, idx) => {
          const trendConfig = TREND_CONFIG[disease.trend] || TREND_CONFIG.stable;
          const TrendIcon = trendConfig.icon;

          return (
            <div 
              key={idx}
              className={`bg-white rounded-xl border-l-4 ${trendConfig.borderColor} shadow-md hover:shadow-lg transition-all p-5`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{disease.disease}</h3>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${trendConfig.bgColor} ${trendConfig.color}`}>
                    <TrendIcon className="w-3 h-3" />
                    {language === 'si' ? trendConfig.labelSi : trendConfig.label}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-bold ${RISK_COLORS[disease.riskLevel]}`}>
                  {disease.riskLevel.toUpperCase()}
                </div>
              </div>

              {/* Growth Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-xl font-bold text-gray-800">{disease.currentCount}</div>
                  <div className="text-xs text-gray-500">{text.currentPeriod}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-xl font-bold text-gray-500">{disease.previousCount}</div>
                  <div className="text-xs text-gray-500">{text.previousPeriod}</div>
                </div>
              </div>

              {/* Percent Change */}
              <div className={`flex items-center justify-center gap-2 p-2 rounded-lg ${trendConfig.bgColor}`}>
                <TrendIcon className={`w-5 h-5 ${trendConfig.color}`} />
                <span className={`text-lg font-bold ${trendConfig.color}`}>
                  {disease.percentChange > 0 ? '+' : ''}{disease.percentChange}%
                </span>
              </div>

              {/* Affected Areas */}
              <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {disease.affectedDistricts} {text.districts}
                </span>
                <span>{disease.affectedGnDivisions} {text.gnDivisions}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* District Summary */}
      {data.districtSummary && data.districtSummary.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            {text.districtSummary}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">District</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-600">{text.currentPeriod}</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-600">{text.previousPeriod}</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-600">{text.percentChange}</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-600">Trend</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-600">{text.affectedAreas}</th>
                </tr>
              </thead>
              <tbody>
                {data.districtSummary.map((district, idx) => {
                  const trendConfig = TREND_CONFIG[district.trend] || TREND_CONFIG.stable;
                  const TrendIcon = trendConfig.icon;

                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium text-gray-800">{district.district}</td>
                      <td className="py-3 px-3 text-center font-bold">{district.currentReports}</td>
                      <td className="py-3 px-3 text-center text-gray-500">{district.previousReports}</td>
                      <td className={`py-3 px-3 text-center font-bold ${trendConfig.color}`}>
                        {district.percentChange > 0 ? '+' : ''}{district.percentChange}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${trendConfig.bgColor} ${trendConfig.color}`}>
                          <TrendIcon className="w-3 h-3" />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-gray-600">{district.affectedAreas}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutbreakGrowthIndicators;
