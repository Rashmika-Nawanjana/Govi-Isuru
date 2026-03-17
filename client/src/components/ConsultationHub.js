import React, { useState } from 'react';
import { ArrowLeft, Users, CalendarDays } from 'lucide-react';

import FarmerManualBooking from './FarmerManualBooking';
import InstructorBookingManager from './InstructorBookingManager';

export default function ConsultationHub({ onBack, user, language = 'en', onInteraction }) {
  const [activeTab, setActiveTab] = useState(user?.role === 'officer' ? 'manage' : 'book');

  const t = {
    en: {
      title: 'Expert Consultation',
      book: 'Book Consultation',
      manage: 'Manage Bookings'
    },
    si: {
      title: 'විශේෂඥ උපදේශනය',
      book: 'උපදේශනය වෙන්කරවා ගන්න',
      manage: 'වෙන්කරවා ගැනීම් කළමනාකරණය'
    }
  };

  const text = t[language] || t.en;

  // Determine which tabs to show based on user role
  const isFarmer = !user?.role || user?.role === 'farmer';
  const isInstructor = user?.role === 'officer';

  const tabs = [];
  if (isFarmer) {
    tabs.push({ id: 'book', label: text.book, icon: CalendarDays });
  }
  if (isInstructor) {
    tabs.push({ id: 'manage', label: text.manage, icon: Users });
  }

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
          <Users className="w-6 h-6 text-rose-600" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{text.title}</h2>
        </div>
      </div>

      {/* Sub-tabs - only show if multiple roles */}
      {tabs.length > 1 && (
        <div className="flex gap-2 pb-2 px-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div className="pt-2">
        {isFarmer && activeTab === 'book' && <FarmerManualBooking lang={language} onInteraction={onInteraction} />}
        {isInstructor && activeTab === 'manage' && <InstructorBookingManager lang={language} onInteraction={onInteraction} />}
      </div>
    </div>
  );
}
