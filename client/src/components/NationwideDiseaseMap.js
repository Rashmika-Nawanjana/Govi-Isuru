import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Globe,
  AlertTriangle,
  MapPin,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Shield,
  Calendar,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Search,
  X,
  Info
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

// Sri Lankan districts for filter
const SRI_LANKA_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Moneragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
];

const severityConfig = {
  critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', badge: 'bg-red-500', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', badge: 'bg-orange-500', dot: 'bg-orange-500' },
  medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', badge: 'bg-yellow-500', dot: 'bg-yellow-500' },
  low: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-500', dot: 'bg-blue-500' },
  none: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', badge: 'bg-gray-500', dot: 'bg-gray-400' }
};

const NationwideDiseaseMap = ({ user, language = 'en' }) => {
  const [reports, setReports] = useState([]);
  const [districtSummary, setDistrictSummary] = useState([]);
  const [diseaseSummary, setDiseaseSummary] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDistrict, setExpandedDistrict] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);
  const [activeTab, setActiveTab] = useState('districts');

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedDisease, setSelectedDisease] = useState('');
  const [days, setDays] = useState(30);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const t = {
    en: {
      title: 'Nationwide Disease Reports',
      subtitle: 'Verified disease reports from all districts across Sri Lanka',
      districts: 'By District',
      diseases: 'By Disease',
      reports: 'All Reports',
      filters: 'Filters',
      clearFilters: 'Clear All',
      district: 'District',
      allDistricts: 'All Districts',
      crop: 'Crop',
      allCrops: 'All Crops',
      disease: 'Disease',
      allDiseases: 'All Diseases',
      timeRange: 'Time Range',
      last7: 'Last 7 Days',
      last30: 'Last 30 Days',
      last90: 'Last 90 Days',
      refresh: 'Refresh',
      loading: 'Loading verified reports...',
      noData: 'No verified disease reports found',
      noDataSub: 'Try adjusting the filters or time range',
      totalVerified: 'Total Verified',
      districtsAffected: 'Districts Affected',
      diseasesFound: 'Diseases Found',
      verifiedBy: 'Verified by',
      reportedOn: 'Reported',
      confidence: 'AI Confidence',
      reportsCount: 'reports',
      search: 'Search districts or diseases...',
      gnDivision: 'GN Division',
      dsDivision: 'DS Division',
      severity: 'Severity',
      detectedIn: 'detected in',
      avgConfidence: 'Avg. Confidence',
      latestReport: 'Latest',
      viewReports: 'View Reports',
      verifiedBadge: 'Officer Verified'
    },
    si: {
      title: 'දිවයින පුරා රෝග වාර්තා',
      subtitle: 'ශ්‍රී ලංකාවේ සියලුම දිස්ත්‍රික්කවල සත්‍යාපිත රෝග වාර්තා',
      districts: 'දිස්ත්‍රික්ක අනුව',
      diseases: 'රෝග අනුව',
      reports: 'සියලු වාර්තා',
      filters: 'පෙරහන්',
      clearFilters: 'සියල්ල මකන්න',
      district: 'දිස්ත්‍රික්කය',
      allDistricts: 'සියලුම දිස්ත්‍රික්ක',
      crop: 'බෝගය',
      allCrops: 'සියලුම බෝග',
      disease: 'රෝගය',
      allDiseases: 'සියලුම රෝග',
      timeRange: 'කාල පරාසය',
      last7: 'පසුගිය දින 7',
      last30: 'පසුගිය දින 30',
      last90: 'පසුගිය දින 90',
      refresh: 'නැවුම් කරන්න',
      loading: 'සත්‍යාපිත වාර්තා පූරණය වෙමින්...',
      noData: 'සත්‍යාපිත රෝග වාර්තා හමු නොවීය',
      noDataSub: 'පෙරහන් හෝ කාල පරාසය වෙනස් කර බලන්න',
      totalVerified: 'මුළු සත්‍යාපිත',
      districtsAffected: 'බලපෑමට ලක් දිස්ත්‍රික්ක',
      diseasesFound: 'හමුවූ රෝග',
      verifiedBy: 'සත්‍යාපනය කළේ',
      reportedOn: 'වාර්තා කළ',
      confidence: 'AI විශ්වාසනීයත්වය',
      reportsCount: 'වාර්තා',
      search: 'දිස්ත්‍රික්ක හෝ රෝග සොයන්න...',
      gnDivision: 'ග්‍රා.නි. කොට්ඨාසය',
      dsDivision: 'ප්‍රා.ලේ. කොට්ඨාසය',
      severity: 'බරපතලකම',
      detectedIn: 'හමු වූ',
      avgConfidence: 'සාමාන්‍ය විශ්වාසය',
      latestReport: 'මෑත',
      viewReports: 'වාර්තා බලන්න',
      verifiedBadge: 'නිලධාරී සත්‍යාපිතයි'
    }
  };

  const text = t[language] || t.en;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { days };
      if (selectedDistrict) params.district = selectedDistrict;
      if (selectedCrop) params.crop = selectedCrop;
      if (selectedDisease) params.disease = selectedDisease;

      const response = await axios.get(`${API_BASE}/api/alerts/nationwide-diseases`, { params });

      setReports(response.data.reports || []);
      setDistrictSummary(response.data.districtSummary || []);
      setDiseaseSummary(response.data.diseaseSummary || []);
      setTotalCount(response.data.totalCount || 0);
    } catch (err) {
      console.error('Error fetching nationwide diseases:', err);
      setError(language === 'si' ? 'දත්ත පූරණය අසාර්ථක විය' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [days, selectedDistrict, selectedCrop, selectedDisease, language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearFilters = () => {
    setSelectedDistrict('');
    setSelectedCrop('');
    setSelectedDisease('');
    setDays(30);
    setSearchQuery('');
  };

  const hasFilters = selectedDistrict || selectedCrop || selectedDisease || days !== 30;

  // Unique crops and diseases from data for filter dropdowns
  const availableCrops = [...new Set(reports.map(r => r.crop))].sort();
  const availableDiseases = [...new Set(reports.map(r => r.disease))].sort();

  // Filtered lists based on search
  const filteredDistricts = districtSummary.filter(d =>
    !searchQuery || d.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.diseases.some(dis => dis.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredDiseases = diseaseSummary.filter(d =>
    !searchQuery || d.disease.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.districts.some(dist => dist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredReports = reports.filter(r =>
    !searchQuery ||
    r.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.disease.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.gnDivision.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.crop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(language === 'si' ? 'si-LK' : 'en-LK', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const getSeverity = (sev) => severityConfig[sev] || severityConfig.none;

  // Check if this is the user's own district
  const isMyDistrict = (district) => user?.district === district;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl md:rounded-3xl p-4 md:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
                <Globe className="w-6 h-6 md:w-8 md:h-8" />
                {text.title}
              </h1>
              <p className="text-white/80 mt-1 text-sm md:text-base">{text.subtitle}</p>
              {user?.district && (
                <div className="flex items-center gap-2 mt-2 md:mt-3 text-xs md:text-sm bg-white/15 w-fit px-3 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5" />
                  {language === 'si' ? `ඔබ: ${user.district}` : `You: ${user.district}`}
                </div>
              )}
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title={text.refresh}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4 md:mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold">{totalCount}</div>
                <div className="text-xs md:text-sm text-white/80">{text.totalVerified}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold">{districtSummary.length}</div>
                <div className="text-xs md:text-sm text-white/80">{text.districtsAffected}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold">{diseaseSummary.length}</div>
                <div className="text-xs md:text-sm text-white/80">{text.diseasesFound}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search + Filters Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg p-3 md:p-4 space-y-3">
        {/* Search Row */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={text.search}
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 md:px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              showFilters || hasFilters
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden md:inline">{text.filters}</span>
            {hasFilters && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            {/* District Filter */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 block">{text.district}</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full text-sm py-2 px-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white"
              >
                <option value="">{text.allDistricts}</option>
                {SRI_LANKA_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d} {isMyDistrict(d) ? '⭐' : ''}</option>
                ))}
              </select>
            </div>

            {/* Crop Filter */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 block">{text.crop}</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full text-sm py-2 px-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white"
              >
                <option value="">{text.allCrops}</option>
                {['Rice', 'Tea', 'Chili'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Disease Filter */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 block">{text.disease}</label>
              <select
                value={selectedDisease}
                onChange={(e) => setSelectedDisease(e.target.value)}
                className="w-full text-sm py-2 px-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white"
              >
                <option value="">{text.allDiseases}</option>
                {availableDiseases.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Time Range */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 block">{text.timeRange}</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full text-sm py-2 px-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white"
              >
                <option value={7}>{text.last7}</option>
                <option value={30}>{text.last30}</option>
                <option value={90}>{text.last90}</option>
              </select>
            </div>

            {/* Clear Filters */}
            {hasFilters && (
              <div className="col-span-2 md:col-span-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> {text.clearFilters}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg p-1.5 md:p-2 flex gap-1.5 md:gap-2">
        {[
          { id: 'districts', label: text.districts, icon: MapPin },
          { id: 'diseases', label: text.diseases, icon: AlertTriangle },
          { id: 'reports', label: text.reports, icon: BarChart3 }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 md:px-4 py-2.5 rounded-lg md:rounded-xl font-medium text-xs md:text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">{text.loading}</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">{error}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200">
              {text.refresh}
            </button>
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-bold text-lg">{text.noData}</p>
            <p className="text-gray-500 text-sm mt-1">{text.noDataSub}</p>
          </div>
        ) : (
          <>
            {/* Districts Tab */}
            {activeTab === 'districts' && (
              <div className="space-y-3">
                {filteredDistricts.map((item, idx) => {
                  const isExpanded = expandedDistrict === item.district;
                  const isMine = isMyDistrict(item.district);
                  const districtReports = reports.filter(r => r.district === item.district);

                  return (
                    <div key={item.district} className={`bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-md border-2 overflow-hidden transition-all ${
                      isMine ? 'border-indigo-300 dark:border-indigo-600' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                    }`}>
                      <button
                        onClick={() => setExpandedDistrict(isExpanded ? null : item.district)}
                        className="w-full p-4 md:p-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-lg ${
                            item.count >= 10 ? 'bg-gradient-to-br from-red-500 to-orange-500' :
                            item.count >= 5 ? 'bg-gradient-to-br from-orange-500 to-amber-500' :
                            'bg-gradient-to-br from-yellow-500 to-green-500'
                          }`}>
                            {item.count}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-gray-800 dark:text-white text-sm md:text-base">
                                {item.district}
                              </h3>
                              {isMine && (
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] md:text-xs font-bold rounded-full">
                                  {language === 'si' ? 'ඔබේ දිස්ත්‍රික්කය' : 'Your District'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {item.diseases.slice(0, 3).map((d, dIdx) => (
                                <span key={dIdx} className="text-[10px] md:text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                  {d}
                                </span>
                              ))}
                              {item.diseases.length > 3 && (
                                <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                                  +{item.diseases.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:inline">
                            {formatDate(item.latestReport)}
                          </span>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                      </button>

                      {/* Expanded district details */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-3 md:p-5 space-y-2 md:space-y-3">
                          {districtReports.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">{text.noData}</p>
                          ) : (
                            districtReports.slice(0, 10).map((report, rIdx) => {
                              const sev = getSeverity(report.severity);
                              return (
                                <div key={report.id || rIdx} className={`flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 ${sev.bg}`}>
                                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${sev.dot}`} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-sm text-gray-800 dark:text-white">{report.disease}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">{report.crop}</span>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${sev.badge}`}>{report.severity}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 text-[11px] md:text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {report.gnDivision}, {report.dsDivision}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Shield className="w-3 h-3 text-green-500" />
                                        {report.verifiedBy}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(report.reportedAt)}
                                      </span>
                                      {report.confidence > 0 && (
                                        <span className="flex items-center gap-1">
                                          <TrendingUp className="w-3 h-3" />
                                          {Math.round(report.confidence * 100)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          {districtReports.length > 10 && (
                            <p className="text-center text-xs text-gray-500 pt-2">
                              {language === 'si' ? `තවත් ${districtReports.length - 10}ක් ඇත` : `${districtReports.length - 10} more reports`}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredDistricts.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{language === 'si' ? 'ප්‍රතිඵල හමු නොවීය' : 'No matching results'}</p>
                  </div>
                )}
              </div>
            )}

            {/* Diseases Tab */}
            {activeTab === 'diseases' && (
              <div className="space-y-3">
                {filteredDiseases.map((item, idx) => (
                  <div key={item.disease} className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-md p-4 md:p-5 hover:shadow-lg transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-800 dark:text-white text-sm md:text-base">{item.disease}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${
                            item.count >= 10 ? 'bg-red-500' : item.count >= 5 ? 'bg-orange-500' : 'bg-yellow-500'
                          }`}>
                            {item.count} {text.reportsCount}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {item.districts.length} {text.detectedIn} {item.districts.length === 1 ? (language === 'si' ? 'දිස්ත්‍රික්ක 1' : '1 district') : (language === 'si' ? `දිස්ත්‍රික්ක ${item.districts.length}` : `${item.districts.length} districts`)}
                          </span>
                          {item.avgConfidence > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5" />
                              {text.avgConfidence}: {item.avgConfidence}%
                            </span>
                          )}
                        </div>
                        {/* District chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {item.districts.map((dist, dIdx) => (
                            <span key={dIdx} className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full font-medium ${
                              isMyDistrict(dist)
                                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                              {dist} {isMyDistrict(dist) ? '⭐' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                        <Shield className="w-3.5 h-3.5" />
                        <span className="text-[10px] md:text-xs font-bold">{text.verifiedBadge}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredDiseases.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{language === 'si' ? 'ප්‍රතිඵල හමු නොවීය' : 'No matching results'}</p>
                  </div>
                )}
              </div>
            )}

            {/* All Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-2 md:space-y-3">
                {/* Info notice about verification */}
                <div className="flex items-start gap-2.5 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-xl text-xs md:text-sm text-indigo-700 dark:text-indigo-300">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'si'
                      ? 'මෙහි ඇත්තේ නිලධාරීන් විසින් සත්‍යාපනය කරන ලද රෝග වාර්තා පමණි. ඔබේ GN කොට්ඨාසයේ අනතුරු ඇඟවීම් සඳහා "රෝග අනතුරු ඇඟවීම්" කොටස භාවිතා කරන්න.'
                      : 'Only officer-verified disease reports are shown here. For alerts specific to your GN Division, use the "Disease Alerts" section.'
                    }
                  </span>
                </div>

                {filteredReports.map((report, idx) => {
                  const sev = getSeverity(report.severity);
                  const isExpanded = expandedReport === report.id;
                  const isMine = isMyDistrict(report.district);

                  return (
                    <div key={report.id || idx} className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border-l-4 ${
                      report.severity === 'critical' ? 'border-red-500' :
                      report.severity === 'high' ? 'border-orange-500' :
                      report.severity === 'medium' ? 'border-yellow-500' :
                      'border-blue-500'
                    }`}>
                      <button
                        onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                        className="w-full p-3 md:p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 flex-wrap">
                            <span className="font-bold text-sm text-gray-800 dark:text-white">{report.disease}</span>
                            <span className="text-[10px] md:text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">{report.crop}</span>
                            <span className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded text-white ${sev.badge}`}>{report.severity}</span>
                            {isMine && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded font-bold">
                                {language === 'si' ? 'ඔබේ දිස්ත්‍රික්කය' : 'Your District'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            <span className="text-[10px] md:text-xs text-gray-400 hidden sm:inline">{formatDate(report.reportedAt)}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 mt-1.5 text-[10px] md:text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.district}</span>
                          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-500" />{text.verifiedBadge}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-gray-700 p-3 md:p-4 bg-gray-50 dark:bg-gray-900/50">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs md:text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-semibold mb-0.5">{text.gnDivision}</span>
                              <span className="font-medium text-gray-800 dark:text-white">{report.gnDivision}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-semibold mb-0.5">{text.dsDivision}</span>
                              <span className="font-medium text-gray-800 dark:text-white">{report.dsDivision}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-semibold mb-0.5">{text.verifiedBy}</span>
                              <span className="font-medium text-gray-800 dark:text-white flex items-center gap-1">
                                <Shield className="w-3 h-3 text-green-500" />
                                {report.verifiedBy}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-semibold mb-0.5">{text.confidence}</span>
                              <span className="font-medium text-gray-800 dark:text-white">
                                {report.confidence > 0 ? `${Math.round(report.confidence * 100)}%` : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredReports.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{language === 'si' ? 'ප්‍රතිඵල හමු නොවීය' : 'No matching results'}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NationwideDiseaseMap;
