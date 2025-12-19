import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Star, 
  X, 
  MessageSquare, 
  User, 
  Calendar,
  ThumbsUp,
  Award
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * FeedbackList - Display feedbacks for a farmer/listing
 */
const FeedbackList = ({ listing, onClose, lang = 'en' }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reputation, setReputation] = useState(null);

  const texts = {
    en: {
      title: 'Seller Reviews',
      noFeedbacks: 'No reviews yet',
      beFirst: 'Be the first to review this seller!',
      verifiedPurchase: 'Verified Purchase',
      totalReviews: 'Reviews',
      avgRating: 'Average Rating',
      close: 'Close'
    },
    si: {
      title: 'විකුණුම්කරු සමාලෝචන',
      noFeedbacks: 'තවම සමාලෝචන නැත',
      beFirst: 'මෙම විකුණුම්කරුව සමාලෝචනය කළ පළමු තැනැත්තා වන්න!',
      verifiedPurchase: 'සත්‍යාපිත මිලදී ගැනීම',
      totalReviews: 'සමාලෝචන',
      avgRating: 'සාමාන්‍ය ශ්‍රේණිගත කිරීම',
      close: 'වසන්න'
    }
  };

  const t = texts[lang] || texts.en;

  useEffect(() => {
    fetchFeedbacks();
  }, [listing]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      
      // If listing has farmer_id, fetch by farmer
      if (listing.farmer_id?._id || listing.farmer_id) {
        const farmerId = listing.farmer_id?._id || listing.farmer_id;
        
        const [feedbackRes, reputationRes] = await Promise.all([
          axios.get(`${API_BASE}/api/reputation/farmer/${farmerId}/feedbacks?limit=20`),
          axios.get(`${API_BASE}/api/reputation/farmer/${farmerId}`)
        ]);
        
        setFeedbacks(feedbackRes.data.feedbacks || []);
        setReputation(reputationRes.data.reputation || null);
      } else {
        // No farmer_id, fetch by listing_id instead
        try {
          const feedbackRes = await axios.get(`${API_BASE}/api/reputation/listing/${listing._id}/feedbacks`);
          setFeedbacks(feedbackRes.data.feedbacks || []);
        } catch (err) {
          setFeedbacks([]);
        }
        setReputation(null);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-LK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-bold">{t.title}</h2>
                <p className="text-green-100 text-sm">{listing.farmerName}</p>
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

        {/* Stats Summary */}
        {reputation && (
          <div className="px-5 py-4 bg-gray-50 border-b flex items-center justify-around">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star size={20} className="text-yellow-400 fill-yellow-400" />
                <span className="text-2xl font-bold text-gray-800">
                  {reputation.reputation_score?.toFixed(1) || '3.0'}
                </span>
              </div>
              <p className="text-xs text-gray-500">{t.avgRating}</p>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{feedbacks.length}</p>
              <p className="text-xs text-gray-500">{t.totalReviews}</p>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{reputation.breakdown?.sales?.count || 0}</p>
              <p className="text-xs text-gray-500">{lang === 'si' ? 'විකුණුම්' : 'Sales'}</p>
            </div>
          </div>
        )}

        {/* Feedbacks List */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{t.noFeedbacks}</p>
              <p className="text-gray-400 text-sm mt-1">{t.beFirst}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div 
                  key={feedback._id} 
                  className="bg-white border rounded-xl p-4 hover:shadow-md transition"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{feedback.buyer_name}</p>
                        <div className="flex items-center gap-2">
                          {renderStars(feedback.rating)}
                          <span className="text-xs text-gray-400">
                            {formatDate(feedback.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {feedback.is_verified_purchase && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <ThumbsUp size={10} />
                        {t.verifiedPurchase}
                      </span>
                    )}
                  </div>

                  {/* Comment */}
                  {feedback.comment && (
                    <p className="text-gray-600 text-sm mt-2 pl-10">
                      "{feedback.comment}"
                    </p>
                  )}

                  {/* Listing Info */}
                  {feedback.listing_id && (
                    <div className="mt-2 pl-10">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                        {feedback.listing_id.cropType} - {feedback.listing_id.quantity}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackList;
