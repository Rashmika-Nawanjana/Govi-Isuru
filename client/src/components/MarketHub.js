import React, { useState } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, ShoppingBag, Newspaper } from 'lucide-react';

import YieldPrediction from './YieldPrediction';
import MarketTrends from './MarketTrends';
import Marketplace from './Marketplace';
import AgriNews from './AgriNews';

export default function MarketHub({ onBack, user, language = 'en', onInteraction }) {
  const [activeTab, setActiveTab] = useState('yield');

  const t = {
    en: {
      title: 'Market Hub',
      yield: 'Yield Forecast',
      trends: 'Market Trends',
      marketplace: 'Marketplace',
      news: 'Agri News'
    },
    si: {
      title: 'වෙලඳ සන්දර්භ',
      yield: 'අස්වැන්න පූර්වcatherයාස',
      trends: 'වෙලඳ ප්‍රවණතා',
      marketplace: 'අලෙවිසැල',
      news: 'ගොවි ප්‍රවෘත්ති'
    }
  };

  const text = t[language] || t.en;

  const tabs = [
    { id: 'yield', label: text.yield, icon: BarChart3 },
    { id: 'trends', label: text.trends, icon: TrendingUp },
    { id: 'marketplace', label: text.marketplace, icon: ShoppingBag },
    { id: 'news', label: text.news, icon: Newspaper }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Back to hubs"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{text.title}</h2>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 px-1">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap font-semibold text-sm transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="pt-2">
        {activeTab === 'yield' && <YieldPrediction lang={language} onInteraction={onInteraction} />}
        {activeTab === 'trends' && <MarketTrends lang={language} />}
        {activeTab === 'marketplace' && <Marketplace lang={language} currentUser={user} onInteraction={onInteraction} />}
        {activeTab === 'news' && <AgriNews lang={language} user={user} />}
      </div>
    </div>
  );
}
