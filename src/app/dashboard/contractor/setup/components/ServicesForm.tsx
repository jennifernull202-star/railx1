/**
 * THE RAIL EXCHANGE™ — Contractor Setup: Services Form
 * 
 * Step 2: Service categories and specializations.
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface ServicesFormProps {
  formData: {
    services: string[];
    specializations: string[];
    certifications: string[];
  };
  onUpdate: (updates: Partial<ServicesFormProps['formData']>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SERVICE_CATEGORIES = [
  {
    id: 'track-maintenance',
    label: 'Track Maintenance & Repair',
    description: 'Rail replacement, tie installation, ballast work',
  },
  {
    id: 'track-construction',
    label: 'Track Construction',
    description: 'New track installation, yard construction',
  },
  {
    id: 'signal-systems',
    label: 'Signal Systems',
    description: 'Signal installation, maintenance, PTC systems',
  },
  {
    id: 'bridge-structures',
    label: 'Bridges & Structures',
    description: 'Bridge repair, inspection, construction',
  },
  {
    id: 'grade-crossings',
    label: 'Grade Crossings',
    description: 'Crossing installation, warning systems',
  },
  {
    id: 'derailment-response',
    label: 'Derailment Response',
    description: 'Emergency response, re-railing services',
  },
  {
    id: 'equipment-services',
    label: 'Equipment Services',
    description: 'Locomotive repair, car maintenance',
  },
  {
    id: 'environmental',
    label: 'Environmental Services',
    description: 'Remediation, waste management, compliance',
  },
  {
    id: 'survey-engineering',
    label: 'Survey & Engineering',
    description: 'Track geometry, surveying, design',
  },
  {
    id: 'vegetation-management',
    label: 'Vegetation Management',
    description: 'Right-of-way clearing, brush control',
  },
];

const CERTIFICATIONS = [
  { id: 'fra', label: 'FRA Certified' },
  { id: 'osha', label: 'OSHA Certified' },
  { id: 'dot', label: 'DOT Compliant' },
  { id: 'arema', label: 'AREMA Standards' },
  { id: 'aashto', label: 'AASHTO Compliant' },
  { id: 'iso-9001', label: 'ISO 9001' },
  { id: 'iso-14001', label: 'ISO 14001' },
  { id: 'dbe', label: 'DBE Certified' },
  { id: 'mbe', label: 'MBE Certified' },
  { id: 'wbe', label: 'WBE Certified' },
];

const ServicesForm: React.FC<ServicesFormProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const toggleService = (serviceId: string) => {
    const updated = formData.services.includes(serviceId)
      ? formData.services.filter((s) => s !== serviceId)
      : [...formData.services, serviceId];
    onUpdate({ services: updated });
  };

  const toggleCertification = (certId: string) => {
    const updated = formData.certifications.includes(certId)
      ? formData.certifications.filter((c) => c !== certId)
      : [...formData.certifications, certId];
    onUpdate({ certifications: updated });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.services.length === 0) {
      newErrors.services = 'Please select at least one service category';
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
        <h3 className="text-lg font-semibold text-navy-900">Services Offered</h3>
        <p className="text-sm text-text-secondary">
          Select all the services your business provides.
        </p>
      </div>

      {/* Service Categories */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-navy-900">
          Service Categories <span className="text-status-error">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SERVICE_CATEGORIES.map((service) => (
            <label
              key={service.id}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                formData.services.includes(service.id)
                  ? 'border-rail-orange bg-rail-orange/5'
                  : 'border-border-default hover:border-rail-orange/50'
              }`}
            >
              <Checkbox
                checked={formData.services.includes(service.id)}
                onCheckedChange={() => toggleService(service.id)}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-navy-900">{service.label}</span>
                <p className="text-xs text-text-secondary mt-0.5">{service.description}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.services && (
          <p className="text-xs text-status-error">{errors.services}</p>
        )}
      </div>

      {/* Certifications */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-navy-900">
          Certifications & Compliance
        </label>
        <p className="text-xs text-text-secondary">
          Select all applicable certifications. You may be asked to provide documentation.
        </p>
        <div className="flex flex-wrap gap-2">
          {CERTIFICATIONS.map((cert) => (
            <label
              key={cert.id}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border cursor-pointer text-sm transition-all ${
                formData.certifications.includes(cert.id)
                  ? 'border-rail-orange bg-rail-orange/10 text-rail-orange'
                  : 'border-border-default hover:border-rail-orange/50'
              }`}
            >
              <Checkbox
                checked={formData.certifications.includes(cert.id)}
                onCheckedChange={() => toggleCertification(cert.id)}
                className="w-4 h-4"
              />
              {cert.label}
            </label>
          ))}
        </div>
      </div>

      {/* Additional Specializations */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-navy-900">
          Additional Specializations
        </label>
        <textarea
          value={formData.specializations.join('\n')}
          onChange={(e) => onUpdate({ 
            specializations: e.target.value.split('\n').filter((s) => s.trim()) 
          })}
          placeholder="Enter any additional specializations, one per line..."
          className="w-full px-3 py-2 rounded-lg border border-border-default bg-surface-primary text-sm focus:outline-none focus:ring-2 focus:ring-rail-orange focus:border-transparent"
          rows={3}
        />
        <p className="text-xs text-text-tertiary">Optional — list any specialized skills not covered above</p>
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

export { ServicesForm };
