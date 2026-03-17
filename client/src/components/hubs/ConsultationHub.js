import React, { useState } from 'react';
import { Users, MessageSquare, Clock, Star, Calendar, ArrowRight } from 'lucide-react';

const ConsultationHub = ({ lang, user, onNavigate, onInteraction }) => {
  const isEnglish = lang === 'en';
  const [selectedTab, setSelectedTab] = useState('experts');

  const experts = [
    {
      id: 1,
      name: 'Dr. Sanjeev Kumar',
      specialty: isEnglish ? 'Rice Cultivation' : 'සහල් වගා',
      experience: '20 years',
      rating: 4.9,
      ratePerSession: 'LKR 500',
      availability: isEnglish ? 'Available Now' : 'දැන්වე ඇත',
      avatar: '🧑‍⚕️',
      bio: isEnglish ? 'Expert in modern rice farming techniques' : 'නවීන සහල් වගා ශිල්පරතුවලට ඇති'
    },
    {
      id: 2,
      name: 'Pradeep Jayasuriya',
      specialty: isEnglish ? 'Organic Farming' : 'ජෛව ගොවිතැන',
      experience: '15 years',
      rating: 4.8,
      ratePerSession: 'LKR 600',
      availability: isEnglish ? 'Available in 2 hours' : '2 පැයෙන් පසු හැකි',
      avatar: '👨‍🌾',
      bio: isEnglish ? 'Certified organic farming specialist' : 'සහතිකිත ජෛව ගොවිතැන විශේෂඥ'
    },
    {
      id: 3,
      name: 'Dr. Lakshmi De Silva',
      specialty: isEnglish ? 'Plant Diseases' : 'ශාක රෝග',
      experience: '18 years',
      rating: 4.9,
      ratePerSession: 'LKR 700',
      availability: isEnglish ? 'Available Tomorrow' : 'හෙට ඇත',
      avatar: '👩‍⚕️',
      bio: isEnglish ? 'Plant pathologist and disease management expert' : 'ශාක පෙතිකරණවලාදිකරු'
    },
    {
      id: 4,
      name: 'Rajesh Patel',
      specialty: isEnglish ? 'Market & Business' : 'වෙළඳ සහ ව්‍යවසාය',
      experience: '12 years',
      rating: 4.7,
      ratePerSession: 'LKR 550',
      availability: isEnglish ? 'Available Now' : 'දැන්වේ ඇත',
      avatar: '💼',
      bio: isEnglish ? 'Business strategy and market analysis expert' : ' STATUS නීතිය සහ වෙළඳ විශ්ලේෂණ'
    }
  ];

  const consultationTypes = [
    {
      id: 'video',
      title: isEnglish ? '📹 Video Call' : '📹 වීඩියෝ ඇමතුම',
      duration: isEnglish ? '30 min' : '30 තිස්.',
      price: 'LKR 500',
      description: isEnglish ? 'Face-to-face consultation' : 'මුහුණ සම්මුකයක සම්මතකරමු',
      icon: '📹'
    },
    {
      id: 'chat',
      title: isEnglish ? '💬 Chat Session' : '💬 කතා සැසිය',
      duration: isEnglish ? 'Unlimited' : 'අසීමිතවයි',
      price: 'LKR 300',
      description: isEnglish ? 'Real-time text messaging' : 'ගින්නා ගිය පෙළ පණිවිඩ',
      icon: '💬'
    },
    {
      id: 'scheduled',
      title: isEnglish ? '📅 Scheduled Calls' : '📅 නිර්ධාරිත ඇමතුම්',
      duration: isEnglish ? 'As needed' : 'අවශ්‍යයි විට',
      price: 'LKR 2000',
      description: isEnglish ? 'Weekly expert guidance' : 'සතිකේ විශේෂඥ භාරකරු',
      icon: '📅'
    },
    {
      id: 'group',
      title: isEnglish ? '👥 Group Sessions' : '👥 සමූහ සැසි',
      duration: isEnglish ? '1 hour' : '1 ස.',
      price: 'LKR 1500',
      description: isEnglish ? 'Learn with other farmers' : 'වෙනත් ගොවීන් සමඟ ඉගෙන ගන්න',
      icon: '👥'
    }
  ];

  const upcomingSessions = [
    {
      id: 1,
      expert: 'Dr. Sanjeev Kumar',
      topic: isEnglish ? 'Rice Cultivation Techniques' : 'සහල් වගා ශිල්ප',
      date: isEnglish ? 'Tomorrow at 3:00 PM' : 'හෙට දින 3:00',
      participants: 12
    }
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-2">
          <Users className="w-8 h-8 text-blue-600" />
          {isEnglish ? 'Consultation Hub' : 'උපදෙස් තේරීම'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isEnglish 
            ? 'Connect with agricultural experts and get personalized farming advice'
            : 'කර්ෂි විශේෂඥයින් සමඟ සංයුක්ත වන්න සහ ব්‍යක්තිමත් ගොවිතැන උපදෙස ලබන්න'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setSelectedTab('experts')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
            selectedTab === 'experts'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400'
          }`}
        >
          {isEnglish ? '👨‍⚕️ Experts' : '👨‍⚕️ විශේෂඥයින්'}
        </button>
        <button
          onClick={() => setSelectedTab('types')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
            selectedTab === 'types'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400'
          }`}
        >
          {isEnglish ? '📋 Services' : '📋 සේවාවන්'}
        </button>
        <button
          onClick={() => setSelectedTab('sessions')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
            selectedTab === 'sessions'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400'
          }`}
        >
          {isEnglish ? '📅 My Sessions' : '📅 මගේ සැසි'}
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'experts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {experts.map((expert) => (
            <div key={expert.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Expert Header */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 flex items-start gap-4">
                <div className="text-4xl">{expert.avatar}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">{expert.name}</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">{expert.specialty}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{expert.rating}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({expert.experience})</span>
                  </div>
                </div>
              </div>

              {/* Expert Info */}
              <div className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{expert.bio}</p>

                {/* Status Badge */}
                <div className="mb-4 inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                  {expert.availability}
                </div>

                {/* Price and Action */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{isEnglish ? 'Per Session' : 'සැසිය පිණිසට'}</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{expert.ratePerSession}</p>
                  </div>
                  <button
                    onClick={() => {
                      onInteraction?.();
                      // Could navigate to booking or show booking modal
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                  >
                    {isEnglish ? 'Book' : 'ඔබ කරන්න'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {consultationTypes.map((type) => (
            <button
              key={type.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-left hover:scale-[1.02] active:scale-95"
            >
              <div className="text-5xl mb-4">{type.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{type.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{type.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{type.duration}</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{type.price}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedTab === 'sessions' && (
        <div className="space-y-4">
          {upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <div key={session.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{session.expert}</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-1">{session.topic}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                    {isEnglish ? 'Scheduled' : 'නිර්ධාරිතයි'}
                  </span>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{session.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{session.participants} {isEnglish ? 'attendees' : 'සහභාගිකරුවරු'}</span>
                  </div>
                  <button className="ml-auto px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-semibold text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                    {isEnglish ? 'Join' : 'එක්ව'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {isEnglish ? 'No scheduled sessions yet' : 'තවම නිර්ධාරිත සැසි නැත'}
              </p>
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                {isEnglish ? 'Schedule Now' : 'දැන්ම නිර්ධාරණය කරන්න'}
              </button>
            </div>
          )}

          {/* Available Sessions to Join */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              {isEnglish ? 'Join Live Group Sessions' : 'සජීවී සමූහ සැසි එක් වන්න'}
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <h4 className="font-bold text-gray-800 dark:text-white mb-2">
                  {isEnglish ? 'Rice Cultivation Techniques' : 'සහල් වගා ශිල්ප'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {isEnglish ? 'Dr. Sanjeev Kumar' : 'ඩොක්ටර් සංජීව කුමාර'} • {isEnglish ? 'Today at 3:00 PM' : 'අද දින 3:00'}
                </p>
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                  {isEnglish ? 'Join Now' : 'දැන් එක් වන්න'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-gray-800 dark:text-white mb-4">
          {isEnglish ? '❓ Quick Tips' : '❓ ඉක්මන් ඉඟි'}
        </h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li>• {isEnglish ? 'Prepare your questions beforehand for better consultations' : 'වඩා හොඳ උපදෙස් සඳහා ඔබගේ ප්‍රශ්න කලින් සූදානම් කරන්න'}</li>
          <li>• {isEnglish ? 'Have your photo/video ready for video calls' : 'ඡායා/වීඩියෝ ඇමතුම් සඳහා සූදානම් කරන්න'}</li>
          <li>• {isEnglish ? 'Sessions are recorded for your future reference' : 'සැසි ඔබගේ ඉදිරි යොමුව සඳහා පටිගත කෙරෙයි'}</li>
        </ul>
      </div>
    </div>
  );
};

export default ConsultationHub;
