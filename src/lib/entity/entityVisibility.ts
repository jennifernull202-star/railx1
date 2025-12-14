/**
 * THE RAIL EXCHANGE™ — Entity Visibility
 * 
 * Utilities for determining entity visibility status.
 * NO auth logic. NO enforcement. Pure visibility derivation.
 */

import {
  Entity,
  EntityType,
  VisibilityTier,
  VerificationStatus,
  ENTITY_TYPES,
  VISIBILITY_TIER,
  VERIFICATION_STATUS,
} from '@/types/entity';

/**
 * Check if an entity is publicly visible
 */
export function isEntityVisible(entity: Entity | null): boolean {
  if (!entity) return false;
  if (!entity.isActive) return false;
  if (entity.visibilityTier === VISIBILITY_TIER.HIDDEN) return false;
  return true;
}

/**
 * Check if an entity is verified
 */
export function isEntityVerified(entity: Entity | null): boolean {
  if (!entity) return false;
  return entity.verificationStatus === VERIFICATION_STATUS.VERIFIED;
}

/**
 * Get visibility tier label
 */
export function getVisibilityTierLabel(tier: VisibilityTier): string {
  switch (tier) {
    case VISIBILITY_TIER.HIDDEN:
      return 'Hidden';
    case VISIBILITY_TIER.BASIC:
      return 'Basic';
    case VISIBILITY_TIER.FEATURED:
      return 'Featured';
    case VISIBILITY_TIER.PRIORITY:
      return 'Priority';
    default:
      return 'Unknown';
  }
}

/**
 * Get verification status label
 */
export function getVerificationStatusLabel(status: VerificationStatus): string {
  switch (status) {
    case VERIFICATION_STATUS.NONE:
      return 'Not Verified';
    case VERIFICATION_STATUS.PENDING:
      return 'Verification Pending';
    case VERIFICATION_STATUS.VERIFIED:
      return 'Verified';
    case VERIFICATION_STATUS.EXPIRED:
      return 'Verification Expired';
    case VERIFICATION_STATUS.REJECTED:
      return 'Verification Rejected';
    default:
      return 'Unknown';
  }
}

/**
 * Get badge color class for visibility tier
 */
export function getVisibilityTierColor(tier: VisibilityTier): string {
  switch (tier) {
    case VISIBILITY_TIER.HIDDEN:
      return 'bg-gray-100 text-gray-600';
    case VISIBILITY_TIER.BASIC:
      return 'bg-blue-100 text-blue-700';
    case VISIBILITY_TIER.FEATURED:
      return 'bg-amber-100 text-amber-700';
    case VISIBILITY_TIER.PRIORITY:
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Get badge color class for verification status
 */
export function getVerificationStatusColor(status: VerificationStatus): string {
  switch (status) {
    case VERIFICATION_STATUS.NONE:
      return 'bg-gray-100 text-gray-600';
    case VERIFICATION_STATUS.PENDING:
      return 'bg-yellow-100 text-yellow-700';
    case VERIFICATION_STATUS.VERIFIED:
      return 'bg-green-100 text-green-700';
    case VERIFICATION_STATUS.EXPIRED:
      return 'bg-red-100 text-red-700';
    case VERIFICATION_STATUS.REJECTED:
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Determine if entity should appear in public directory
 */
export function shouldAppearInDirectory(entity: Entity | null): boolean {
  if (!entity) return false;
  if (!entity.isActive) return false;
  if (entity.visibilityTier === VISIBILITY_TIER.HIDDEN) return false;
  
  // Type-specific rules
  switch (entity.type) {
    case ENTITY_TYPES.SELLER:
      // Sellers need verification to appear
      return entity.verificationStatus === VERIFICATION_STATUS.VERIFIED;
      
    case ENTITY_TYPES.CONTRACTOR:
      // Contractors need verification to appear
      return entity.verificationStatus === VERIFICATION_STATUS.VERIFIED;
      
    case ENTITY_TYPES.COMPANY:
      // Companies can appear without verification (basic listing)
      return true;
      
    default:
      return false;
  }
}

/**
 * Get ranking priority for directory sorting
 * Higher number = appears first
 */
export function getDirectoryRankingPriority(entity: Entity | null): number {
  if (!entity) return 0;
  
  let priority = 0;
  
  // Verification adds base priority
  if (entity.verificationStatus === VERIFICATION_STATUS.VERIFIED) {
    priority += 100;
  }
  
  // Visibility tier adds priority
  switch (entity.visibilityTier) {
    case VISIBILITY_TIER.PRIORITY:
      priority += 300;
      break;
    case VISIBILITY_TIER.FEATURED:
      priority += 200;
      break;
    case VISIBILITY_TIER.BASIC:
      priority += 50;
      break;
  }
  
  return priority;
}
