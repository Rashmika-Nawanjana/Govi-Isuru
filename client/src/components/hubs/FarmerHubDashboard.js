import React from 'react';
import { Leaf, Droplets, ShoppingBag, Users, ChevronRight } from 'lucide-react';

const FarmerHubDashboard = ({ lang, user, onNavigate }) => {
  const isEnglish = lang === 'en';

  const hubs = [
    {
      id: 'cropCareHub',
      title: isEnglish ? 'Crop Care Hub' : 'බෝග 관리 තේරීම',
      description: isEnglish 
        ? 'Expert guidance on crop health, disease management, and cultivation best practices'
        : 'බෝග සෞඛ්‍යය, රෝග පාලනය සහ වගා වෙත නිර්දේශ',
      icon: Droplets,
      color: 'from-green-400 to-emerald-600',
      stats: [
        { label: isEnglish ? 'Features' : 'විශේෂිතා', value: '8+' },
        { label: isEnglish ? 'Resources' : 'සම්පත්', value: '50+' }
      ]
    },
    {
      id: 'marketHub',
      title: isEnglish ? 'Market Hub' : 'වෙළඳ තේරීම',
      description: isEnglish
        ? 'Connect with buyers, monitor prices, and maximize your agricultural profits'
        : 'ගැණුම්කරුවරුන් සමඟ සংযোගය, මිල නිරීක්ෂණය සහ ලාභ සর්වාධිකරණය',
      icon: ShoppingBag,
      color: 'from-amber-400 to-orange-600',
      stats: [
        { label: isEnglish ? 'Active Listings' : 'ක්‍රියාශීල ලැයිස්තු', value: '1000+' },
        { label: isEnglish ? 'Buyers' : 'ගැණුම්කරුවරු', value: '500+' }
      ]
    },
    {
      id: 'consultationHub',
      title: isEnglish ? 'Consultation Hub' : 'උපදෙස් තේරීම',
      description: isEnglish
        ? 'Connect with agricultural experts and instructors for personalized farming advice'
        : 'කර්ෂි විශේෂඥයින් සහ උපදේශකයින් සමඟ සම්බන්ධ වන්න',
      icon: Users,
      color: 'from-blue-400 to-cyan-600',
      stats: [
        { label: isEnglish ? 'Experts' : 'විශේෂඥයින්', value: '50+' },
        { label: isEnglish ? 'Sessions' : 'සැසි', value: '2000+' }
      ]
    }
  ];

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-800 dark:text-white mb-2">
          {isEnglish ? 'Farmer Hub' : 'ගොවි තේරීම'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {isEnglish 
            ? 'Your one-stop destination for complete farming solutions'
            : 'සම්පූර්ණ වගාකරණ විසඳුම් සඳහා ඔබගේ එක්ම ස්ථාන'}
        </p>
      </div>

      {/* Welcome Card */}
      <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
        <div className="relative p-6 md:p-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="absolute top-0 right-0 opacity-10">
            <Leaf className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-green-100 mb-2 uppercase tracking-wide">
              {isEnglish ? 'Welcome Back' : 'ආයුබෝවන්'}
            </p>
            <h2 className="text-2xl font-bold mb-3">{user?.username || 'Farmer'}</h2>
            <p className="text-green-50 mb-4 max-w-2xl">
              {isEnglish 
                ? 'Explore our integrated hubs designed to support your farming journey with expert guidance, market opportunities, and community connections.'
                : 'ඔබගේ බෝගකරණ ගමන සඉටු කිරීමට අවශ්‍ය සমස්ত මාධ්‍ය එක ස්ථානයෙන් ලබා ගන්න.'}
            </p>
          </div>
        </div>
      </div>

      {/* Hub Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {hubs.map((hub) => {
          const Icon = hub.icon;
          return (
            <button
              key={hub.id}
              onClick={() => onNavigate(hub.id)}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-95 text-left"
            >
              {/* Color Header */}
              <div className={`h-24 bg-gradient-to-r ${hub.color} relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icon className="w-32 h-32 absolute -top-8 -right-8 text-white" />
                </div>
                <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 md:p-5">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center justify-between">
                  {hub.title}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {hub.description}
                </p>

                {/* Stats */}
                <div className="flex gap-3 justify-between">
                  {hub.stats.map((stat, idx) => (
                    <div key={idx} className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {stat.label}
                      </p>
                      <p className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          {isEnglish ? 'Quick Actions' : 'ඉක්මන් ක්‍රියා'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 transition-colors text-left">
            <p className="font-semibold text-gray-800 dark:text-white mb-1">
              {isEnglish ? 'View My Listings' : 'මගේ ලැයිස්තු බලන්න'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isEnglish ? 'Check your active product listings' : 'ඔබගේ ක්‍රියාශීල දෙපල බලන්න'}
            </p>
          </button>
          <button className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 transition-colors text-left">
            <p className="font-semibold text-gray-800 dark:text-white mb-1">
              {isEnglish ? 'Get Expert Advice' : 'විශේෂඥ උපදෙස් ලබන්න'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isEnglish ? 'Chat with agricultural experts' : 'කර්ෂි විශේෂඥයින් සමඟ සම්බන්ධ වන්න'}
            </p>
          </button>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          {isEnglish 
            ? '💡 Tip: Each hub is designed to help you make better farming decisions'
            : '💡 ඉඟිය: සෑම තේරීම ඔබගේ බෝගකරණ තීරණ සඳහා සැකසී ඇත'}
        </p>
      </div>
    </div>
  );
};

export default FarmerHubDashboard;
