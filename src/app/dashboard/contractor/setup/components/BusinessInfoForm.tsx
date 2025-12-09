/**
 * THE RAIL EXCHANGE™ — Contractor Setup: Business Info Form
 * 
 * Step 1: Basic business information collection.
 */

'use client';

import * as React from 'react';
import { InputField, TextareaField } from '@/components/forms';
import { Button } from '@/components/ui/button';

interface BusinessInfoFormProps {
  formData: {
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    website: string;
    description: string;
    yearsInBusiness: string;
    numberOfEmployees: string;
  };
  onUpdate: (updates: Partial<BusinessInfoFormProps['formData']>) => void;
  onNext: () => void;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const BusinessInfoForm: React.FC<BusinessInfoFormProps> = ({
  formData,
  onUpdate,
  onNext,
}) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.zip.trim()) {
      newErrors.zip = 'ZIP code is required';
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
        <h3 className="text-lg font-semibold text-navy-900">Business Information</h3>
        <p className="text-sm text-text-secondary">
          Tell us about your railroad contracting business.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Business Name"
          value={formData.businessName}
          onChange={(e) => onUpdate({ businessName: e.target.value })}
          error={errors.businessName}
          placeholder="ABC Railroad Services"
          required
        />
        <InputField
          label="Contact Name"
          value={formData.contactName}
          onChange={(e) => onUpdate({ contactName: e.target.value })}
          error={errors.contactName}
          placeholder="John Smith"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => onUpdate({ email: e.target.value })}
          error={errors.email}
          placeholder="john@abcrailroad.com"
          required
        />
        <InputField
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={(e) => onUpdate({ phone: e.target.value })}
          error={errors.phone}
          placeholder="(555) 123-4567"
          required
        />
      </div>

      <InputField
        label="Street Address"
        value={formData.address}
        onChange={(e) => onUpdate({ address: e.target.value })}
        placeholder="123 Rail Yard Road"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 md:col-span-2">
          <InputField
            label="City"
            value={formData.city}
            onChange={(e) => onUpdate({ city: e.target.value })}
            error={errors.city}
            placeholder="Chicago"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1">
            State <span className="text-status-error">*</span>
          </label>
          <select
            value={formData.state}
            onChange={(e) => onUpdate({ state: e.target.value })}
            className={`w-full h-10 px-3 rounded-lg border ${
              errors.state ? 'border-status-error' : 'border-border-default'
            } bg-surface-primary text-sm focus:outline-none focus:ring-2 focus:ring-rail-orange focus:border-transparent`}
          >
            <option value="">Select</option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {errors.state && (
            <p className="text-xs text-status-error mt-1">{errors.state}</p>
          )}
        </div>
        <InputField
          label="ZIP Code"
          value={formData.zip}
          onChange={(e) => onUpdate({ zip: e.target.value })}
          error={errors.zip}
          placeholder="60601"
          required
        />
      </div>

      <InputField
        label="Website"
        type="url"
        value={formData.website}
        onChange={(e) => onUpdate({ website: e.target.value })}
        placeholder="https://www.abcrailroad.com"
        hint="Optional — helps clients learn more about your business"
      />

      <TextareaField
        label="Business Description"
        value={formData.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Describe your business, specialties, and what sets you apart..."
        rows={4}
        hint="This will be displayed on your public profile"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1">
            Years in Business
          </label>
          <select
            value={formData.yearsInBusiness}
            onChange={(e) => onUpdate({ yearsInBusiness: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-border-default bg-surface-primary text-sm focus:outline-none focus:ring-2 focus:ring-rail-orange focus:border-transparent"
          >
            <option value="">Select</option>
            <option value="<1">Less than 1 year</option>
            <option value="1-3">1-3 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5-10">5-10 years</option>
            <option value="10-20">10-20 years</option>
            <option value="20+">20+ years</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1">
            Number of Employees
          </label>
          <select
            value={formData.numberOfEmployees}
            onChange={(e) => onUpdate({ numberOfEmployees: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-border-default bg-surface-primary text-sm focus:outline-none focus:ring-2 focus:ring-rail-orange focus:border-transparent"
          >
            <option value="">Select</option>
            <option value="1">Just me</option>
            <option value="2-5">2-5</option>
            <option value="6-10">6-10</option>
            <option value="11-25">11-25</option>
            <option value="26-50">26-50</option>
            <option value="51-100">51-100</option>
            <option value="100+">100+</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-4">
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

export { BusinessInfoForm };
