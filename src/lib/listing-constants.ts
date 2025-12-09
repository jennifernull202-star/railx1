/**
 * THE RAIL EXCHANGE™ — Listing Constants
 * 
 * Shared constants for listing categories, conditions, and statuses.
 * These are safe to import in client components.
 */

// Listing categories
export const LISTING_CATEGORIES = [
  'locomotives',
  'freight-cars',
  'passenger-cars',
  'maintenance-of-way',
  'track-materials',
  'signals-communications',
  'parts-components',
  'tools-equipment',
  'real-estate',
  'services',
] as const;

export type ListingCategory = typeof LISTING_CATEGORIES[number];

// Listing conditions
export const LISTING_CONDITIONS = [
  'new',
  'rebuilt',
  'refurbished', 
  'used-excellent',
  'used-good',
  'used-fair',
  'for-parts',
  'as-is',
] as const;

export type ListingCondition = typeof LISTING_CONDITIONS[number];

// Listing statuses
export const LISTING_STATUSES = [
  'draft',
  'pending',
  'active',
  'sold',
  'expired',
  'archived',
] as const;

export type ListingStatus = typeof LISTING_STATUSES[number];

// Category labels for display
export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  'locomotives': 'Locomotives',
  'freight-cars': 'Freight Cars',
  'passenger-cars': 'Passenger Cars',
  'maintenance-of-way': 'Maintenance of Way',
  'track-materials': 'Track Materials',
  'signals-communications': 'Signals & Communications',
  'parts-components': 'Parts & Components',
  'tools-equipment': 'Tools & Equipment',
  'real-estate': 'Real Estate',
  'services': 'Services',
};

// Condition labels for display
export const CONDITION_LABELS: Record<ListingCondition, string> = {
  'new': 'New',
  'rebuilt': 'Rebuilt',
  'refurbished': 'Refurbished',
  'used-excellent': 'Used - Excellent',
  'used-good': 'Used - Good',
  'used-fair': 'Used - Fair',
  'for-parts': 'For Parts',
  'as-is': 'As Is',
};

// Status labels for display
export const STATUS_LABELS: Record<ListingStatus, string> = {
  'draft': 'Draft',
  'pending': 'Pending Review',
  'active': 'Active',
  'sold': 'Sold',
  'expired': 'Expired',
  'archived': 'Archived',
};
