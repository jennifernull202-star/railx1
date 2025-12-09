/**
 * THE RAIL EXCHANGE™ — Contractor Setup: Regions Form
 * 
 * Step 3: Service regions and coverage areas.
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { InputField } from '@/components/forms';

interface RegionsFormProps {
  formData: {
    serviceRegions: string[];
    travelWillingness: string;
    serviceRadius: string;
  };
  onUpdate: (updates: Partial<RegionsFormProps['formData']>) => void;
  onNext: () => void;
  onBack: () => void;
}

const US_REGIONS = [
  { id: 'northeast', label: 'Northeast', states: 'CT, DE, MA, MD, ME, NH, NJ, NY, PA, RI, VT' },
  { id: 'southeast', label: 'Southeast', states: 'AL, FL, GA, KY, MS, NC, SC, TN, VA, WV' },
  { id: 'midwest', label: 'Midwest', states: 'IA, IL, IN, KS, MI, MN, MO, ND, NE, OH, SD, WI' },
  { id: 'southwest', label: 'Southwest', states: 'AR, AZ, LA, NM, OK, TX' },
  { id: 'west', label: 'West', states: 'CA, CO, ID, MT, NV, OR, UT, WA, WY' },
  { id: 'alaska', label: 'Alaska', states: 'AK' },
  { id: 'hawaii', label: 'Hawaii', states: 'HI' },
];

const TRAVEL_OPTIONS = [
  { value: 'local', label: 'Local Only', description: 'Within my immediate service area' },
  { value: 'regional', label: 'Regional', description: 'Willing to travel within my selected regions' },
  { value: 'national', label: 'Nationwide', description: 'Available for projects anywhere in the US' },
  { value: 'international', label: 'International', description: 'Available for international projects' },
];

const RADIUS_OPTIONS = [
  { value: '25', label: '25 miles' },
  { value: '50', label: '50 miles' },
  { value: '100', label: '100 miles' },
  { value: '250', label: '250 miles' },
  { value: '500', label: '500 miles' },
  { value: 'unlimited', label: 'No limit' },
];

const RegionsForm: React.FC<RegionsFormProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const toggleRegion = (regionId: string) => {
    const updated = formData.serviceRegions.includes(regionId)
      ? formData.serviceRegions.filter((r) => r !== regionId)
      : [...formData.serviceRegions, regionId];
    onUpdate({ serviceRegions: updated });
  };

  const selectAllRegions = () => {
    onUpdate({ serviceRegions: US_REGIONS.map((r) => r.id) });
  };

  const clearAllRegions = () => {
    onUpdate({ serviceRegions: [] });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.serviceRegions.length === 0) {
      newErrors.serviceRegions = 'Please select at least one service region';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-navy-900">Service Regions</h3>
        <p className="text-sm text-text-secondary">
          Define where your business operates. This helps clients find contractors in their area.
        </p>
      </div>

      {/* US Regions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-navy-900">
            Service Regions <span className="text-status-error">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllRegions}
              className="text-xs text-rail-orange hover:text-rail-orange-dark"
            >
              Select All
            </button>
            <span className="text-xs text-text-tertiary">|</span>
            <button
              type="button"
              onClick={clearAllRegions}
              className="text-xs text-text-tertiary hover:text-text-secondary"
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {US_REGIONS.map((region) => (
            <label
              key={region.id}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                formData.serviceRegions.includes(region.id)
                  ? 'border-rail-orange bg-rail-orange/5'
                  : 'border-border-default hover:border-rail-orange/50'
              }`}
            >
              <Checkbox
                checked={formData.serviceRegions.includes(region.id)}
                onCheckedChange={() => toggleRegion(region.id)}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-navy-900">{region.label}</span>
                <p className="text-xs text-text-tertiary mt-0.5">{region.states}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.serviceRegions && (
          <p className="text-xs text-status-error">{errors.serviceRegions}</p>
        )}
      </div>

      {/* Travel Willingness */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-navy-900">
          Travel Willingness
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TRAVEL_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                formData.travelWillingness === option.value
                  ? 'border-rail-orange bg-rail-orange/5'
                  : 'border-border-default hover:border-rail-orange/50'
              }`}
            >
              <input
                type="radio"
                name="travelWillingness"
                value={option.value}
                checked={formData.travelWillingness === option.value}
                onChange={(e) => onUpdate({ travelWillingness: e.target.value })}
                className="mt-0.5 w-4 h-4 text-rail-orange focus:ring-rail-orange"
              />
              <div>
                <span className="text-sm font-medium text-navy-900">{option.label}</span>
                <p className="text-xs text-text-secondary mt-0.5">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Service Radius */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-navy-900">
          Service Radius from Home Base
        </label>
        <p className="text-xs text-text-secondary">
          How far are you willing to travel from your primary location?
        </p>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`inline-flex items-center px-4 py-2 rounded-full border cursor-pointer text-sm transition-all ${
                formData.serviceRadius === option.value
                  ? 'border-rail-orange bg-rail-orange text-white'
                  : 'border-border-default hover:border-rail-orange/50'
              }`}
            >
              <input
                type="radio"
                name="serviceRadius"
                value={option.value}
                checked={formData.serviceRadius === option.value}
                onChange={(e) => onUpdate({ serviceRadius: e.target.value })}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <Button type="submit" className="bg-rail-orange hover:bg-rail-orange-dark">
          Continue
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </form>
  );
};

export { RegionsForm };
