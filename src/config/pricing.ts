/**
 * THE RAIL EXCHANGE™ — Unified Pricing Configuration
 * 
 * SINGLE SOURCE OF TRUTH for all pricing, subscriptions, and add-ons.
 * 
 * IMPORTANT: 
 * - All pricing must be managed here. Do not hardcode prices anywhere else.
 * - Stripe Price IDs are loaded from environment variables.
 * - Admin dashboard can modify these values in future iterations.
 */

// ============================================================================
// SELLER SUBSCRIPTION TIERS
// ============================================================================

export const SELLER_TIERS = {
  BUYER: 'buyer',           // Free tier (browse only, no listings)
  BASIC: 'basic',           // $29/mo - 3 listings
  PLUS: 'plus',             // $59/mo - 10 listings
  PRO: 'pro',               // $100/mo - unlimited
  ENTERPRISE: 'enterprise', // Custom pricing
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

export const SELLER_VERIFICATION_CONFIG: Record<SellerVerificationTier, SellerVerificationTierConfig> = {
  [SELLER_VERIFICATION_TIERS.STANDARD]: {
    id: SELLER_VERIFICATION_TIERS.STANDARD,
    name: 'Standard Verification',
    description: 'Required verification to create listings',
    price: 2900, // $29.00
    features: [
      'Identity document review',
      'AI-assisted document review',
      'Human admin review',
      'Verified Seller badge',
      '24-hour approval SLA',
      'Valid for 1 year',
    ],
    stripePriceId: process.env.STRIPE_PRICE_SELLER_VERIFIED || '',
    slaHours: 24,
    popular: false,
  },
  [SELLER_VERIFICATION_TIERS.PRIORITY]: {
    id: SELLER_VERIFICATION_TIERS.PRIORITY,
    name: 'Priority Verification',
    description: 'Fast-track verification with premium benefits',
    price: 4900, // $49.00
    features: [
      'Priority document review',
      'Identity document review',
      'AI-assisted document review',
      'Human admin review',
      'Priority Verified Seller badge',
      '3-day ranking boost for first listing',
      'Priority review queue',
      'Valid for 1 year',
    ],
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM_SELLER_VERIFIED || '',
    slaHours: 0, // Instant
    badge: 'Priority Verified Seller',
    rankingBoostDays: 3,
    popular: true,
  },
};

// ============================================================================
// CONTRACTOR TIERS — PAID VISIBILITY ONLY
// ============================================================================
// No free tier. Contractors MUST be verified AND subscribed to appear anywhere.
// Verification is a one-time annual payment. Visibility tiers are monthly.

export const CONTRACTOR_TIERS = {
  NONE: 'none',               // Default - NOT visible anywhere (must verify + subscribe)
  VERIFIED: 'verified',       // Base tier - paid verification, appears in search/maps
  FEATURED: 'featured',       // Priority placement, highlighted on maps
  PRIORITY: 'priority',       // Top placement, limited slots, premium badge
} as const;

export type ContractorTier = typeof CONTRACTOR_TIERS[keyof typeof CONTRACTOR_TIERS];

export interface ContractorTierConfig {
  id: ContractorTier;
  name: string;
  description: string;
  priceMonthly: number;  // in cents (0 for base after verification)
  priceYearly?: number;  // in cents
  features: string[];
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  searchRankBoost: number;      // Multiplier for search ranking
  mapHighlight: boolean;        // Highlighted on maps
  listingPlacement: boolean;    // Appears on equipment listings
  limitedSlots?: number;        // Per region/category limit (undefined = unlimited)
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
    isHidden: true, // Don't show on pricing page
  },
  [CONTRACTOR_TIERS.VERIFIED]: {
    id: CONTRACTOR_TIERS.VERIFIED,
    name: 'Verified Contractor',
    description: 'Verified and visible in contractor directory',
    priceMonthly: 0, // Included with verification
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
  },
  [CONTRACTOR_TIERS.FEATURED]: {
    id: CONTRACTOR_TIERS.FEATURED,
    name: 'Featured Contractor',
    description: 'Priority placement with enhanced visibility',
    priceMonthly: 9900, // $99.00/month
    priceYearly: 99000, // $990/year (2 months free)
    features: [
      'Everything in Verified',
      'Priority placement in search results',
      'Highlighted on contractor map',
      'Appears on relevant equipment listings',
      'Featured badge on profile',
      '2x search ranking boost',
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CONTRACTOR_FEATURED_MONTHLY || '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_CONTRACTOR_FEATURED_YEARLY || '',
    searchRankBoost: 2.0,
    mapHighlight: true,
    listingPlacement: true,
    badge: 'Featured',
  },
  [CONTRACTOR_TIERS.PRIORITY]: {
    id: CONTRACTOR_TIERS.PRIORITY,
    name: 'Priority Contractor',
    description: 'Top placement with exclusive positioning',
    priceMonthly: 19900, // $199.00/month
    priceYearly: 199000, // $1990/year (2 months free)
    features: [
      'Everything in Featured',
      'Always first in search results',
      'Premium highlighted badge',
      'First on equipment listing pages',
      'Limited slots per region (5 max)',
      '3x search ranking boost',
      'Priority support',
    ],
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CONTRACTOR_PRIORITY_MONTHLY || '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_CONTRACTOR_PRIORITY_YEARLY || '',
    searchRankBoost: 3.0,
    mapHighlight: true,
    listingPlacement: true,
    limitedSlots: 5, // Per region
    badge: 'Priority',
  },
};

// ============================================================================
// CONTRACTOR VERIFICATION (Required BEFORE any visibility)
// ============================================================================
// One-time annual payment. Must complete:
// - Identity verification
// - Business verification
// - Insurance upload
// - Compliance confirmation

export const CONTRACTOR_VERIFICATION_TIERS = {
  STANDARD: 'standard',
  PRIORITY: 'priority',
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
    name: 'Contractor Verification',
    description: 'Required to appear in directory and receive inquiries',
    price: 9900, // $99.00
    features: [
      'Identity verification',
      'Business verification',
      'Insurance verification',
      'Compliance confirmation',
      'Verified Contractor badge',
      '24-hour processing',
      'Valid for 1 year',
    ],
    stripePriceId: process.env.STRIPE_PRICE_CONTRACTOR_VERIFIED_MONTHLY || '',
    slaHours: 24,
    validityDays: 365,
  },
  [CONTRACTOR_VERIFICATION_TIERS.PRIORITY]: {
    id: CONTRACTOR_VERIFICATION_TIERS.PRIORITY,
    name: 'Priority Contractor Verification',
    description: 'Fast-track verification with immediate visibility',
    price: 14900, // $149.00
    features: [
      'Everything in Standard',
      'Instant processing',
      'Priority badge for first 7 days',
      '7-day Featured placement included',
      'Valid for 1 year',
    ],
    stripePriceId: process.env.STRIPE_PRICE_CONTRACTOR_PRIORITY_VERIFICATION || '',
    slaHours: 0, // Instant
    validityDays: 365,
  },
};

// ============================================================================
// ADD-ON TYPE DEFINITIONS
// ============================================================================

export const ADD_ON_TYPES = {
  FEATURED: 'featured',
  PREMIUM: 'premium',
  ELITE: 'elite',
  AI_ENHANCEMENT: 'ai-enhancement',
  VERIFIED_BADGE: 'verified-badge',
  SPEC_SHEET: 'spec-sheet',
} as const;

export type AddOnType = typeof ADD_ON_TYPES[keyof typeof ADD_ON_TYPES];

// ============================================================================
// ADD-ON PRICING CONFIGURATION (in cents) - ONE-TIME PURCHASES
// ============================================================================

export const ADD_ON_PRICING = {
  [ADD_ON_TYPES.FEATURED]: 2000,        // $20.00 - Featured Listing
  [ADD_ON_TYPES.PREMIUM]: 5000,         // $50.00 - Premium Placement
  [ADD_ON_TYPES.ELITE]: 9900,           // $99.00 - Elite Placement
  [ADD_ON_TYPES.AI_ENHANCEMENT]: 1000,  // $10.00 - AI Listing Enhancement
  [ADD_ON_TYPES.VERIFIED_BADGE]: 1500,  // $15.00 - Verified Asset Badge
  [ADD_ON_TYPES.SPEC_SHEET]: 2500,      // $25.00 - Spec Sheet Auto-Build
} as const;

// ============================================================================
// ADD-ON DURATION CONFIGURATION (in days)
// ============================================================================

export const ADD_ON_DURATION = {
  [ADD_ON_TYPES.FEATURED]: 30,          // 30 days
  [ADD_ON_TYPES.PREMIUM]: 30,           // 30 days
  [ADD_ON_TYPES.ELITE]: 30,             // 30 days
  [ADD_ON_TYPES.AI_ENHANCEMENT]: null,  // Permanent (one-time enhancement)
  [ADD_ON_TYPES.VERIFIED_BADGE]: 30,    // 30 days
  [ADD_ON_TYPES.SPEC_SHEET]: null,      // Permanent (one-time generation)
} as const;

// ============================================================================
// ADD-ON RANKING BOOST CONFIGURATION
// ============================================================================

export const ADD_ON_RANKING_BOOST = {
  [ADD_ON_TYPES.FEATURED]: 1,           // +1 tier boost
  [ADD_ON_TYPES.PREMIUM]: 2,            // +2 tier boost
  [ADD_ON_TYPES.ELITE]: 3,              // +3 tier boost (highest - homepage + category)
  [ADD_ON_TYPES.AI_ENHANCEMENT]: 0,     // No ranking boost (content enhancement only)
  [ADD_ON_TYPES.VERIFIED_BADGE]: 0,     // No ranking boost (trust signal only)
  [ADD_ON_TYPES.SPEC_SHEET]: 0,         // No ranking boost (document generation only)
} as const;

// ============================================================================
// STRIPE PRICE ID MAPPING (for add-ons - one-time checkout)
// ============================================================================

export const STRIPE_ADDON_PRICE_IDS = {
  [ADD_ON_TYPES.FEATURED]: process.env.STRIPE_PRICE_FEATURED_LISTING || '',
  [ADD_ON_TYPES.PREMIUM]: process.env.STRIPE_PRICE_PREMIUM_PLACEMENT || '',
  [ADD_ON_TYPES.ELITE]: process.env.STRIPE_PRICE_ELITE_PLACEMENT || '',
  [ADD_ON_TYPES.AI_ENHANCEMENT]: process.env.STRIPE_PRICE_AI_ENHANCEMENT || '',
  [ADD_ON_TYPES.VERIFIED_BADGE]: process.env.STRIPE_PRICE_VERIFIED_BADGE || '',
  [ADD_ON_TYPES.SPEC_SHEET]: process.env.STRIPE_PRICE_SPEC_SHEET || '',
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
  [ADD_ON_TYPES.FEATURED]: {
    name: 'Featured Listing',
    shortDescription: 'Boosted visibility in search results',
    description: 'Get 3x more visibility with featured placement in search results and category pages. Your listing appears before standard listings.',
    features: [
      'Featured badge on listing',
      'Priority in search results (+1 tier)',
      'Highlighted in category views',
      'Included in Featured section on homepage',
    ],
    badge: 'Featured',
    badgeColor: 'bg-amber-500',
    icon: '⭐',
    category: 'visibility',
  },
  [ADD_ON_TYPES.PREMIUM]: {
    name: 'Premium Placement',
    shortDescription: 'Top of category placement',
    description: 'Maximum category exposure with pinned placement at the top of your category. Ideal for high-value equipment.',
    features: [
      'All Featured benefits',
      'Pinned to category top (+2 tier)',
      'Premium badge on listing',
      'Analytics insights dashboard',
      'Larger thumbnail in search',
    ],
    badge: 'Premium',
    badgeColor: 'bg-purple-600',
    icon: '💎',
    category: 'visibility',
  },
  [ADD_ON_TYPES.ELITE]: {
    name: 'Elite Placement',
    shortDescription: 'Homepage highlight + premium placement',
    description: 'The ultimate visibility package with homepage featuring, maximum exposure, and priority support. Your listing gets the best placement possible.',
    features: [
      'All Premium benefits',
      'Homepage highlight section',
      'Elite badge on listing',
      'Highest ranking tier (+3)',
      'Priority customer support',
      'Social media promotion eligibility',
    ],
    badge: 'Elite',
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
  [ADD_ON_TYPES.VERIFIED_BADGE]: {
    name: 'Verified Asset Badge',
    shortDescription: 'Trust signal for buyers',
    description: 'Add a verified asset badge to your listing to build buyer confidence. Shows that your equipment has been seller-verified for authenticity.',
    features: [
      'Verified Asset badge on listing',
      'Trust indicator for buyers',
      'Highlighted in search results',
      'Increased buyer confidence',
      'Professional credibility boost',
    ],
    badge: 'Verified Asset',
    badgeColor: 'bg-green-600',
    icon: '✓',
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
};

// ============================================================================
// RANKING WEIGHTS FOR SEARCH (used by search API)
// ============================================================================

export const RANKING_WEIGHTS = {
  // Tier-based ranking weights (add-on based)
  elite: 750,
  premium: 500,
  featured: 250,
  
  // Seller tier ranking bonuses
  sellerPro: 100,    // Pro sellers get a small boost
  sellerPlus: 40,    // Plus sellers get a small boost
  
  // Contractor tier ranking bonuses  
  verifiedContractor: 200, // Verified contractors rank higher
  
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
 * Visibility add-ons that affect search ranking
 */
export const VISIBILITY_ADDONS: AddOnType[] = [
  ADD_ON_TYPES.FEATURED,
  ADD_ON_TYPES.PREMIUM,
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
