import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Star, 
  TrendingUp, 
  CheckCircle, 
  MessageSquare, 
  ShoppingBag,
  Info,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import ReputationBadge from './ReputationBadge';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

/**
 * ReputationBreakdown - Detailed explainable reputation display
 */
const ReputationBreakdown = ({ farmerId, lang = 'en', showDetails = true }) => {
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);

  const texts = {
    en: {
      title: 'Reputation Score',
      explanation: 'This score is calculated using successful sales (40%), verified listings (30%), and buyer feedback (30%).',
      sales: 'Successful Sales',
      verified: 'Verified Listings',
      feedback: 'Buyer Feedback',
      avgRating: 'Average Rating',
      weight: 'Weight',
      score: 'Score',
      count: 'Count',
      viewDetails: 'View Details',
      hideDetails: 'Hide Details',
      newFarmer: 'New Farmer',
      newFarmerDesc: 'This farmer is new to the platform. Starting score: 3.0'
    },
    si: {
      title: 'කීර්තිමත් ලකුණු',
      explanation: 'මෙම ලකුණු ගණනය කරනු ලබන්නේ සාර්ථක විකුණුම් (40%), සත්‍යාපිත ලැයිස්තුගත කිරීම් (30%), සහ ගැනුම්කරුවන්ගේ ප්‍රතිපෝෂණය (30%) භාවිතයෙනි.',
      sales: 'සාර්ථක විකුණුම්',
      verified: 'සත්‍යාපිත ලැයිස්තුගත කිරීම්',
      feedback: 'ගැනුම්කරු ප්‍රතිපෝෂණය',
      avgRating: 'සාමාන්‍ය ශ්‍රේණිගත කිරීම',
      weight: 'බර',
      score: 'ලකුණු',
      count: 'ගණන',
      viewDetails: 'විස්තර බලන්න',
      hideDetails: 'විස්තර සඟවන්න',
      newFarmer: 'නව ගොවියා',
      newFarmerDesc: 'මෙම ගොවියා වේදිකාවට අලුත්. ආරම්භක ලකුණු: 3.0'
    }
  };

  const t = texts[lang] || texts.en;

  useEffect(() => {
    if (farmerId) {
      fetchReputation();
    }
  }, [farmerId]);

  const fetchReputation = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/reputation/farmer/${farmerId}`);
      setReputation(res.data.reputation);
      setError(null);
    } catch (err) {
      console.error('Error fetching reputation:', err);
      setError('Failed to load reputation');
    } finally {
      setLoading(false);
    }
  };

  // Score bar component
  const ScoreBar = ({ score, maxScore = 5, color = 'green' }) => {
    const percentage = (score / maxScore) * 100;
    const colorClasses = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      blue: 'bg-blue-500'
    };

    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClasses[color]} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600 w-10">
          {score.toFixed(1)}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !reputation) {
    return null;
  }

  const { breakdown, reputation_score, is_verified_farmer } = reputation;
  const isNewFarmer = breakdown.sales.count === 0 && breakdown.feedback.count === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{t.title}</h3>
              <ReputationBadge 
                score={reputation_score} 
                isVerified={is_verified_farmer}
                size="md"
                lang={lang}
              />
            </div>
          </div>
          
          {showDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              {expanded ? (
                <>
                  {t.hideDetails} <ChevronUp size={16} />
                </>
              ) : (
                <>
                  {t.viewDetails} <ChevronDown size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-start gap-2">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">{t.explanation}</p>
      </div>

      {/* New Farmer Notice */}
      {isNewFarmer && (
        <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100 flex items-start gap-2">
          <Star size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-700">{t.newFarmer}</p>
            <p className="text-xs text-yellow-600">{t.newFarmerDesc}</p>
          </div>
        </div>
      )}

      {/* Breakdown Details */}
      {(expanded || !showDetails) && (
        <div className="p-4 space-y-4">
          {/* Sales Score */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingBag size={18} className="text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{t.sales}</span>
                <span className="text-xs text-gray-500">
                  {breakdown.sales.count} {t.count} • {breakdown.sales.weight}
                </span>
              </div>
              <ScoreBar score={breakdown.sales.score} color="green" />
            </div>
          </div>

          {/* Verified Score */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle size={18} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{t.verified}</span>
                <span className="text-xs text-gray-500">
                  {breakdown.verified.count} {t.count} • {breakdown.verified.weight}
                </span>
              </div>
              <ScoreBar score={breakdown.verified.score} color="blue" />
            </div>
          </div>

          {/* Feedback Score */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <MessageSquare size={18} className="text-yellow-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{t.feedback}</span>
                <span className="text-xs text-gray-500">
                  {breakdown.feedback.count} {t.count} • {breakdown.feedback.weight}
                </span>
              </div>
              <ScoreBar score={breakdown.feedback.averageRating} color="yellow" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReputationBreakdown;
