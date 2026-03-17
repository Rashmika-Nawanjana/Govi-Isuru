import React, { useState } from 'react';
import { Leaf, ShoppingBag, TrendingUp, ChevronRight, Sprout, BarChart3, Users } from 'lucide-react';

export default function FarmerHubDashboard({ onSelectHub, lang = 'en' }) {
  const [hoveredHub, setHoveredHub] = useState(null);

  const t = {
    en: {
      cropCare: 'Crop Care',
      cropCareDesc: 'AI diagnosis, disease alerts, crop health monitoring',
      market: 'Market Hub',
      marketDesc: 'Yield forecast, market trends, sell & buy produce',
      consultation: 'Expert Consultation',
      consultationDesc: 'Book expert advice for any crop-related question'
    },
    si: {
      cropCare: 'බෝග සැලකීම',
      cropCareDesc: 'AI රෝගനිදාන, රෝග අනතුරු, බෝග සෞඛ්‍ය අධීක්ෂණ',
      market: 'වෙලඳ සන්දර්භ',
      marketDesc: 'අස්වැන්න පূර්වcatherයාස, වෙලඳ ප්‍රවණතා, නිෂ්පාදන විකිණීම',
      consultation: 'විශේෂඥ උපදේශනය',
      consultationDesc: 'ඕනෑම බෝග ගැටලුවට විශේෂඥ උපදෙස් වෙන්කරවා ගන්න'
    }
  };

  const texts = t[lang] || t.en;

  const hubs = [
    {
      id: 'crop-care',
      icon: Sprout,
      title: texts.cropCare,
      description: texts.cropCareDesc,
      gradient: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-700'
    },
    {
      id: 'market',
      icon: BarChart3,
      title: texts.market,
      description: texts.marketDesc,
      gradient: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-700'
    },
    {
      id: 'consultation',
      icon: Users,
      title: texts.consultation,
      description: texts.consultationDesc,
      gradient: 'from-rose-500 to-purple-600',
      textColor: 'text-rose-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Leaf className="w-8 h-8" />
          <h1 className="text-3xl font-black">Govi Isuru</h1>
        </div>
        <p className="text-green-100 text-lg">
          {lang === 'si'
            ? 'ඔබේ ගොවිතැන ගනුදෙනු සවිබල ගැන්වීම'
            : 'Empower Your Farming Journey'}
        </p>
      </div>

      {/* Hub cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {hubs.map((hub) => {
          const IconComponent = hub.icon;
          const isHovered = hoveredHub === hub.id;

          return (
            <button
              key={hub.id}
              onClick={() => onSelectHub(hub.id)}
              onMouseEnter={() => setHoveredHub(hub.id)}
              onMouseLeave={() => setHoveredHub(null)}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 active:scale-95"
            >
              {/* Card background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${hub.gradient} opacity-90 group-hover:opacity-100 transition-opacity`}
              />

              {/* Content */}
              <div className="relative p-8 flex flex-col justify-between min-h-64 text-white">
                {/* Icon */}
                <div
                  className={`p-4 bg-white/20 rounded-2xl w-fit backdrop-blur-sm group-hover:bg-white/30 transition-all ${
                    isHovered ? 'scale-110' : ''
                  }`}
                >
                  <IconComponent className="w-8 h-8" />
                </div>

                {/* Text */}
                <div className="text-left">
                  <h3 className="text-2xl font-black mb-2 group-hover:translate-x-1 transition-transform">
                    {hub.title}
                  </h3>
                  <p className="text-white/90 text-sm leading-relaxed mb-4">{hub.description}</p>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all">
                    <span>{lang === 'si' ? 'ප්‍රවේශ වන්න' : 'Explore'}</span>
                    <ChevronRight
                      className={`w-5 h-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Hover overlay glow */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
            </button>
          );
        })}
      </div>

      {/* Quick stats footer */}
      <div className="grid grid-cols-3 gap-4 pt-4">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">
            {lang === 'si' ? 'ක්‍රෙඩිට්' : 'Credits'}
          </p>
          <p className="text-2xl font-black text-emerald-700 mt-1">—</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
            {lang === 'si' ? 'සක්‍රිය ගැටලු' : 'Active Cases'}
          </p>
          <p className="text-2xl font-black text-blue-700 mt-1">—</p>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-purple-50 rounded-xl p-4 border border-rose-100">
          <p className="text-xs text-rose-600 font-semibold uppercase tracking-wide">
            {lang === 'si' ? 'වෙන්කරවා ගැනීම්' : 'Bookings'}
          </p>
          <p className="text-2xl font-black text-rose-700 mt-1">—</p>
        </div>
      </div>
    </div>
  );
}
