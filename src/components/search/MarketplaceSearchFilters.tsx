/**
 * THE RAIL EXCHANGE™ — Marketplace Search Filters
 * 
 * STRUCTURED EQUIPMENT FILTERS for marketplace search.
 * Uses ONLY structured listing data fields.
 * 
 * UNIVERSAL FILTERS:
 * - Category
 * - Manufacturer
 * - Model
 * - Year Built Range
 * - Reporting Marks
 * - Location (State)
 * - Availability
 * - Condition
 * 
 * CATEGORY-SPECIFIC FILTERS:
 * 
 * LOCOMOTIVES:
 * - Horsepower Range
 * - FRA Compliance
 * - Engine Hours / Mileage Range
 * 
 * RAILCARS:
 * - AAR Car Type
 * - Load Limit Range
 * - Axle Count
 */

'use client';

import { useState, useEffect } from 'react';
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from '@/lib/listing-constants';
import { US_STATES } from '@/lib/constants';

// Common manufacturers by category
const LOCOMOTIVE_MANUFACTURERS = [
  'EMD', 'GE', 'Wabtec', 'Alco', 'MLW', 'BLW', 'Progress Rail', 'Siemens', 'Other'
];

const RAILCAR_MANUFACTURERS = [
  'Trinity', 'Greenbrier', 'FreightCar America', 'National Steel Car',
  'TrinityRail', 'GATX', 'Union Tank Car', 'American Railcar', 'Other'
];

// AAR Car Type codes
const AAR_CAR_TYPES = [
  { code: 'A', label: 'A - Automobile' },
  { code: 'B', label: 'B - Ballast' },
  { code: 'C', label: 'C - Caboose' },
  { code: 'E', label: 'E - Gondola (covered)' },
  { code: 'F', label: 'F - Flat Car' },
  { code: 'G', label: 'G - Gondola (open)' },
  { code: 'H', label: 'H - Hopper (covered)' },
  { code: 'J', label: 'J - Container' },
  { code: 'K', label: 'K - Hopper (open)' },
  { code: 'L', label: 'L - Tank (non-pressurized)' },
  { code: 'P', label: 'P - Passenger' },
  { code: 'R', label: 'R - Refrigerator' },
  { code: 'S', label: 'S - Stock' },
  { code: 'T', label: 'T - Tank (pressurized)' },
  { code: 'X', label: 'X - Box Car' },
];

// Availability options
const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'storage', label: 'In Storage' },
  { value: 'in-service', label: 'In Service' },
  { value: 'lease-return', label: 'Lease Return' },
  { value: 'pending-repair', label: 'Pending Repair' },
];

const CATEGORY_LABELS: Record<string, string> = {
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

const CONDITION_LABELS: Record<string, string> = {
  'new': 'New',
  'rebuilt': 'Rebuilt',
  'refurbished': 'Refurbished',
  'used-excellent': 'Used - Excellent',
  'used-good': 'Used - Good',
  'used-fair': 'Used - Fair',
  'for-parts': 'For Parts',
  'as-is': 'As-Is',
};

export interface MarketplaceFilters {
  // Universal filters
  category?: string;
  condition?: string;
  state?: string;
  manufacturer?: string;
  model?: string;
  minYearBuilt?: string;
  maxYearBuilt?: string;
  reportingMarks?: string;
  availability?: string;
  minPrice?: string;
  maxPrice?: string;
  verifiedSellerOnly?: boolean;
  
  // Locomotive-specific
  minHorsepower?: string;
  maxHorsepower?: string;
  fraCompliant?: boolean;
  minEngineHours?: string;
  maxEngineHours?: string;
  minMileage?: string;
  maxMileage?: string;
  
  // Railcar-specific
  aarCarType?: string;
  minLoadLimit?: string;
  maxLoadLimit?: string;
  axleCount?: string;
}

interface MarketplaceSearchFiltersProps {
  filters: MarketplaceFilters;
  onFilterChange: (filters: MarketplaceFilters) => void;
  onClear: () => void;
  isOpen: boolean;
}

export function MarketplaceSearchFilters({
  filters,
  onFilterChange,
  onClear,
  isOpen,
}: MarketplaceSearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<MarketplaceFilters>(filters);

  // Sync with parent filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Debounced filter update
  const updateFilter = (key: keyof MarketplaceFilters, value: string | boolean | undefined) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Get manufacturers based on category
  const getManufacturers = () => {
    if (localFilters.category === 'locomotives') return LOCOMOTIVE_MANUFACTURERS;
    if (localFilters.category === 'freight-cars' || localFilters.category === 'passenger-cars') return RAILCAR_MANUFACTURERS;
    // Combine both arrays and deduplicate
    const combined = [...LOCOMOTIVE_MANUFACTURERS, ...RAILCAR_MANUFACTURERS];
    return combined.filter((mfr, index) => combined.indexOf(mfr) === index);
  };

  // Check if locomotive-specific filters should show
  const showLocomotiveFilters = localFilters.category === 'locomotives';
  
  // Check if railcar-specific filters should show
  const showRailcarFilters = localFilters.category === 'freight-cars' || localFilters.category === 'passenger-cars';

  // Count active filters
  const activeFilterCount = Object.entries(localFilters).filter(([, value]) => {
    if (typeof value === 'boolean') return value;
    return value && value !== '';
  }).length;

  if (!isOpen) return null;

  return (
    <div className="bg-surface-secondary rounded-xl border border-surface-border p-6 space-y-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy-900">
          Filters {activeFilterCount > 0 && <span className="text-rail-orange">({activeFilterCount})</span>}
        </h3>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-rail-orange hover:text-rail-orange-dark"
          >
            Clear all
          </button>
        )}
      </div>

      {/* SECTION: Core Equipment Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Category</label>
          <select
            value={localFilters.category || ''}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="form-input text-sm py-2"
          >
            <option value="">All Categories</option>
            {LISTING_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat}
              </option>
            ))}
          </select>
        </div>

        {/* Manufacturer */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Manufacturer</label>
          <select
            value={localFilters.manufacturer || ''}
            onChange={(e) => updateFilter('manufacturer', e.target.value)}
            className="form-input text-sm py-2"
          >
            <option value="">All Manufacturers</option>
            {getManufacturers().map((mfr) => (
              <option key={mfr} value={mfr}>{mfr}</option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Model</label>
          <input
            type="text"
            value={localFilters.model || ''}
            onChange={(e) => updateFilter('model', e.target.value)}
            placeholder="e.g., GP38-2, SD70"
            className="form-input text-sm py-2"
          />
        </div>

        {/* Year Built Range */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Year Built</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={localFilters.minYearBuilt || ''}
              onChange={(e) => updateFilter('minYearBuilt', e.target.value)}
              placeholder="Min"
              className="form-input text-sm py-2 w-1/2"
              min="1900"
              max="2030"
            />
            <input
              type="number"
              value={localFilters.maxYearBuilt || ''}
              onChange={(e) => updateFilter('maxYearBuilt', e.target.value)}
              placeholder="Max"
              className="form-input text-sm py-2 w-1/2"
              min="1900"
              max="2030"
            />
          </div>
        </div>

        {/* Reporting Marks */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Reporting Marks</label>
          <input
            type="text"
            value={localFilters.reportingMarks || ''}
            onChange={(e) => updateFilter('reportingMarks', e.target.value)}
            placeholder="e.g., BNSF, UP"
            className="form-input text-sm py-2"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Location</label>
          <select
            value={localFilters.state || ''}
            onChange={(e) => updateFilter('state', e.target.value)}
            className="form-input text-sm py-2"
          >
            <option value="">All States</option>
            {US_STATES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Availability */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Availability</label>
          <select
            value={localFilters.availability || ''}
            onChange={(e) => updateFilter('availability', e.target.value)}
            className="form-input text-sm py-2"
          >
            <option value="">Any</option>
            {AVAILABILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Condition</label>
          <select
            value={localFilters.condition || ''}
            onChange={(e) => updateFilter('condition', e.target.value)}
            className="form-input text-sm py-2"
          >
            <option value="">All Conditions</option>
            {LISTING_CONDITIONS.map((cond) => (
              <option key={cond} value={cond}>
                {CONDITION_LABELS[cond] || cond}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION: Locomotive-Specific Filters */}
      {showLocomotiveFilters && (
        <div className="border-t border-surface-border pt-4">
          <h4 className="text-xs font-semibold text-navy-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-rail-orange/10 rounded flex items-center justify-center text-[10px]">🚂</span>
            Locomotive Specifications
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Horsepower Range */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Horsepower</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={localFilters.minHorsepower || ''}
                  onChange={(e) => updateFilter('minHorsepower', e.target.value)}
                  placeholder="Min"
                  className="form-input text-sm py-2 w-1/2"
                />
                <input
                  type="number"
                  value={localFilters.maxHorsepower || ''}
                  onChange={(e) => updateFilter('maxHorsepower', e.target.value)}
                  placeholder="Max"
                  className="form-input text-sm py-2 w-1/2"
                />
              </div>
            </div>

            {/* FRA Compliance */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.fraCompliant || false}
                  onChange={(e) => updateFilter('fraCompliant', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-rail-orange focus:ring-rail-orange"
                />
                <span className="text-sm text-navy-900">FRA Compliant Only</span>
              </label>
            </div>

            {/* Engine Hours Range */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Engine Hours</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={localFilters.minEngineHours || ''}
                  onChange={(e) => updateFilter('minEngineHours', e.target.value)}
                  placeholder="Min"
                  className="form-input text-sm py-2 w-1/2"
                />
                <input
                  type="number"
                  value={localFilters.maxEngineHours || ''}
                  onChange={(e) => updateFilter('maxEngineHours', e.target.value)}
                  placeholder="Max"
                  className="form-input text-sm py-2 w-1/2"
                />
              </div>
            </div>

            {/* Mileage Range */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Mileage</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={localFilters.minMileage || ''}
                  onChange={(e) => updateFilter('minMileage', e.target.value)}
                  placeholder="Min"
                  className="form-input text-sm py-2 w-1/2"
                />
                <input
                  type="number"
                  value={localFilters.maxMileage || ''}
                  onChange={(e) => updateFilter('maxMileage', e.target.value)}
                  placeholder="Max"
                  className="form-input text-sm py-2 w-1/2"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Railcar-Specific Filters */}
      {showRailcarFilters && (
        <div className="border-t border-surface-border pt-4">
          <h4 className="text-xs font-semibold text-navy-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-rail-orange/10 rounded flex items-center justify-center text-[10px]">🚃</span>
            Railcar Specifications
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* AAR Car Type */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">AAR Car Type</label>
              <select
                value={localFilters.aarCarType || ''}
                onChange={(e) => updateFilter('aarCarType', e.target.value)}
                className="form-input text-sm py-2"
              >
                <option value="">All Types</option>
                {AAR_CAR_TYPES.map((type) => (
                  <option key={type.code} value={type.code}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Load Limit Range */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Load Limit (lbs)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={localFilters.minLoadLimit || ''}
                  onChange={(e) => updateFilter('minLoadLimit', e.target.value)}
                  placeholder="Min"
                  className="form-input text-sm py-2 w-1/2"
                />
                <input
                  type="number"
                  value={localFilters.maxLoadLimit || ''}
                  onChange={(e) => updateFilter('maxLoadLimit', e.target.value)}
                  placeholder="Max"
                  className="form-input text-sm py-2 w-1/2"
                />
              </div>
            </div>

            {/* Axle Count */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Axle Count</label>
              <select
                value={localFilters.axleCount || ''}
                onChange={(e) => updateFilter('axleCount', e.target.value)}
                className="form-input text-sm py-2"
              >
                <option value="">Any</option>
                <option value="4">4 Axles</option>
                <option value="6">6 Axles</option>
                <option value="8">8 Axles</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Trust & Price Filters */}
      <div className="border-t border-surface-border pt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* S-5.1: Identity Verified Seller Only */}
          <div className="flex items-end">
            <label 
              className="flex items-center gap-2 cursor-pointer"
              title="Identity Verified means business documents were submitted and reviewed. This does not guarantee transaction outcomes."
            >
              <input
                type="checkbox"
                checked={localFilters.verifiedSellerOnly || false}
                onChange={(e) => updateFilter('verifiedSellerOnly', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-navy-900 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                ID Verified Sellers Only
              </span>
            </label>
          </div>

          {/* Price Range */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-medium text-text-secondary mb-1">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={localFilters.minPrice || ''}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                placeholder="Min $"
                className="form-input text-sm py-2 w-1/2"
              />
              <input
                type="number"
                value={localFilters.maxPrice || ''}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                placeholder="Max $"
                className="form-input text-sm py-2 w-1/2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketplaceSearchFilters;
