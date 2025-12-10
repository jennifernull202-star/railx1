/**
 * THE RAIL EXCHANGE™ — Contractor Onboarding
 * 
 * Multi-step contractor registration with photo uploads.
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BulkPhotoUpload, { UploadedImage } from '@/components/forms/BulkPhotoUpload';
import { US_STATES } from '@/lib/constants';
import { Building2, Phone, Mail, MapPin, Briefcase, Camera, Check, ArrowRight, ArrowLeft } from 'lucide-react';

const SERVICE_CATEGORIES = [
  { id: 'track-construction', label: 'Track Construction' },
  { id: 'track-maintenance', label: 'Track Maintenance' },
  { id: 'signal-systems', label: 'Signal Systems' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'bridge-structures', label: 'Bridge & Structures' },
  { id: 'environmental', label: 'Environmental' },
  { id: 'surveying', label: 'Surveying' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'equipment-rental', label: 'Equipment Rental' },
  { id: 'material-supply', label: 'Material Supply' },
  { id: 'demolition', label: 'Demolition' },
  { id: 'welding', label: 'Welding' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'consulting', label: 'Consulting' },
  { id: 'training', label: 'Training' },
  { id: 'emergency-response', label: 'Emergency Response' },
  { id: 'other', label: 'Other' },
];

const STEPS = [
  { id: 1, name: 'Business Info', icon: Building2 },
  { id: 2, name: 'Services', icon: Briefcase },
  { id: 3, name: 'Photos', icon: Camera },
  { id: 4, name: 'Review', icon: Check },
];

export default function ContractorOnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    businessName: '',
    businessDescription: '',
    businessPhone: '',
    businessEmail: '',
    website: '',
    city: '',
    state: '',
    zipCode: '',
    yearsInBusiness: '',
    numberOfEmployees: '',
    services: [] as string[],
    regionsServed: ['Nationwide'],
  });

  const [portfolioImages, setPortfolioImages] = useState<UploadedImage[]>([]);
  const [equipmentImages, setEquipmentImages] = useState<UploadedImage[]>([]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rail-orange" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-navy-900 mb-4">Sign In Required</h2>
          <p className="text-slate-600 mb-6">Please sign in to become a contractor.</p>
          <Link 
            href="/auth/login?callbackUrl=/contractors/onboard" 
            className="inline-flex items-center gap-2 bg-rail-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#e55f15] transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const toggleService = (serviceId: string) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const validateStep = (step: number): boolean => {
    setError('');
    
    switch (step) {
      case 1:
        if (!form.businessName.trim()) {
          setError('Business name is required');
          return false;
        }
        if (!form.businessDescription.trim()) {
          setError('Business description is required');
          return false;
        }
        if (!form.businessPhone.trim()) {
          setError('Phone number is required');
          return false;
        }
        if (!form.city.trim() || !form.state.trim() || !form.zipCode.trim()) {
          setError('Complete address is required');
          return false;
        }
        return true;
      case 2:
        if (form.services.length === 0) {
          setError('Please select at least one service');
          return false;
        }
        return true;
      case 3:
        // Photos are optional
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Filter out uploading/error images
      const validPortfolioUrls = portfolioImages
        .filter(img => !img.uploading && !img.error)
        .map(img => img.url);
      const validEquipmentUrls = equipmentImages
        .filter(img => !img.uploading && !img.error)
        .map(img => img.url);

      const response = await fetch('/api/contractors/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          businessDescription: form.businessDescription,
          businessPhone: form.businessPhone,
          businessEmail: form.businessEmail || session?.user?.email,
          website: form.website,
          address: {
            street: '',
            city: form.city,
            state: form.state,
            zipCode: form.zipCode,
            country: 'USA',
          },
          services: form.services,
          regionsServed: form.regionsServed,
          yearsInBusiness: parseInt(form.yearsInBusiness) || 1,
          numberOfEmployees: form.numberOfEmployees || '1-10',
          portfolioImages: validPortfolioUrls,
          equipmentImages: validEquipmentUrls,
          photos: [...validPortfolioUrls, ...validEquipmentUrls],
          isPublished: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // Redirect to contractor dashboard after successful registration
      router.push('/dashboard/contractor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <nav className="container-rail">
          <div className="flex items-center justify-between h-[72px]">
            <Link href="/" className="flex items-center gap-1.5">
              <span className="text-[22px] font-bold text-navy-900 tracking-tight">The Rail</span>
              <span className="text-[22px] font-bold text-rail-orange tracking-tight">Exchange</span>
              <span className="text-rail-orange text-[11px] font-semibold -mt-2">™</span>
            </Link>
            <Link href="/contractors" className="text-slate-600 hover:text-navy-900">
              ← Back to Contractors
            </Link>
          </div>
        </nav>
      </header>

      <main className="container-rail py-12">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mb-3">
              Become a Contractor
            </h1>
            <p className="text-lg text-slate-600">
              Complete your profile to start receiving project inquiries
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-10">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                      isActive
                        ? 'bg-rail-orange text-white'
                        : isCompleted
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">{step.name}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${isCompleted ? 'bg-green-400' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
            {/* Step 1: Business Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-navy-900 mb-6">Business Information</h2>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rail-orange focus:border-rail-orange"
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={form.businessDescription}
                    onChange={(e) => setForm({ ...form, businessDescription: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rail-orange focus:border-rail-orange"
                    rows={4}
                    placeholder="Describe your company and services..."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={form.businessPhone}
                      onChange={(e) => setForm({ ...form, businessPhone: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rail-orange focus:border-rail-orange"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={form.businessEmail}
                      onChange={(e) => setForm({ ...form, businessEmail: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rail-orange focus:border-rail-orange"
                      placeholder={session?.user?.email || 'contact@company.com'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    Website (optional)
                  </label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rail-orange focus:border-rail-orange"
                    placeholder="https://www.yourcompany.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Business Address *
                  </label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rail-orange focus:border-rail-orange"
                        placeholder="City *"
                      />
                      <select
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rail-orange focus:border-rail-orange"
                      >
                        <option value="">Select State *</option>
                        {US_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={form.zipCode}
                      onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                      className="w-full sm:w-1/3 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rail-orange focus:border-rail-orange"
                      placeholder="ZIP Code *"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                      Years in Business
                    </label>
                    <input
                      type="number"
                      value={form.yearsInBusiness}
                      onChange={(e) => setForm({ ...form, yearsInBusiness: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rail-orange focus:border-rail-orange"
                      placeholder="e.g., 10"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                      Number of Employees
                    </label>
                    <select
                      value={form.numberOfEmployees}
                      onChange={(e) => setForm({ ...form, numberOfEmployees: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rail-orange focus:border-rail-orange"
                    >
                      <option value="">Select range</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-100">51-100</option>
                      <option value="101-500">101-500</option>
                      <option value="500+">500+</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Services */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-navy-900 mb-2">Services Offered</h2>
                <p className="text-slate-600 mb-6">Select all services your company provides</p>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {SERVICE_CATEGORIES.map(service => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.id)}
                      className={`p-4 text-left rounded-xl border-2 transition-all ${
                        form.services.includes(service.id)
                          ? 'border-rail-orange bg-rail-orange/5 text-navy-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          form.services.includes(service.id) ? 'border-rail-orange bg-rail-orange' : 'border-slate-300'
                        }`}>
                          {form.services.includes(service.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{service.label}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-sm text-slate-500">
                  Selected: {form.services.length} service{form.services.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Step 3: Photos */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-navy-900 mb-2">Portfolio Images</h2>
                  <p className="text-slate-600 mb-4">
                    Show off your past work and completed projects
                  </p>
                  <BulkPhotoUpload
                    images={portfolioImages}
                    onChange={setPortfolioImages}
                    folder="contractors"
                    maxImages={10}
                    maxFileSize={10}
                  />
                </div>

                <div className="border-t border-slate-100 pt-8">
                  <h2 className="text-xl font-semibold text-navy-900 mb-2">Equipment Images</h2>
                  <p className="text-slate-600 mb-4">
                    Showcase your equipment, tools, and capabilities
                  </p>
                  <BulkPhotoUpload
                    images={equipmentImages}
                    onChange={setEquipmentImages}
                    folder="contractors"
                    maxImages={10}
                    maxFileSize={10}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-navy-900 mb-6">Review Your Profile</h2>

                <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Business Name</p>
                    <p className="font-medium text-navy-900">{form.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Description</p>
                    <p className="text-navy-900">{form.businessDescription}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Phone</p>
                      <p className="font-medium text-navy-900">{form.businessPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-medium text-navy-900">{form.businessEmail || session?.user?.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Location</p>
                    <p className="font-medium text-navy-900">{form.city}, {form.state} {form.zipCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Services ({form.services.length})</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {form.services.map(s => {
                        const service = SERVICE_CATEGORIES.find(cat => cat.id === s);
                        return (
                          <span key={s} className="px-2 py-1 bg-rail-orange/10 text-rail-orange text-sm rounded-full">
                            {service?.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Portfolio Images</p>
                      <p className="font-medium text-navy-900">{portfolioImages.length} uploaded</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Equipment Images</p>
                      <p className="font-medium text-navy-900">{equipmentImages.length} uploaded</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-800">
                    <strong>Ready to go!</strong> Your profile will be published immediately. You can edit it anytime from your dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-navy-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-rail-orange text-white rounded-xl font-semibold hover:bg-[#e55f15] transition-colors"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create Profile
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
