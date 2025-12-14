/**
 * THE RAIL EXCHANGE™ — Entity Visibility Badge
 * 
 * Displays visibility tier for an entity.
 * NO auth. NO enforcement. Pure display.
 */

import { Star, Crown, Sparkles } from 'lucide-react';
import { Entity, VISIBILITY_TIER } from '@/types/entity';
import { EntityVisibilityBadgeProps } from './types';

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function EntityVisibilityBadge({ 
  entity, 
  size = 'md' 
}: EntityVisibilityBadgeProps) {
  if (!entity) return null;
  
  const tier = entity.visibilityTier;
  
  // Don't show badge for basic or hidden tiers
  if (tier === VISIBILITY_TIER.BASIC || tier === VISIBILITY_TIER.HIDDEN) {
    return null;
  }
  
  const getConfig = () => {
    switch (tier) {
      case VISIBILITY_TIER.FEATURED:
        return {
          icon: Star,
          label: 'Featured',
          className: 'bg-amber-100 text-amber-700 border-amber-200',
        };
      case VISIBILITY_TIER.PRIORITY:
        return {
          icon: Crown,
          label: 'Priority',
          className: 'bg-purple-100 text-purple-700 border-purple-200',
        };
      default:
        return null;
    }
  };
  
  const config = getConfig();
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${sizeClasses[size]}
        ${config.className}
      `}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  );
}

export default EntityVisibilityBadge;
