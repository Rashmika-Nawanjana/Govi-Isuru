import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Map,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Target,
  Navigation,
  Eye,
  Shield,
  Zap
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Risk level configuration
const RISK_CONFIG = {
  critical: {
    color: 'bg-red-600',
    textColor: 'text-red-600',
    borderColor: 'border-red-500',
    bgLight: 'bg-red-100',
    label: 'Critical',
    labelSi: 'විවේචනාත්මක',
    intensity: 100
  },
  high: {
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-500',
    bgLight: 'bg-orange-100',
    label: 'High',
    labelSi: 'ඉහළ',
    intensity: 75
  },
  medium: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-500',
    bgLight: 'bg-yellow-100',
    label: 'Medium',
    labelSi: 'මධ්‍යම',
    intensity: 50
  },
  low: {
    color: 'bg-green-500',
    textColor: 'text-green-600',
    borderColor: 'border-green-500',
    bgLight: 'bg-green-100',
    label: 'Low',
    labelSi: 'අඩු',
    intensity: 25
  }
};

const SpreadRiskMapping = ({ user, language = 'en' }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('heatmap');
  const [days, setDays] = useState(14);

  const t = {
    en: {
      title: 'Spread Risk Mapping',
      subtitle: 'Geographic risk analysis and spread prediction',
      loading: 'Analyzing spread patterns...',
      noData: 'No spread data available',
      heatmap: 'Risk Heatmap',
      neighbors: 'Neighbor Zones',
      predictions: 'Spread Predictions',
      districtRisk: 'District Risk',
      gnDivision: 'GN Division',
      reportCount: 'Reports',
      diseases: 'Diseases',
      riskLevel: 'Risk Level',
      intensity: 'Intensity',
      lastReport: 'Last Report',
      daysAgo: 'days ago',
      adjacentTo: 'Adjacent to',
      recommendation: 'Recommendation',
      spreadProbability: 'Spread Probability',
      criticalZones: 'Critical Zones',
      highRiskZones: 'High Risk Zones',
      watchZones: 'Watch Zones',
      totalAffected: 'Total Affected',
      confirmedSpread: 'Confirmed Spread',
      highProbability: 'High Probability',
      mediumProbability: 'Medium Probability'
    },
    si: {
      title: 'පැතිරීමේ අවදානම් සිතියම්ගත කිරීම',
      subtitle: 'භූගෝලීය අවදානම් විශ්ලේෂණය සහ පැතිරීම් පුරෝකථනය',
      loading: 'පැතිරීමේ රටා විශ්ලේෂණය කරමින්...',
      noData: 'පැතිරීමේ දත්ත නොමැත',
      heatmap: 'අවදානම් තාප සිතියම',
      neighbors: 'අසල්වැසි කලාප',
      predictions: 'පැතිරීම් පුරෝකථන',
      districtRisk: 'දිස්ත්‍රික් අවදානම',
      gnDivision: 'GN කොට්ඨාසය',
      reportCount: 'වාර්තා',
      diseases: 'රෝග',
      riskLevel: 'අවදානම් මට්ටම',
      intensity: 'තීව්‍රතාව',
      lastReport: 'අවසාන වාර්තාව',
      daysAgo: 'දින පෙර',
      adjacentTo: 'අසල',
      recommendation: 'නිර්දේශය',
      spreadProbability: 'පැතිරීමේ සම්භාවිතාව',
      criticalZones: 'විවේචනාත්මක කලාප',
      highRiskZones: 'ඉහළ අවදානම් කලාප',
      watchZones: 'නිරීක්ෂණ කලාප',
      totalAffected: 'මුළු බලපෑම',
      confirmedSpread: 'තහවුරු පැතිරීම',
      highProbability: 'ඉහළ සම්භාවිතාව',
      mediumProbability: 'මධ්‍යම සම්භාවිතාව'
    }
  };

  const text = t[language] || t.en;
  const getToken = () => localStorage.getItem('token');

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/analytics/spread-risk`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { days }
      });
      setData(response.data);
    } catch (err) {
      console.error('Error fetching spread risk data:', err);
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
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
        <p className="text-gray-600">{text.loading}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <Map className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">{text.noData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Map className="w-6 h-6" />
              {text.title}
            </h2>
            <p className="text-blue-200 text-sm mt-1">{text.subtitle}</p>
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Summary Stats */}
        {data.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{data.summary.totalAffectedGnDivisions}</div>
              <div className="text-xs text-blue-200">{text.totalAffected}</div>
            </div>
            <div className="bg-red-500/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{data.summary.criticalZones}</div>
              <div className="text-xs text-blue-200">{text.criticalZones}</div>
            </div>
            <div className="bg-orange-500/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{data.summary.highRiskZones}</div>
              <div className="text-xs text-blue-200">{text.highRiskZones}</div>
            </div>
            <div className="bg-yellow-500/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{data.summary.watchZones}</div>
              <div className="text-xs text-blue-200">{text.watchZones}</div>
            </div>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-2 flex flex-wrap gap-2">
        {[
          { id: 'heatmap', label: text.heatmap, icon: Target },
          { id: 'neighbors', label: text.neighbors, icon: Navigation },
          { id: 'predictions', label: text.predictions, icon: Zap },
          { id: 'districts', label: text.districtRisk, icon: MapPin }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeView === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Heatmap View */}
      {activeView === 'heatmap' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-600" />
            {text.heatmap}
          </h3>
          
          {/* Risk Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {Object.entries(RISK_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${config.color}`}></div>
                <span className="text-sm text-gray-600">
                  {language === 'si' ? config.labelSi : config.label}
                </span>
              </div>
            ))}
          </div>

          {/* Heatmap Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
            {data.heatmapData?.map((zone, idx) => {
              const riskConfig = RISK_CONFIG[zone.riskLevel] || RISK_CONFIG.low;
              
              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border-l-4 ${riskConfig.borderColor} ${riskConfig.bgLight} hover:shadow-md transition-all`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-gray-800">{zone.gnDivision}</h4>
                      <p className="text-xs text-gray-500">{zone.dsDivision}, {zone.district}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold text-white ${riskConfig.color}`}>
                      {zone.intensityScore}%
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {zone.reportCount} {text.reportCount}
                    </span>
                    <span className="text-gray-500">
                      {zone.lastReportDaysAgo} {text.daysAgo}
                    </span>
                  </div>
                  
                  {zone.diseases && zone.diseases.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {zone.diseases.slice(0, 3).map((disease, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-gray-600">
                          {disease}
                        </span>
                      ))}
                      {zone.diseases.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-200 rounded text-xs text-gray-600">
                          +{zone.diseases.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Neighbor Risk Zones */}
      {activeView === 'neighbors' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-orange-600" />
            {text.neighbors}
          </h3>
          
          {data.neighborRiskZones?.length > 0 ? (
            <div className="space-y-3">
              {data.neighborRiskZones.map((zone, idx) => (
                <div 
                  key={idx}
                  className="p-4 bg-orange-50 rounded-xl border border-orange-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-gray-800">{zone.gnDivision}</h4>
                      <p className="text-sm text-orange-600">
                        {text.adjacentTo}: <span className="font-medium">{zone.adjacentTo}</span>
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      zone.predictedRisk === 'elevated' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {zone.predictedRisk === 'elevated' ? 'ELEVATED' : 'WATCH'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{zone.currentReports} {text.reportCount}</span>
                    <span className="text-orange-600">
                      Adjacent Risk: {zone.adjacentRiskLevel}
                    </span>
                  </div>
                  
                  <div className="p-2 bg-white rounded-lg text-sm text-gray-700">
                    <Eye className="w-4 h-4 inline mr-1 text-orange-500" />
                    {zone.recommendation}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No neighbor risk zones identified</p>
          )}
        </div>
      )}

      {/* Spread Predictions */}
      {activeView === 'predictions' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            {text.predictions}
          </h3>
          
          {data.predictedSpreadAreas?.length > 0 ? (
            <div className="space-y-3">
              {data.predictedSpreadAreas.map((area, idx) => {
                const probabilityColors = {
                  confirmed_spread: 'bg-red-600 text-white',
                  high: 'bg-orange-500 text-white',
                  medium: 'bg-yellow-500 text-white'
                };
                
                return (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl border-l-4 ${
                      area.spreadProbability === 'confirmed_spread' 
                        ? 'border-red-500 bg-red-50' 
                        : area.spreadProbability === 'high'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-yellow-500 bg-yellow-50'
                    } hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">{area.district}</h4>
                        <p className="text-sm text-gray-600">
                          {text.adjacentTo}: <span className="font-medium">{area.adjacentTo}</span>
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${probabilityColors[area.spreadProbability]}`}>
                        {area.spreadProbability === 'confirmed_spread' 
                          ? text.confirmedSpread
                          : area.spreadProbability === 'high'
                            ? text.highProbability
                            : text.mediumProbability}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>{area.currentReports} current {text.reportCount}</span>
                      <span>Source: {area.sourceRiskLevel} risk</span>
                    </div>
                    
                    <div className="p-2 bg-white rounded-lg text-sm text-gray-700">
                      <Shield className="w-4 h-4 inline mr-1 text-purple-500" />
                      {area.recommendation}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No spread predictions available</p>
          )}
        </div>
      )}

      {/* District Risk Map */}
      {activeView === 'districts' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            {text.districtRisk}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.districtRiskMap?.map((district, idx) => {
              const riskConfig = RISK_CONFIG[district.riskLevel] || RISK_CONFIG.low;
              
              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border ${riskConfig.borderColor} ${riskConfig.bgLight} hover:shadow-md transition-all`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{district.district}</h4>
                      <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-white ${riskConfig.color}`}>
                        {language === 'si' ? riskConfig.labelSi : riskConfig.label} Risk
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">{district.reportCount}</div>
                      <div className="text-xs text-gray-500">{text.reportCount}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div className="bg-white rounded p-2 text-center">
                      <div className="font-bold text-gray-700">{district.affectedAreas}</div>
                      <div className="text-xs text-gray-500">Areas</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center">
                      <div className="font-bold text-gray-700">{district.diseases?.length || 0}</div>
                      <div className="text-xs text-gray-500">{text.diseases}</div>
                    </div>
                  </div>
                  
                  {district.neighborDistricts?.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Neighbors:</span>{' '}
                      {district.neighborDistricts.slice(0, 3).join(', ')}
                      {district.neighborDistricts.length > 3 && ` +${district.neighborDistricts.length - 3}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpreadRiskMapping;
