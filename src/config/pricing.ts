/**
 * THE RAIL EXCHANGE™ — Unified Pricing Configuration
 * 
 * SINGLE SOURCE OF TRUTH for all pricing, subscriptions, and add-ons.
 * 
 * LOCKED ARCHITECTURE — CONTEXT ALIGNED
 * 
 * VERIFICATION TYPES & PRICING:
 * - Buyer: $1 one-time (lifetime) - "Identity Confirmed" badge
 * - Seller: $29/year - "Identity Verified" badge
 * - Professional (Contractor = Company): $2,500/year ALL-IN
 *   ❌ No contractor-only tiers
 *   ❌ No company-only tiers
 *   ❌ No analytics upsells for professionals
 *   ❌ No monthly plans
 * 
 * ADD-ONS:
 * - Elite Placement ONLY: $99/30 days (no Premium/Featured tiers)
 * - AI Enhancement: $10/use
 * - Spec Sheet: $25 one-time
 * 
 * ANALYTICS ENTITLEMENTS:
 * - Buyers: NEVER
 * - Sellers: Locked by default, must purchase add-on
 * - Professionals (Contractor/Company): ALWAYS included ($2,500/year)
 * 
 * IMPORTANT: 
 * - All pricing must be managed here. Do not hardcode prices anywhere else.
 * - Stripe Price IDs are loaded from environment variables.
 * - Admin dashboard can modify these values in future iterations.
 */

// ============================================================================
// BUYER VERIFICATION (Required for buyer actions - NOT browsing)
// ============================================================================

export const BUYER_VERIFICATION = {
  price: 100, // $1.00 one-time
  lifetime: true,
  badge: 'Identity Confirmed',
  stripePriceId: process.env.STRIPE_PRICE_BUYER_VERIFICATION || '',
  requiredFor: [
    'Send inquiries',
    'Message sellers/contractors',
    'Leave reviews',
    'Indicate purchase intent',
  ],
  notRequiredFor: [
    'Browse listings',
    'Search',
    'View profiles',
    'Read reviews',
  ],
  disclaimer: 'Identity confirmation verifies the account belongs to a real person. It does not imply purchasing authority or endorsement.',
} as const;

// ============================================================================
// VERIFIED BUYER ACTIVITY BADGE (Optional, FREE, earned)
// ============================================================================

export const VERIFIED_BUYER_ACTIVITY = {
  price: 0, // FREE - earned badge
  badge: 'Verified Buyer (Activity)',
  requirements: {
    identityVerified: true,
    minCompletedPurchases: 3,
    minAccountAgeDays: 30,
    noAbuseFlags: true,
  },
  disclaimer: 'Verified Buyer (Activity) reflects completed marketplace transactions. It does not imply financial capability, purchasing authority, or endorsement.',
  styling: {
    colors: 'neutral', // gray/slate only
    noGreen: true,
    noShields: true,
    noCheckmarks: true,
  },
} as const;

// ============================================================================
// SELLER SUBSCRIPTION TIERS (Legacy - sellers only need verification now)
// ============================================================================

export const SELLER_TIERS = {
  BUYER: 'buyer',           // Free tier (browse only, no listings)
  BASIC: 'basic',           // Legacy - kept for backward compatibility
  PLUS: 'plus',             // Legacy - kept for backward compatibility
  PRO: 'pro',               // Legacy - kept for backward compatibility
  ENTERPRISE: 'enterprise', // Legacy - kept for backward compatibility
} as const;

export type SellerTier = typeof SELLER_TIERS[keyof typeof SELLER_TIERS];

export interface SellerTierConfig {
  id: SellerTier;
  name: string;
  description: string;
  priceMonthly: number;  // in cents, 0 for free
  priceYearly?: number;  // in cents, optional yearly discount
  listingLimit: number;  // -1 for unlimited
  features: string[];
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  isPopular?: boolean;
  isEnterprise?: boolean;
}

export const SELLER_TIER_CONFIG: Record<SellerTier, SellerTierConfig> = {
  [SELLER_TIERS.BUYER]: {
    id: SELLER_TIERS.BUYER,
    name: 'Buyer',
    description: 'Browse and contact sellers for free',
    priceMonthly: 0,
    listingLimit: 0,
    features: [
      'Browse all listings',
      'Contact sellers',
      'Save favorites',
      'Email alerts for saved searches',
    ],
  },
  [SELLER_TIERS.BASIC]: {
    id: SELLER_TIERS.BASIC,
    name: 'Seller Basic',
    description: 'Perfect for occasional sellers',
    priceMonthly: 2900, // $29.00
    priceYearly: 29000, // $290/year (2 months free)
    listingLimit: 3,
    features: [
      'Up to 3 active listings',
      'Basic seller dashboard',
      'Email notifications',
      'Standard support',
      'Listing analytics (basic)',
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_SELLER_BASIC_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_SELLER_BASIC || '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_SELLER_BASIC_YEARLY || '',
  },
  [SELLER_TIERS.PLUS]: {
    id: SELLER_TIERS.PLUS,
    name: 'Seller Plus',
    description: 'For active sellers who need more listings',
    priceMonthly: 5900, // $59.00
    priceYearly: 59000, // $590/year (2 months free)
    listingLimit: 10,
    features: [
      'Up to 10 active listings',
      'Visibility boost (+10% ranking)',
      'Full analytics dashboard',
      'Priority support',
      'Bulk listing tools',
      'Featured seller badge',
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_SELLER_PLUS_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_SELLER_UNLIMITED || '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_SELLER_PLUS_YEARLY || '',
    isPopular: true,
  },
  [SELLER_TIERS.PRO]: {
    id: SELLER_TIERS.PRO,
    name: 'Seller Pro',
    description: 'Unlimited listings with maximum exposure',
    priceMonthly: 10000, // $100.00
    priceYearly: 100000, // $1000/year (2 months free)
    listingLimit: -1, // Unlimited
    features: [
      'Unlimited active listings',
      'Premium visibility boost (+25% ranking)',
      'Full analytics + export',
      'Dedicated account manager',
      'Homepage rotation eligibility',
      'API access',
      'White-label options',
      'Priority 24/7 support',
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_SELLER_PRO_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_SELLER_PRO || '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_SELLER_PRO_YEARLY || '',
  },
  [SELLER_TIERS.ENTERPRISE]: {
    id: SELLER_TIERS.ENTERPRISE,
    name: 'Enterprise',
    description: 'Custom solutions for large operations',
    priceMonthly: 0, // Custom pricing
    listingLimit: -1, // Unlimited
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated success team',
      'SLA guarantees',
      'Custom analytics',
      'Volume discounts on add-ons',
      'Custom branding options',
    ],
    isEnterprise: true,
  },
};

// ============================================================================
// SELLER VERIFICATION TIERS (Required to create listings)
// ============================================================================

export const SELLER_VERIFICATION_TIERS = {
  STANDARD: 'standard',
  PRIORITY: 'priority',
} as const;

export type SellerVerificationTier = typeof SELLER_VERIFICATION_TIERS[keyof typeof SELLER_VERIFICATION_TIERS];

export interface SellerVerificationTierConfig {
  id: SellerVerificationTier;
  name: string;
  description: string;
  price: number; // One-time payment in cents
  features: string[];
  stripePriceId: string;
  slaHours: number; // AI processing SLA
  badge?: string;
  rankingBoostDays?: number; // First listing boost
  popular?: boolean; // Show as recommended
}

// S-5.4 & S-5.6: Updated verification language - clear what verification means
export const SELLER_VERIFICATION_CONFIG: Record<SellerVerificationTier, SellerVerificationTierConfig> = {
  [SELLER_VERIFICATION_TIERS.STANDARD]: {
    id: SELLER_VERIFICATION_TIERS.STANDARD,
    name: 'Seller Identity Verification',
    description: 'Annual identity verification to create listings',
    price: 2900, // $29.00/year
    features: [
      'Business document submission',
      'Document review',
      'Admin review process',
      'Identity Verified badge',
      '24-hour processing time',
      'Valid for 1 year',
    ],
    stripePriceId: process.env.STRIPE_PRICE_SELLER_VERIFIED || '',
    slaHours: 24,
    popular: true, // Default option
  },
  [SELLER_VERIFICATION_TIERS.PRIORITY]: {
    id: SELLER_VERIFICATION_TIERS.PRIORITY,
    name: 'Priority Seller Verification',
    description: 'Fast-track identity verification',
    price: 4900, // $49.00/year
    features: [
      'Priority document review',
      'Business document submission',
      'Document review',
      'Admin review process',
      'Identity Verified badge',
      'Same-day processing',
      'Valid for 1 year',
    ],
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM_SELLER_VERIFIED || '',
    slaHours: 0, // Instant
    popular: false,
  },
};

// ============================================================================
// CONTRACTOR TIERS — LEGACY (Now unified under Professional Plan)
// ============================================================================
// NOTE: Contractors and Companies are NOW the SAME commercial class.
// All professionals use PROFESSIONAL_PLAN at $2,500/year ALL-IN.
// These tiers are LEGACY - kept only for backwards compatibility with existing data.

export const CONTRACTOR_TIERS = {
  NONE: 'none',               // Default - NOT visible (must subscribe to Professional)
  VERIFIED: 'verified',       // Legacy - maps to Professional
  PLATFORM: 'platform',       // Legacy - maps to Professional
  PROFESSIONAL: 'professional', // Current: $2,500/year ALL-IN
  // Legacy tiers - kept for backwards compatibility with existing data
  FEATURED: 'featured',       // Legacy - maps to Professional
  PRIORITY: 'priority',       // Legacy - maps to Professional
} as const;

export type ContractorTier = typeof CONTRACTOR_TIERS[keyof typeof CONTRACTOR_TIERS];

export interface ContractorTierConfig {
  id: ContractorTier;
  name: string;
  description: string;
  priceMonthly: number;  // in cents (0 for verification-only)
  priceYearly?: number;  // in cents
  features: string[];
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  searchRankBoost: number;      // Multiplier for search ranking
  mapHighlight: boolean;        // Highlighted on maps
  listingPlacement: boolean;    // Appears on equipment listings
  analytics: boolean;           // Access to analytics
  leadIntelligence: boolean;    // Access to lead intelligence
  badge?: string;               // Badge text
  isHidden?: boolean;           // Not shown on pricing page
}

export const CONTRACTOR_TIER_CONFIG: Record<ContractorTier, ContractorTierConfig> = {
  [CONTRACTOR_TIERS.NONE]: {
    id: CONTRACTOR_TIERS.NONE,
    name: 'Unverified',
    description: 'Not visible in contractor directory. Must verify to appear.',
    priceMonthly: 0,
    features: [
      'Create contractor profile (private)',
      'Cannot appear in search',
      'Cannot appear on maps',
      'Cannot receive inquiries',
    ],
    searchRankBoost: 0,
    mapHighlight: false,
    listingPlacement: false,
    analytics: false,
    leadIntelligence: false,
    isHidden: true, // Don't show on pricing page
  },
  [CONTRACTOR_TIERS.VERIFIED]: {
    id: CONTRACTOR_TIERS.VERIFIED,
    name: 'Verified Contractor',
    description: 'Business verification to appear in directory',
    priceMonthly: 0, // Verification is separate ($150/year)
    features: [
      'Appears in contractor search',
      'Visible on contractor map',
      'Can receive inquiries',
      'Verified badge on profile',
      'Contact information display',
      'Service area listing',
    ],
    searchRankBoost: 1.0,
    mapHighlight: false,
    listingPlacement: false,
    analytics: false, // Analytics requires Platform plan
    leadIntelligence: false,
  },
  [CONTRACTOR_TIERS.PLATFORM]: {
    id: CONTRACTOR_TIERS.PLATFORM,
    name: 'Contractor Platform',
    description: 'Full platform access with analytics and lead intelligence',
    priceMonthly: 34900, // $349.00/month
    features: [
      'Everything in Verified',
      'Full analytics suite',
      'Performance dashboards',
      'Lead intelligence',
      'Ranking participation',
      'Profile prominence',
      'Priority support',
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CONTRACTOR_PLATFORM_MONTHLY || '',
    searchRankBoost: 2.0,
    mapHighlight: true,
    listingPlacement: true,
    analytics: true,
    leadIntelligence: true,
    badge: 'Platform',
  },
  // Legacy tier - maps to VERIFIED
  [CONTRACTOR_TIERS.FEATURED]: {
    id: CONTRACTOR_TIERS.FEATURED,
    name: 'Featured Contractor (Legacy)',
    description: 'Legacy tier - equivalent to Professional',
    priceMonthly: 0,
    features: ['Legacy - see Professional tier'],
    searchRankBoost: 1.0,
    mapHighlight: false,
    listingPlacement: false,
    analytics: false,
    leadIntelligence: false,
    isHidden: true,
  },
  // Legacy tier - maps to PROFESSIONAL
  [CONTRACTOR_TIERS.PRIORITY]: {
    id: CONTRACTOR_TIERS.PRIORITY,
    name: 'Priority Contractor (Legacy)',
    description: 'Legacy tier - equivalent to Professional',
    priceMonthly: 0, // No monthly - annual only
    priceYearly: 250000, // $2,500/year
    features: ['Legacy - see Professional tier'],
    searchRankBoost: 2.0,
    mapHighlight: true,
    listingPlacement: true,
    analytics: true,
    leadIntelligence: true,
    isHidden: true,
  },
  // Current tier: Professional Verified Plan
  [CONTRACTOR_TIERS.PROFESSIONAL]: {
    id: CONTRACTOR_TIERS.PROFESSIONAL,
    name: 'Professional Verified',
    description: 'All-in annual plan for contractors and companies',
    priceMonthly: 0, // No monthly option
    priceYearly: 250000, // $2,500.00/year
    features: [
      'Business verification included',
      'Unlimited product listings',
      'Public business profile',
      'Full analytics suite',
      'Performance dashboards',
      'Lead intelligence',
      'Ranking participation',
      'Profile prominence',
      'Full dashboard access',
      'Contractor directory listing',
      'Map visibility',
      'Priority support',
    ],
    stripePriceIdYearly: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL || '',
    searchRankBoost: 2.0,
    mapHighlight: true,
    listingPlacement: true,
    analytics: true, // ALWAYS included
    leadIntelligence: true,
    badge: 'Professional',
  },
};

// ============================================================================
// CONTRACTOR VERIFICATION — LEGACY (Now included in Professional Plan)
// ============================================================================
// NOTE: Verification is now INCLUDED in the $2,500/year Professional Plan.
// This section kept for backwards compatibility only.

export const CONTRACTOR_VERIFICATION = {
  name: 'Contractor Business Verification (Legacy)',
  description: 'Now included in Professional Plan',
  price: 0, // Included in Professional Plan
  features: [
    'Identity verification',
    'Business verification',
    'Insurance verification',
    'Compliance confirmation',
    'Verified Contractor badge',
    '24-hour processing',
    'Valid for 1 year',
  ],
  stripePriceId: '', // No longer sold separately
  validityDays: 365,
  includedInProfessionalPlan: true,
} as const;

// Legacy compatibility - keeping old structure for existing code
export const CONTRACTOR_VERIFICATION_TIERS = {
  STANDARD: 'standard',
} as const;

export type ContractorVerificationTier = typeof CONTRACTOR_VERIFICATION_TIERS[keyof typeof CONTRACTOR_VERIFICATION_TIERS];

export interface ContractorVerificationConfig {
  id: ContractorVerificationTier;
  name: string;
  description: string;
  price: number; // One-time payment in cents
  features: string[];
  stripePriceId: string;
  slaHours: number;
  validityDays: number; // 365 = 1 year
}

export const CONTRACTOR_VERIFICATION_CONFIG: Record<ContractorVerificationTier, ContractorVerificationConfig> = {
  [CONTRACTOR_VERIFICATION_TIERS.STANDARD]: {
    id: CONTRACTOR_VERIFICATION_TIERS.STANDARD,
    name: 'Contractor Business Verification',
    description: 'Required to appear in directory and access platform',
    price: 15000, // $150.00/year
    features: [
      'Identity verification',
      'Business verification',
      'Insurance verification',
      'Compliance confirmation',
      'Verified Contractor badge',
      '24-hour processing',
      'Valid for 1 year',
    ],
    stripePriceId: process.env.STRIPE_PRICE_CONTRACTOR_VERIFICATION || '',
    slaHours: 24,
    validityDays: 365,
  },
};
// ============================================================================
// PROFESSIONAL PLAN ($2,500/year - Contractor = Company, UNIFIED)
// ============================================================================
// Contractors and Companies are the SAME commercial class.
// Single annual charge includes everything. No upsells. No monthly option.

export const PROFESSIONAL_PLAN = {
  name: 'Professional Verified Plan',
  description: 'All-in annual plan for contractors and companies',
  price: 250000, // $2,500.00/year
  stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL || '',
  includes: {
    businessVerification: true, // No separate fee
    unlimitedListings: true,
    publicProfile: true,
    fullAnalytics: true,        // ALWAYS included
    performanceDashboards: true,
    leadIntelligence: true,
    rankingParticipation: true,
    profileProminence: true,
    fullDashboardAccess: true,
    contractorDirectory: true,  // Visible in contractor search
    mapListing: true,           // Visible on maps
  },
  features: [
    'Business verification included',
    'Unlimited product listings',
    'Public business profile',
    'Full analytics suite',
    'Performance dashboards',
    'Lead intelligence',
    'Ranking participation',
    'Profile prominence',
    'Full dashboard access',
    'Contractor directory listing',
    'Map visibility',
    'Priority support',
  ],
  noMonthlyFees: true,
  noAnalyticsUpsells: true,
  noListingLimits: true,
  noSeparateVerificationFee: true,
} as const;

// Legacy alias - COMPANY_PLAN now points to PROFESSIONAL_PLAN
export const COMPANY_PLAN = PROFESSIONAL_PLAN;

// ============================================================================
// ADD-ON TYPE DEFINITIONS (Elite ONLY - no Premium/Featured tiers)
// ============================================================================

export const ADD_ON_TYPES = {
  ELITE: 'elite',                       // $99/30 days - ONLY placement tier
  AI_ENHANCEMENT: 'ai-enhancement',     // $10/use
  SPEC_SHEET: 'spec-sheet',             // $25 one-time
  VERIFIED_BADGE: 'verified-badge',     // Legacy - seller attestation
  SELLER_ANALYTICS: 'seller-analytics', // $49/year - Seller analytics access
} as const;

export type AddOnType = typeof ADD_ON_TYPES[keyof typeof ADD_ON_TYPES];

// ============================================================================
// ADD-ON PRICING CONFIGURATION (in cents)
// ELITE is the ONLY visibility placement tier
// ============================================================================

export const ADD_ON_PRICING = {
  [ADD_ON_TYPES.ELITE]: 9900,               // $99.00 - Elite Placement (ONLY tier)
  [ADD_ON_TYPES.AI_ENHANCEMENT]: 1000,      // $10.00 - AI Listing Enhancement
  [ADD_ON_TYPES.SPEC_SHEET]: 2500,          // $25.00 - Spec Sheet Auto-Build
  [ADD_ON_TYPES.VERIFIED_BADGE]: 1500,      // $15.00 - Verified Asset Badge (legacy)
  [ADD_ON_TYPES.SELLER_ANALYTICS]: 4900,    // $49.00/year - Seller Analytics Access
} as const;

// Legacy compatibility - map old types to Elite
export const LEGACY_ADD_ON_MAPPING = {
  'featured': ADD_ON_TYPES.ELITE,
  'premium': ADD_ON_TYPES.ELITE,
} as const;

// ============================================================================
// ADD-ON DURATION CONFIGURATION (in days)
// ============================================================================

export const ADD_ON_DURATION = {
  [ADD_ON_TYPES.ELITE]: 30,                 // 30 days
  [ADD_ON_TYPES.AI_ENHANCEMENT]: null,      // Permanent (one-time enhancement)
  [ADD_ON_TYPES.SPEC_SHEET]: null,          // Permanent (one-time generation)
  [ADD_ON_TYPES.VERIFIED_BADGE]: 30,        // 30 days
  [ADD_ON_TYPES.SELLER_ANALYTICS]: 365,     // 365 days (1 year)
} as const;

// ============================================================================
// ADD-ON RANKING BOOST CONFIGURATION
// ============================================================================

export const ADD_ON_RANKING_BOOST = {
  [ADD_ON_TYPES.ELITE]: 3,                  // +3 tier boost (highest - homepage + category)
  [ADD_ON_TYPES.AI_ENHANCEMENT]: 0,         // No ranking boost (content enhancement only)
  [ADD_ON_TYPES.SPEC_SHEET]: 0,             // No ranking boost (document generation only)
  [ADD_ON_TYPES.VERIFIED_BADGE]: 0,         // No ranking boost (trust signal only)
  [ADD_ON_TYPES.SELLER_ANALYTICS]: 0,       // No ranking boost (dashboard access only)
} as const;

// ============================================================================
// STRIPE PRICE ID MAPPING (for add-ons - one-time checkout)
// ============================================================================

export const STRIPE_ADDON_PRICE_IDS = {
  [ADD_ON_TYPES.ELITE]: process.env.STRIPE_PRICE_ELITE_PLACEMENT || '',
  [ADD_ON_TYPES.AI_ENHANCEMENT]: process.env.STRIPE_PRICE_AI_ENHANCEMENT || '',
  [ADD_ON_TYPES.SPEC_SHEET]: process.env.STRIPE_PRICE_SPEC_SHEET || '',
  [ADD_ON_TYPES.VERIFIED_BADGE]: process.env.STRIPE_PRICE_VERIFIED_BADGE || '',
  [ADD_ON_TYPES.SELLER_ANALYTICS]: process.env.STRIPE_PRICE_SELLER_ANALYTICS_ACCESS || '',
} as const;

// ============================================================================
// ADD-ON METADATA & DESCRIPTIONS
// ============================================================================

export interface AddOnMetadata {
  name: string;
  shortDescription: string;
  description: string;
  features: string[];
  badge?: string;
  badgeColor?: string;
  icon?: string;
  category: 'visibility' | 'enhancement';
}

export const ADD_ON_METADATA: Record<AddOnType, AddOnMetadata> = {
  [ADD_ON_TYPES.ELITE]: {
    name: 'Elite Placement',
    shortDescription: 'Homepage highlight + premium placement',
    description: 'The visibility package with homepage featuring and maximum exposure. Your listing gets the best placement possible. Always labeled as Sponsored.',
    features: [
      'Homepage highlight section',
      'Elite badge on listing',
      'Highest ranking tier (+3)',
      'Priority customer support',
      'Social media promotion eligibility',
      'Always labeled "Sponsored"',
    ],
    badge: 'Sponsored',
    badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-600',
    icon: '🏆',
    category: 'visibility',
  },
  [ADD_ON_TYPES.AI_ENHANCEMENT]: {
    name: 'AI Listing Enhancement',
    shortDescription: 'AI-assisted content optimization',
    description: 'Let AI assist with content improvements—titles, descriptions, and keyword optimization. One-time enhancement for your listing.',
    features: [
      'AI-assisted title suggestions',
      'Description clarity improvements',
      'Keyword optimization',
      'Industry-specific terminology',
      'Grammar and clarity improvements',
    ],
    badge: 'AI Assisted',
    badgeColor: 'bg-blue-600',
    icon: '🤖',
    category: 'enhancement',
  },
  [ADD_ON_TYPES.SPEC_SHEET]: {
    name: 'Spec Sheet Auto-Build',
    shortDescription: 'Professional PDF spec sheet',
    description: 'Automatically generate a professional PDF specification sheet for your equipment. One-time generation that buyers can download.',
    features: [
      'Branded PDF document',
      'Equipment specifications formatted',
      'Photos included',
      'Downloadable by buyers',
      'Professional layout',
    ],
    badge: 'Spec Sheet',
    badgeColor: 'bg-slate-700',
    icon: '📄',
    category: 'enhancement',
  },
  // S-5.4: Removed exaggerated claims from verified badge
  [ADD_ON_TYPES.VERIFIED_BADGE]: {
    name: 'Verified Asset Badge',
    shortDescription: 'Seller attestation badge',
    description: 'Add a seller-attested badge to your listing. Shows that the seller has confirmed equipment details. This is self-reported and not independently verified.',
    features: [
      'Seller-attested badge on listing',
      'Highlighted in search results',
      'Shows seller commitment',
    ],
    badge: 'Seller Attested',
    badgeColor: 'bg-green-600',
    icon: '✓',
    category: 'enhancement',
  },
  [ADD_ON_TYPES.SELLER_ANALYTICS]: {
    name: 'Seller Analytics Access',
    shortDescription: 'Unlock listing analytics dashboard',
    description: 'Get detailed insights into your listing performance, view trends, inquiry tracking, and conversion metrics. Analytics are provided for informational purposes only.',
    features: [
      'View & inquiry tracking',
      'Top performing listings',
      'Category performance breakdown',
      'Outbound click tracking (website, email, phone)',
      'Conversion rate analysis',
      'Valid for 1 year',
    ],
    badge: 'Analytics',
    badgeColor: 'bg-indigo-600',
    icon: '📊',
    category: 'enhancement',
  },
};

// ============================================================================
// RANKING WEIGHTS FOR SEARCH (used by search API)
// ============================================================================

export const RANKING_WEIGHTS = {
  // Tier-based ranking weights (Elite only)
  elite: 750,
  sponsored: 750, // Alias for elite
  
  // Seller tier ranking bonuses
  sellerPro: 100,    // Pro sellers get a small boost
  sellerPlus: 40,    // Plus sellers get a small boost
  
  // Professional plan ranking (Contractor = Company)
  professional: 400, // Professionals rank high
  
  // Legacy aliases - map to professional
  verifiedContractor: 400, // Maps to professional
  platformContractor: 400, // Maps to professional
  companyPlan: 400,        // Maps to professional
  
  // Base scores
  base: 100,
  
  // Penalties
  expired: -50,
} as const;

// ============================================================================
// LISTING LIMITS (by seller tier)
// Everyone can sell with verification - listing limits are unlimited
// ============================================================================

export const LISTING_LIMITS: Record<SellerTier, number> = {
  [SELLER_TIERS.BUYER]: -1, // Unlimited (but requires verification)
  [SELLER_TIERS.BASIC]: -1, // Unlimited (but requires verification)
  [SELLER_TIERS.PLUS]: -1, // Unlimited
  [SELLER_TIERS.PRO]: -1, // Unlimited
  [SELLER_TIERS.ENTERPRISE]: -1, // Unlimited
};

/**
 * Check if a user can create a new listing based on their tier
 * NOTE: Seller verification is required separately - check isVerifiedSeller
 */
export function canCreateListing(tier: SellerTier, currentListingCount: number): boolean {
  const limit = LISTING_LIMITS[tier];
  if (limit === -1) return true; // Unlimited
  return currentListingCount < limit;
}

/**
 * Get remaining listing slots for a tier
 */
export function getRemainingListingSlots(tier: SellerTier, currentListingCount: number): number {
  const limit = LISTING_LIMITS[tier];
  if (limit === -1) return Infinity;
  return Math.max(0, limit - currentListingCount);
}

// ============================================================================
// HELPER FUNCTIONS - SUBSCRIPTION TIERS
// ============================================================================

/**
 * Format price in dollars
 */
export function formatPrice(priceInCents: number): string {
  if (priceInCents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInCents / 100);
}

/**
 * Format price with /mo suffix for subscriptions
 */
export function formatSubscriptionPrice(priceInCents: number): string {
  if (priceInCents === 0) return 'Free';
  return `${formatPrice(priceInCents)}/mo`;
}

/**
 * Get seller tier config by tier ID
 */
export function getSellerTierConfig(tier: SellerTier): SellerTierConfig {
  return SELLER_TIER_CONFIG[tier];
}

/**
 * Get contractor tier config by tier ID
 */
export function getContractorTierConfig(tier: ContractorTier): ContractorTierConfig {
  return CONTRACTOR_TIER_CONFIG[tier];
}

/**
 * Get all seller tiers for pricing display (excluding buyer - now removed as subscription isn't needed)
 * Sellers only need verification, not a subscription tier
 */
export function getSellerTiersForDisplay(): SellerTierConfig[] {
  return [
    SELLER_TIER_CONFIG[SELLER_TIERS.PLUS],
    SELLER_TIER_CONFIG[SELLER_TIERS.PRO],
    SELLER_TIER_CONFIG[SELLER_TIERS.ENTERPRISE],
  ];
}

/**
 * Get seller verification tiers for display
 */
export function getSellerVerificationTiersForDisplay(): SellerVerificationTierConfig[] {
  return [
    SELLER_VERIFICATION_CONFIG[SELLER_VERIFICATION_TIERS.STANDARD],
    SELLER_VERIFICATION_CONFIG[SELLER_VERIFICATION_TIERS.PRIORITY],
  ];
}

/**
 * Get all contractor tiers for pricing display
 * Excludes NONE tier (hidden/internal)
 */
export function getContractorTiersForDisplay(): ContractorTierConfig[] {
  return [
    CONTRACTOR_TIER_CONFIG[CONTRACTOR_TIERS.VERIFIED],
    CONTRACTOR_TIER_CONFIG[CONTRACTOR_TIERS.FEATURED],
    CONTRACTOR_TIER_CONFIG[CONTRACTOR_TIERS.PRIORITY],
  ];
}

// ============================================================================
// HELPER FUNCTIONS - ADD-ONS
// ============================================================================

/**
 * Get formatted price string for an add-on
 */
export function formatAddOnPrice(type: AddOnType): string {
  const priceInCents = ADD_ON_PRICING[type];
  return formatPrice(priceInCents);
}

/**
 * Get formatted duration string for an add-on
 */
export function formatAddOnDuration(type: AddOnType): string {
  const duration = ADD_ON_DURATION[type];
  if (duration === null) return 'Permanent';
  const durationNum = duration as number;
  if (durationNum >= 365) return '1 year';
  if (durationNum >= 30) return '30 days';
  if (durationNum >= 7) return '1 week';
  return `${durationNum} days`;
}

/**
 * Calculate expiration date for an add-on
 */
export function calculateExpirationDate(type: AddOnType, startDate: Date = new Date()): Date | null {
  const duration = ADD_ON_DURATION[type];
  if (duration === null) return null;
  return new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
}

/**
 * Get remaining time for an active add-on
 */
export function getRemainingTime(expiresAt: Date | null): { days: number; hours: number; expired: boolean } | null {
  if (!expiresAt) return null; // Permanent add-on
  
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, expired: true };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return { days, hours, expired: false };
}

/**
 * Format remaining time as human-readable string
 */
export function formatRemainingTime(expiresAt: Date | null): string {
  const remaining = getRemainingTime(expiresAt);
  if (!remaining) return 'Permanent';
  if (remaining.expired) return 'Expired';
  if (remaining.days > 0) return `${remaining.days}d ${remaining.hours}h remaining`;
  return `${remaining.hours}h remaining`;
}

/**
 * Get all add-ons for a specific category
 */
export function getAddOnsByCategory(category: 'visibility' | 'enhancement'): AddOnType[] {
  return (Object.keys(ADD_ON_METADATA) as AddOnType[]).filter(
    (type) => ADD_ON_METADATA[type].category === category
  );
}

/**
 * Get the complete add-on info for display
 */
export function getAddOnInfo(type: AddOnType) {
  return {
    type,
    ...ADD_ON_METADATA[type],
    price: ADD_ON_PRICING[type],
    priceFormatted: formatAddOnPrice(type),
    duration: ADD_ON_DURATION[type],
    durationFormatted: formatAddOnDuration(type),
    rankingBoost: ADD_ON_RANKING_BOOST[type],
    stripePriceId: STRIPE_ADDON_PRICE_IDS[type],
  };
}

/**
 * Get all add-on info for display
 */
export function getAllAddOnsInfo() {
  return (Object.values(ADD_ON_TYPES) as AddOnType[]).map(getAddOnInfo);
}

/**
 * Visibility add-ons that affect search ranking (Elite ONLY)
 */
export const VISIBILITY_ADDONS: AddOnType[] = [
  ADD_ON_TYPES.ELITE,
];

/**
 * Check if an add-on affects ranking
 */
export function isRankingAddOn(type: AddOnType): boolean {
  return ADD_ON_RANKING_BOOST[type] > 0;
}

/**
 * Get the highest ranking boost from a list of active add-ons
 */
export function getMaxRankingBoost(activeAddOns: AddOnType[]): number {
  return Math.max(0, ...activeAddOns.map(type => ADD_ON_RANKING_BOOST[type]));
}

// ============================================================================
// ANALYTICS ENTITLEMENTS (STRICT RULES)
// ============================================================================
// ANALYTICS ENTITLEMENTS (LOCKED ARCHITECTURE)
// ============================================================================
// - Buyers: NEVER
// - Sellers: Locked by default, must purchase add-on
// - Professionals (Contractor = Company): ALWAYS included ($2,500/year)
//   ❌ No analytics upsells for professionals

export const ANALYTICS_ENTITLEMENTS = {
  buyer: {
    hasAccess: false,
    canPurchase: false,
    reason: 'Analytics not available for buyer accounts',
  },
  seller: {
    hasAccess: false,
    canPurchase: true,
    reason: 'Purchase analytics add-on to access',
    addOnPrice: 4900, // $49/mo for seller analytics
  },
  // Professional = Contractor = Company (UNIFIED)
  professional: {
    hasAccess: true, // ALWAYS included
    canPurchase: false, // Already included
    reason: 'Included with Professional Plan ($2,500/year)',
  },
  // Legacy aliases - map to professional
  contractor: {
    hasAccess: true, // ALWAYS included (same as company)
    canPurchase: false, // Already included
    reason: 'Included with Professional Plan ($2,500/year)',
  },
  company: {
    hasAccess: true, // ALWAYS included
    canPurchase: false, // Already included
    reason: 'Included with Professional Plan ($2,500/year)',
  },
} as const;

/**
 * Check analytics access for a user
 * Professional plan (contractor/company) ALWAYS has analytics
 */
export function hasAnalyticsAccess(userType: 'buyer' | 'seller' | 'contractor' | 'company' | 'professional', options?: {
  isProfessional?: boolean;
  hasAnalyticsAddOn?: boolean;
}): boolean {
  switch (userType) {
    case 'buyer':
      return false; // NEVER
    case 'seller':
      return options?.hasAnalyticsAddOn === true;
    case 'professional':
    case 'contractor':
    case 'company':
      return options?.isProfessional === true; // ALWAYS with Professional plan
    default:
      return false;
  }
}

// ============================================================================
// SUBSCRIPTION STATUS TYPES
// ============================================================================

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
  TRIALING: 'trialing',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
  PAUSED: 'paused',
} as const;

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];

// ============================================================================
// TIER COMPARISON HELPERS
// ============================================================================

const SELLER_TIER_ORDER: SellerTier[] = [
  SELLER_TIERS.BUYER,
  SELLER_TIERS.BASIC,
  SELLER_TIERS.PLUS,
  SELLER_TIERS.PRO,
  SELLER_TIERS.ENTERPRISE,
];

/**
 * Check if tier A is higher than tier B
 */
export function isHigherTier(tierA: SellerTier, tierB: SellerTier): boolean {
  return SELLER_TIER_ORDER.indexOf(tierA) > SELLER_TIER_ORDER.indexOf(tierB);
}

/**
 * Check if upgrade is available from current tier
 */
export function canUpgrade(currentTier: SellerTier): boolean {
  const currentIndex = SELLER_TIER_ORDER.indexOf(currentTier);
  return currentIndex < SELLER_TIER_ORDER.length - 1;
}

/**
 * Check if downgrade is available from current tier
 */
export function canDowngrade(currentTier: SellerTier): boolean {
  const currentIndex = SELLER_TIER_ORDER.indexOf(currentTier);
  return currentIndex > 1; // Can't downgrade below Basic (index 1)
}

/**
 * Get next higher tier
 */
export function getNextTier(currentTier: SellerTier): SellerTier | null {
  const currentIndex = SELLER_TIER_ORDER.indexOf(currentTier);
  if (currentIndex < SELLER_TIER_ORDER.length - 1) {
    return SELLER_TIER_ORDER[currentIndex + 1];
  }
  return null;
}

/**
 * Get the tier a user should be on based on role
 * Default: buyers stay buyer, sellers get basic, contractors are separate
 */
export function getDefaultTierForRole(role: 'buyer' | 'seller' | 'contractor' | 'admin'): SellerTier {
  switch (role) {
    case 'seller':
      return SELLER_TIERS.BASIC;
    case 'admin':
      return SELLER_TIERS.PRO;
    default:
      return SELLER_TIERS.BUYER;
  }
}
