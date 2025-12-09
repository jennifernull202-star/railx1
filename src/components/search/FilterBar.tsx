/**
 * THE RAIL EXCHANGE™ — Filter Bar Component
 * 
 * Premium filter sidebar/bar for search and marketplace pages.
 * Supports multiple filter types with collapsible sections.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterSection {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'select';
  options?: FilterOption[];
  range?: {
    min: number;
    max: number;
    step?: number;
    format?: (value: number) => string;
  };
  defaultValue?: string | string[] | [number, number];
  collapsed?: boolean;
}

export interface FilterBarProps {
  sections?: FilterSection[];
  values?: Record<string, string | string[] | [number, number]>;
  onChange?: (id: string, value: string | string[] | [number, number]) => void;
  onReset?: () => void;
  onApply?: () => void;
  variant?: 'sidebar' | 'horizontal' | 'vertical';
  showApplyButton?: boolean;
  className?: string;
  // Simplified props for marketplace pages
  onFilterChange?: (filters: { priceRange?: { min?: number; max?: number }; condition?: string }) => void;
  initialFilters?: { priceRange?: { min?: number; max?: number }; condition?: string };
}

const FilterBar: React.FC<FilterBarProps> = ({
  sections = [],
  values = {},
  onChange,
  onReset,
  onApply,
  variant = 'sidebar',
  showApplyButton = false,
  className,
  onFilterChange,
  initialFilters,
}) => {
  const [collapsedSections, setCollapsedSections] = React.useState<Set<string>>(
    new Set(sections.filter(s => s.collapsed).map(s => s.id))
  );
  
  // Local state for simplified filter mode
  const [localPriceMin, setLocalPriceMin] = React.useState(initialFilters?.priceRange?.min?.toString() || '');
  const [localPriceMax, setLocalPriceMax] = React.useState(initialFilters?.priceRange?.max?.toString() || '');
  const [localCondition, setLocalCondition] = React.useState(initialFilters?.condition || '');

  // Simplified mode (for marketplace pages)
  const isSimplifiedMode = !sections.length && onFilterChange;

  const toggleSection = (id: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(id)) {
      newCollapsed.delete(id);
    } else {
      newCollapsed.add(id);
    }
    setCollapsedSections(newCollapsed);
  };

  const handleCheckboxChange = (sectionId: string, optionValue: string, checked: boolean) => {
    const current = (values[sectionId] as string[]) || [];
    const newValue = checked
      ? [...current, optionValue]
      : current.filter(v => v !== optionValue);
    onChange?.(sectionId, newValue);
  };

  const renderSection = (section: FilterSection) => {
    const isCollapsed = collapsedSections.has(section.id);

    return (
      <div key={section.id} className="py-4">
        {/* Section Header */}
        <button
          type="button"
          onClick={() => toggleSection(section.id)}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <span className="text-sm font-semibold text-navy-900">{section.label}</span>
          <svg
            className={cn(
              "w-4 h-4 text-text-tertiary transition-transform",
              isCollapsed && "-rotate-90"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Section Content */}
        {!isCollapsed && (
          <div className="space-y-2">
            {/* Checkbox Type */}
            {section.type === 'checkbox' && section.options?.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <Checkbox
                  id={`${section.id}-${option.value}`}
                  checked={((values[section.id] as string[]) || []).includes(option.value)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange(section.id, option.value, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`${section.id}-${option.value}`}
                  className="text-sm text-text-secondary cursor-pointer flex-1"
                >
                  {option.label}
                </Label>
                {option.count !== undefined && (
                  <span className="text-xs text-text-tertiary">({option.count})</span>
                )}
              </div>
            ))}

            {/* Radio/Select Type */}
            {section.type === 'radio' && section.options && (
              <Select
                value={(values[section.id] as string) || ''}
                onValueChange={(value) => onChange?.(section.id, value)}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder={`Select ${section.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {section.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Select Type */}
            {section.type === 'select' && section.options && (
              <Select
                value={(values[section.id] as string) || ''}
                onValueChange={(value) => onChange?.(section.id, value)}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder={`Select ${section.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {section.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                      {option.count !== undefined && ` (${option.count})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Range Type */}
            {section.type === 'range' && section.range && (
              <div className="px-1">
                <Slider
                  value={(values[section.id] as [number, number]) || [section.range.min, section.range.max]}
                  min={section.range.min}
                  max={section.range.max}
                  step={section.range.step || 1}
                  onValueChange={(value) => onChange?.(section.id, value as [number, number])}
                  className="mt-2"
                />
                <div className="flex justify-between mt-2 text-xs text-text-secondary">
                  <span>
                    {section.range.format
                      ? section.range.format((values[section.id] as [number, number])?.[0] || section.range.min)
                      : (values[section.id] as [number, number])?.[0] || section.range.min
                    }
                  </span>
                  <span>
                    {section.range.format
                      ? section.range.format((values[section.id] as [number, number])?.[1] || section.range.max)
                      : (values[section.id] as [number, number])?.[1] || section.range.max
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (variant === 'horizontal') {
    return (
      <div className={cn("bg-white border border-surface-border rounded-xl p-4", className)}>
        <div className="flex flex-wrap items-center gap-4">
          {sections.slice(0, 4).map((section) => (
            section.type === 'select' || section.type === 'radio' ? (
              <div key={section.id} className="min-w-[150px]">
                <Select
                  value={(values[section.id] as string) || ''}
                  onValueChange={(value) => onChange?.(section.id, value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={section.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {section.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null
          ))}
          
          <div className="flex-1" />
          
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              Reset
            </Button>
          )}
          
          {showApplyButton && onApply && (
            <Button size="sm" onClick={onApply} className="bg-rail-orange hover:bg-rail-orange-dark">
              Apply Filters
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Sidebar variant
  
  // Handle simplified mode for marketplace pages
  if (isSimplifiedMode) {
    const handleApplySimplified = () => {
      onFilterChange?.({
        priceRange: {
          min: localPriceMin ? parseInt(localPriceMin) : undefined,
          max: localPriceMax ? parseInt(localPriceMax) : undefined,
        },
        condition: localCondition || undefined,
      });
    };

    return (
      <div className={cn("space-y-6", className)}>
        {/* Price Range */}
        <div>
          <h4 className="font-semibold text-navy-900 mb-3">Price Range</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-text-secondary mb-1">Min Price</Label>
              <input
                type="number"
                placeholder="$0"
                value={localPriceMin}
                onChange={(e) => setLocalPriceMin(e.target.value)}
                onBlur={handleApplySimplified}
                className="w-full h-9 px-3 rounded-lg border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange"
              />
            </div>
            <div>
              <Label className="text-xs text-text-secondary mb-1">Max Price</Label>
              <input
                type="number"
                placeholder="Any"
                value={localPriceMax}
                onChange={(e) => setLocalPriceMax(e.target.value)}
                onBlur={handleApplySimplified}
                className="w-full h-9 px-3 rounded-lg border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Condition */}
        <div>
          <h4 className="font-semibold text-navy-900 mb-3">Condition</h4>
          <div className="space-y-2">
            {['New', 'Excellent', 'Good', 'Fair', 'For Parts'].map((cond) => (
              <label key={cond} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value={cond.toLowerCase()}
                  checked={localCondition === cond.toLowerCase()}
                  onChange={(e) => {
                    setLocalCondition(e.target.value);
                    onFilterChange?.({
                      priceRange: {
                        min: localPriceMin ? parseInt(localPriceMin) : undefined,
                        max: localPriceMax ? parseInt(localPriceMax) : undefined,
                      },
                      condition: e.target.value,
                    });
                  }}
                  className="w-4 h-4 text-rail-orange focus:ring-rail-orange"
                />
                <span className="text-sm text-text-secondary">{cond}</span>
              </label>
            ))}
            {localCondition && (
              <button
                type="button"
                onClick={() => {
                  setLocalCondition('');
                  onFilterChange?.({
                    priceRange: {
                      min: localPriceMin ? parseInt(localPriceMin) : undefined,
                      max: localPriceMax ? parseInt(localPriceMax) : undefined,
                    },
                    condition: undefined,
                  });
                }}
                className="text-xs text-rail-orange hover:text-rail-orange-dark mt-1"
              >
                Clear condition
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white border border-surface-border rounded-xl", className)}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
        <h3 className="font-semibold text-navy-900">Filters</h3>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-rail-orange hover:text-rail-orange-dark font-medium"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Sections */}
      <div className="px-5 divide-y divide-surface-border">
        {sections.map(renderSection)}
      </div>

      {/* Apply Button */}
      {showApplyButton && onApply && (
        <>
          <Separator />
          <div className="p-4">
            <Button 
              onClick={onApply} 
              className="w-full bg-rail-orange hover:bg-rail-orange-dark"
            >
              Apply Filters
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export { FilterBar };
