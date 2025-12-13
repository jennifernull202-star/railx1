/**
 * THE RAIL EXCHANGE™ — Verification Helper Library
 * 
 * SINGLE SOURCE OF TRUTH for all verification status checks.
 * Implements the business verification hierarchy:
 * 
 * CONTRACTOR VERIFIED (Higher) → Can access Seller + Contractor features
 * SELLER VERIFIED (Lower)      → Can access Seller features ONLY
 * NOT VERIFIED                  → Browse only (buyer)
 * 
 * IMPORTANT: Use these helpers instead of checking fields directly.
 */

import { 
  VERIFICATION_TYPES, 
  VERIFICATION_STATUS,
  type VerificationType,
  type VerificationStatus,
  canAccessSellerFeatures,
  canAccessContractorFeatures,
} from '@/config/verification';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Minimal user object for verification checks
 * Accepts both lean documents and full Mongoose documents
 */
export interface VerificationUser {
  // New unified system fields (primary)
  sellerVerificationStatus?: string | null;
  contractorVerificationStatus?: string | null;
  
  // Legacy fields (for backward compatibility)
  isVerifiedSeller?: boolean;
  verifiedSellerStatus?: string | null;
  verifiedSellerExpiresAt?: Date | string | null;
  
  // Expiration tracking
  sellerVerificationExpiresAt?: Date | string | null;
  contractorVerificationExpiresAt?: Date | string | null;
  
  // Capability flags
  isSeller?: boolean;
  isContractor?: boolean;
}

/**
 * Verification status result
 */
export interface VerificationResult {
  type: VerificationType;
  status: VerificationStatus;
  expiresAt: Date | null;
  isExpired: boolean;
  canSell: boolean;
  canContract: boolean;
  displayName: string;
}

// ============================================================================
// CORE VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Get the effective verification type from user fields
 * Implements the hierarchy: Contractor > Seller > None
 */
export function getVerificationType(user: VerificationUser): VerificationType {
  // Check contractor verification first (highest trust level)
  if (user.contractorVerificationStatus === 'active') {
    return VERIFICATION_TYPES.CONTRACTOR;
  }
  
  // Check seller verification (uses both new and legacy fields)
  if (
    user.sellerVerificationStatus === 'active' ||
    (user.isVerifiedSeller && user.verifiedSellerStatus === 'active')
  ) {
    return VERIFICATION_TYPES.SELLER;
  }
  
  return VERIFICATION_TYPES.NONE;
}

/**
 * Get the effective verification status from user fields
 */
export function getVerificationStatus(user: VerificationUser): VerificationStatus {
  // Check contractor verification first (highest trust level)
  const contractorStatus = user.contractorVerificationStatus;
  if (contractorStatus === 'active') return VERIFICATION_STATUS.ACTIVE;
  if (contractorStatus === 'pending-ai') return VERIFICATION_STATUS.PENDING_AI;
  if (contractorStatus === 'pending-admin') return VERIFICATION_STATUS.PENDING_ADMIN;
  if (contractorStatus === 'revoked') return VERIFICATION_STATUS.REVOKED;
  
  // Check seller verification (uses both new and legacy fields)
  const sellerStatus = user.sellerVerificationStatus || user.verifiedSellerStatus;
  if (sellerStatus === 'active') return VERIFICATION_STATUS.ACTIVE;
  if (sellerStatus === 'expired') return VERIFICATION_STATUS.EXPIRED;
  if (sellerStatus === 'pending-ai') return VERIFICATION_STATUS.PENDING_AI;
  if (sellerStatus === 'pending-admin') return VERIFICATION_STATUS.PENDING_ADMIN;
  if (sellerStatus === 'revoked') return VERIFICATION_STATUS.REVOKED;
  
  return VERIFICATION_STATUS.NONE;
}

/**
 * Get verification expiration date
 */
export function getVerificationExpiresAt(user: VerificationUser): Date | null {
  const type = getVerificationType(user);
  
  if (type === VERIFICATION_TYPES.CONTRACTOR) {
    return user.contractorVerificationExpiresAt 
      ? new Date(user.contractorVerificationExpiresAt) 
      : null;
  }
  
  if (type === VERIFICATION_TYPES.SELLER) {
    // Check legacy field first, then new field
    const expiresAt = user.verifiedSellerExpiresAt || user.sellerVerificationExpiresAt;
    return expiresAt ? new Date(expiresAt) : null;
  }
  
  return null;
}

/**
 * Check if verification is expired
 */
export function isVerificationExpired(user: VerificationUser): boolean {
  const expiresAt = getVerificationExpiresAt(user);
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}

/**
 * Get complete verification result for a user
 */
export function getVerificationResult(user: VerificationUser): VerificationResult {
  const type = getVerificationType(user);
  const status = getVerificationStatus(user);
  const expiresAt = getVerificationExpiresAt(user);
  const isExpired = isVerificationExpired(user);
  
  // Adjust status if expired
  const effectiveStatus = isExpired ? VERIFICATION_STATUS.EXPIRED : status;
  
  return {
    type,
    status: effectiveStatus,
    expiresAt,
    isExpired,
    canSell: canAccessSellerFeatures(type, effectiveStatus),
    canContract: canAccessContractorFeatures(type, effectiveStatus),
    displayName: getVerificationDisplayName(type, effectiveStatus),
  };
}

// ============================================================================
// ACCESS CHECK FUNCTIONS
// ============================================================================

/**
 * Check if user can access seller dashboard
 * Requires SELLER or CONTRACTOR verification (active, not expired)
 */
export function canAccessSellerDashboard(user: VerificationUser): boolean {
  const result = getVerificationResult(user);
  return result.canSell;
}

/**
 * Check if user can access contractor dashboard
 * Requires CONTRACTOR verification only (seller verification NOT enough)
 */
export function canAccessContractorDashboard(user: VerificationUser): boolean {
  const result = getVerificationResult(user);
  return result.canContract;
}

/**
 * Check if user can create/publish listings
 * Requires at least SELLER verification (or CONTRACTOR which includes seller)
 */
export function canPublishListings(user: VerificationUser): boolean {
  const result = getVerificationResult(user);
  return result.canSell;
}

/**
 * Check if user appears in contractor directory
 * Requires CONTRACTOR verification only
 */
export function canAppearInContractorDirectory(user: VerificationUser): boolean {
  const result = getVerificationResult(user);
  return result.canContract;
}

/**
 * Check if user's seller verification is about to expire
 * @param daysThreshold - Number of days before expiration to trigger warning
 */
export function isVerificationExpiringsSoon(user: VerificationUser, daysThreshold: number = 30): boolean {
  const expiresAt = getVerificationExpiresAt(user);
  if (!expiresAt) return false;
  
  const now = new Date();
  const daysUntilExpiration = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiration <= daysThreshold && daysUntilExpiration > 0;
}

/**
 * Get days until verification expires
 */
export function getDaysUntilExpiration(user: VerificationUser): number | null {
  const expiresAt = getVerificationExpiresAt(user);
  if (!expiresAt) return null;
  
  const now = new Date();
  return Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get display name for verification status
 */
export function getVerificationDisplayName(type: VerificationType, status: VerificationStatus): string {
  if (status !== VERIFICATION_STATUS.ACTIVE) {
    switch (status) {
      case VERIFICATION_STATUS.PENDING_AI:
        return 'Verification Pending (Document Review)';
      case VERIFICATION_STATUS.PENDING_ADMIN:
        return 'Verification Pending (Admin Review)';
      case VERIFICATION_STATUS.EXPIRED:
        return 'Verification Expired';
      case VERIFICATION_STATUS.REVOKED:
        return 'Verification Revoked';
      default:
        return 'Not Verified';
    }
  }
  
  switch (type) {
    case VERIFICATION_TYPES.CONTRACTOR:
      return 'Contractor Verified';
    case VERIFICATION_TYPES.SELLER:
      return 'Seller Verified';
    default:
      return 'Not Verified';
  }
}

/**
 * Get verification badge variant for UI
 */
export function getVerificationBadgeVariant(user: VerificationUser): 'contractor' | 'seller' | 'pending' | 'expired' | 'none' {
  const result = getVerificationResult(user);
  
  if (result.isExpired) return 'expired';
  
  if (result.status === VERIFICATION_STATUS.PENDING_AI || 
      result.status === VERIFICATION_STATUS.PENDING_ADMIN) {
    return 'pending';
  }
  
  if (result.status !== VERIFICATION_STATUS.ACTIVE) return 'none';
  
  switch (result.type) {
    case VERIFICATION_TYPES.CONTRACTOR:
      return 'contractor';
    case VERIFICATION_TYPES.SELLER:
      return 'seller';
    default:
      return 'none';
  }
}

// ============================================================================
// UPGRADE/PREVENTION LOGIC
// ============================================================================

/**
 * Check if user is already verified at a given level (to prevent double purchase)
 */
export function isAlreadyVerifiedAt(user: VerificationUser, targetType: VerificationType): boolean {
  const currentType = getVerificationType(user);
  const status = getVerificationStatus(user);
  
  if (status !== VERIFICATION_STATUS.ACTIVE) return false;
  
  // If trying to get seller verification but already contractor verified = already covered
  if (targetType === VERIFICATION_TYPES.SELLER) {
    return currentType === VERIFICATION_TYPES.SELLER || currentType === VERIFICATION_TYPES.CONTRACTOR;
  }
  
  // If trying to get contractor verification
  if (targetType === VERIFICATION_TYPES.CONTRACTOR) {
    return currentType === VERIFICATION_TYPES.CONTRACTOR;
  }
  
  return false;
}

/**
 * Check if user is eligible for contractor upgrade (has seller, wants contractor)
 */
export function isEligibleForContractorUpgrade(user: VerificationUser): boolean {
  const type = getVerificationType(user);
  const status = getVerificationStatus(user);
  
  // Must be seller verified and active
  return type === VERIFICATION_TYPES.SELLER && status === VERIFICATION_STATUS.ACTIVE;
}

/**
 * Get the verification type user should purchase (prevents downgrades)
 */
export function getRecommendedVerificationType(
  user: VerificationUser,
  requestedType: VerificationType
): VerificationType | null {
  const currentType = getVerificationType(user);
  const status = getVerificationStatus(user);
  
  // If already contractor verified and active, no purchase needed
  if (currentType === VERIFICATION_TYPES.CONTRACTOR && status === VERIFICATION_STATUS.ACTIVE) {
    if (requestedType === VERIFICATION_TYPES.SELLER) {
      return null; // Already covered by contractor verification
    }
    if (requestedType === VERIFICATION_TYPES.CONTRACTOR) {
      return null; // Already have it
    }
  }
  
  // If already seller verified and requesting seller, no purchase needed
  if (currentType === VERIFICATION_TYPES.SELLER && 
      status === VERIFICATION_STATUS.ACTIVE &&
      requestedType === VERIFICATION_TYPES.SELLER) {
    return null;
  }
  
  return requestedType;
}

// ============================================================================
// STRIPE CHECKOUT HELPERS
// ============================================================================

/**
 * Validate verification purchase request
 * Returns error message if invalid, null if valid
 */
export function validateVerificationPurchase(
  user: VerificationUser,
  requestedType: VerificationType
): string | null {
  const currentType = getVerificationType(user);
  const status = getVerificationStatus(user);
  
  // Already contractor verified
  if (currentType === VERIFICATION_TYPES.CONTRACTOR && status === VERIFICATION_STATUS.ACTIVE) {
    if (requestedType === VERIFICATION_TYPES.SELLER) {
      return 'You are already Contractor Verified, which includes all Seller features. No additional verification needed.';
    }
    if (requestedType === VERIFICATION_TYPES.CONTRACTOR) {
      return 'You are already Contractor Verified.';
    }
  }
  
  // Already seller verified, trying to buy seller again
  if (currentType === VERIFICATION_TYPES.SELLER && 
      status === VERIFICATION_STATUS.ACTIVE &&
      requestedType === VERIFICATION_TYPES.SELLER) {
    return 'You are already Seller Verified. Consider upgrading to Contractor Verification for more features.';
  }
  
  return null; // Valid purchase
}
