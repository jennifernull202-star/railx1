/**
 * THE RAIL EXCHANGE™ — Edit Listing Page
 * 
 * Full-featured listing editor with image management,
 * premium add-ons, and real-time preview.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { EQUIPMENT_TYPES, US_STATES, CONDITIONS } from '@/lib/constants';

interface ListingImage {
  url: string;
  alt: string;
  isPrimary?: boolean;
}

interface ListingData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  condition: string;
  year?: number;
  manufacturer?: string;
  modelNumber?: string;
  specifications?: Record<string, string>;
  price: {
    amount: number;
    currency: string;
    negotiable: boolean;
    priceType: string;
  };
  location: {
    city: string;
    state: string;
    zip: string;
  };
  images: ListingImage[];
  status: string;
  premiumAddOns: {
    featured: { active: boolean; expiresAt?: string };
    topSpot: { active: boolean; expiresAt?: string };
    boosted: { active: boolean; boostLevel?: number; expiresAt?: string };
  };
  sellerId: string;
}

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();
  const listingId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [manufacturer, setManufacturer] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [negotiable, setNegotiable] = useState(false);
  const [priceType, setPriceType] = useState('fixed');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [images, setImages] = useState<ListingImage[]>([]);
  const [status, setStatus] = useState('active');
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([]);

  // Premium Add-ons
  const [featured, setFeatured] = useState(false);
  const [topSpot, setTopSpot] = useState(false);
  const [boosted, setBoosted] = useState(false);

  // Image Upload
  const [isUploading, setIsUploading] = useState(false);

  const fetchListing = useCallback(async () => {
    try {
      const res = await fetch(`/api/listings/${listingId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Listing not found');
        }
        throw new Error('Failed to fetch listing');
      }

      const data: ListingData = await res.json();

      // Verify ownership
      if (data.sellerId !== session?.user?.id && session?.user?.role !== 'admin') {
        throw new Error('You do not have permission to edit this listing');
      }

      // Populate form
      setTitle(data.title);
      setDescription(data.description);
      setCategory(data.category);
      setCondition(data.condition);
      setYear(data.year || '');
      setManufacturer(data.manufacturer || '');
      setModelNumber(data.modelNumber || '');
      setPrice(data.price.amount);
      setNegotiable(data.price.negotiable);
      setPriceType(data.price.priceType);
      setCity(data.location.city);
      setState(data.location.state);
      setZip(data.location.zip);
      setImages(data.images);
      setStatus(data.status);
      setFeatured(data.premiumAddOns.featured.active);
      setTopSpot(data.premiumAddOns.topSpot.active);
      setBoosted(data.premiumAddOns.boosted.active);

      if (data.specifications) {
        setSpecs(
          Object.entries(data.specifications).map(([key, value]) => ({ key, value }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [listingId, session?.user?.id, session?.user?.role]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && listingId) {
      fetchListing();
    }
  }, [sessionStatus, listingId, fetchListing]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      for (const file of Array.from(files)) {
        // Get presigned URL with all required fields
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
            folder: 'listings',
            fileType: 'image',
          }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Failed to get upload URL');
        }

        const { uploadUrl, fileUrl } = result.data;

        // Upload to S3
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload to S3');
        }

        setImages(prev => [...prev, { url: fileUrl, alt: title || 'Listing image' }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    setImages(prev =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  const addSpec = () => {
    setSpecs(prev => [...prev, { key: '', value: '' }]);
  };

  const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
    setSpecs(prev =>
      prev.map((spec, i) =>
        i === index ? { ...spec, [field]: value } : spec
      )
    );
  };

  const removeSpec = (index: number) => {
    setSpecs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // Validate
      if (!title.trim()) throw new Error('Title is required');
      if (!category) throw new Error('Category is required');
      if (!condition) throw new Error('Condition is required');
      if (!price) throw new Error('Price is required');
      if (!city.trim() || !state) throw new Error('Location is required');

      // Build specifications object
      const specifications: Record<string, string> = {};
      specs.forEach(spec => {
        if (spec.key.trim() && spec.value.trim()) {
          specifications[spec.key.trim()] = spec.value.trim();
        }
      });

      // Prepare update data
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        year: year || undefined,
        manufacturer: manufacturer.trim() || undefined,
        modelNumber: modelNumber.trim() || undefined,
        specifications,
        price: {
          amount: Number(price),
          currency: 'USD',
          negotiable,
          priceType,
        },
        location: {
          city: city.trim(),
          state,
          zip: zip.trim(),
        },
        images,
        status,
        premiumAddOns: {
          featured: { active: featured },
          topSpot: { active: topSpot },
          boosted: { active: boosted },
        },
      };

      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update listing');
      }

      setSuccessMessage('Listing updated successfully!');
      setTimeout(() => {
        router.push('/dashboard/listings');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-12 h-12 border-4 border-rail-orange/30 border-t-rail-orange rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Loading listing...</p>
      </div>
    );
  }

  if (error && isLoading === false && !title) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-status-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="heading-lg mb-2">Unable to Load Listing</h2>
        <p className="text-text-secondary mb-6">{error}</p>
        <Link href="/dashboard/listings" className="btn-primary">
          Back to Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/dashboard/listings"
            className="text-body-sm text-text-secondary hover:text-navy-900 mb-2 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Listings
          </Link>
          <h1 className="heading-xl">Edit Listing</h1>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-status-success/10 border border-status-success/30 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-status-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-status-success font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-status-error/10 border border-status-error/30 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-status-error flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-status-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <section className="bg-white rounded-2xl border border-surface-border p-6">
          <h2 className="heading-md mb-6">Basic Information</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-body-sm font-medium text-navy-900 mb-2">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g., 2018 Caterpillar D6T XL Bulldozer"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-body-sm font-medium text-navy-900 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="input-field resize-none"
                placeholder="Provide a detailed description of the equipment..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-body-sm font-medium text-navy-900 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select category</option>
                  {EQUIPMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="condition" className="block text-body-sm font-medium text-navy-900 mb-2">
                  Condition *
                </label>
                <select
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select condition</option>
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <label htmlFor="year" className="block text-body-sm font-medium text-navy-900 mb-2">
                  Year
                </label>
                <input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')}
                  className="input-field"
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div>
                <label htmlFor="manufacturer" className="block text-body-sm font-medium text-navy-900 mb-2">
                  Manufacturer
                </label>
                <input
                  id="manufacturer"
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Caterpillar"
                />
              </div>

              <div>
                <label htmlFor="modelNumber" className="block text-body-sm font-medium text-navy-900 mb-2">
                  Model Number
                </label>
                <input
                  id="modelNumber"
                  type="text"
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                  className="input-field"
                  placeholder="e.g., D6T XL"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="bg-white rounded-2xl border border-surface-border p-6">
          <h2 className="heading-md mb-6">Images</h2>

          <div className="space-y-4">
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-surface-secondary rounded-xl overflow-hidden">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-rail-orange text-white text-caption rounded-md">
                        Primary
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className="p-2 bg-white rounded-lg text-navy-900 hover:bg-surface-secondary"
                        title="Set as primary"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-2 bg-white rounded-lg text-status-error hover:bg-surface-secondary"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <label className="block">
              <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-rail-orange/50 hover:bg-rail-orange/5 transition-colors ${isUploading ? 'opacity-50 cursor-wait' : 'border-surface-border'}`}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-rail-orange/30 border-t-rail-orange rounded-full animate-spin mb-2" />
                    <p className="text-body-sm text-text-secondary">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-text-tertiary mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-body-md font-medium text-navy-900 mb-1">
                      Click to upload images
                    </p>
                    <p className="text-caption text-text-secondary">
                      PNG, JPG up to 10MB each
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white rounded-2xl border border-surface-border p-6">
          <h2 className="heading-md mb-6">Pricing</h2>

          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-body-sm font-medium text-navy-900 mb-2">
                  Price (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                  <input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? parseInt(e.target.value) : '')}
                    className="input-field pl-8"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="priceType" className="block text-body-sm font-medium text-navy-900 mb-2">
                  Price Type
                </label>
                <select
                  id="priceType"
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value)}
                  className="input-field"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="obo">Or Best Offer</option>
                  <option value="auction">Auction</option>
                  <option value="contact">Contact for Price</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
                className="w-5 h-5 rounded border-surface-border text-rail-orange focus:ring-rail-orange/20"
              />
              <span className="text-body-md">Price is negotiable</span>
            </label>
          </div>
        </section>

        {/* Location */}
        <section className="bg-white rounded-2xl border border-surface-border p-6">
          <h2 className="heading-md mb-6">Location</h2>

          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <label htmlFor="city" className="block text-body-sm font-medium text-navy-900 mb-2">
                City *
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-field"
                placeholder="Chicago"
                required
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-body-sm font-medium text-navy-900 mb-2">
                State *
              </label>
              <select
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="zip" className="block text-body-sm font-medium text-navy-900 mb-2">
                ZIP Code
              </label>
              <input
                id="zip"
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="input-field"
                placeholder="60601"
              />
            </div>
          </div>
        </section>

        {/* Specifications */}
        <section className="bg-white rounded-2xl border border-surface-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-md">Specifications</h2>
            <button
              type="button"
              onClick={addSpec}
              className="text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark"
            >
              + Add Specification
            </button>
          </div>

          {specs.length === 0 ? (
            <p className="text-body-md text-text-secondary text-center py-8">
              No specifications added. Click &quot;Add Specification&quot; to add details.
            </p>
          ) : (
            <div className="space-y-3">
              {specs.map((spec, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => updateSpec(index, 'key', e.target.value)}
                    className="input-field flex-1"
                    placeholder="e.g., Weight"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => updateSpec(index, 'value', e.target.value)}
                    className="input-field flex-1"
                    placeholder="e.g., 20,000 lbs"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpec(index)}
                    className="p-2 text-text-secondary hover:text-status-error"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Status & Premium */}
        <section className="bg-white rounded-2xl border border-surface-border p-6">
          <h2 className="heading-md mb-6">Status & Premium Add-ons</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="status" className="block text-body-sm font-medium text-navy-900 mb-2">
                Listing Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field max-w-xs"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            <div className="border-t border-surface-border pt-6">
              <h3 className="text-body-md font-medium text-navy-900 mb-4">Premium Add-ons</h3>
              <div className="space-y-4">
                <label className="flex items-start gap-4 p-4 rounded-xl border border-surface-border hover:border-rail-orange/30 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-surface-border text-rail-orange focus:ring-rail-orange/20"
                  />
                  <div>
                    <span className="text-body-md font-medium text-navy-900">Featured Listing</span>
                    <p className="text-caption text-text-secondary mt-1">
                      Highlighted with a badge and shown in featured sections
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-4 rounded-xl border border-surface-border hover:border-rail-orange/30 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={topSpot}
                    onChange={(e) => setTopSpot(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-surface-border text-rail-orange focus:ring-rail-orange/20"
                  />
                  <div>
                    <span className="text-body-md font-medium text-navy-900">Top Spot</span>
                    <p className="text-caption text-text-secondary mt-1">
                      Appear at the top of search results in your category
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-4 rounded-xl border border-surface-border hover:border-rail-orange/30 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={boosted}
                    onChange={(e) => setBoosted(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-surface-border text-rail-orange focus:ring-rail-orange/20"
                  />
                  <div>
                    <span className="text-body-md font-medium text-navy-900">Boosted Visibility</span>
                    <p className="text-caption text-text-secondary mt-1">
                      Get more views with algorithmic boosting
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard/listings"
            className="btn-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary min-w-[160px]"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
