import React, { useState } from 'react';
import { ArrowLeft, Sprout, Search, FileText, AlertTriangle, CloudSun, Droplets } from 'lucide-react';

import AIDoctor from './AIDoctor';
import MyReports from './MyReports';
import AlertsDashboard from './AlertsDashboard';
import WeatherAdvisor from './WeatherAdvisor';
import CropSuitability from './CropSuitability';

export default function CropCareHub({ onBack, user, language = 'en', onInteraction }) {
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [coords] = useState({ lat: parseFloat(user?.gnDivision || 8.3114), lon: 80.4037 });

  const t = {
    en: {
      title: 'Crop Care Hub',
      diagnosis: 'AI Diagnosis',
      myReports: 'My Reports',
      alerts: 'Disease Alerts',
      weather: 'Weather Advisory',
      suitability: 'Crop Suitability'
    },
    si: {
      title: 'බෝග සැලකීම',
      diagnosis: 'AI රෝගනිදාන',
      myReports: 'මගේ වාර්තා',
      alerts: 'රෝග අනතුරු',
      weather: 'කාලගුණ උපදෙස්',
      suitability: 'බෝග සුදුසුකම'
    }
  };

  const text = t[language] || t.en;

  const tabs = [
    { id: 'diagnosis', label: text.diagnosis, icon: Search },
    { id: 'myReports', label: text.myReports, icon: FileText },
    { id: 'alerts', label: text.alerts, icon: AlertTriangle },
    { id: 'weather', label: text.weather, icon: CloudSun },
    { id: 'suitability', label: text.suitability, icon: Droplets }
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
          <Sprout className="w-6 h-6 text-emerald-600" />
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
                  ? 'bg-emerald-600 text-white shadow-md'
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
        {activeTab === 'diagnosis' && <AIDoctor lang={language} user={user} onInteraction={onInteraction} />}
        {activeTab === 'myReports' && <MyReports user={user} lang={language} />}
        {activeTab === 'alerts' && <AlertsDashboard user={user} language={language} />}
        {activeTab === 'weather' && <WeatherAdvisor lang={language} lat={coords.lat} lon={coords.lon} user={user} />}
        {activeTab === 'suitability' && <CropSuitability lang={language} user={user} coords={coords} onInteraction={onInteraction} />}
      </div>
    </div>
  );
}
