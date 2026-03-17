import React from 'react';
import { Droplets } from 'lucide-react';

const CropCareHub = ({ lang, activeView, onNavigate, children }) => {
  const tabs = [
    { id: 'doctor', label: lang === 'si' ? 'AI වෛද්‍ය' : 'AI Doctor' },
    { id: 'weather', label: lang === 'si' ? 'කාලගුණය' : 'Weather Advisory' },
    { id: 'alerts', label: lang === 'si' ? 'අනතුරු ඇඟවීම්' : 'Disease Alerts' },
    { id: 'suitability', label: lang === 'si' ? 'බෝග සුදුසුකම' : 'Crop Suitability' },
    { id: 'yield', label: lang === 'si' ? 'අස්වැන්න' : 'Yield Forecast' }
  ];

  const currentTab = tabs.some((tab) => tab.id === activeView) ? activeView : 'doctor';

  return (
    <div className="w-full space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-green-100 dark:border-gray-700 shadow-sm p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5 text-green-600" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            {lang === 'si' ? 'බෝග 관리 හබ්' : 'Crop Care Hub'}
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
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-green-400'
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

export default CropCareHub;
