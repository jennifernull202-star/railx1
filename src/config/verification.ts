/**
 * THE RAIL EXCHANGE™ — Verification Hierarchy Configuration
 * 
 * SINGLE SOURCE OF TRUTH for business verification levels.
 * 
 * KEY PRINCIPLES:
 * 1. Verification is per BUSINESS ENTITY, not per role.
 * 2. CONTRACTOR verification is the HIGHEST trust level.
 * 3. CONTRACTOR verification automatically includes SELLER access.
 * 4. SELLER verification does NOT unlock CONTRACTOR access.
 * 5. One business, one verification state.
 * 
 * HIERARCHY (One-Way Unlock):
 * - CONTRACTOR VERIFIED → Can access SELLER + CONTRACTOR features
 * - SELLER VERIFIED → Can access SELLER features ONLY
 * - NOT VERIFIED → Can browse only (buyer)
 */

// ============================================================================
// VERIFICATION TYPES
// ============================================================================

export const VERIFICATION_TYPES = {
  NONE: 'none',
  SELLER: 'seller',
  CONTRACTOR: 'contractor',
} as const;

export type VerificationType = typeof VERIFICATION_TYPES[keyof typeof VERIFICATION_TYPES];

// ============================================================================
// VERIFICATION STATUS VALUES
// ============================================================================

export const VERIFICATION_STATUS = {
  NONE: 'none',
  PENDING_AI: 'pending-ai',
  PENDING_ADMIN: 'pending-admin',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const;

export type VerificationStatus = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];

// ============================================================================
// VERIFICATION HIERARCHY (TRUST LEVELS)
// ============================================================================
// Higher number = higher trust level
// CONTRACTOR > SELLER > NONE

export const VERIFICATION_TRUST_LEVEL: Record<VerificationType, number> = {
  [VERIFICATION_TYPES.NONE]: 0,
  [VERIFICATION_TYPES.SELLER]: 1,
  [VERIFICATION_TYPES.CONTRACTOR]: 2, // HIGHEST - includes seller access
};

// ============================================================================
// VERIFICATION PRICING (Annual)
// ============================================================================

export const VERIFICATION_PRICING = {
  [VERIFICATION_TYPES.SELLER]: 4900,      // $49/year
  [VERIFICATION_TYPES.CONTRACTOR]: 14900, // $149/year
} as const;

// ============================================================================
// VERIFICATION STRIPE PRICE IDS
// ============================================================================

export const VERIFICATION_STRIPE_PRICE_IDS = {
  [VERIFICATION_TYPES.SELLER]: process.env.STRIPE_PRICE_SELLER_VERIFICATION_YEARLY || '',
  [VERIFICATION_TYPES.CONTRACTOR]: process.env.STRIPE_PRICE_CONTRACTOR_VERIFICATION_YEARLY || '',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a verification type is at least a certain level
 * @param currentType - The user's current verification type
 * @param requiredType - The minimum required verification type
 * @returns true if currentType meets or exceeds requiredType
 */
export function hasVerificationLevel(
  currentType: VerificationType,
  requiredType: VerificationType
): boolean {
  return VERIFICATION_TRUST_LEVEL[currentType] >= VERIFICATION_TRUST_LEVEL[requiredType];
}

/**
 * Check if user can access seller features
 * SELLER access is granted to: SELLER verified OR CONTRACTOR verified
 */
export function canAccessSellerFeatures(verificationType: VerificationType, status: VerificationStatus): boolean {
  if (status !== VERIFICATION_STATUS.ACTIVE) return false;
  // Contractor verified users automatically have seller access
  return verificationType === VERIFICATION_TYPES.SELLER || 
         verificationType === VERIFICATION_TYPES.CONTRACTOR;
}

/**
 * Check if user can access contractor features
 * CONTRACTOR access is granted ONLY to: CONTRACTOR verified
 * SELLER verification does NOT unlock contractor access
 */
export function canAccessContractorFeatures(verificationType: VerificationType, status: VerificationStatus): boolean {
  if (status !== VERIFICATION_STATUS.ACTIVE) return false;
  // ONLY contractor verified users can access contractor features
  return verificationType === VERIFICATION_TYPES.CONTRACTOR;
}

/**
 * Check if user can create listings
 * Requires at least SELLER verification (or CONTRACTOR which includes seller)
 */
export function canCreateListings(verificationType: VerificationType, status: VerificationStatus): boolean {
  return canAccessSellerFeatures(verificationType, status);
}

/**
 * Check if user can appear as contractor in directory
 * Requires CONTRACTOR verification (seller verification is NOT enough)
 */
export function canAppearAsContractor(verificationType: VerificationType, status: VerificationStatus): boolean {
  return canAccessContractorFeatures(verificationType, status);
}

/**
 * Determine if upgrading from seller to contractor would be an upgrade
 */
export function isUpgrade(fromType: VerificationType, toType: VerificationType): boolean {
  return VERIFICATION_TRUST_LEVEL[toType] > VERIFICATION_TRUST_LEVEL[fromType];
}

/**
 * Get display name for verification type
 */
export function getVerificationDisplayName(type: VerificationType): string {
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
 * Get verification type from legacy fields
 * Used during migration from old system to unified system
 */
export function getVerificationTypeFromLegacy(
  isVerifiedSeller: boolean,
  verifiedSellerStatus: string,
  contractorVerificationStatus: string
): VerificationType {
  // Contractor verification takes precedence (higher trust)
  if (contractorVerificationStatus === 'active') {
    return VERIFICATION_TYPES.CONTRACTOR;
  }
  // Then check seller verification
  if (isVerifiedSeller && verifiedSellerStatus === 'active') {
    return VERIFICATION_TYPES.SELLER;
  }
  return VERIFICATION_TYPES.NONE;
}
