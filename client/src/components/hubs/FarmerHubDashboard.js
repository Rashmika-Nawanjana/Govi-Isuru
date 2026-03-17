import React from 'react';
import { Leaf, Droplets, ShoppingBag, Users, ChevronRight } from 'lucide-react';

const FarmerHubDashboard = ({ lang, user, onNavigate }) => {
  const isEnglish = lang === 'en';

  const hubs = [
    {
      id: 'cropCareHub',
      title: isEnglish ? 'Crop Care Hub' : 'බෝග 관리 හබ්',
      subtitle: isEnglish ? 'Disease Management' : 'රෝග පාලනය',
      description: isEnglish 
        ? 'Expert guidance on crop health, disease detection, and cultivation best practices'
        : 'බෝග සෞඛ්‍යය, රෝග සොයාගැනීම සහ වගා පිණිසටත්',
      icon: Droplets,
      color: 'from-green-400 to-emerald-600',
      borderColor: 'border-green-500',
      bgLight: 'bg-green-50',
      bgLightDark: 'dark:bg-green-900/20',
      buttonText: isEnglish ? 'Explore Hub' : 'හබ් ගවේෂණය කරන්න',
      emoji: '🌱'
    },
    {
      id: 'marketHub',
      title: isEnglish ? 'Market Hub' : 'වෙළඳ හබ්',
      subtitle: isEnglish ? 'Connect with Buyers' : 'ගැණුම්කරුවරුන් සමඟ සංයුක්ත',
      description: isEnglish
        ? 'Connect with buyers, monitor market prices, and maximize your agricultural profits'
        : 'ගැණුම්කරුවරුන් සමඟ සංයුක්ත, මිල නිරීක්ෂණය සහ ලාභ සර්වාධිකරණය',
      icon: ShoppingBag,
      color: 'from-amber-400 to-orange-600',
      borderColor: 'border-amber-500',
      bgLight: 'bg-amber-50',
      bgLightDark: 'dark:bg-amber-900/20',
      buttonText: isEnglish ? 'Explore Hub' : 'හබ් ගවේෂණය කරන්න',
      emoji: '📦'
    },
    {
      id: 'consultationHub',
      title: isEnglish ? 'Consultation Hub' : 'උපදෙස් හබ්',
      subtitle: isEnglish ? 'Expert Guidance' : 'විශේෂඥ භාරකරු',
      description: isEnglish
        ? 'Connect with agricultural experts and instructors for personalized farming advice'
        : 'කර්ෂි විශේෂඥයින් සහ උපදේශකයින් සමඟ සම්බන්ධ වන්න',
      icon: Users,
      color: 'from-blue-400 to-cyan-600',
      borderColor: 'border-blue-500',
      bgLight: 'bg-blue-50',
      bgLightDark: 'dark:bg-blue-900/20',
      buttonText: isEnglish ? 'Explore Hub' : 'හබ් ගවේෂණය කරන්න',
      emoji: '👥'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className="text-center py-8 md:py-12 px-4">
        <div className="mb-4 flex items-center justify-center">
          <Leaf className="w-10 h-10 text-green-600 dark:text-green-400 mr-3" />
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
            {isEnglish ? 'Govi Isuru' : 'ගොවි ඉසුරු'}
          </h1>
        </div>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 font-semibold mb-2">
          {isEnglish 
            ? 'The Unified Farming Ecosystem'
            : 'එකීකෘත ගොවිතැන ඉකෙසිස්ටම්'}
        </p>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-500">
          {isEnglish
            ? 'Connecting Farmers, Experts, and Markets for Agricultural Excellence'
            : 'ගොවීන්, විශේෂඥයින් සහ වෙළඳ කර්ෂි excellence සඳහා සංයුක්ත'}
        </p>
      </div>

      {/* Main Content - Hub Tiles */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Intro Text */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-3">
            {isEnglish ? 'Choose Your Hub' : 'ඔබගේ හබ් තෝරන්න'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {isEnglish
              ? 'Select a hub to access specialized tools and resources to enhance your farming operations'
              : 'ඔබගේ ගොවිතැන ක්‍රියාකාරකම් වැඩි කිරීමට විශේෂිත මාධ්‍ය ප්‍රවේශ වීමට එක හබ් තෝරන්න'}
          </p>
        </div>

        {/* Hub Cards Grid - Larger and Prominent */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {hubs.map((hub) => {
            const Icon = hub.icon;
            return (
              <button
                key={hub.id}
                onClick={() => onNavigate(hub.id)}
                className={`group bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-[1.03] active:scale-95 text-left border-2 ${hub.borderColor} hover:border-opacity-100 border-opacity-50`}
              >
                {/* Color Header - Larger */}
                <div className={`h-32 md:h-40 bg-gradient-to-r ${hub.color} relative overflow-hidden flex items-center justify-center`}>
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icon className="w-48 h-48 absolute -top-16 -right-16 text-white" />
                  </div>
                  <div className="relative z-10 text-5xl md:text-6xl">
                    {hub.emoji}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                  <p className="text-xs md:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {hub.subtitle}
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-3">
                    {hub.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base mb-6 leading-relaxed">
                    {hub.description}
                  </p>

                  {/* Button */}
                  <button
                    className={`w-full py-3 px-4 rounded-xl font-bold text-lg transition-all duration-200 text-white bg-gradient-to-r ${hub.color} hover:shadow-lg active:scale-95 flex items-center justify-center gap-2`}
                  >
                    {hub.buttonText}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </button>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 md:p-12 mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">
            {isEnglish ? 'Why Choose Govi Isuru?' : 'ගොවි ඉසුරු තෝරා ගන්නේ ඇයි?'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-2">
                {isEnglish ? 'Expert Guidance' : 'විශේෂඥ භාරකරු'}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {isEnglish 
                  ? 'Access to agricultural experts and proven practices'
                  : 'කර්ෂි විශේෂඥයින් සහ ඔප්පු විටෙ කර්ණිකතාවට ප්‍රවේශ'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-2">
                {isEnglish ? 'Market Insights' : 'වෙළඳ තොරතුරු'}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {isEnglish
                  ? 'Real-time price tracking and buyer connections'
                  : 'සජීවී මිල ලුහුබඩු සහ ගැණුම්කරු සම්බන්ධතා'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-2">
                {isEnglish ? 'Grow Your Business' : 'ඔබගේ ව්‍යවසාය වර්ධනය කරන්න'}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {isEnglish
                  ? 'Tools and resources to scale your farming operations'
                  : 'ඔබගේ ගොවිතැන මාපකිරීම් සඳහා මාධ්‍ය සහ සම්පත්'}
              </p>
            </div>
          </div>
        </div>

        {/* Welcome Note */}
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm md:text-base">
            {isEnglish 
              ? `Welcome, ${user?.username || 'Farmer'}! 👋 Select a hub to get started.`
              : `ආයුබෝවන්, ${user?.username || 'ගොවි'}! 👋 ශුරු කිරීමට හබ් තෝරන්න.`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FarmerHubDashboard;
