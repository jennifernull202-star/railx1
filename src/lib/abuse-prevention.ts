/**
 * THE RAIL EXCHANGE™ — Abuse Prevention Utilities
 * 
 * S-1 PLATFORM ABUSE CONTAINMENT
 * 
 * Centralized abuse prevention logic for:
 * - Inquiry spam containment
 * - Content filtering (links, promotional phrases)
 * - Image hash duplicate detection
 * - False report tracking
 * - Account age-based limits
 */

import crypto from 'crypto';

// ============================================
// S-1.2: INQUIRY SPAM CONTAINMENT
// ============================================

// Inquiry limits based on account age
export const INQUIRY_LIMITS = {
  NEW_ACCOUNT_DAYS: 7,          // Accounts younger than this are "new"
  NEW_ACCOUNT_DAILY_LIMIT: 5,   // New accounts: 5 inquiries/day
  VERIFIED_DAILY_LIMIT: 20,     // Verified accounts: 20 inquiries/day
  SPAM_FLAG_THRESHOLD: 3,       // 3 rejected/spam-flagged inquiries → 24-hour lock
  LOCKOUT_HOURS: 24,            // Lockout duration
};

// Blocked phrases for inquiry content (simple keyword blocklist)
const BLOCKED_PHRASES = [
  // Promotional spam
  'click here',
  'visit my website',
  'check out my site',
  'free offer',
  'limited time offer',
  'act now',
  'don\'t miss out',
  'exclusive deal',
  'make money fast',
  'work from home',
  'earn extra income',
  // Phishing/scam indicators
  'send money',
  'wire transfer',
  'western union',
  'moneygram',
  'gift card payment',
  'bitcoin payment',
  'crypto payment',
  'verify your account',
  'confirm your identity',
  // Contact harvesting
  'contact me at',
  'email me at',
  'call me at',
  'text me at',
  'whatsapp',
  'telegram',
  'signal me',
];

// URL pattern for detecting external links
const URL_PATTERN = /https?:\/\/[^\s]+|www\.[^\s]+|\[url\]|\[link\]/gi;

/**
 * Check if content contains blocked promotional phrases
 */
export function containsBlockedPhrases(content: string): { blocked: boolean; phrase?: string } {
  const lowerContent = content.toLowerCase();
  
  for (const phrase of BLOCKED_PHRASES) {
    if (lowerContent.includes(phrase.toLowerCase())) {
      return { blocked: true, phrase };
    }
  }
  
  return { blocked: false };
}

/**
 * Check if content contains external links
 */
export function containsExternalLinks(content: string): boolean {
  return URL_PATTERN.test(content);
}

/**
 * Validate inquiry content for spam indicators
 * Returns error message if blocked, null if OK
 */
export function validateInquiryContent(content: string): string | null {
  // Check for external links
  if (containsExternalLinks(content)) {
    return 'External links are not allowed in inquiries.';
  }
  
  // Check for blocked phrases
  const phraseCheck = containsBlockedPhrases(content);
  if (phraseCheck.blocked) {
    return 'Your message contains content that is not allowed.';
  }
  
  return null;
}

/**
 * Check if user is within inquiry limits based on account age
 */
export function getInquiryLimit(accountCreatedAt: Date, isEmailVerified: boolean): number {
  if (!isEmailVerified) {
    return 0; // Unverified accounts cannot send inquiries
  }
  
  const accountAgeMs = Date.now() - new Date(accountCreatedAt).getTime();
  const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);
  
  if (accountAgeDays < INQUIRY_LIMITS.NEW_ACCOUNT_DAYS) {
    return INQUIRY_LIMITS.NEW_ACCOUNT_DAILY_LIMIT;
  }
  
  return INQUIRY_LIMITS.VERIFIED_DAILY_LIMIT;
}

// ============================================
// S-1.3: IMAGE HASH DUPLICATE DETECTION
// ============================================

/**
 * Generate a simple hash for an image URL
 * For S-1, we use URL-based hashing as a lightweight approach
 * In production, use perceptual hashing (pHash) for actual image content
 */
export function generateImageHash(imageUrl: string): string {
  // Normalize URL (remove query params, lowercase)
  const normalizedUrl = imageUrl.split('?')[0].toLowerCase().trim();
  
  // Generate SHA-256 hash
  return crypto.createHash('sha256').update(normalizedUrl).digest('hex');
}

/**
 * Generate hashes for multiple images
 */
export function generateImageHashes(imageUrls: string[]): string[] {
  return imageUrls.map(url => generateImageHash(url));
}

// ============================================
// S-1.3: MINIMUM LISTING COMPLETENESS
// ============================================

export interface ListingCompletenessResult {
  isComplete: boolean;
  missingFields: string[];
}

/**
 * Check if listing meets minimum content requirements
 * Required: title, price or contact-for-price, location, at least 3 images
 */
export function checkListingCompleteness(listing: {
  title?: string;
  price?: { type?: string; amount?: number };
  location?: { city?: string; state?: string };
  media?: Array<{ url?: string }>;
  images?: Array<{ url?: string }>;
}): ListingCompletenessResult {
  const missingFields: string[] = [];
  
  // Title required
  if (!listing.title || listing.title.trim().length < 5) {
    missingFields.push('title (minimum 5 characters)');
  }
  
  // Price or Contact-for-Price required
  const hasPrice = listing.price?.type === 'contact' || 
                   (listing.price?.amount && listing.price.amount > 0);
  if (!hasPrice) {
    missingFields.push('price or Contact for Price');
  }
  
  // Location required
  if (!listing.location?.city || !listing.location?.state) {
    missingFields.push('location (city and state)');
  }
  
  // Minimum 3 images required
  const images = listing.media || listing.images || [];
  if (images.length < 3) {
    missingFields.push(`at least 3 images (currently ${images.length})`);
  }
  
  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

// ============================================
// S-1.4: FALSE REPORT TRACKING
// ============================================

export const REPORT_ABUSE_LIMITS = {
  AUTO_FLAG_THRESHOLD: 5,           // Increased from 3 to 5 unique accounts
  FALSE_REPORTS_FOR_RATELIMIT: 3,   // 3 rejected reports → rate-limited
  RATELIMIT_DURATION_HOURS: 48,     // Rate limit duration for false reporters
  MIN_ACCOUNT_AGE_HOURS: 24,        // Minimum account age to submit reports
};

/**
 * Check if user can submit reports (not rate-limited for false reports)
 */
export function canUserSubmitReport(
  rejectedReportCount: number,
  reportRateLimitedUntil: Date | null
): { canReport: boolean; reason?: string } {
  // Check if currently rate-limited
  if (reportRateLimitedUntil && new Date(reportRateLimitedUntil) > new Date()) {
    return {
      canReport: false,
      reason: 'You are temporarily unable to submit reports. Please try again later.',
    };
  }
  
  // Check if too many rejected reports
  if (rejectedReportCount >= REPORT_ABUSE_LIMITS.FALSE_REPORTS_FOR_RATELIMIT) {
    return {
      canReport: false,
      reason: 'Report submission is temporarily unavailable.',
    };
  }
  
  return { canReport: true };
}

// ============================================
// S-1.5: CONTRACTOR CLAIM LIMITS
// ============================================

export const CONTRACTOR_DISPLAY_LIMITS = {
  MAX_REGIONS_DISPLAYED: 3,   // Cap regionsServed display to top 3
  MAX_SERVICES_DISPLAYED: 5,  // Cap services shown to top 5
};

/**
 * Limit contractor regions for display
 */
export function limitRegionsDisplay(regions: string[]): string[] {
  return regions.slice(0, CONTRACTOR_DISPLAY_LIMITS.MAX_REGIONS_DISPLAYED);
}

/**
 * Limit contractor services for display
 */
export function limitServicesDisplay(services: string[]): string[] {
  return services.slice(0, CONTRACTOR_DISPLAY_LIMITS.MAX_SERVICES_DISPLAYED);
}

// ============================================
// S-1.6: BADGE TOOLTIP TEXT
// ============================================

export const BADGE_TOOLTIP = 'Badge reflects account status and paid placement. Not a transaction guarantee.';

// ============================================
// CAPTCHA VERIFICATION (PLACEHOLDER)
// ============================================

/**
 * Verify CAPTCHA token
 * In production, integrate with reCAPTCHA v3 or hCaptcha
 */
export async function verifyCaptcha(token: string): Promise<boolean> {
  // For S-1, we implement the interface but allow bypass in development
  // Production should integrate actual CAPTCHA service
  
  if (process.env.NODE_ENV === 'development') {
    // In development, accept any non-empty token
    return !!(token && token.length > 0);
  }
  
  // Production: Verify with reCAPTCHA
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.warn('CAPTCHA: No secret key configured, skipping verification');
    return true;
  }
  
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    });
    
    const data = await response.json();
    return data.success === true && (data.score === undefined || data.score >= 0.5);
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return false;
  }
}
