/**
 * THE RAIL EXCHANGE™ — Entity Verification Badge
 * 
 * Displays verification status for an entity.
 * NO auth. NO enforcement. Pure display.
 */

import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Entity, VERIFICATION_STATUS } from '@/types/entity';
import { EntityVerificationBadgeProps } from './types';

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

export function EntityVerificationBadge({ 
  entity, 
  size = 'md' 
}: EntityVerificationBadgeProps) {
  if (!entity) return null;
  
  const status = entity.verificationStatus;
  
  // Don't show badge for unverified entities
  if (status === VERIFICATION_STATUS.NONE) {
    return null;
  }
  
  const getConfig = () => {
    switch (status) {
      case VERIFICATION_STATUS.VERIFIED:
        return {
          icon: CheckCircle,
          label: 'Verified',
          className: 'bg-green-100 text-green-700 border-green-200',
        };
      case VERIFICATION_STATUS.PENDING:
        return {
          icon: Clock,
          label: 'Pending',
          className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        };
      case VERIFICATION_STATUS.EXPIRED:
        return {
          icon: AlertTriangle,
          label: 'Expired',
          className: 'bg-red-100 text-red-700 border-red-200',
        };
      case VERIFICATION_STATUS.REJECTED:
        return {
          icon: AlertTriangle,
          label: 'Rejected',
          className: 'bg-red-100 text-red-700 border-red-200',
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

export default EntityVerificationBadge;
