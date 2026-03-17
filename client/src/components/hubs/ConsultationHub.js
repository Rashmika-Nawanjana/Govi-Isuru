import React from 'react';
import { Users } from 'lucide-react';

const ConsultationHub = ({ lang, activeView, onNavigate, children }) => {
  const tabs = [
    { id: 'manualBooking', label: lang === 'si' ? 'වෙන්කරවා ගැනීම' : 'Manual Booking' },
    { id: 'myReports', label: lang === 'si' ? 'මගේ වාර්තා' : 'My Reports' }
  ];

  const currentTab = tabs.some((tab) => tab.id === activeView) ? activeView : 'manualBooking';

  return (
    <div className="w-full space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-sm p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            {lang === 'si' ? 'උපදෙස් හබ්' : 'Consultation Hub'}
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
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-blue-400'
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

export default ConsultationHub;
