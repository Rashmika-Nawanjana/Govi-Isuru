import React from 'react';
import { Star, Shield, CheckCircle } from 'lucide-react';

/**
 * ReputationBadge - Displays farmer reputation score with stars
 * @param {number} score - Reputation score (1-5)
 * @param {boolean} isVerified - Whether farmer is verified
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} showLabel - Show score label
 */
const ReputationBadge = ({ 
  score = 3.0, 
  isVerified = false, 
  size = 'md',
  showLabel = true,
  lang = 'en'
}) => {
  // Clamp score between 1 and 5
  const clampedScore = Math.max(1, Math.min(5, score || 3));
  
  // Size configurations
  const sizes = {
    sm: { star: 12, text: 'text-xs', gap: 'gap-0.5' },
    md: { star: 16, text: 'text-sm', gap: 'gap-1' },
    lg: { star: 20, text: 'text-base', gap: 'gap-1.5' }
  };
  
  const config = sizes[size] || sizes.md;
  
  // Generate stars based on score
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(clampedScore);
    const hasHalfStar = clampedScore % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // Full star
        stars.push(
          <Star 
            key={i} 
            size={config.star} 
            className="text-yellow-400 fill-yellow-400" 
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        // Half star (using gradient)
        stars.push(
          <div key={i} className="relative">
            <Star size={config.star} className="text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star size={config.star} className="text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        );
      } else {
        // Empty star
        stars.push(
          <Star 
            key={i} 
            size={config.star} 
            className="text-gray-300" 
          />
        );
      }
    }
    return stars;
  };
  
  // Color based on score
  const getScoreColor = () => {
    if (clampedScore >= 4.5) return 'text-green-600';
    if (clampedScore >= 3.5) return 'text-green-500';
    if (clampedScore >= 2.5) return 'text-yellow-600';
    return 'text-orange-500';
  };

  return (
    <div className={`flex items-center ${config.gap}`}>
      {/* Stars */}
      <div className={`flex items-center ${config.gap}`}>
        {renderStars()}
      </div>
      
      {/* Score Label */}
      {showLabel && (
        <span className={`font-bold ${getScoreColor()} ${config.text}`}>
          {clampedScore.toFixed(1)}
        </span>
      )}
      
      {/* Verified Badge */}
      {isVerified && (
        <div 
          className="flex items-center gap-0.5 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full"
          title={lang === 'si' ? 'සත්‍යාපිත ගොවියා' : 'Verified Farmer'}
        >
          <CheckCircle size={config.star - 4} />
          {size !== 'sm' && (
            <span className="text-xs font-medium">
              {lang === 'si' ? 'සත්‍යාපිත' : 'Verified'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ReputationScoreCircle - Circular progress version
 */
export const ReputationScoreCircle = ({ score = 3.0, size = 60 }) => {
  const clampedScore = Math.max(1, Math.min(5, score || 3));
  const percentage = (clampedScore / 5) * 100;
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColor = () => {
    if (clampedScore >= 4.5) return '#16a34a';
    if (clampedScore >= 3.5) return '#22c55e';
    if (clampedScore >= 2.5) return '#ca8a04';
    return '#ea580c';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={20}
          stroke="#e5e7eb"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={20}
          stroke={getColor()}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color: getColor() }}>
          {clampedScore.toFixed(1)}
        </span>
      </div>
    </div>
  );
};

/**
 * MiniReputationBadge - Compact inline badge
 */
export const MiniReputationBadge = ({ score = 3.0 }) => {
  const clampedScore = Math.max(1, Math.min(5, score || 3));
  
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star size={14} className="text-yellow-400 fill-yellow-400" />
      <span className="font-semibold">{clampedScore.toFixed(1)}</span>
    </span>
  );
};

export default ReputationBadge;
