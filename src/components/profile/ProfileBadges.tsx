/**
 * THE RAIL EXCHANGE™ — Profile Badges
 * 
 * Displays verification and visibility badges in profile header.
 * Compact badge display for inline use.
 */

import { CheckCircle2, Sparkles, TrendingUp, Clock, Shield } from 'lucide-react';
import type { ProfileBadgesProps } from './types';

export function ProfileBadges({ verification, visibility }: ProfileBadgesProps) {
  const badges: React.ReactNode[] = [];

  // Verification badge
  if (verification) {
    if (verification.status === 'verified') {
      badges.push(
        <span
          key="verified"
          className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full"
        >
          <CheckCircle2 className="h-3 w-3" />
          Verified
        </span>
      );
    } else if (verification.status === 'in_progress') {
      badges.push(
        <span
          key="in-progress"
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
        >
          <Clock className="h-3 w-3" />
          Verifying
        </span>
      );
    }
  }

  // Visibility badges
  if (visibility) {
    if (visibility.isPriority || visibility.tier === 'priority') {
      badges.push(
        <span
          key="priority"
          className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full"
        >
          <TrendingUp className="h-3 w-3" />
          Priority
        </span>
      );
    } else if (visibility.isFeatured || visibility.tier === 'featured') {
      badges.push(
        <span
          key="featured"
          className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full"
        >
          <Sparkles className="h-3 w-3" />
          Featured
        </span>
      );
    }
  }

  // No badges to show
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {badges}
    </div>
  );
}

export default ProfileBadges;
