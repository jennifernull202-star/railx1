/**
 * THE RAIL EXCHANGE™ — Create Listing Page
 * 
 * Multi-step form for creating equipment listings.
 * Premium UI with validation and S3 uploads.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from '@/lib/listing-constants';
import { US_STATES } from '@/lib/constants';
import LocationAutocomplete, { LocationResult } from '@/components/search/LocationAutocomplete';

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

interface MediaFile {
  url: string;
  type: 'image' | 'video' | 'document';
  caption: string;
  isPrimary: boolean;
  order: number;
  file?: File;
}

interface Specification {
  label: string;
  value: string;
  unit: string;
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

const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Title, category, and condition' },
  { id: 2, name: 'Details', description: 'Price, location, and quantity' },
  { id: 3, name: 'Photos', description: 'Add images and documents' },
  { id: 4, name: 'Specifications', description: 'Technical details' },
  { id: 5, name: 'Review', description: 'Review and publish' },
];

export default function CreateListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
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
  
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const updateFormData = (updates: Partial<ListingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Handle media upload
  const handleFileSelect = useCallback(async (files: FileList) => {
    setUploadingMedia(true);
    setError('');

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const isDocument = file.type === 'application/pdf';

        if (!isImage && !isVideo && !isDocument) {
          continue;
        }

        // Get presigned URL
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            folder: 'listings',
          }),
        });

        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          throw new Error('Failed to get upload URL');
        }

        // Upload to S3
        await fetch(uploadData.data.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        // Add to media list
        setMedia(prev => [
          ...prev,
          {
            url: uploadData.data.fileUrl,
            type: isImage ? 'image' : isVideo ? 'video' : 'document',
            caption: '',
            isPrimary: prev.length === 0, // First image is primary
            order: prev.length,
          },
        ]);
      }
    } catch {
      setError('Failed to upload files. Please try again.');
    } finally {
      setUploadingMedia(false);
    }
  }, []);

  const removeMedia = (index: number) => {
    setMedia(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // If we removed the primary, make first one primary
      if (prev[index].isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const setPrimaryMedia = (index: number) => {
    setMedia(prev =>
      prev.map((item, i) => ({
        ...item,
        isPrimary: i === index,
      }))
    );
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

  const validateStep = (step: number): boolean => {
    setError('');

    switch (step) {
      case 1:
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
        return true;

      case 2:
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
        // Photos are optional but recommended
        return true;

      case 4:
        // Specifications are optional
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

  const handleSubmit = async (asDraft: boolean = false) => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setError('');

    try {
      const listingData = {
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
        media: media.map((m, i) => ({ ...m, order: i })),
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

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create listing');
      }

      // Redirect to listing page or dashboard
      router.push(`/listings/${data.data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not authenticated
  if (status === 'loading') {
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
              </div>
            )}

            {/* Step 2: Details */}
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

                {/* Manual city/state inputs as fallback */}
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
                    <select
                      value={formData.state}
                      onChange={(e) => updateFormData({ state: e.target.value })}
                      className="form-input"
                    >
                      <option value="">Select state</option>
                      {US_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
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

            {/* Step 3: Photos */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="heading-lg mb-6">Photos & Documents</h2>

                {/* Upload Area */}
                <div
                  className="border-2 border-dashed border-surface-border rounded-2xl p-8 text-center hover:border-rail-orange transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files) {
                      handleFileSelect(e.dataTransfer.files);
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                  />
                  <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-body-md font-medium text-navy-900 mb-1">
                    {uploadingMedia ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-body-sm text-text-secondary">
                    Images, videos, or PDF documents (max 50MB each)
                  </p>
                </div>

                {/* Media Grid */}
                {media.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-body-sm text-text-secondary">
                      Click the star to set as primary image. Drag to reorder.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {media.map((item, index) => (
                        <div
                          key={index}
                          className={`relative group aspect-square rounded-xl overflow-hidden border-2 ${
                            item.isPrimary ? 'border-rail-orange' : 'border-surface-border'
                          }`}
                        >
                          {item.type === 'image' && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.url}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {item.type === 'video' && (
                            <div className="w-full h-full bg-navy-900 flex items-center justify-center">
                              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          {item.type === 'document' && (
                            <div className="w-full h-full bg-surface-secondary flex items-center justify-center">
                              <svg className="w-12 h-12 text-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPrimaryMedia(index)}
                              className={`p-2 rounded-lg ${item.isPrimary ? 'bg-rail-orange text-white' : 'bg-white text-navy-900'}`}
                              title="Set as primary"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMedia(index)}
                              className="p-2 rounded-lg bg-red-500 text-white"
                              title="Remove"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>

                          {/* Primary Badge */}
                          {item.isPrimary && (
                            <div className="absolute top-2 left-2 bg-rail-orange text-white text-caption px-2 py-1 rounded">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {media.length === 0 && (
                  <p className="text-body-sm text-text-tertiary text-center">
                    No media uploaded yet. Listings with photos get 5x more views!
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Specifications */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="heading-lg mb-6">Technical Specifications</h2>

                <p className="text-body-md text-text-secondary">
                  Add technical details that buyers care about. These help your listing appear in relevant searches.
                </p>

                {/* Specifications List */}
                <div className="space-y-4">
                  {specifications.map((spec, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="flex-1 grid sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={spec.label}
                          onChange={(e) => updateSpecification(index, 'label', e.target.value)}
                          placeholder="Label (e.g., Horsepower)"
                          className="form-input"
                        />
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                          placeholder="Value (e.g., 4,400)"
                          className="form-input"
                        />
                        <input
                          type="text"
                          value={spec.unit}
                          onChange={(e) => updateSpecification(index, 'unit', e.target.value)}
                          placeholder="Unit (e.g., HP)"
                          className="form-input"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSpecification(index)}
                        className="p-3 text-text-tertiary hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addSpecification}
                  className="btn-outline"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Specification
                </button>

                {/* Tags */}
                <div className="pt-6 border-t border-surface-border">
                  <label className="form-label">Tags</label>
                  <p className="text-body-sm text-text-secondary mb-3">
                    Add keywords to help buyers find your listing
                  </p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Enter a tag and press Enter"
                      className="form-input flex-1"
                    />
                    <button type="button" onClick={addTag} className="btn-outline">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-surface-secondary rounded-full text-body-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-text-tertiary hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="heading-lg mb-6">Review Your Listing</h2>

                {/* Preview Card */}
                <div className="border border-surface-border rounded-xl overflow-hidden">
                  {media.length > 0 && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={media.find(m => m.isPrimary)?.url || media[0].url}
                      alt={formData.title}
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex gap-2 mb-3">
                      <span className="badge-primary">{CATEGORY_LABELS[formData.category]?.label}</span>
                      <span className="badge-secondary">{CONDITION_LABELS[formData.condition]?.label}</span>
                    </div>
                    <h3 className="heading-md mb-2">{formData.title || 'Untitled Listing'}</h3>
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
                    <p className="text-body-md line-clamp-3">{formData.description}</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-surface-secondary rounded-xl">
                    <h4 className="heading-sm mb-3">Details</h4>
                    <dl className="space-y-2 text-body-sm">
                      <div className="flex justify-between">
                        <dt className="text-text-secondary">Quantity</dt>
                        <dd className="font-medium">{formData.quantity} {formData.quantityUnit}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-text-secondary">Photos</dt>
                        <dd className="font-medium">{media.filter(m => m.type === 'image').length}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-text-secondary">Specifications</dt>
                        <dd className="font-medium">{specifications.filter(s => s.label && s.value).length}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="p-4 bg-surface-secondary rounded-xl">
                    <h4 className="heading-sm mb-3">Shipping</h4>
                    <ul className="space-y-2 text-body-sm">
                      {formData.localPickup && (
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Local Pickup
                        </li>
                      )}
                      {formData.sellerShips && (
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Seller Ships
                        </li>
                      )}
                      {formData.buyerArranges && (
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Buyer Arranges
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Logged in user info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-body-sm text-blue-800">
                    <strong>Seller:</strong> {session?.user?.name || session?.user?.email}
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
                      onClick={() => handleSubmit(false)}
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
    </>
  );
}
