import React, { useState } from 'react';
import { Droplets, Leaf, AlertCircle, Zap, ArrowLeft, ChevronRight, Search } from 'lucide-react';

const CropCareHub = ({ lang, user, onNavigate, onInteraction }) => {
  const isEnglish = lang === 'en';
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const crops = [
    {
      id: 'rice',
      name: isEnglish ? 'Rice' : 'සහල්',
      icon: '🌾',
      commonDiseases: [
        { name: isEnglish ? 'Blast Disease' : 'පිපිරීම රෝගය', severity: 'high', treatment: isEnglish ? 'Apply fungicide spray' : 'ශක්තිනාශක ස්‍ප්‍රේ' },
        { name: isEnglish ? 'Brown Spot' : 'දුඹුරු ලප', severity: 'medium', treatment: isEnglish ? 'Improve field drainage' : 'ක්ෂේත්ර ජලාපවහන සුધාරණය' }
      ]
    },
    {
      id: 'chili',
      name: isEnglish ? 'Chili' : 'QueensMiris',
      icon: '🌶️',
      commonDiseases: [
        { name: isEnglish ? 'Leaf Spot' : 'කොළ ලප', severity: 'medium', treatment: isEnglish ? 'Use copper fungicide' : 'තඹ ශක්තිනාශක භාවිතා කරන්න' },
        { name: isEnglish ? 'Powdery Mildew' : 'වට්ටේ මිල්ඩ්‍යු', severity: 'low', treatment: isEnglish ? 'Sulfur dust application' : 'සල්ෆර් දූවන ක්‍රම' }
      ]
    },
    {
      id: 'tea',
      name: isEnglish ? 'Tea' : 'තේ',
      icon: '☕',
      commonDiseases: [
        { name: isEnglish ? 'Die-back' : 'දි-බැක්', severity: 'high', treatment: isEnglish ? 'Prune affected branches' : 'බාධිතයි බිම් කපන්න' },
        { name: isEnglish ? 'Red Rust' : 'රතු පර', severity: 'medium', treatment: isEnglish ? 'Apply phosphite fungicide' : 'ෆොස්ෆයිට් ශක්තිනාශක' }
      ]
    },
    {
      id: 'vegetables',
      name: isEnglish ? 'Vegetables' : 'එල්ලු',
      icon: '🥬',
      commonDiseases: [
        { name: isEnglish ? 'Early Blight' : 'නිර්මාණ පිපිරීම', severity: 'high', treatment: isEnglish ? 'Remove infected leaves' : 'සংක්‍රමිත කොළ ඉවත් කරන්න' },
        { name: isEnglish ? 'Damping Off' : 'තෙතමින් අඩු වීම', severity: 'medium', treatment: isEnglish ? 'Use sterile soil' : 'බීජ සෙන්ගලු පිරිවැයිම' }
      ]
    }
  ];

  const careCategories = [
    {
      id: 'watering',
      title: isEnglish ? '💧 Watering Guide' : '💧 ජලය යෙදීමේ මාර්ගෝපදේශ',
      tips: [
        isEnglish ? 'Water early morning or late evening' : 'උදෑසරට හෝ සඳහසට ජලය යෙදින්න',
        isEnglish ? 'Avoid waterlogging' : 'ජල විතිනෙන බිම වලින් වළකින්න',
        isEnglish ? 'Check soil moisture before watering' : 'ජලය මූසල දීමට පෙර පස සෙතලිම පරීක්ෂා කරන්න'
      ]
    },
    {
      id: 'fertilizer',
      title: isEnglish ? '🌱 Fertilizer Schedule' : '🌱 පෝෂක නිර්ධාරණ කාලසටහන',
      tips: [
        isEnglish ? 'Use balanced fertilizer during growth' : 'වර්ධනයේ දී සමිතයට පෝෂක ගැතිය',
        isEnglish ? 'Phosphorus for flowering' : 'ඔටුනක් සඳහා ෆොස්ෆරස්',
        isEnglish ? 'Apply organic compost' : 'ජෛව පිරිසිදුකරණ ඇල්ලුම යෙදින්න'
      ]
    },
    {
      id: 'pruning',
      title: isEnglish ? '✂️ Pruning Techniques' : '✂️ විතර කැපීම් තාක්ෂණ',
      tips: [
        isEnglish ? 'Remove dead branches' : 'මිනි බිම් කපන්න',
        isEnglish ? 'Improve air circulation' : 'වායු සිරෙස වැඩි කරන්න',
        isEnglish ? 'Shape plant for better yield' : 'වඩා හොඳ අස්වැන්න සඳහා ශාකෙ හැඩ සටහන'
      ]
    }
  ];

  const filteredCrops = crops.filter(crop =>
    crop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedCrop) {
    const crop = crops.find(c => c.id === selectedCrop);
    return (
      <div className="w-full">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setSelectedCrop(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {isEnglish ? 'Back' : 'ගමන් ගි'}
          </button>
          <div>
            <p className="text-4xl mb-2">{crop.icon}</p>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{crop.name} {isEnglish ? 'Care' : 'පිණිස'}</h1>
          </div>
        </div>

        {/* Common Diseases */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            {isEnglish ? 'Common Diseases' : 'සාමාන්‍ය රෝග'}
          </h2>
          <div className="grid gap-4">
            {crop.commonDiseases.map((disease, idx) => (
              <div key={idx} className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-red-700 dark:text-red-400 text-lg">{disease.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 ${
                      disease.severity === 'high' ? 'bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-200' :
                      disease.severity === 'medium' ? 'bg-yellow-200 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200' :
                      'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-200'
                    }`}>
                      {isEnglish ? disease.severity.toUpperCase() : (disease.severity === 'high' ? 'ඉහළ' : disease.severity === 'medium' ? 'මධ්‍ය' : 'අඩු')}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <strong>{isEnglish ? 'Treatment:' : 'ප්‍රතිකාරය:'}</strong> {disease.treatment}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Expert Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {careCategories.map((category) => (
            <div key={category.id} className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3">{category.title}</h3>
              <ul className="space-y-2">
                {category.tips.map((tip, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-2">
          <Droplets className="w-8 h-8 text-green-600" />
          {isEnglish ? 'Crop Care Hub' : 'බෝග 관리 තේරීම'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isEnglish 
            ? 'Expert guidance for healthy crops and disease prevention'
            : 'සෞඛ්‍ය රෙෙක්ෂිතවන ගස් සහ රෝග වලින් බේරා ගැනීම'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8 relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={isEnglish ? 'Search crops...' : 'බෝග සොයන්න...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Crop Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {filteredCrops.map((crop) => (
          <button
            key={crop.id}
            onClick={() => setSelectedCrop(crop.id)}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-95 text-left p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-5xl">{crop.icon}</span>
              <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{crop.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {isEnglish ? `${crop.commonDiseases.length} common diseases` : `${crop.commonDiseases.length} රෝග`}
            </p>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-semibold">
              {isEnglish ? 'View Care Guide' : 'බලන්න මාර්ගෝපදේශ'} →
            </div>
          </button>
        ))}
      </div>

      {/* General Care Tips */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          {isEnglish ? 'General Care Tips' : 'සාමාන්‍ය බලපු ඉඟිකස්'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {careCategories.map((category) => (
            <div key={category.id} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3">{category.title}</h3>
              <ul className="space-y-2">
                {category.tips.slice(0, 2).map((tip, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CropCareHub;
