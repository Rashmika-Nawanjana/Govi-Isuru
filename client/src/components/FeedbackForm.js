import React, { useState } from 'react';
import axios from 'axios';
import { Star, Send, X, MessageSquare, CheckCircle } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

/**
 * FeedbackForm - Submit buyer feedback for a listing
 */
const FeedbackForm = ({ 
  listing, 
  onClose, 
  onSubmit, 
  lang = 'en' 
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const texts = {
    en: {
      title: 'Rate Your Purchase',
      subtitle: 'Help other buyers by sharing your experience',
      cropLabel: 'Crop',
      farmerLabel: 'Farmer',
      yourName: 'Your Name',
      yourPhone: 'Your Phone (for verification)',
      ratingLabel: 'Overall Rating',
      ratingRequired: 'Please select a rating',
      commentLabel: 'Your Feedback (Optional)',
      commentPlaceholder: 'Share your experience with this farmer...',
      submitBtn: 'Submit Feedback',
      submitting: 'Submitting...',
      successTitle: 'Thank You!',
      successMsg: 'Your feedback helps build trust in our farming community.',
      closeBtn: 'Close',
      ratingTexts: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
    },
    si: {
      title: 'ඔබගේ මිලදී ගැනීම ශ්‍රේණිගත කරන්න',
      subtitle: 'ඔබගේ අත්දැකීම් බෙදාගැනීමෙන් අනෙකුත් ගැනුම්කරුවන්ට උදව් කරන්න',
      cropLabel: 'බෝගය',
      farmerLabel: 'ගොවියා',
      yourName: 'ඔබගේ නම',
      yourPhone: 'ඔබගේ දුරකථනය (සත්‍යාපනය සඳහා)',
      ratingLabel: 'සමස්ත ශ්‍රේණිගත කිරීම',
      ratingRequired: 'කරුණාකර ශ්‍රේණිගත කිරීමක් තෝරන්න',
      commentLabel: 'ඔබගේ ප්‍රතිපෝෂණය (විකල්ප)',
      commentPlaceholder: 'මෙම ගොවියා සමඟ ඔබේ අත්දැකීම් බෙදාගන්න...',
      submitBtn: 'ප්‍රතිපෝෂණය ඉදිරිපත් කරන්න',
      submitting: 'ඉදිරිපත් කරමින්...',
      successTitle: 'ස්තූතියි!',
      successMsg: 'ඔබගේ ප්‍රතිපෝෂණය අපගේ ගොවිතැන් ප්‍රජාවේ විශ්වාසය ගොඩනැගීමට උපකාරී වේ.',
      closeBtn: 'වසන්න',
      ratingTexts: ['දුර්වල', 'සාමාන්‍ය', 'හොඳ', 'ඉතා හොඳ', 'විශිෂ්ට']
    }
  };

  const t = texts[lang] || texts.en;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError(t.ratingRequired);
      return;
    }

    if (!buyerName.trim()) {
      setError(lang === 'si' ? 'කරුණාකර ඔබගේ නම ඇතුළත් කරන්න' : 'Please enter your name');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/api/reputation/feedback`,
        {
          listing_id: listing._id,
          farmer_id: listing.farmer_id?._id || listing.farmer_id,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          rating,
          comment
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      setSuccess(true);
      if (onSubmit) {
        onSubmit();
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(
        err.response?.data?.error || 
        (lang === 'si' ? 'ප්‍රතිපෝෂණය ඉදිරිපත් කිරීමට අසමත් විය' : 'Failed to submit feedback')
      );
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{t.successTitle}</h3>
          <p className="text-gray-600 mb-6">{t.successMsg}</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-bold">{t.title}</h2>
                <p className="text-green-100 text-sm">{t.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Listing Info */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t.cropLabel}:</span>
            <span className="font-bold text-gray-800">{listing.cropType}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-500">{t.farmerLabel}:</span>
            <span className="font-medium text-gray-800">{listing.farmerName}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Rating Stars */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.ratingLabel} *
            </label>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={`transition-colors ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {(hoveredRating || rating) > 0 && (
                <span className="text-sm font-medium text-gray-600">
                  {t.ratingTexts[(hoveredRating || rating) - 1]}
                </span>
              )}
            </div>
          </div>

          {/* Buyer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.yourName} *
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder={lang === 'si' ? 'ඔබගේ නම ඇතුළත් කරන්න' : 'Enter your name'}
              required
            />
          </div>

          {/* Buyer Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.yourPhone}
            </label>
            <input
              type="tel"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="07XXXXXXXX"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.commentLabel}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
              placeholder={t.commentPlaceholder}
              maxLength={500}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || rating === 0}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
              loading || rating === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? (
              t.submitting
            ) : (
              <>
                <Send size={18} />
                {t.submitBtn}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
