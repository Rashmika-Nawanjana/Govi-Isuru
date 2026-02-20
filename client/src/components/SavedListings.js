import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bookmark, MapPin, Phone, User, Sprout, MessageCircle, Star, 
  CheckCircle, MessageSquare, X, Loader
} from 'lucide-react';
import ReputationBadge from './ReputationBadge';
import FeedbackForm from './FeedbackForm';
import FeedbackList from './FeedbackList';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

const SavedListings = ({ lang, currentUser, onNavigate }) => {
  const [savedListings, setSavedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackListing, setFeedbackListing] = useState(null);
  const [viewFeedbackListing, setViewFeedbackListing] = useState(null);

  const t = {
    en: {
      title: 'Saved Listings',
      subtitle: 'Your bookmarked marketplace items',
      empty: 'No saved listings yet',
      emptyDesc: 'Browse the marketplace and save listings you\'re interested in',
      browseMarket: 'Browse Marketplace',
      contactWa: 'WhatsApp',
      contactCall: 'Call Now',
      rateSeller: 'Rate Seller',
      viewReviews: 'View Reviews',
      verified: 'Verified',
      unsave: 'Remove from saved',
      sales: 'Sales',
      rating: 'Rating',
      loading: 'Loading your saved listings...'
    },
    si: {
      title: 'සුරක්ෂිත ලැයිස්තු',
      subtitle: 'ඔබ සලකුණු කළ වෙළඳපල අයිතම',
      empty: 'තවම සුරක්ෂිත ලැයිස්තු නැත',
      emptyDesc: 'වෙළඳපලෙහි සැරිසරන්න සහ ඔබට කැමති දැන්වීම් සුරකින්න',
      browseMarket: 'වෙළඳසැල බලන්න',
      contactWa: 'WhatsApp',
      contactCall: 'දැන් අමතන්න',
      rateSeller: 'අලෙවිකරුවා ශ්‍රේණිගත කරන්න',
      viewReviews: 'සමාලෝචන බලන්න',
      verified: 'සත්‍යාපිත',
      unsave: 'සුරැකීමෙන් ඉවත් කරන්න',
      sales: 'විකුණුම්',
      rating: 'ශ්‍රේණිගත',
      loading: 'ඔබේ සුරක්ෂිත ලැයිස්තු පූරණය වෙමින්...'
    }
  };

  useEffect(() => {
    fetchSavedListings();
  }, []);

  const fetchSavedListings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/api/saved-listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSavedListings(res.data.listings || []);
    } catch (err) {
      console.error('Failed to fetch saved listings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (listingId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.post(
        `${API_BASE}/api/saved-listings/toggle/${listingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove from local state
      setSavedListings(savedListings.filter(listing => listing._id !== listingId));
    } catch (err) {
      console.error('Failed to unsave listing', err);
      alert(lang === 'en' ? 'Failed to remove listing' : 'දැන්වීම ඉවත් කිරීමට අසමත් විය');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-in fade-in">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="h-12 w-12 text-green-600 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t[lang].loading}</p>
        </div>
      </div>
    );
  }

  if (savedListings.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2">
            <Bookmark className="h-7 w-7" />
            {t[lang].title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t[lang].subtitle}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Bookmark className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t[lang].empty}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t[lang].emptyDesc}</p>
          <button
            onClick={() => onNavigate && onNavigate('marketplace')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
          >
            {t[lang].browseMarket}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2">
          <Bookmark className="h-7 w-7" />
          {t[lang].title}
        </h2>
        <p className="text-gray-600 mt-1">
          {savedListings.length} {lang === 'en' 
            ? `saved ${savedListings.length === 1 ? 'listing' : 'listings'}`
            : 'සුරක්ෂිත දැන්වීම්'
          }
        </p>
      </div>

      {/* Saved Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {savedListings.map((item) => (
          <div key={item._id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md hover:shadow-xl transition-all border-l-4 border-yellow-500 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-green-500" /> {item.cropType}
                </h4>
                <div className="flex items-center gap-2">
                  {item.verified && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle size={12} /> {t[lang].verified}
                    </span>
                  )}
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">{item.quantity}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-700 mb-3">Rs. {item.price}</p>
              
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2"><User size={14} /> {item.farmerName}</p>
                  {item.farmer_id && (
                    <ReputationBadge 
                      score={item.farmer_id.reputation_score || 3.0}
                      isVerified={item.farmer_id.is_verified_farmer}
                      size="sm"
                      lang={lang}
                    />
                  )}
                </div>
                <p className="flex items-center gap-2"><MapPin size={14} /> {item.location}</p>
                <p className="flex items-center gap-2 font-bold text-gray-800 dark:text-white"><Phone size={14} /> {item.phone}</p>
              </div>

              {/* Farmer Stats */}
              {item.farmer_id && item.farmer_id.total_sales > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 mb-4 flex items-center justify-around text-xs">
                  <div className="text-center">
                    <p className="font-bold text-gray-800 dark:text-white">{item.farmer_id.total_sales}</p>
                    <p className="text-gray-500 dark:text-gray-400">{t[lang].sales}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-600"></div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800 dark:text-white">{item.farmer_id.reputation_score?.toFixed(1) || '3.0'}</p>
                    <p className="text-gray-500 dark:text-gray-400">{t[lang].rating}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Contact Actions */}
              <div className="grid grid-cols-2 gap-2">
                <a 
                  href={`https://wa.me/${
                    item.phone.replace(/\s/g, '').startsWith('0') 
                      ? '94' + item.phone.replace(/\s/g, '').substring(1) 
                      : item.phone.replace(/\s/g, '')
                  }?text=${encodeURIComponent(
                    lang === 'si' 
                      ? `ආයුබෝවන් ${item.farmerName}, මම ඔබේ ${item.cropType} අස්වැන්න ගැන විමසීමට කැමතියි (Govi Isuru හරහා).` 
                      : `Hello ${item.farmerName}, I am interested in your ${item.cropType} harvest posted on Govi Isuru.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-2 rounded-xl font-bold text-xs hover:bg-[#128C7E] transition shadow-sm"
                >
                  <MessageCircle size={16} /> {t[lang].contactWa}
                </a>

                <a 
                  href={`tel:${item.phone}`}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl font-bold text-xs hover:bg-blue-700 transition shadow-sm"
                >
                  <Phone size={16} /> {t[lang].contactCall}
                </a>
              </div>

              {/* Rate Seller & View Reviews */}
              <div className="grid grid-cols-2 gap-2">
                {currentUser && currentUser._id !== item.farmer_id?._id && (
                  <button
                    onClick={() => setFeedbackListing(item)}
                    className="flex items-center justify-center gap-1 bg-amber-100 text-amber-700 py-2 rounded-xl font-bold text-xs hover:bg-amber-200 transition"
                  >
                    <Star size={14} /> {t[lang].rateSeller}
                  </button>
                )}
                
                <button
                  onClick={() => setViewFeedbackListing(item)}
                  className={`flex items-center justify-center gap-1 py-2 rounded-xl font-bold text-xs transition ${
                    currentUser && currentUser._id !== item.farmer_id?._id 
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'col-span-2 bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  <MessageSquare size={14} /> {t[lang].viewReviews}
                </button>
              </div>

              {/* Unsave Button */}
              <button
                onClick={() => handleUnsave(item._id)}
                className="w-full flex items-center justify-center gap-1 bg-red-100 text-red-700 py-2 rounded-xl font-bold text-xs hover:bg-red-200 transition"
              >
                <X size={14} /> {t[lang].unsave}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback Form Modal */}
      {feedbackListing && (
        <FeedbackForm
          listing={feedbackListing}
          onClose={() => setFeedbackListing(null)}
          onSubmit={() => {
            setFeedbackListing(null);
            fetchSavedListings();
          }}
          lang={lang}
        />
      )}

      {/* View Feedbacks Modal */}
      {viewFeedbackListing && (
        <FeedbackList
          listing={viewFeedbackListing}
          onClose={() => setViewFeedbackListing(null)}
          lang={lang}
        />
      )}
    </div>
  );
};

export default SavedListings;
