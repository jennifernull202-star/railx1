/**
 * THE RAIL EXCHANGE™ — Create Listing Page
 * 
 * Multi-step form for creating equipment listings.
 * Premium UI with validation and S3 uploads.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { 
  LISTING_CATEGORIES, 
  LISTING_CONDITIONS,
  AVAILABILITY_OPTIONS,
  LOCOMOTIVE_MANUFACTURERS,
  RAILCAR_MANUFACTURERS,
  AAR_CAR_TYPES,
  requiresEquipmentData,
  isLocomotiveCategory,
  isRailcarCategory,
} from '@/lib/listing-constants';
import { US_STATES } from '@/lib/constants';
import LocationAutocomplete, { LocationResult } from '@/components/search/LocationAutocomplete';
import BulkPhotoUpload, { UploadedImage } from '@/components/forms/BulkPhotoUpload';
import { useUnsavedChanges } from '@/lib/hooks/useUnsavedChanges';
import PublishUpsellModal from '@/components/PublishUpsellModal';

const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  'locomotives': { label: 'Locomotives', description: 'Diesel, electric, and switcher locomotives' },
  'freight-cars': { label: 'Freight Cars', description: 'Box cars, tank cars, hoppers, and more' },
  'passenger-cars': { label: 'Passenger Cars', description: 'Coaches, sleepers, and dining cars' },
  'maintenance-of-way': { label: 'Maintenance of Way', description: 'Track equipment and MOW machines' },
  'track-materials': { label: 'Track Materials', description: 'Rail, ties, switches, and fasteners' },
  'signals-communications': { label: 'Signals & Communications', description: 'Signal systems and telecom equipment' },
  'parts-components': { label: 'Parts & Components', description: 'Replacement parts and components' },
  'tools-equipment': { label: 'Tools & Equipment', description: 'Hand tools and specialty equipment' },
  'real-estate': { label: 'Real Estate', description: 'Rail yards, depots, and ROW' },
  'services': { label: 'Services', description: 'Inspection, repair, and consulting services' },
};

const CONDITION_LABELS: Record<string, { label: string; description: string }> = {
  'new': { label: 'New', description: 'Factory new, never used' },
  'rebuilt': { label: 'Rebuilt', description: 'Professionally rebuilt to specifications' },
  'refurbished': { label: 'Refurbished', description: 'Restored and reconditioned' },
  'used-excellent': { label: 'Used - Excellent', description: 'Minimal wear, fully operational' },
  'used-good': { label: 'Used - Good', description: 'Normal wear, fully functional' },
  'used-fair': { label: 'Used - Fair', description: 'Significant wear, may need work' },
  'for-parts': { label: 'For Parts', description: 'Suitable for parts or scrap' },
  'as-is': { label: 'As-Is', description: 'Sold as-is, no warranty' },
};

interface Specification {
  label: string;
  value: string;
  unit: string;
}

// Structured equipment data for rolling stock
interface EquipmentFormData {
  // Core identifiers (required for equipment categories)
  reportingMarks: string;
  manufacturer: string;
  model: string;
  yearBuilt: string;
  availability: string;
  
  // Locomotive-specific
  horsepower: string;
  fraCompliant: 'yes' | 'no' | 'unknown' | '';
  engineHours: string;
  mileage: string;
  
  // Railcar-specific
  aarCarType: string;
  loadLimit: string;
  axleCount: string;
}

interface ListingFormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  condition: string;
  priceType: 'fixed' | 'negotiable' | 'contact' | 'rfq';
  priceAmount: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number;
  lng?: number;
  quantity: string;
  quantityUnit: string;
  localPickup: boolean;
  sellerShips: boolean;
  buyerArranges: boolean;
  tags: string[];
}

// S-4.1: Compressed 3-step flow (was 5 steps)
const STEPS = [
  { id: 1, name: 'Core Info', description: 'Title, category, equipment basics' },
  { id: 2, name: 'Pricing & Location', description: 'Price, location, and quantity' },
  { id: 3, name: 'Media & Publish', description: 'Add photos and publish' },
];

interface VerificationStatus {
  isVerified: boolean;
  status: string;
  expiresAt?: string;
}

export default function CreateListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    condition: '',
    priceType: 'fixed',
    priceAmount: '',
    city: '',
    state: '',
    zipCode: '',
    quantity: '1',
    quantityUnit: '',
    localPickup: true,
    sellerShips: false,
    buyerArranges: true,
    tags: [],
  });
  
  const [media, setMedia] = useState<UploadedImage[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  
  // Structured equipment data state
  const [equipmentData, setEquipmentData] = useState<EquipmentFormData>({
    reportingMarks: '',
    manufacturer: '',
    model: '',
    yearBuilt: '',
    availability: '',
    horsepower: '',
    fraCompliant: '',
    engineHours: '',
    mileage: '',
    aarCarType: '',
    loadLimit: '',
    axleCount: '',
  });
  
  // #8 fix: localStorage key for draft auto-save
  const DRAFT_STORAGE_KEY = 'railx-listing-draft';
  
  // Check seller verification status
  useEffect(() => {
    const checkVerification = async () => {
      if (status !== 'authenticated') return;
      
      try {
        const res = await fetch('/api/verification/seller/status');
        if (res.ok) {
          const data = await res.json();
          setVerificationStatus({
            isVerified: data.userStatus?.isVerifiedSeller && data.userStatus?.verifiedSellerStatus === 'active',
            status: data.userStatus?.verifiedSellerStatus || 'none',
            expiresAt: data.userStatus?.verifiedSellerExpiresAt,
          });
        }
      } catch (err) {
        console.error('Failed to check verification status:', err);
      } finally {
        setCheckingVerification(false);
      }
    };
    
    checkVerification();
  }, [status]);
  
  // #8 fix: Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.equipmentData) setEquipmentData(parsed.equipmentData);
        if (parsed.media) setMedia(parsed.media);
        if (parsed.specifications) setSpecifications(parsed.specifications);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        setDraftRestored(true);
      }
    } catch (e) {
      console.error('Failed to restore draft:', e);
    }
  }, []);
  
  // #8 fix: Auto-save draft to localStorage on changes
  const saveDraft = useCallback(() => {
    try {
      const draftData = {
        formData,
        equipmentData,
        media: media.filter(m => !m.uploading && !m.error), // Only save completed uploads
        specifications,
        currentStep,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  }, [formData, equipmentData, media, specifications, currentStep]);
  
  // #8 fix: Debounced auto-save on form changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveDraft();
    }, 1000); // Save 1 second after last change
    
    return () => clearTimeout(timeoutId);
  }, [saveDraft]);
  
  // #8 fix: Clear draft from localStorage after successful submission
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear draft:', e);
    }
  };

  // Warn user before leaving with unsaved changes
  const hasFormChanges = formData.title.length > 0 || 
    formData.description.length > 0 || 
    formData.category.length > 0 ||
    media.length > 0 ||
    specifications.some(s => s.label || s.value);
  
  useUnsavedChanges({ 
    hasChanges: hasFormChanges && !isSubmitting,
    message: 'You have unsaved changes to your listing. Are you sure you want to leave?'
  });

  const updateFormData = (updates: Partial<ListingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateEquipmentData = (updates: Partial<EquipmentFormData>) => {
    setEquipmentData(prev => ({ ...prev, ...updates }));
  };

  const addSpecification = () => {
    setSpecifications(prev => [...prev, { label: '', value: '', unit: '' }]);
  };

  const updateSpecification = (index: number, field: keyof Specification, value: string) => {
    setSpecifications(prev =>
      prev.map((spec, i) =>
        i === index ? { ...spec, [field]: value } : spec
      )
    );
  };

  const removeSpecification = (index: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateFormData({ tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateFormData({ tags: formData.tags.filter(t => t !== tag) });
  };

  // S-4.1 + S-4.5: Combined validation for 3-step flow with relaxed field requirements
  const validateStep = (step: number): boolean => {
    setError('');

    switch (step) {
      case 1:
        // Core Info: Title, category, condition, description + equipment basics
        if (!formData.title.trim()) {
          setError('Title is required');
          return false;
        }
        if (!formData.category) {
          setError('Please select a category');
          return false;
        }
        if (!formData.condition) {
          setError('Please select a condition');
          return false;
        }
        if (!formData.description.trim()) {
          setError('Description is required');
          return false;
        }
        // S-4.5: Equipment data validation - relaxed, only require essential fields
        if (requiresEquipmentData(formData.category)) {
          if (!equipmentData.manufacturer.trim()) {
            setError('Manufacturer is required');
            return false;
          }
          if (!equipmentData.model.trim()) {
            setError('Model is required');
            return false;
          }
          // S-4.5: Year built optional if unknown
          // S-4.5: Locomotive horsepower, engine hours, mileage - all optional (unknown allowed)
          // S-4.5: FRA compliance - optional (needs assessment allowed)
          // S-4.5: Railcar AAR type, load limit, axle count - only AAR type required
          if (isRailcarCategory(formData.category) && !equipmentData.aarCarType) {
            setError('AAR car type is required for railcars');
            return false;
          }
        }
        return true;

      case 2:
        // Pricing & Location
        if (formData.priceType === 'fixed' && !formData.priceAmount) {
          setError('Please enter a price or select "Contact for Price"');
          return false;
        }
        if (!formData.city.trim()) {
          setError('City is required');
          return false;
        }
        if (!formData.state) {
          setError('State is required');
          return false;
        }
        return true;

      case 3:
        // Media & Publish - photos optional
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

  // S-4.4: Direct publish - no blocking upsell modal
  // Upsells are shown AFTER successful publish on the listing page
  const handlePublishClick = async () => {
    if (!validateStep(currentStep)) return;
    await handleSubmit(false);
  };

  // S-4.4: Post-publish upsell flow (called from listing page, not here)
  // Keep this for backwards compatibility but it's no longer triggered from create page
  const handlePublishWithAddons = async (selectedAddons: string[]) => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setError('');

    try {
      // First create the listing as active
      const listingData = buildListingData(false);
      
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create listing');
      }

      const listingId = data.data._id;

      // Create checkout session for add-ons
      const checkoutRes = await fetch('/api/checkout/listing-addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          addons: selectedAddons,
          successUrl: `${window.location.origin}/listings/${data.data.slug}?addons=success`,
          cancelUrl: `${window.location.origin}/listings/${data.data.slug}?addons=cancelled`,
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutData.success || !checkoutData.url) {
        // If checkout fails, still redirect to listing (it's already published)
        clearDraft();
        router.push(`/listings/${data.data.slug}`);
        return;
      }

      clearDraft();
      // Redirect to Stripe checkout
      window.location.href = checkoutData.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setShowUpsellModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish without add-ons
  const handlePublishWithoutAddons = async () => {
    setShowUpsellModal(false);
    await handleSubmit(false);
  };

  // Build listing data object
  const buildListingData = (asDraft: boolean) => {
    // Build equipment data object for rolling stock
    const equipment = requiresEquipmentData(formData.category) ? {
      reportingMarks: equipmentData.reportingMarks || undefined,
      manufacturer: equipmentData.manufacturer,
      model: equipmentData.model,
      yearBuilt: equipmentData.yearBuilt ? parseInt(equipmentData.yearBuilt) : undefined,
      availability: equipmentData.availability || undefined,
      // Locomotive-specific fields
      ...(isLocomotiveCategory(formData.category) && {
        horsepower: equipmentData.horsepower ? parseInt(equipmentData.horsepower) : undefined,
        fraCompliant: equipmentData.fraCompliant === 'yes' ? true : 
                      equipmentData.fraCompliant === 'no' ? false : undefined,
        engineHours: equipmentData.engineHours ? parseInt(equipmentData.engineHours) : undefined,
        mileage: equipmentData.mileage ? parseInt(equipmentData.mileage) : undefined,
      }),
      // Railcar-specific fields
      ...(isRailcarCategory(formData.category) && {
        aarCarType: equipmentData.aarCarType || undefined,
        loadLimit: equipmentData.loadLimit ? parseInt(equipmentData.loadLimit) : undefined,
        axleCount: equipmentData.axleCount ? parseInt(equipmentData.axleCount) : undefined,
      }),
    } : undefined;

    return {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory,
      condition: formData.condition,
      status: asDraft ? 'draft' : 'active',
      price: {
        type: formData.priceType,
        amount: formData.priceAmount ? parseFloat(formData.priceAmount) : undefined,
        currency: 'USD',
      },
      location: {
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: 'USA',
        lat: formData.lat,
        lng: formData.lng,
      },
      media: media.filter(m => !m.uploading && !m.error).map((m, i) => ({
        url: m.url,
        type: 'image' as const,
        caption: '',
        isPrimary: m.isPrimary,
        order: i,
      })),
      equipment,
      specifications: specifications.filter(s => s.label && s.value),
      quantity: parseInt(formData.quantity) || 1,
      quantityUnit: formData.quantityUnit,
      shippingOptions: {
        localPickup: formData.localPickup,
        sellerShips: formData.sellerShips,
        buyerArranges: formData.buyerArranges,
      },
      tags: formData.tags,
    };
  };

  const handleSubmit = async (asDraft: boolean = false) => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setError('');

    try {
      const listingData = buildListingData(asDraft);

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create listing');
      }

      // #8 fix: Clear draft from localStorage on successful submission
      clearDraft();
      
      // Redirect to listing page or dashboard
      router.push(`/listings/${data.data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not authenticated
  if (status === 'loading' || checkingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rail-orange" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login?callbackUrl=/listings/create');
    return null;
  }

  // S-4.3: Check if verification is needed - show inline notice, don't block
  const needsVerification = verificationStatus && !verificationStatus.isVerified;
  const isExpired = verificationStatus?.status === 'expired';

  return (
    <>
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-border/50">
        <nav className="container-rail">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center">
              <span className="text-heading-lg font-bold text-navy-900">The Rail</span>
              <span className="text-heading-lg font-bold text-rail-orange ml-1">Exchange</span>
              <span className="text-rail-orange text-sm font-medium ml-0.5">™</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/listings" className="text-body-md font-medium text-text-secondary hover:text-navy-900">
                ← Back to Listings
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 bg-surface-secondary py-8">
        <div className="container-rail max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-display-sm font-bold text-navy-900 mb-2">Create Listing</h1>
            <p className="text-body-lg text-text-secondary">
              List your rail equipment, materials, or services for sale.
            </p>
          </div>

          {/* S-4.3: Verification Notice - inline, not blocking */}
          {needsVerification && (
            <div className={`mb-6 p-4 rounded-xl border flex items-start gap-4 ${
              isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <svg 
                className={`w-6 h-6 flex-shrink-0 ${isExpired ? 'text-red-600' : 'text-amber-600'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className={`font-medium ${isExpired ? 'text-red-800' : 'text-amber-800'}`}>
                  {isExpired ? 'Verification Expired' : 'Seller verification is required to publish listings.'}
                </p>
                <p className={`text-sm mt-1 ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
                  You can draft listings before verifying. Verification is only required at publish.
                </p>
              </div>
              <Link
                href="/dashboard/verification/seller"
                className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  isExpired 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                {isExpired ? 'Renew' : 'Get Verified'}
              </Link>
            </div>
          )}

          {/* #8 fix: Draft Restored Banner */}
          {draftRestored && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-800">Your previous draft has been restored.</span>
              </div>
              <button
                onClick={() => {
                  clearDraft();
                  setFormData({
                    title: '', description: '', category: '', subcategory: '', condition: '',
                    priceType: 'fixed', priceAmount: '', city: '', state: '', zipCode: '',
                    quantity: '1', quantityUnit: '', localPickup: true, sellerShips: false,
                    buyerArranges: true, tags: [],
                  });
                  setEquipmentData({
                    reportingMarks: '', manufacturer: '', model: '', yearBuilt: '', availability: '',
                    horsepower: '', fraCompliant: '', engineHours: '', mileage: '',
                    aarCarType: '', loadLimit: '', axleCount: '',
                  });
                  setMedia([]);
                  setSpecifications([]);
                  setCurrentStep(1);
                  setDraftRestored(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Discard Draft
              </button>
            </div>
          )}

          {/* Progress Steps */}
          <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                        currentStep > step.id
                          ? 'bg-green-500 text-white'
                          : currentStep === step.id
                          ? 'bg-rail-orange text-white'
                          : 'bg-surface-secondary text-text-tertiary'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className={`text-caption mt-2 hidden md:block ${currentStep === step.id ? 'text-navy-900 font-medium' : 'text-text-tertiary'}`}>
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`hidden md:block w-24 h-0.5 mx-4 ${
                        currentStep > step.id ? 'bg-green-500' : 'bg-surface-border'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Form Content */}
          <div className="bg-white rounded-2xl shadow-card border border-surface-border p-8">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="heading-lg mb-6">Basic Information</h2>

                {/* Title */}
                <div>
                  <label className="form-label">Listing Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="e.g., 2015 EMD SD70ACe Locomotive - Low Hours"
                    className="form-input"
                    maxLength={150}
                  />
                  <p className="text-caption text-text-tertiary mt-1">
                    {formData.title.length}/150 characters
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label className="form-label">Category *</label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {LISTING_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => updateFormData({ category: cat })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.category === cat
                            ? 'border-rail-orange bg-rail-orange/5'
                            : 'border-surface-border hover:border-navy-200'
                        }`}
                      >
                        <span className="text-body-md font-semibold text-navy-900">
                          {CATEGORY_LABELS[cat]?.label || cat}
                        </span>
                        <p className="text-caption text-text-secondary mt-1">
                          {CATEGORY_LABELS[cat]?.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="form-label">Condition *</label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {LISTING_CONDITIONS.map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => updateFormData({ condition: cond })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.condition === cond
                            ? 'border-rail-orange bg-rail-orange/5'
                            : 'border-surface-border hover:border-navy-200'
                        }`}
                      >
                        <span className="text-body-md font-semibold text-navy-900">
                          {CONDITION_LABELS[cond]?.label || cond}
                        </span>
                        <p className="text-caption text-text-secondary mt-1">
                          {CONDITION_LABELS[cond]?.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="form-label">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    placeholder="Provide a detailed description of your item. Include specifications, history, condition details, and any relevant information buyers should know."
                    rows={8}
                    className="form-input"
                    maxLength={10000}
                  />
                  <p className="text-caption text-text-tertiary mt-1">
                    {formData.description.length}/10,000 characters
                  </p>
                </div>

                {/* S-4.1: Equipment Data merged into Step 1 for rolling stock categories */}
                {requiresEquipmentData(formData.category) && (
                  <div className="border-t border-surface-border pt-6 mt-6">
                    <h3 className="heading-md mb-4">Equipment Details</h3>
                    <p className="text-body-md text-text-secondary mb-6">
                      Add equipment specifics to help buyers find and evaluate your listing.
                    </p>

                    {/* Core Equipment Fields */}
                    <div className="bg-surface-secondary rounded-xl p-6 space-y-4">
                      <h4 className="text-lg font-semibold text-navy-900">Core Identification</h4>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Manufacturer *</label>
                          <select
                            value={equipmentData.manufacturer}
                            onChange={(e) => updateEquipmentData({ manufacturer: e.target.value })}
                            className="form-input"
                          >
                            <option value="">Select manufacturer</option>
                            {(isLocomotiveCategory(formData.category) ? LOCOMOTIVE_MANUFACTURERS : RAILCAR_MANUFACTURERS).map((mfr) => (
                              <option key={mfr} value={mfr}>{mfr}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="form-label">Model *</label>
                          <input
                            type="text"
                            value={equipmentData.model}
                            onChange={(e) => updateEquipmentData({ model: e.target.value })}
                            placeholder={isLocomotiveCategory(formData.category) ? "e.g., SD70ACe, GP38-2" : "e.g., 5161, 25500"}
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          {/* S-4.5: Year Built optional */}
                          <label className="form-label">Year Built <span className="text-text-tertiary">(optional)</span></label>
                          <input
                            type="number"
                            value={equipmentData.yearBuilt}
                            onChange={(e) => updateEquipmentData({ yearBuilt: e.target.value })}
                            placeholder="e.g., 2015 or leave blank if unknown"
                            min="1900"
                            max={new Date().getFullYear() + 1}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="form-label">Reporting Marks <span className="text-text-tertiary">(optional)</span></label>
                          <input
                            type="text"
                            value={equipmentData.reportingMarks}
                            onChange={(e) => updateEquipmentData({ reportingMarks: e.target.value.toUpperCase() })}
                            placeholder="e.g., BNSF 1234"
                            className="form-input uppercase"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Availability Status <span className="text-text-tertiary">(optional)</span></label>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {AVAILABILITY_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => updateEquipmentData({ availability: option.value })}
                              className={`p-3 rounded-xl border-2 text-left transition-all ${
                                equipmentData.availability === option.value
                                  ? 'border-rail-orange bg-rail-orange/5'
                                  : 'border-surface-border hover:border-navy-200'
                              }`}
                            >
                              <span className="text-sm font-medium text-navy-900">{option.label}</span>
                              <p className="text-xs text-text-secondary mt-0.5">{option.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Locomotive-Specific Fields - S-4.5: All optional */}
                    {isLocomotiveCategory(formData.category) && (
                      <div className="bg-blue-50 rounded-xl p-6 space-y-4 mt-4">
                        <h4 className="text-lg font-semibold text-navy-900">Locomotive Specifications <span className="text-sm font-normal text-text-tertiary">(optional)</span></h4>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="form-label">Horsepower</label>
                            <input
                              type="number"
                              value={equipmentData.horsepower}
                              onChange={(e) => updateEquipmentData({ horsepower: e.target.value })}
                              placeholder="e.g., 4400 or leave blank"
                              min="100"
                              className="form-input"
                            />
                          </div>
                          <div>
                            {/* S-4.5: FRA compliance with "Needs assessment" option */}
                            <label className="form-label">FRA Compliance</label>
                            <select
                              value={equipmentData.fraCompliant}
                              onChange={(e) => updateEquipmentData({ fraCompliant: e.target.value as EquipmentFormData['fraCompliant'] })}
                              className="form-input"
                            >
                              <option value="">Unknown / Needs assessment</option>
                              <option value="yes">Yes - FRA Compliant</option>
                              <option value="no">No - Not FRA Compliant</option>
                              <option value="unknown">Unknown</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            {/* S-4.5: Engine hours optional */}
                            <label className="form-label">Engine Hours <span className="text-text-tertiary">(if known)</span></label>
                            <input
                              type="number"
                              value={equipmentData.engineHours}
                              onChange={(e) => updateEquipmentData({ engineHours: e.target.value })}
                              placeholder="e.g., 45000"
                              min="0"
                              className="form-input"
                            />
                          </div>
                          <div>
                            {/* S-4.5: Mileage optional */}
                            <label className="form-label">Mileage <span className="text-text-tertiary">(if known)</span></label>
                            <input
                              type="number"
                              value={equipmentData.mileage}
                              onChange={(e) => updateEquipmentData({ mileage: e.target.value })}
                              placeholder="e.g., 250000"
                              min="0"
                              className="form-input"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Railcar-Specific Fields - S-4.5: Only AAR type required */}
                    {isRailcarCategory(formData.category) && (
                      <div className="bg-amber-50 rounded-xl p-6 space-y-4 mt-4">
                        <h4 className="text-lg font-semibold text-navy-900">Railcar Specifications</h4>
                        
                        <div>
                          <label className="form-label">AAR Car Type *</label>
                          <select
                            value={equipmentData.aarCarType}
                            onChange={(e) => updateEquipmentData({ aarCarType: e.target.value })}
                            className="form-input"
                          >
                            <option value="">Select AAR car type</option>
                            {AAR_CAR_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            {/* S-4.5: Load limit optional */}
                            <label className="form-label">Load Limit (lbs) <span className="text-text-tertiary">(optional)</span></label>
                            <input
                              type="number"
                              value={equipmentData.loadLimit}
                              onChange={(e) => updateEquipmentData({ loadLimit: e.target.value })}
                              placeholder="e.g., 286000"
                              min="1000"
                              className="form-input"
                            />
                          </div>
                          <div>
                            {/* S-4.5: Axle count optional */}
                            <label className="form-label">Axle Count <span className="text-text-tertiary">(optional)</span></label>
                            <select
                              value={equipmentData.axleCount}
                              onChange={(e) => updateEquipmentData({ axleCount: e.target.value })}
                              className="form-input"
                            >
                              <option value="">Unknown / Select if known</option>
                              <option value="4">4 axles (2 trucks)</option>
                              <option value="6">6 axles (3 trucks)</option>
                              <option value="8">8 axles (4 trucks)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* S-4.2: Photo Upload Available Early - Mini uploader in Step 1 */}
                <div className="border-t border-surface-border pt-6 mt-6">
                  <h3 className="heading-md mb-2">Photos <span className="text-text-tertiary text-sm font-normal">(optional - can add more in step 3)</span></h3>
                  <p className="text-body-sm text-text-secondary mb-4">
                    Start uploading photos now - they&apos;ll be saved as you continue.
                  </p>
                  <BulkPhotoUpload
                    images={media}
                    onChange={setMedia}
                    folder="listings"
                    maxImages={20}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Pricing & Location (S-4.1: was Step 3) */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="heading-lg mb-6">Pricing & Location</h2>

                {/* Price Type */}
                <div>
                  <label className="form-label">Pricing Type *</label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { value: 'fixed', label: 'Fixed Price', description: 'Set a firm price' },
                      { value: 'negotiable', label: 'Negotiable', description: 'Open to offers' },
                      { value: 'contact', label: 'Contact for Price', description: 'Discuss with buyers' },
                      { value: 'rfq', label: 'Request for Quote', description: 'Custom quotes only' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateFormData({ priceType: option.value as ListingFormData['priceType'] })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.priceType === option.value
                            ? 'border-rail-orange bg-rail-orange/5'
                            : 'border-surface-border hover:border-navy-200'
                        }`}
                      >
                        <span className="text-body-md font-semibold text-navy-900">{option.label}</span>
                        <p className="text-caption text-text-secondary mt-1">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Amount */}
                {(formData.priceType === 'fixed' || formData.priceType === 'negotiable') && (
                  <div>
                    <label className="form-label">Price (USD) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                      <input
                        type="number"
                        value={formData.priceAmount}
                        onChange={(e) => updateFormData({ priceAmount: e.target.value })}
                        placeholder="0.00"
                        className="form-input pl-8"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                )}

                {/* Location with Autocomplete */}
                <div>
                  <label className="form-label">Location *</label>
                  <LocationAutocomplete
                    value={formData.city && formData.state ? `${formData.city}, ${formData.state}` : ''}
                    placeholder="Enter city to search..."
                    inputClassName="form-input"
                    onLocationSelect={(location: LocationResult) => {
                      updateFormData({
                        city: location.city,
                        state: location.state,
                        zipCode: location.postalCode || formData.zipCode,
                        lat: location.lat,
                        lng: location.lng,
                      });
                    }}
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    Start typing to search for a city with autocomplete
                  </p>
                </div>

                {/* S-4.6: Free-text city/state with optional autocomplete */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateFormData({ city: e.target.value })}
                      placeholder="e.g., Chicago"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">State *</label>
                    <input
                      type="text"
                      list="us-states-list"
                      value={formData.state}
                      onChange={(e) => updateFormData({ state: e.target.value })}
                      placeholder="e.g., Illinois"
                      className="form-input"
                    />
                    <datalist id="us-states-list">
                      {US_STATES.map((state) => (
                        <option key={state} value={state} />
                      ))}
                    </datalist>
                    <p className="text-xs text-text-tertiary mt-1">Type or select from suggestions</p>
                  </div>
                </div>

                <div>
                  <label className="form-label">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => updateFormData({ zipCode: e.target.value })}
                    placeholder="e.g., 60601"
                    className="form-input max-w-xs"
                  />
                </div>

                {/* Quantity */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => updateFormData({ quantity: e.target.value })}
                      min="1"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Unit (optional)</label>
                    <input
                      type="text"
                      value={formData.quantityUnit}
                      onChange={(e) => updateFormData({ quantityUnit: e.target.value })}
                      placeholder="e.g., units, tons, linear feet"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Shipping Options */}
                <div>
                  <label className="form-label">Shipping Options</label>
                  <div className="space-y-3">
                    {[
                      { key: 'localPickup', label: 'Local Pickup', description: 'Buyer picks up at your location' },
                      { key: 'sellerShips', label: 'Seller Ships', description: 'You arrange and ship the item' },
                      { key: 'buyerArranges', label: 'Buyer Arranges Shipping', description: 'Buyer handles transportation' },
                    ].map((option) => (
                      <label key={option.key} className="flex items-center gap-3 p-4 border border-surface-border rounded-xl cursor-pointer hover:bg-surface-secondary transition-colors">
                        <input
                          type="checkbox"
                          checked={formData[option.key as keyof ListingFormData] as boolean}
                          onChange={(e) => updateFormData({ [option.key]: e.target.checked })}
                          className="w-5 h-5 rounded border-surface-border text-rail-orange focus:ring-rail-orange"
                        />
                        <div>
                          <span className="text-body-md font-medium text-navy-900">{option.label}</span>
                          <p className="text-caption text-text-secondary">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Media & Publish (S-4.1: combines old Steps 4+5) */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="heading-lg mb-2">Media & Publish</h2>
                <p className="text-body-md text-text-secondary mb-6">
                  Review your photos and publish your listing.
                </p>

                {/* Photo Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-navy-900">Photos & Documents</h3>
                  <BulkPhotoUpload
                    images={media}
                    onChange={setMedia}
                    folder="listings"
                    maxImages={20}
                    maxFileSize={10}
                  />
                  {media.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-amber-800">No photos yet</p>
                        <p className="text-sm text-amber-700">Listings with photos get 5x more views!</p>
                      </div>
                    </div>
                  )}
                  {media.length > 0 && (
                    <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                      ✓ {media.length} photo{media.length !== 1 ? 's' : ''} uploaded
                    </p>
                  )}
                </div>

                {/* Quick Preview Card */}
                <div className="border border-surface-border rounded-xl overflow-hidden">
                  <div className="bg-surface-secondary px-4 py-2 border-b border-surface-border">
                    <span className="text-sm font-medium text-text-secondary">Preview</span>
                  </div>
                  <div className="p-6">
                    <div className="flex gap-2 mb-3">
                      <span className="badge-primary">{CATEGORY_LABELS[formData.category]?.label}</span>
                      <span className="badge-secondary">{CONDITION_LABELS[formData.condition]?.label}</span>
                    </div>
                    <h3 className="heading-md mb-2">{formData.title || 'Untitled Listing'}</h3>
                    
                    {/* Equipment Identity */}
                    {requiresEquipmentData(formData.category) && equipmentData.manufacturer && (
                      <p className="text-lg font-semibold text-navy-800 mb-2">
                        {equipmentData.yearBuilt} {equipmentData.manufacturer} {equipmentData.model}
                        {equipmentData.reportingMarks && <span className="text-text-secondary ml-2">({equipmentData.reportingMarks})</span>}
                      </p>
                    )}
                    
                    <p className="text-body-lg font-semibold text-rail-orange mb-3">
                      {formData.priceType === 'fixed' || formData.priceType === 'negotiable'
                        ? `$${parseFloat(formData.priceAmount || '0').toLocaleString()}`
                        : formData.priceType === 'contact'
                        ? 'Contact for Price'
                        : 'Request for Quote'}
                    </p>
                    <p className="text-body-md text-text-secondary mb-4">
                      {formData.city}, {formData.state}
                    </p>
                  </div>
                </div>

                {/* Ready to publish notice */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-body-sm text-blue-800">
                    <strong>Seller:</strong> {session?.user?.name || session?.user?.email}<br/>
                    <span className="text-blue-600">Your listing is ready to publish!</span>
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-border">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              <div className="flex gap-3">
                {currentStep === STEPS.length ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSubmit(true)}
                      disabled={isSubmitting}
                      className="btn-outline"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      onClick={handlePublishClick}
                      disabled={isSubmitting}
                      className="btn-primary"
                    >
                      {isSubmitting ? 'Publishing...' : 'Publish Listing'}
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={nextStep} className="btn-primary">
                    Next →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Publish Upsell Modal */}
      <PublishUpsellModal
        isOpen={showUpsellModal}
        onClose={() => setShowUpsellModal(false)}
        onPublishWithAddons={handlePublishWithAddons}
        onPublishWithoutAddons={handlePublishWithoutAddons}
        listingTitle={formData.title || 'Your Listing'}
      />
    </>
  );
}
