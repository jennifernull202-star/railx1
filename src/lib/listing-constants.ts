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

// ============================================
// STRUCTURED EQUIPMENT CONSTANTS
// ============================================

// Availability statuses
export const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Immediately Available', description: 'Ready for sale/shipping now' },
  { value: 'storage', label: 'In Storage', description: 'Currently in storage facility' },
  { value: 'in-service', label: 'In Service', description: 'Currently in use, available upon sale' },
  { value: 'lease-return', label: 'Lease Return', description: 'Coming off lease soon' },
  { value: 'pending-repair', label: 'Pending Repair', description: 'Needs repair before use' },
] as const;

export type EquipmentAvailability = typeof AVAILABILITY_OPTIONS[number]['value'];

// Locomotive manufacturers
export const LOCOMOTIVE_MANUFACTURERS = [
  'EMD',
  'GE', 
  'Wabtec',
  'Progress Rail',
  'Alco',
  'MLW',
  'BLW',
  'Siemens',
  'Stadler',
  'Alstom',
  'Other',
] as const;

// Railcar manufacturers
export const RAILCAR_MANUFACTURERS = [
  'Trinity',
  'Greenbrier',
  'FreightCar America',
  'National Steel Car',
  'TrinityRail',
  'GATX',
  'Union Tank Car',
  'American Railcar',
  'Other',
] as const;

// All manufacturers combined
export const ALL_MANUFACTURERS = [
  ...LOCOMOTIVE_MANUFACTURERS.filter(m => m !== 'Other'),
  ...RAILCAR_MANUFACTURERS.filter(m => m !== 'Other'),
  'Other',
] as const;

// AAR Car Type codes with labels
export const AAR_CAR_TYPES = [
  { value: 'A', label: 'A - Auto Rack' },
  { value: 'B', label: 'B - Bulkhead Flat Car' },
  { value: 'C', label: 'C - Covered Hopper' },
  { value: 'D', label: 'D - Depressed Center Flat' },
  { value: 'E', label: 'E - Gondola (Mill)' },
  { value: 'F', label: 'F - Flat Car' },
  { value: 'G', label: 'G - Gondola' },
  { value: 'H', label: 'H - Open Top Hopper' },
  { value: 'J', label: 'J - Auto Parts Car' },
  { value: 'K', label: 'K - Caboose' },
  { value: 'L', label: 'L - Log/Pulpwood Car' },
  { value: 'M', label: 'M - Mechanical Reefer' },
  { value: 'N', label: 'N - Container' },
  { value: 'P', label: 'P - Passenger Car' },
  { value: 'R', label: 'R - Standard Reefer' },
  { value: 'S', label: 'S - Stock Car' },
  { value: 'T', label: 'T - Tank Car' },
  { value: 'U', label: 'U - High-Side Gondola' },
  { value: 'V', label: 'V - Vat Car' },
  { value: 'W', label: 'W - Well Car' },
  { value: 'X', label: 'X - Box Car' },
  { value: 'Z', label: 'Z - Container Flat Car' },
] as const;

export type AARCarType = typeof AAR_CAR_TYPES[number]['value'];

// Categories that require equipment data
export const EQUIPMENT_CATEGORIES = ['locomotives', 'freight-cars', 'passenger-cars'] as const;
export const LOCOMOTIVE_CATEGORIES = ['locomotives'] as const;
export const RAILCAR_CATEGORIES = ['freight-cars', 'passenger-cars'] as const;

// Helper to check if category requires equipment data
export const requiresEquipmentData = (category: string): boolean => {
  return EQUIPMENT_CATEGORIES.includes(category as typeof EQUIPMENT_CATEGORIES[number]);
};

export const isLocomotiveCategory = (category: string): boolean => {
  return LOCOMOTIVE_CATEGORIES.includes(category as typeof LOCOMOTIVE_CATEGORIES[number]);
};

export const isRailcarCategory = (category: string): boolean => {
  return RAILCAR_CATEGORIES.includes(category as typeof RAILCAR_CATEGORIES[number]);
};
