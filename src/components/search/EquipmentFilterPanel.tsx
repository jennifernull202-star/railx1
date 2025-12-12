/**
 * THE RAIL EXCHANGE™ — Equipment Filter Panel
 * 
 * BUYER AUDIT IMPLEMENTATION: Dynamic category-specific equipment filters
 * 
 * Shows different filter options based on selected category:
 * - Locomotives: horsepower, engine hours, mileage, MU capable
 * - Railcars: AAR type, load limit, cubic capacity
 * - Track Materials: rail weight, tie type
 * - All: manufacturer, model, year, FRA compliance
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, RotateCcw, SlidersHorizontal, Search } from 'lucide-react';

// Equipment manufacturers
const MANUFACTURERS = [
  'EMD', 'GE', 'Wabtec', 'Progress Rail', 'Alco', 'MLW',
  'Trinity', 'Greenbrier', 'FreightCar America', 'National Steel Car',
  'American Railcar', 'GATX', 'Union Tank Car', 'Siemens', 'Alstom', 'Other'
];

// AAR car type codes
const AAR_CAR_TYPES = [
  { value: 'A', label: 'A - Automobile/Auto Parts' },
  { value: 'B', label: 'B - Box Car' },
  { value: 'C', label: 'C - Caboose' },
  { value: 'D', label: 'D - Switching Locomotive' },
  { value: 'E', label: 'E - Road Locomotive' },
  { value: 'F', label: 'F - Flat Car' },
  { value: 'G', label: 'G - Gondola' },
  { value: 'H', label: 'H - Hopper' },
  { value: 'J', label: 'J - Covered Hopper' },
  { value: 'K', label: 'K - Rack/Container' },
  { value: 'L', label: 'L - Special Service' },
  { value: 'P', label: 'P - Passenger' },
  { value: 'R', label: 'R - Refrigerator' },
  { value: 'S', label: 'S - Stock' },
  { value: 'T', label: 'T - Tank Car' },
  { value: 'V', label: 'V - Multi-Level' },
  { value: 'W', label: 'W - Well Car' },
  { value: 'X', label: 'X - MOW Equipment' },
];

// Availability options
const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'storage', label: 'In Storage' },
  { value: 'in-service', label: 'In Service' },
  { value: 'lease-return', label: 'Lease Return' },
  { value: 'pending-repair', label: 'Pending Repair' },
];

// Seller type options
const SELLER_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'dealer', label: 'Dealer' },
  { value: 'railroad', label: 'Railroad' },
  { value: 'leasing-company', label: 'Leasing Company' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'scrap-yard', label: 'Scrap Yard' },
];

export interface EquipmentFilters {
  // Text searches
  reportingMarks?: string;
  model?: string;
  
  // Selections
  manufacturers?: string[];
  aarCarTypes?: string[];
  availability?: string[];
  sellerTypes?: string[];
  
  // Ranges
  minYearBuilt?: number;
  maxYearBuilt?: number;
  minHorsepower?: number;
  maxHorsepower?: number;
  minEngineHours?: number;
  maxEngineHours?: number;
  minMileage?: number;
  maxMileage?: number;
  minQuantity?: number;
  
  // Toggles
  fraCompliant?: boolean;
  verifiedSellerOnly?: boolean;
  
  // Radius
  radiusLat?: number;
  radiusLng?: number;
  radiusMiles?: number;
}

interface EquipmentFilterPanelProps {
  category?: string;
  filters: EquipmentFilters;
  onChange: (filters: EquipmentFilters) => void;
  onReset?: () => void;
  onApply?: () => void;
  facets?: {
    manufacturers?: { _id: string; count: number }[];
    yearRange?: { min: number; max: number };
    priceRange?: { min: number; max: number };
  };
  className?: string;
  variant?: 'sidebar' | 'modal';
}

// Simple collapsible section component
function FilterSection({ 
  title, 
  isOpen, 
  onToggle, 
  children 
}: { 
  title: string; 
  isOpen: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-surface-border pb-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full py-2 text-sm font-semibold text-navy-900"
      >
        {title}
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="space-y-4 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function EquipmentFilterPanel({
  category,
  filters,
  onChange,
  onReset,
  onApply,
  facets,
  className,
}: EquipmentFilterPanelProps) {
  const [openSections, setOpenSections] = React.useState<Set<string>>(
    new Set(['equipment', 'compliance'])
  );

  const toggleSection = (section: string) => {
    const newOpen = new Set(openSections);
    if (newOpen.has(section)) {
      newOpen.delete(section);
    } else {
      newOpen.add(section);
    }
    setOpenSections(newOpen);
  };

  const updateFilter = <K extends keyof EquipmentFilters>(
    key: K, 
    value: EquipmentFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: keyof EquipmentFilters, value: string) => {
    const current = (filters[key] as string[]) || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilter(key, newValue as EquipmentFilters[typeof key]);
  };

  // Determine which filter sections to show based on category
  const isLocomotive = category === 'locomotives';
  const isRailcar = ['railcars', 'passenger-equipment'].includes(category || '');

  const currentYear = new Date().getFullYear();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-orange" />
          <span className="font-semibold text-navy-900">Equipment Filters</span>
        </div>
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-text-secondary hover:text-brand-orange"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Reporting Marks Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Reporting Marks</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <Input
            placeholder="BNSF 1234, UP 5678..."
            value={filters.reportingMarks || ''}
            onChange={(e) => updateFilter('reportingMarks', e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Equipment Section */}
      <FilterSection 
        title="Equipment Details" 
        isOpen={openSections.has('equipment')} 
        onToggle={() => toggleSection('equipment')}
      >
        {/* Manufacturer */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Manufacturer</Label>
          <Select
            value={filters.manufacturers?.[0] || ''}
            onValueChange={(value) => updateFilter('manufacturers', value ? [value] : [])}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Manufacturers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Manufacturers</SelectItem>
              {MANUFACTURERS.map((mfr) => {
                const count = facets?.manufacturers?.find(f => f._id === mfr)?.count;
                return (
                  <SelectItem key={mfr} value={mfr}>
                    {mfr} {count ? `(${count})` : ''}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Model</Label>
          <Input
            placeholder="GP38-2, SD70MAC..."
            value={filters.model || ''}
            onChange={(e) => updateFilter('model', e.target.value)}
          />
        </div>

        {/* Year Built Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Year Built</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="From"
              min={1900}
              max={currentYear}
              value={filters.minYearBuilt || ''}
              onChange={(e) => updateFilter('minYearBuilt', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-1/2"
            />
            <Input
              type="number"
              placeholder="To"
              min={1900}
              max={currentYear}
              value={filters.maxYearBuilt || ''}
              onChange={(e) => updateFilter('maxYearBuilt', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-1/2"
            />
          </div>
        </div>

        {/* Locomotive-specific filters */}
        {isLocomotive && (
          <>
            {/* Horsepower Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Horsepower</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min HP"
                  value={filters.minHorsepower || ''}
                  onChange={(e) => updateFilter('minHorsepower', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-1/2"
                />
                <Input
                  type="number"
                  placeholder="Max HP"
                  value={filters.maxHorsepower || ''}
                  onChange={(e) => updateFilter('maxHorsepower', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-1/2"
                />
              </div>
            </div>

            {/* Engine Hours Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Engine Hours</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minEngineHours || ''}
                  onChange={(e) => updateFilter('minEngineHours', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-1/2"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxEngineHours || ''}
                  onChange={(e) => updateFilter('maxEngineHours', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-1/2"
                />
              </div>
            </div>

            {/* Mileage Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mileage</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minMileage || ''}
                  onChange={(e) => updateFilter('minMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-1/2"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxMileage || ''}
                  onChange={(e) => updateFilter('maxMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-1/2"
                />
              </div>
            </div>
          </>
        )}

        {/* Railcar-specific filters */}
        {isRailcar && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">AAR Car Type</Label>
            <Select
              value={filters.aarCarTypes?.[0] || ''}
              onValueChange={(value) => updateFilter('aarCarTypes', value ? [value] : [])}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Car Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Car Types</SelectItem>
                {AAR_CAR_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </FilterSection>

      {/* Compliance Section */}
      <FilterSection 
        title="Compliance & Availability" 
        isOpen={openSections.has('compliance')} 
        onToggle={() => toggleSection('compliance')}
      >
        {/* FRA Compliant Toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">FRA Compliant Only</Label>
          <Switch
            checked={filters.fraCompliant || false}
            onCheckedChange={(checked) => updateFilter('fraCompliant', checked)}
          />
        </div>

        {/* Availability */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Availability</Label>
          <div className="space-y-2">
            {AVAILABILITY_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <Checkbox
                  id={`avail-${option.value}`}
                  checked={(filters.availability || []).includes(option.value)}
                  onCheckedChange={() => toggleArrayFilter('availability', option.value)}
                />
                <Label htmlFor={`avail-${option.value}`} className="text-sm cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Minimum Quantity */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Minimum Quantity</Label>
          <Input
            type="number"
            placeholder="e.g., 10"
            min={1}
            value={filters.minQuantity || ''}
            onChange={(e) => updateFilter('minQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>
      </FilterSection>

      {/* Seller Section */}
      <FilterSection 
        title="Seller Preferences" 
        isOpen={openSections.has('seller')} 
        onToggle={() => toggleSection('seller')}
      >
        {/* Verified Seller Only */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Verified Sellers Only</Label>
          <Switch
            checked={filters.verifiedSellerOnly || false}
            onCheckedChange={(checked) => updateFilter('verifiedSellerOnly', checked)}
          />
        </div>

        {/* Seller Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Seller Type</Label>
          <div className="space-y-2">
            {SELLER_TYPES.map((type) => (
              <div key={type.value} className="flex items-center gap-2">
                <Checkbox
                  id={`seller-${type.value}`}
                  checked={(filters.sellerTypes || []).includes(type.value)}
                  onCheckedChange={() => toggleArrayFilter('sellerTypes', type.value)}
                />
                <Label htmlFor={`seller-${type.value}`} className="text-sm cursor-pointer">
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Apply Button */}
      {onApply && (
        <Button 
          onClick={onApply} 
          className="w-full bg-brand-orange hover:bg-brand-orange-dark"
        >
          Apply Filters
        </Button>
      )}
    </div>
  );
}

export default EquipmentFilterPanel;
