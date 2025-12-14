/**
 * THE RAIL EXCHANGE™ — Profile Visibility Strip
 * 
 * Displays visibility tier and boost status.
 * Affects profile prominence in marketplace.
 * NO pricing logic.
 */

import { Sparkles, TrendingUp, Eye } from 'lucide-react';
import type { ProfileVisibilityStripProps } from './types';

export function ProfileVisibilityStrip({ 
  visibility, 
  entityName 
}: ProfileVisibilityStripProps) {
  // No visibility data or basic tier = don't show strip
  if (!visibility || visibility.tier === 'basic') {
    return null;
  }

  // Featured tier
  if (visibility.tier === 'featured' || visibility.isFeatured) {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 rounded-lg px-4 py-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium text-amber-700">
          Featured {entityName ? `— ${entityName}` : 'Profile'}
        </span>
        {visibility.boostExpiresAt && (
          <span className="text-xs text-amber-600 ml-auto">
            Until {new Date(visibility.boostExpiresAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
    );
  }

  // Priority tier
  if (visibility.tier === 'priority' || visibility.isPriority) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 rounded-lg px-4 py-2 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-medium text-emerald-700">
          Priority Placement
        </span>
        {visibility.boostExpiresAt && (
          <span className="text-xs text-emerald-600 ml-auto">
            Until {new Date(visibility.boostExpiresAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
    );
  }

  // Hidden tier (should rarely show, but handle gracefully)
  if (visibility.tier === 'hidden') {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-2">
        <Eye className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-500">
          Profile visibility limited
        </span>
      </div>
    );
  }

  return null;
}

export default ProfileVisibilityStrip;
