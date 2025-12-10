/**
 * THE RAIL EXCHANGE™ — Contractor Setup Page
 * 
 * Multi-step onboarding flow for contractors inside the dashboard.
 * Includes business info, services, regions, documents, and equipment.
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { InputField, SelectField, TextareaField, ImageUpload } from '@/components/forms';
import type { UploadedImage } from '@/components/forms';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Service categories
const SERVICE_CATEGORIES = [
  { value: 'track-construction', label: 'Track Construction' },
  { value: 'track-maintenance', label: 'Track Maintenance' },
  { value: 'signal-systems', label: 'Signal Systems' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'bridge-structures', label: 'Bridge & Structures' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'surveying', label: 'Surveying' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'equipment-rental', label: 'Equipment Rental' },
  { value: 'material-supply', label: 'Material Supply' },
  { value: 'demolition', label: 'Demolition' },
  { value: 'welding', label: 'Welding' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'training', label: 'Training' },
  { value: 'emergency-response', label: 'Emergency Response' },
  { value: 'other', label: 'Other' },
];

// US States
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

interface FormData {
  // Business Information (PART 4-A)
  businessName: string;
  dba: string; // Optional DBA
  businessDescription: string;
  contactName: string; // Required Contact Name
  businessPhone: string;
  businessEmail: string;
  website: string;
  // Address
  street: string;
  city: string;
  state: string;
  zipCode: string;
  // Identity & Compliance (PART 4-B)
  einTaxId: string; // EIN / Tax ID
  stateOfIncorporation: string;
  yearsInBusiness: string;
  numberOfEmployees: string;
  safetyCertifications: string[]; // MSHA, OSHA, FRA
  // Services (PART 4-C)
  services: string[];
  serviceDescription: string;
  // Regions (PART 4-D)
  regionsServed: string[];
  serviceRadius: string; // Optional radius input
  // Documents (PART 4-E)
  documents: UploadedImage[];
  certificateOfInsurance: UploadedImage[]; // COI - Required
  w9: UploadedImage[]; // W-9 - Required
  safetyManual: UploadedImage[]; // Safety manual - Required
  complianceDocs: UploadedImage[]; // Compliance documents
  certifications: UploadedImage[]; // Certifications
  // Equipment
  equipmentOwned: string[];
  equipmentPhotos: UploadedImage[]; // Optional equipment photos
  // Photos
  logo: UploadedImage[];
  photos: UploadedImage[];
  // Experience Summary (PART 4-F)
  yearsExperience: string;
  pastClients: string; // Past railroad clients
  notableProjects: string;
  capabilities: string;
}

const STEPS = [
  { id: 'business', title: 'Business Info', description: 'Basic company information' },
  { id: 'services', title: 'Services', description: 'What services do you offer?' },
  { id: 'regions', title: 'Regions', description: 'Where do you operate?' },
  { id: 'documents', title: 'Documents', description: 'Insurance & certifications' },
  { id: 'photos', title: 'Photos', description: 'Logo & portfolio photos' },
];

export default function ContractorSetupPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [formData, setFormData] = React.useState<FormData>({
    // Business Information
    businessName: '',
    dba: '',
    businessDescription: '',
    contactName: session?.user?.name || '',
    businessPhone: '',
    businessEmail: session?.user?.email || '',
    website: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    // Identity & Compliance
    einTaxId: '',
    stateOfIncorporation: '',
    yearsInBusiness: '',
    numberOfEmployees: '',
    safetyCertifications: [],
    // Services
    services: [],
    serviceDescription: '',
    // Regions
    regionsServed: [],
    serviceRadius: '',
    // Documents (REQUIRED: COI, W-9, Safety Manual)
    documents: [],
    certificateOfInsurance: [],
    w9: [],
    safetyManual: [],
    complianceDocs: [],
    certifications: [],
    // Equipment
    equipmentOwned: [],
    equipmentPhotos: [],
    // Photos
    logo: [],
    photos: [],
    // Experience Summary
    yearsExperience: '',
    pastClients: '',
    notableProjects: '',
    capabilities: '',
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'services' | 'regionsServed', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Business Info
        return formData.businessName && formData.businessPhone && formData.city && formData.state;
      case 1: // Services
        return formData.services.length > 0;
      case 2: // Regions
        return formData.regionsServed.length > 0;
      case 3: // Documents
        return true; // Optional
      case 4: // Photos
        return true; // Optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contractors/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessDescription: formData.businessDescription,
          businessPhone: formData.businessPhone,
          businessEmail: formData.businessEmail,
          website: formData.website,
          yearsInBusiness: parseInt(formData.yearsInBusiness) || 0,
          numberOfEmployees: formData.numberOfEmployees,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: 'USA',
          },
          services: formData.services,
          serviceDescription: formData.serviceDescription,
          regionsServed: formData.regionsServed,
          documents: formData.documents.map(d => ({
            name: d.alt || 'Document',
            url: d.url,
            type: 'other',
            uploadedAt: new Date(),
          })),
          equipmentOwned: formData.equipmentOwned,
          logo: formData.logo[0]?.url,
          photos: formData.photos.map(p => p.url),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create profile');
      }

      router.push('/dashboard/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900">Complete Your Contractor Profile</h1>
        <p className="text-text-secondary mt-1">
          Set up your business profile to start receiving leads and appearing in search results.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => index < currentStep && setCurrentStep(index)}
              className={cn(
                "text-xs font-medium transition-colors",
                index === currentStep && "text-rail-orange",
                index < currentStep && "text-status-success cursor-pointer hover:underline",
                index > currentStep && "text-text-tertiary"
              )}
            >
              {step.title}
            </button>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Business Info */}
          {currentStep === 0 && (
            <>
              <InputField
                label="Business Name"
                value={formData.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                placeholder="Your Company Name"
                required
              />
              <TextareaField
                label="Business Description"
                value={formData.businessDescription}
                onChange={(e) => updateField('businessDescription', e.target.value)}
                placeholder="Tell potential clients about your company..."
                showCharCount
                maxLength={1000}
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Phone"
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => updateField('businessPhone', e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
                <InputField
                  label="Email"
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => updateField('businessEmail', e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
              <InputField
                label="Website"
                type="url"
                value={formData.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://www.yourcompany.com"
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Years in Business"
                  type="number"
                  value={formData.yearsInBusiness}
                  onChange={(e) => updateField('yearsInBusiness', e.target.value)}
                  placeholder="10"
                />
                <SelectField
                  label="Number of Employees"
                  value={formData.numberOfEmployees}
                  onChange={(v) => updateField('numberOfEmployees', v)}
                  options={[
                    { value: '1-10', label: '1-10 employees' },
                    { value: '11-50', label: '11-50 employees' },
                    { value: '51-200', label: '51-200 employees' },
                    { value: '201-500', label: '201-500 employees' },
                    { value: '500+', label: '500+ employees' },
                  ]}
                />
              </div>
              <div className="pt-4 border-t border-surface-border">
                <h3 className="font-medium text-navy-900 mb-4">Business Address</h3>
                <InputField
                  label="Street Address"
                  value={formData.street}
                  onChange={(e) => updateField('street', e.target.value)}
                  placeholder="123 Main St"
                />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <InputField
                    label="City"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="City"
                    required
                  />
                  <SelectField
                    label="State"
                    value={formData.state}
                    onChange={(v) => updateField('state', v)}
                    options={US_STATES}
                    placeholder="State"
                    required
                  />
                  <InputField
                    label="ZIP Code"
                    value={formData.zipCode}
                    onChange={(e) => updateField('zipCode', e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 1: Services */}
          {currentStep === 1 && (
            <>
              <div>
                <Label className="text-sm font-medium text-navy-900 mb-3 block">
                  Select the services you offer <span className="text-status-error">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {SERVICE_CATEGORIES.map((service) => (
                    <div key={service.value} className="flex items-center gap-2">
                      <Checkbox
                        id={service.value}
                        checked={formData.services.includes(service.value)}
                        onCheckedChange={() => toggleArrayItem('services', service.value)}
                      />
                      <Label
                        htmlFor={service.value}
                        className="text-sm text-text-secondary cursor-pointer"
                      >
                        {service.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <TextareaField
                label="Service Description"
                value={formData.serviceDescription}
                onChange={(e) => updateField('serviceDescription', e.target.value)}
                placeholder="Provide more details about your services, specializations, and capabilities..."
                showCharCount
                maxLength={2000}
              />
            </>
          )}

          {/* Step 2: Regions */}
          {currentStep === 2 && (
            <div>
              <Label className="text-sm font-medium text-navy-900 mb-3 block">
                Select the states where you operate <span className="text-status-error">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-2">
                {US_STATES.map((state) => (
                  <div key={state.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`region-${state.value}`}
                      checked={formData.regionsServed.includes(state.value)}
                      onCheckedChange={() => toggleArrayItem('regionsServed', state.value)}
                    />
                    <Label
                      htmlFor={`region-${state.value}`}
                      className="text-sm text-text-secondary cursor-pointer"
                    >
                      {state.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-text-tertiary mt-3">
                Selected: {formData.regionsServed.length} state{formData.regionsServed.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <ImageUpload
                label="Insurance & Certification Documents"
                value={formData.documents}
                onChange={(docs) => updateField('documents', docs)}
                maxImages={10}
                acceptedTypes={['image/jpeg', 'image/png', 'application/pdf']}
                helperText="Upload your insurance certificates, safety certifications, and licenses. PDF and images accepted."
              />
              <div className="p-4 bg-status-info/10 rounded-lg">
                <p className="text-sm text-status-info">
                  <strong>Tip:</strong> Having verified insurance and certifications increases your visibility and builds trust with potential clients.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Photos */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <ImageUpload
                label="Company Logo"
                value={formData.logo}
                onChange={(logo) => updateField('logo', logo)}
                maxImages={1}
                helperText="Upload your company logo. Square format recommended."
              />
              <ImageUpload
                label="Portfolio Photos"
                value={formData.photos}
                onChange={(photos) => updateField('photos', photos)}
                maxImages={20}
                helperText="Add photos of your work, equipment, and team."
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-lg">
              <p className="text-sm text-status-error">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        
        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-rail-orange hover:bg-rail-orange-dark"
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-status-success hover:bg-status-success/90"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Profile...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
