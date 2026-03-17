import React from 'react';
import { ShoppingBag } from 'lucide-react';

const MarketHub = ({ lang, activeView, onNavigate, children }) => {
  const tabs = [
    { id: 'market', label: lang === 'si' ? 'වෙළඳසැල' : 'Marketplace' },
    { id: 'trends', label: lang === 'si' ? 'මිල ප්‍රවණතා' : 'Market Trends' },
    { id: 'news', label: lang === 'si' ? 'ගොවි ප්‍රවෘත්ති' : 'Agri News' },
    { id: 'riceVarieties', label: lang === 'si' ? 'සහල් වර්ග' : 'Rice Varieties' }
  ];

  const currentTab = tabs.some((tab) => tab.id === activeView) ? activeView : 'market';

  return (
    <div className="w-full space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100 dark:border-gray-700 shadow-sm p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            {lang === 'si' ? 'වෙළඳ හබ්' : 'Market Hub'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    isActive
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-amber-400'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
};

export default MarketHub;
