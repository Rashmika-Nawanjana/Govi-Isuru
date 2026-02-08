import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart3,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Users,
  Clock,
  Eye,
  AlertOctagon,
  CheckCircle,
  XCircle
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Coverage status configuration
const COVERAGE_CONFIG = {
  adequate: {
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgLight: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: CheckCircle,
    label: 'Adequate',
    labelSi: 'ප්‍රමාණවත්'
  },
  under_reporting: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgLight: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    icon: AlertTriangle,
    label: 'Under-reporting',
    labelSi: 'අඩු වාර්තා කිරීම'
  },
  stale: {
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgLight: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: XCircle,
    label: 'Stale Data',
    labelSi: 'පැරණි දත්ත'
  }
};

// Blind spot risk colors
const BLIND_SPOT_COLORS = {
  high: 'bg-red-600 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-green-500 text-white'
};

const ReportingCoverageIndex = ({ user, language = 'en' }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [days, setDays] = useState(30);

  const t = {
    en: {
      title: 'Reporting Coverage Index',
      subtitle: 'Identify blind spots and under-reporting areas',
      loading: 'Analyzing coverage data...',
      noData: 'No coverage data available',
      overview: 'Overview',
      gnCoverage: 'GN Coverage',
      districtCoverage: 'District Coverage',
      alerts: 'Alerts',
      totalReportingAreas: 'Reporting Areas',
      adequateCoverage: 'Adequate',
      staleAreas: 'Stale Data',
      underReportingAreas: 'Under-reporting',
      alertCount: 'Active Alerts',
      gnDivision: 'GN Division',
      reportCount: 'Reports',
      lastReport: 'Last Report',
      daysAgo: 'days ago',
      reporters: 'Reporters',
      coverageStatus: 'Status',
      district: 'District',
      coveragePercent: 'Coverage %',
      blindSpotRisk: 'Blind Spot Risk',
      recommendation: 'Recommendation',
      reportDensity: 'Report Density',
      last30Days: 'Last 30 Days',
      last60Days: 'Last 60 Days',
      last90Days: 'Last 90 Days',
      critical: 'Critical',
      warning: 'Warning',
      attention: 'Attention'
    },
    si: {
      title: 'වාර්තා කිරීමේ ආවරණ දර්ශකය',
      subtitle: 'අන්ධ ස්ථාන සහ අඩු වාර්තා කිරීමේ ප්‍රදේශ හඳුනා ගන්න',
      loading: 'ආවරණ දත්ත විශ්ලේෂණය කරමින්...',
      noData: 'ආවරණ දත්ත නොමැත',
      overview: 'දළ විශ්ලේෂණය',
      gnCoverage: 'GN ආවරණය',
      districtCoverage: 'දිස්ත්‍රික් ආවරණය',
      alerts: 'අනතුරු ඇඟවීම්',
      totalReportingAreas: 'වාර්තා කරන ප්‍රදේශ',
      adequateCoverage: 'ප්‍රමාණවත්',
      staleAreas: 'පැරණි දත්ත',
      underReportingAreas: 'අඩු වාර්තා කිරීම',
      alertCount: 'සක්‍රීය අනතුරු ඇඟවීම්',
      gnDivision: 'GN කොට්ඨාසය',
      reportCount: 'වාර්තා',
      lastReport: 'අවසාන වාර්තාව',
      daysAgo: 'දින පෙර',
      reporters: 'වාර්තාකරුවන්',
      coverageStatus: 'තත්ත්වය',
      district: 'දිස්ත්‍රික්කය',
      coveragePercent: 'ආවරණ %',
      blindSpotRisk: 'අන්ධ ස්ථාන අවදානම',
      recommendation: 'නිර්දේශය',
      reportDensity: 'වාර්තා ඝනත්වය',
      last30Days: 'පසුගිය දින 30',
      last60Days: 'පසුගිය දින 60',
      last90Days: 'පසුගිය දින 90',
      critical: 'විවේචනාත්මක',
      warning: 'අනතුරු ඇඟවීම',
      attention: 'අවධානය'
    }
  };

  const text = t[language] || t.en;
  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/analytics/coverage-index`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { days }
      });
      setData(response.data);
    } catch (err) {
      console.error('Error fetching coverage data:', err);
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
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
        <p className="text-gray-600">{text.loading}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">{text.noData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              {text.title}
            </h2>
            <p className="text-emerald-200 text-sm mt-1">{text.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
            >
              <option value={30} className="text-gray-800">{text.last30Days}</option>
              <option value={60} className="text-gray-800">{text.last60Days}</option>
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

        {/* Summary Stats */}
        {data.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{data.summary.totalReportingAreas}</div>
              <div className="text-xs text-emerald-200">{text.totalReportingAreas}</div>
            </div>
            <div className="bg-green-500/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{data.summary.adequateCoverage}</div>
              <div className="text-xs text-emerald-200">{text.adequateCoverage}</div>
            </div>
            <div className="bg-red-500/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{data.summary.staleAreas}</div>
              <div className="text-xs text-emerald-200">{text.staleAreas}</div>
            </div>
            <div className="bg-yellow-500/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{data.summary.alertCount}</div>
              <div className="text-xs text-emerald-200">{text.alertCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-2 flex flex-wrap gap-2">
        {[
          { id: 'overview', label: text.overview, icon: Eye },
          { id: 'gn', label: text.gnCoverage, icon: MapPin },
          { id: 'district', label: text.districtCoverage, icon: BarChart3 },
          { id: 'alerts', label: text.alerts, icon: AlertOctagon }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeView === tab.id
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coverage Distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Coverage Distribution</h3>
            <div className="space-y-4">
              {Object.entries(COVERAGE_CONFIG).map(([key, config]) => {
                const count = data.gnDivisionCoverage?.filter(g => g.coverageStatus === key).length || 0;
                const total = data.gnDivisionCoverage?.length || 1;
                const percent = Math.round((count / total) * 100);
                const Icon = config.icon;
                
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgLight}`}>
                      <Icon className={`w-5 h-5 ${config.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-700">
                          {language === 'si' ? config.labelSi : config.label}
                        </span>
                        <span className="text-sm text-gray-500">{count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${config.color}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Alerts Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              Active Alerts
            </h3>
            {data.underReportingAlerts?.length > 0 ? (
              <div className="space-y-3">
                {data.underReportingAlerts.map((alert, idx) => {
                  const severityColors = {
                    critical: 'bg-red-100 border-red-300 text-red-800',
                    warning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
                    attention: 'bg-blue-100 border-blue-300 text-blue-800'
                  };
                  
                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg border ${severityColors[alert.severity] || severityColors.attention}`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium">{alert.type.replace(/_/g, ' ').toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          alert.severity === 'critical' ? 'bg-red-600 text-white' :
                          alert.severity === 'warning' ? 'bg-yellow-600 text-white' :
                          'bg-blue-600 text-white'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GN Division Coverage */}
      {activeView === 'gn' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            {text.gnCoverage}
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-3 font-semibold text-gray-600">{text.gnDivision}</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-600">{text.district}</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-600">{text.reportCount}</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-600">{text.reporters}</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-600">{text.lastReport}</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-600">{text.coverageStatus}</th>
                </tr>
              </thead>
              <tbody>
                {data.gnDivisionCoverage?.slice(0, 50).map((gn, idx) => {
                  const config = COVERAGE_CONFIG[gn.coverageStatus] || COVERAGE_CONFIG.adequate;
                  const Icon = config.icon;
                  
                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium text-gray-800">{gn.gnDivision}</td>
                      <td className="py-3 px-3 text-gray-600">{gn.district}</td>
                      <td className="py-3 px-3 text-center font-bold">{gn.reportCount}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="flex items-center justify-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          {gn.uniqueReporters}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-gray-500">
                        {gn.daysSinceLastReport} {text.daysAgo}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgLight} ${config.textColor}`}>
                          <Icon className="w-3 h-3" />
                          {language === 'si' ? config.labelSi : config.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* District Coverage */}
      {activeView === 'district' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            {text.districtCoverage}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.districtCoverageIndex?.map((district, idx) => (
              <div 
                key={idx}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">{district.district}</h4>
                    <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${BLIND_SPOT_COLORS[district.blindSpotRisk]}`}>
                      {district.blindSpotRisk.toUpperCase()} {text.blindSpotRisk}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">{district.coveragePercent}%</div>
                    <div className="text-xs text-gray-500">{text.coveragePercent}</div>
                  </div>
                </div>
                
                {/* Coverage Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div 
                    className={`h-3 rounded-full ${
                      district.coveragePercent >= 60 ? 'bg-green-500' :
                      district.coveragePercent >= 30 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${district.coveragePercent}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-bold text-gray-700">{district.reportingGnDivisions}</div>
                    <div className="text-xs text-gray-500">Reporting</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-bold text-gray-700">{district.totalReports}</div>
                    <div className="text-xs text-gray-500">{text.reportCount}</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-bold text-gray-700">{district.uniqueReporters}</div>
                    <div className="text-xs text-gray-500">{text.reporters}</div>
                  </div>
                </div>
                
                <div className="p-2 bg-white rounded-lg text-sm text-gray-700">
                  <Eye className="w-4 h-4 inline mr-1 text-emerald-500" />
                  {district.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Detail */}
      {activeView === 'alerts' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            {text.alerts}
          </h3>
          
          {data.underReportingAlerts?.length > 0 ? (
            <div className="space-y-4">
              {data.underReportingAlerts.map((alert, idx) => {
                const severityConfig = {
                  critical: { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-600' },
                  warning: { bg: 'bg-yellow-50', border: 'border-yellow-300', badge: 'bg-yellow-600' },
                  attention: { bg: 'bg-blue-50', border: 'border-blue-300', badge: 'bg-blue-600' }
                };
                const config = severityConfig[alert.severity] || severityConfig.attention;
                
                return (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl border ${config.border} ${config.bg}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-gray-800">
                          {alert.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-white ${config.badge}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{alert.message}</p>
                    
                    {/* Show affected areas/districts */}
                    {alert.areas && (
                      <div className="flex flex-wrap gap-2">
                        {alert.areas.slice(0, 5).map((area, i) => (
                          <span key={i} className="px-2 py-1 bg-white rounded text-xs text-gray-600">
                            {area.gnDivision || area.district}
                            {area.daysSinceLastReport && ` (${area.daysSinceLastReport}d)`}
                          </span>
                        ))}
                        {alert.areas.length > 5 && (
                          <span className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-600">
                            +{alert.areas.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {alert.districts && (
                      <div className="flex flex-wrap gap-2">
                        {alert.districts.map((d, i) => (
                          <span key={i} className="px-2 py-1 bg-white rounded text-xs text-gray-600">
                            {d.district} ({d.coveragePercent}%)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-16 h-16 mx-auto mb-3 text-green-500" />
              <h4 className="font-bold text-lg text-gray-700">All Clear!</h4>
              <p>No under-reporting alerts at this time</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportingCoverageIndex;
