/**
 * THE RAIL EXCHANGE™ — Input Sanitization Utilities
 * 
 * SECURITY: Sanitize and validate all user inputs to prevent:
 * - Regex injection (ReDoS attacks)
 * - HTML/Script injection (XSS)
 * - NoSQL injection
 * - Invalid data types
 * 
 * RULE: Never trust user input. Sanitize before use.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Escape special regex characters to prevent ReDoS attacks
 * Use this before creating RegExp from user input
 */
export function escapeRegex(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create a safe regex from user input
 * Returns null if input is invalid
 */
export function createSafeRegex(input: string, flags = 'i'): RegExp | null {
  try {
    const escaped = escapeRegex(input.trim());
    if (!escaped) return null;
    return new RegExp(escaped, flags);
  } catch {
    return null;
  }
}

/**
 * Sanitize HTML to prevent XSS
 * Strips all HTML tags by default
 */
export function sanitizeHTML(input: string, allowBasicFormatting = false): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  if (allowBasicFormatting) {
    // Allow only basic formatting tags
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
    });
  }
  
  // Strip ALL HTML
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize text for use in database queries
 * Prevents NoSQL injection
 */
export function sanitizeForDB(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove MongoDB operators
  const sanitized = input
    .replace(/\$[a-zA-Z]+/g, '') // Remove $operators
    .replace(/\{|\}/g, '')       // Remove braces
    .trim();
  
  return sanitized;
}

/**
 * Validate and sanitize a string field
 */
export function sanitizeString(
  input: unknown,
  options: {
    maxLength?: number;
    minLength?: number;
    trim?: boolean;
    lowercase?: boolean;
    stripHTML?: boolean;
  } = {}
): string | null {
  const {
    maxLength = 1000,
    minLength = 0,
    trim = true,
    lowercase = false,
    stripHTML = true,
  } = options;
  
  if (typeof input !== 'string') {
    return null;
  }
  
  let result = input;
  
  if (trim) {
    result = result.trim();
  }
  
  if (stripHTML) {
    result = sanitizeHTML(result);
  }
  
  if (lowercase) {
    result = result.toLowerCase();
  }
  
  if (result.length < minLength || result.length > maxLength) {
    return null;
  }
  
  return result;
}

/**
 * Validate and sanitize a number
 */
export function sanitizeNumber(
  input: unknown,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    defaultValue?: number;
  } = {}
): number | null {
  const { min, max, integer = false, defaultValue } = options;
  
  let num: number;
  
  if (typeof input === 'number') {
    num = input;
  } else if (typeof input === 'string') {
    num = parseFloat(input);
  } else {
    return defaultValue ?? null;
  }
  
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue ?? null;
  }
  
  if (integer) {
    num = Math.floor(num);
  }
  
  if (min !== undefined && num < min) {
    return defaultValue ?? null;
  }
  
  if (max !== undefined && num > max) {
    return defaultValue ?? null;
  }
  
  return num;
}

/**
 * Validate and sanitize an integer
 */
export function sanitizeInteger(
  input: unknown,
  options: { min?: number; max?: number; defaultValue?: number } = {}
): number | null {
  return sanitizeNumber(input, { ...options, integer: true });
}

/**
 * Validate an enum value
 */
export function validateEnum<T extends string>(
  input: unknown,
  allowedValues: readonly T[],
  defaultValue?: T
): T | null {
  if (typeof input !== 'string') {
    return defaultValue ?? null;
  }
  
  const value = input.trim() as T;
  
  if (allowedValues.includes(value)) {
    return value;
  }
  
  return defaultValue ?? null;
}

/**
 * Sanitize an array of strings with size limits
 */
export function sanitizeStringArray(
  input: unknown,
  options: {
    maxItems?: number;
    maxItemLength?: number;
    stripHTML?: boolean;
    unique?: boolean;
  } = {}
): string[] {
  const {
    maxItems = 50,
    maxItemLength = 100,
    stripHTML = true,
    unique = true,
  } = options;
  
  if (!Array.isArray(input)) {
    return [];
  }
  
  let result = input
    .filter((item): item is string => typeof item === 'string')
    .map(item => {
      let sanitized = item.trim();
      if (stripHTML) {
        sanitized = sanitizeHTML(sanitized);
      }
      return sanitized.substring(0, maxItemLength);
    })
    .filter(item => item.length > 0)
    .slice(0, maxItems);
  
  if (unique) {
    result = Array.from(new Set(result));
  }
  
  return result;
}

/**
 * Validate email format
 */
export function validateEmail(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }
  
  const email = input.trim().toLowerCase();
  
  // Basic email regex - not perfect but catches most issues
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return null;
  }
  
  // Max length check
  if (email.length > 254) {
    return null;
  }
  
  return email;
}

/**
 * Validate URL format (only allow https)
 */
export function validateURL(input: unknown, requireHTTPS = true): string | null {
  if (typeof input !== 'string') {
    return null;
  }
  
  try {
    const url = new URL(input.trim());
    
    if (requireHTTPS && url.protocol !== 'https:') {
      return null;
    }
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Validate S3 URL - only allow platform S3 bucket
 */
export function validateS3URL(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }
  
  const url = input.trim();
  const s3Bucket = process.env.AWS_S3_BUCKET || 'the-rail-exchange';
  
  // Valid S3 URL patterns
  const validPatterns = [
    `https://${s3Bucket}.s3.amazonaws.com/`,
    `https://s3.amazonaws.com/${s3Bucket}/`,
    `https://${s3Bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/`,
  ];
  
  for (const pattern of validPatterns) {
    if (url.startsWith(pattern)) {
      return url;
    }
  }
  
  return null;
}

/**
 * Sanitize listing price data
 */
export function sanitizePrice(input: unknown): {
  type: 'fixed' | 'negotiable' | 'auction' | 'contact' | 'rfq';
  amount?: number;
  currency: string;
  originalAmount?: number;
} | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }
  
  const price = input as Record<string, unknown>;
  
  const validTypes = ['fixed', 'negotiable', 'auction', 'contact', 'rfq'] as const;
  const type = validateEnum(price.type, validTypes);
  
  if (!type) {
    return null;
  }
  
  const result: ReturnType<typeof sanitizePrice> = {
    type,
    currency: validateEnum(price.currency, ['USD', 'CAD', 'EUR', 'GBP']) || 'USD',
  };
  
  // Amount validation
  if (price.amount !== undefined) {
    const amount = sanitizeNumber(price.amount, { min: 0, max: 100000000 });
    if (amount !== null) {
      result.amount = amount;
    }
  }
  
  // Original amount validation - must have been a prior price
  if (price.originalAmount !== undefined) {
    const originalAmount = sanitizeNumber(price.originalAmount, { min: 0, max: 100000000 });
    if (originalAmount !== null) {
      result.originalAmount = originalAmount;
    }
  }
  
  return result;
}

/**
 * EQUIPMENT MANUFACTURER ENUM
 * Manufacturer must be one of these values - no free text
 */
export const VALID_MANUFACTURERS = [
  'EMD',
  'GE',
  'Wabtec',
  'Alco',
  'MLW',
  'BLW',
  'Trinity',
  'Greenbrier',
  'FreightCar America',
  'National Steel Car',
  'TrinityRail',
  'GATX',
  'Union Tank Car',
  'American Railcar',
  'Progress Rail',
  'Siemens',
  'Stadler',
  'Alstom',
  'Bombardier',
  'Kawasaki',
  'Hitachi',
  'Other',
] as const;

export type ValidManufacturer = typeof VALID_MANUFACTURERS[number];

/**
 * Validate manufacturer - must be from approved list
 */
export function validateManufacturer(input: unknown): ValidManufacturer | null {
  return validateEnum(input, VALID_MANUFACTURERS);
}

/**
 * Check for keyword stuffing in text
 * Returns true if text appears to be SEO spam
 */
export function detectKeywordStuffing(text: string): boolean {
  if (typeof text !== 'string') {
    return false;
  }
  
  // Check for repeated words
  const words = text.toLowerCase().split(/\s+/);
  const wordCounts = new Map<string, number>();
  
  for (const word of words) {
    if (word.length < 3) continue;
    const count = (wordCounts.get(word) || 0) + 1;
    wordCounts.set(word, count);
    
    // Flag if any word appears more than 10 times
    if (count > 10) {
      return true;
    }
  }
  
  // Check word-to-unique ratio
  const uniqueWords = wordCounts.size;
  const totalWords = words.filter(w => w.length >= 3).length;
  
  // If less than 20% unique words, likely spam
  if (totalWords > 50 && uniqueWords / totalWords < 0.2) {
    return true;
  }
  
  return false;
}

// ============================================
// BATCH E-3: COMPETITOR BRAND BLACKLIST
// ============================================
// Competitor brand names that cannot be used in listing keywords/tags
// to prevent SEO abuse and misleading search results
const COMPETITOR_BRAND_BLACKLIST = [
  // Competitor marketplace names (DO NOT use to mislead searches)
  'ebay',
  'railcar-sales',
  'railcarlink',
  'railinc',
  'machinerytrader',
  'machinery trader',
  'ironplanet',
  'ritchie bros',
  'ritchiebros',
  'equipmentwatch',
  'craigslist',
  // Generic SEO abuse terms
  'best price',
  'lowest price',
  'cheapest',
  'guaranteed',
  'number one',
  '#1',
  'top rated',
];

/**
 * BATCH E-3: Check if keywords/tags contain blacklisted terms
 * Returns array of blacklisted terms found, empty if none
 */
export function checkKeywordBlacklist(keywords: string[]): string[] {
  if (!Array.isArray(keywords)) {
    return [];
  }
  
  const violations: string[] = [];
  const normalizedBlacklist = COMPETITOR_BRAND_BLACKLIST.map(term => term.toLowerCase());
  
  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase().trim();
    
    for (const blacklistedTerm of normalizedBlacklist) {
      // Check for exact match or contained term
      if (normalizedKeyword === blacklistedTerm || normalizedKeyword.includes(blacklistedTerm)) {
        violations.push(keyword);
        break;
      }
    }
  }
  
  return violations;
}

/**
 * BATCH E-3: Validate tags/keywords don't contain blacklisted terms
 * Returns null if valid, error message if invalid
 */
export function validateKeywordsAgainstBlacklist(keywords: string[], tags: string[]): string | null {
  const keywordViolations = checkKeywordBlacklist(keywords);
  const tagViolations = checkKeywordBlacklist(tags);
  
  if (keywordViolations.length > 0 || tagViolations.length > 0) {
    // Return neutral error - don't reveal which specific terms are blacklisted
    return 'Some keywords are not permitted.';
  }
  
  return null;
}

/**
 * Check for duplicate/similar titles
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Sanitize MongoDB ObjectId
 */
export function sanitizeObjectId(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }
  
  // MongoDB ObjectId is 24 hex characters
  const cleaned = input.trim();
  if (/^[a-fA-F0-9]{24}$/.test(cleaned)) {
    return cleaned;
  }
  
  return null;
}

/**
 * Full listing data sanitization
 */
export interface SanitizedListingData {
  title: string;
  description: string;
  category: string;
  condition: string;
  price?: ReturnType<typeof sanitizePrice>;
  tags: string[];
  keywords: string[];
  manufacturer?: ValidManufacturer;
  quantity?: number;
}

export function sanitizeListingData(
  input: Record<string, unknown>,
  existingCategories: readonly string[],
  existingConditions: readonly string[]
): SanitizedListingData | { error: string } {
  // Title - required, sanitized, max 150 chars
  const title = sanitizeString(input.title, { maxLength: 150, minLength: 5 });
  if (!title) {
    return { error: 'Title must be between 5 and 150 characters' };
  }
  
  // Check for keyword stuffing in title
  if (detectKeywordStuffing(title)) {
    return { error: 'Title appears to contain repetitive content' };
  }
  
  // Description - required, sanitized, max 10000 chars
  const description = sanitizeString(input.description, { maxLength: 10000, minLength: 10 });
  if (!description) {
    return { error: 'Description must be between 10 and 10,000 characters' };
  }
  
  // Check for keyword stuffing in description
  if (detectKeywordStuffing(description)) {
    return { error: 'Description appears to contain repetitive content' };
  }
  
  // Category - must be valid enum
  const category = validateEnum(input.category, existingCategories);
  if (!category) {
    return { error: 'Invalid category' };
  }
  
  // Condition - must be valid enum
  const condition = validateEnum(input.condition, existingConditions);
  if (!condition) {
    return { error: 'Invalid condition' };
  }
  
  // Tags - max 20 items, max 50 chars each
  const tags = sanitizeStringArray(input.tags, { maxItems: 20, maxItemLength: 50 });
  
  // Keywords - max 20 items, max 50 chars each
  const keywords = sanitizeStringArray(input.keywords, { maxItems: 20, maxItemLength: 50 });
  
  // BATCH E-3: Check keywords/tags against blacklist
  const blacklistError = validateKeywordsAgainstBlacklist(keywords, tags);
  if (blacklistError) {
    return { error: blacklistError };
  }
  
  // Price
  const price = input.price ? sanitizePrice(input.price) : undefined;
  
  // Manufacturer - must be from approved list
  const manufacturer = input.equipment && typeof input.equipment === 'object'
    ? validateManufacturer((input.equipment as Record<string, unknown>).manufacturer)
    : undefined;
  
  // Quantity - must be positive integer
  const quantity = sanitizeInteger(input.quantity, { min: 1, max: 10000 });
  
  return {
    title,
    description,
    category,
    condition,
    price: price || undefined,
    tags,
    keywords,
    manufacturer: manufacturer || undefined,
    quantity: quantity || undefined,
  };
}
