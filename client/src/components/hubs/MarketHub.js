import React, { useState } from 'react';
import { ShoppingBag, TrendingUp, Users, Map, ArrowRight } from 'lucide-react';

const MarketHub = ({ lang, user, onNavigate, onInteraction }) => {
  const isEnglish = lang === 'en';
  const [activeTab, setActiveTab] = useState('buyers');

  const marketOpportunities = [
    {
      id: 1,
      type: isEnglish ? 'Wholesale' : 'තොග විකිණුම',
      crop: isEnglish ? 'Rice' : 'සහල්',
      price: 'LKR 45/kg',
      quantity: '1000 kg',
      buyer: 'Colombo Rice Traders',
      rating: 4.8,
      icon: '🌾'
    },
    {
      id: 2,
      type: isEnglish ? 'Premium' : 'ප්‍රිමිયම්',
      crop: isEnglish ? 'Organic Chili' : 'ගිණුම් Miris',
      price: 'LKR 120/kg',
      quantity: '500 kg',
      buyer: 'Green Valley Exports',
      rating: 4.9,
      icon: '🌶️'
    },
    {
      id: 3,
      type: isEnglish ? 'Direct' : 'සෘජු',
      crop: isEnglish ? 'Fresh Vegetables' : 'එල්ලු',
      price: 'LKR 65/kg',
      quantity: '200 kg',
      buyer: 'City Markets',
      rating: 4.6,
      icon: '🥬'
    }
  ];

  const sellerProfile = [
    { label: isEnglish ? 'Total Sales' : 'මුළු විකිණුම්', value: 'LKR 250,000' },
    { label: isEnglish ? 'Ratings' : 'තක්තා', value: '4.7 ⭐' },
    { label: isEnglish ? 'Active Listings' : 'ක්‍රියාශීල ලැයිස්තු', value: '8' },
    { label: isEnglish ? 'Verified Buyers' : 'තහවුරුව ගැණුම්කරුවරු', value: '24' }
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-2">
          <ShoppingBag className="w-8 h-8 text-amber-600" />
          {isEnglish ? 'Market Hub' : 'වෙළඳ තේරීම'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isEnglish 
            ? 'Connect with buyers and maximize your agricultural profits'
            : 'ගැණුම්කරුවරුන් සමඟ සංයුක්ත වොට ඔබගේ කර්ෂි ලාභ උච්චතම කරන්න'}
        </p>
      </div>

      {/* Seller Profile Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-wide">
              {isEnglish ? 'Your Profile' : 'ඔබගේ පැතිකඩ'}
            </p>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{user?.username || 'Farmer'}</h2>
          </div>
          <div className="text-4xl">👨‍🌾</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sellerProfile.map((item, idx) => (
            <div key={idx} className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">{item.label}</p>
              <p className="text-lg md:text-xl font-bold text-amber-700 dark:text-amber-300">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('buyers')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'buyers'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {isEnglish ? '🏪 Buyers' : '🏪 ගැණුම්කරුවරු'}
        </button>
        <button
          onClick={() => setActiveTab('prices')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'prices'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {isEnglish ? '📊 Price Trends' : '📊 මිල ප්‍රවණතා'}
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'insights'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {isEnglish ? '💡 Market Insights' : '💡 වෙළඳ තොරතුරු'}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'buyers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {marketOpportunities.map((op) => (
            <div
              key={op.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-3xl mb-2">{op.icon}</p>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">{op.crop}</h3>
                  <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-semibold mt-2">
                    {op.type}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{op.price}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{op.quantity}</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">{op.buyer}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">⭐ {op.rating} rating</p>
              </div>
              <button className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                {isEnglish ? 'View Details' : 'විස්තර බලන්න'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'prices' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            {isEnglish ? 'Current Market Prices' : 'වර්තමාන වෙළඳ මිල'}
          </h3>
          <div className="space-y-4">
            {[
              { crop: isEnglish ? 'Rice' : 'සහල්', price: 'LKR 45-50/kg', trend: 'up' },
              { crop: isEnglish ? 'Chili' : 'Miris', price: 'LKR 110-130/kg', trend: 'stable' },
              { crop: isEnglish ? 'Tea' : 'තේ', price: 'LKR 380-420/kg', trend: 'down' },
              { crop: isEnglish ? 'Vegetables' : 'එල්ලු', price: 'LKR 60-75/kg', trend: 'up' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">{item.crop}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.price}</p>
                </div>
                <span className={`text-lg font-bold ${
                  item.trend === 'up' ? 'text-green-600' : item.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {item.trend === 'up' ? '📈' : item.trend === 'down' ? '📉' : '→'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">
              {isEnglish ? '📈 Market Opportunity' : '📈 වෙළඳ අවස්ථාව'}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {isEnglish 
                ? 'Rice prices are trending upward. Consider increasing production for premium sales.'
                : 'සහල් මිල ඉහළට ගමන් කරයි. ප්‍රිමියම් විකිණුම් සඳහා නිෂ්පාදනය වැඩි කිරීම සලකා බලන්න.'}
            </p>
            <button className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
              {isEnglish ? 'Learn More →' : 'තව දැනගන්න →'}
            </button>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">
              {isEnglish ? '🌱 Growing Demand' : '🌱 වර්ධනයක් ඉල්ලුම්'}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {isEnglish 
                ? 'Organic vegetables see 40% higher demand. Buyers actively seeking certified growers.'
                : 'ඉතින් ගිණුම් එල්ලු 40% වඩා අධිකවිකිණුම සිටිතුයි. ගැණුම්කරුවරු සක්‍රියව සහතිකිත ශිල්පbrusseker සොයනවා.'}
            </p>
            <button className="text-green-600 dark:text-green-400 font-semibold text-sm">
              {isEnglish ? 'Apply Today →' : 'අද යොමු කරන්න →'}
            </button>
          </div>
        </div>
      )}

      {/* Quick Action Footer */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white mb-1">
            {isEnglish ? 'Ready to list your products?' : 'ඔබගේ දෙපල ලැයිස්තුගත කිරීමට සූදානම්?'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isEnglish ? 'Connect with verified buyers across Sri Lanka' : 'ශ්‍රී ලංකා ඉතුරුවේ තහවුරුත ගැණුම්කරුවරුන් සමඟ සංයුක්ත වන්න'}
          </p>
        </div>
        <button
          onClick={() => onNavigate('marketplace')}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
        >
          {isEnglish ? 'List Now' : 'ගින් ඉහළට'}
        </button>
      </div>
    </div>
  );
};

export default MarketHub;
