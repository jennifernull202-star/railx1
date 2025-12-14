/**
 * THE RAIL EXCHANGE™ — Profile Ratings Component
 * 
 * Displays aggregate ratings for profiles and marketplace cards.
 * Returns neutral empty state if no ratings (NOT zero).
 * NO mock data.
 */

import { Star } from 'lucide-react';
import type { ProfileRatingsProps } from './types';

export function ProfileRatings({ 
  ratings, 
  size = 'md',
  showCount = true 
}: ProfileRatingsProps) {
  // Size configurations
  const sizeConfig = {
    sm: { star: 'h-3.5 w-3.5', text: 'text-xs', gap: 'gap-0.5' },
    md: { star: 'h-4 w-4', text: 'text-sm', gap: 'gap-1' },
    lg: { star: 'h-5 w-5', text: 'text-base', gap: 'gap-1.5' },
  };
  
  const config = sizeConfig[size];

  // No ratings data or null average = show neutral state
  if (!ratings || ratings.averageRating === null) {
    return (
      <div className={`flex items-center ${config.gap}`}>
        <Star className={`${config.star} text-slate-300`} />
        <span className={`${config.text} text-slate-400`}>
          No ratings yet
        </span>
      </div>
    );
  }

  // Render filled/empty stars based on rating
  const fullStars = Math.floor(ratings.averageRating);
  const hasHalfStar = ratings.averageRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center ${config.gap}`}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star 
          key={`full-${i}`} 
          className={`${config.star} text-amber-400 fill-amber-400`} 
        />
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <Star className={`${config.star} text-slate-300`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${config.star} text-amber-400 fill-amber-400`} />
          </div>
        </div>
      )}
      
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star 
          key={`empty-${i}`} 
          className={`${config.star} text-slate-300`} 
        />
      ))}

      {/* Rating value and count */}
      <span className={`${config.text} text-slate-700 font-medium ml-1`}>
        {ratings.averageRating.toFixed(1)}
      </span>
      
      {showCount && ratings.totalReviews > 0 && (
        <span className={`${config.text} text-slate-500`}>
          ({ratings.totalReviews})
        </span>
      )}
    </div>
  );
}

export default ProfileRatings;
