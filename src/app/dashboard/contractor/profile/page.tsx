/**
 * THE RAIL EXCHANGE™ — FREE Contractor Profile Page
 * 
 * Build your public contractor profile. NO DOCUMENTS REQUIRED.
 * This profile is free and visible in search results.
 * 
 * SECTIONS:
 * 1. Business Information
 * 2. Services Offered
 * 3. Regions Served
 * 4. Photos / Gallery
 * 
 * NO insurance, certifications, licenses, or verification here.
 * Those belong exclusively in /dashboard/contractor/verify/start
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUnsavedChanges } from '@/lib/hooks/useUnsavedChanges';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Wrench,
  Camera,
  Save,
  Loader2,
  CheckCircle,
  Eye,
  Shield,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

// Service categories (NO document-related services)
const SERVICE_OPTIONS = [
  { value: 'track-repair', label: 'Track Repair & Maintenance' },
  { value: 'brush-cutting', label: 'Brush Cutting' },
  { value: 'derailment-services', label: 'Derailment Services' },
  { value: 'welding', label: 'Welding' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'material-supply', label: 'Material Supply' },
  { value: 'safety-training', label: 'Safety Training' },
  { value: 'construction-support', label: 'Construction Support' },
  { value: 'signal-systems', label: 'Signal Systems' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'bridge-structures', label: 'Bridge & Structures' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'surveying', label: 'Surveying' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'equipment-rental', label: 'Equipment Rental' },
  { value: 'demolition', label: 'Demolition' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'emergency-response', label: 'Emergency Response' },
];

// US States
const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

interface ProfileFormData {
  // Business Info (SECTION 1)
  businessName: string;
  contactEmail: string;
  phoneNumber: string;
  website: string;
  description: string;
  // Services (SECTION 2)
  services: string[];
  customServices: string[];
  // Regions (SECTION 3)
  primaryState: string;
  additionalStates: string[];
  serviceRadius: string;
  // Photos (SECTION 4)
  photos: string[];
}

export default function ContractorProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [profileSlug, setProfileSlug] = useState('');

  const [formData, setFormData] = useState<ProfileFormData>({
    businessName: '',
    contactEmail: '',
    phoneNumber: '',
    website: '',
    description: '',
    services: [],
    customServices: [],
    primaryState: '',
    additionalStates: [],
    serviceRadius: '',
    photos: [],
  });

  const [newCustomService, setNewCustomService] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Fetch existing profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/contractors/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setHasExistingProfile(true);
            setProfileSlug(data.profile.slug || '');
            setFormData({
              businessName: data.profile.companyName || '',
              contactEmail: data.profile.contactInfo?.email || session?.user?.email || '',
              phoneNumber: data.profile.contactInfo?.phone || '',
              website: data.profile.contactInfo?.website || '',
              description: data.profile.description || '',
              services: data.profile.services || [],
              customServices: data.profile.customServices || [],
              primaryState: data.profile.primaryState || '',
              additionalStates: data.profile.serviceAreas || [],
              serviceRadius: data.profile.serviceRadius || '',
              photos: data.profile.photos || [],
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchProfile();
    } else if (sessionStatus !== 'loading') {
      setLoading(false);
    }
  }, [session, sessionStatus]);

  // Redirect if not authenticated
  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/login?callbackUrl=/dashboard/contractor/profile');
    return null;
  }

  // Track if form has unsaved changes
  const hasFormChanges = formData.businessName.length > 0 || 
    formData.description.length > 0 || 
    formData.services.length > 0 ||
    formData.photos.length > 0;
  
  // Warn user before leaving with unsaved changes  
  useUnsavedChanges({ 
    hasChanges: hasFormChanges && !saving && !success,
    message: 'You have unsaved changes to your contractor profile. Are you sure you want to leave?'
  });

  // Handle service toggle
  const toggleService = (serviceValue: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceValue)
        ? prev.services.filter(s => s !== serviceValue)
        : [...prev.services, serviceValue],
    }));
  };

  // Handle custom service add
  const addCustomService = () => {
    if (newCustomService.trim() && !formData.customServices.includes(newCustomService.trim())) {
      setFormData(prev => ({
        ...prev,
        customServices: [...prev.customServices, newCustomService.trim()],
      }));
      setNewCustomService('');
    }
  };

  // Handle state toggle for additional states
  const toggleState = (stateValue: string) => {
    if (stateValue === formData.primaryState) return; // Can't add primary as additional
    setFormData(prev => ({
      ...prev,
      additionalStates: prev.additionalStates.includes(stateValue)
        ? prev.additionalStates.filter(s => s !== stateValue)
        : [...prev.additionalStates, stateValue],
    }));
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.photos.length >= 10) {
      setError('Maximum 10 photos allowed');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    try {
      const presignRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          folder: 'contractors',
          subfolder: 'photos',
          fileType: 'image',
        }),
      });

      const presignData = await presignRes.json();
      if (!presignData.success) {
        throw new Error(presignData.error || 'Failed to get upload URL');
      }

      await fetch(presignData.data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, presignData.data.fileUrl],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  // Save profile
  const handleSave = async () => {
    if (!formData.businessName.trim()) {
      setError('Business name is required');
      return;
    }
    if (!formData.contactEmail.trim()) {
      setError('Contact email is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/contractors/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.businessName,
          contactInfo: {
            email: formData.contactEmail,
            phone: formData.phoneNumber,
            website: formData.website,
          },
          description: formData.description,
          services: formData.services,
          customServices: formData.customServices,
          primaryState: formData.primaryState,
          serviceAreas: formData.additionalStates,
          serviceRadius: formData.serviceRadius,
          photos: formData.photos,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      setSuccess('Profile saved successfully!');
      setHasExistingProfile(true);
      if (data.slug) setProfileSlug(data.slug);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900">Contractor Profile</h1>
        <p className="text-slate-500 mt-1">
          Build your public contractor profile. This profile is free and visible in search results.
        </p>
      </div>

      {/* View Public Profile Link */}
      {hasExistingProfile && profileSlug && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Your profile is live!</span>
          </div>
          <Link
            href={`/contractors/${profileSlug}`}
            className="flex items-center gap-2 text-green-700 hover:text-green-900 font-medium"
          >
            <Eye className="w-4 h-4" />
            View Public Profile
          </Link>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <X className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* SECTION 1: Business Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Business Information</h2>
            <p className="text-sm text-slate-500">Basic company details</p>
          </div>
        </div>

        <div className="grid gap-5">
          {/* Business Name - REQUIRED */}
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1.5">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              placeholder="Your Company Name"
            />
          </div>

          {/* Contact Email - REQUIRED */}
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1.5">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                placeholder="contact@company.com"
              />
            </div>
          </div>

          {/* Phone - OPTIONAL */}
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1.5">
              Phone Number <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Website - OPTIONAL */}
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1.5">
              Website URL <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                placeholder="https://yourcompany.com"
              />
            </div>
          </div>

          {/* Description - OPTIONAL */}
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1.5">
              Company Description <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
              placeholder="Tell potential clients about your company, experience, and capabilities..."
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Services Offered */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Services Offered</h2>
            <p className="text-sm text-slate-500">Select all services you provide</p>
          </div>
        </div>

        {/* Service Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SERVICE_OPTIONS.map((service) => (
            <button
              key={service.value}
              onClick={() => toggleService(service.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.services.includes(service.value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {service.label}
            </button>
          ))}
        </div>

        {/* Custom Services */}
        {formData.customServices.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.customServices.map((service, index) => (
              <span
                key={index}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center gap-1"
              >
                {service}
                <button
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    customServices: prev.customServices.filter((_, i) => i !== index),
                  }))}
                  className="ml-1 hover:text-green-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add Custom Service */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newCustomService}
            onChange={(e) => setNewCustomService(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomService()}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
            placeholder="Add a custom service..."
          />
          <button
            onClick={addCustomService}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SECTION 3: Regions Served */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Regions Served</h2>
            <p className="text-sm text-slate-500">Where do you operate?</p>
          </div>
        </div>

        {/* Primary State */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-navy-900 mb-1.5">
            Primary State
          </label>
          <select
            value={formData.primaryState}
            onChange={(e) => setFormData(prev => ({ ...prev, primaryState: e.target.value }))}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">Select primary state...</option>
            {US_STATES.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
        </div>

        {/* Additional States */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-navy-900 mb-1.5">
            Additional States Served
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-lg">
            {US_STATES.filter(s => s.value !== formData.primaryState).map((state) => (
              <button
                key={state.value}
                onClick={() => toggleState(state.value)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  formData.additionalStates.includes(state.value)
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {state.value}
              </button>
            ))}
          </div>
        </div>

        {/* Service Radius */}
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1.5">
            Service Radius <span className="text-slate-400 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.serviceRadius}
            onChange={(e) => setFormData(prev => ({ ...prev, serviceRadius: e.target.value }))}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            placeholder="e.g., 300 miles, Nationwide, Regional"
          />
        </div>
      </div>

      {/* SECTION 4: Photos / Gallery */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Camera className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Photos / Gallery</h2>
            <p className="text-sm text-slate-500">Show equipment, team, and past projects (max 10)</p>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
          {formData.photos.map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
              <Image
                src={photo}
                alt={`Photo ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Upload Button */}
          {formData.photos.length < 10 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-500">
              {uploadingPhoto ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Plus className="w-6 h-6" />
                  <span className="text-xs">Add Photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </label>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Supports JPG, PNG, WebP. Max 5MB per image.
        </p>
      </div>

      {/* Get Verified CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">
              Want More Visibility?
            </h3>
            <p className="text-blue-100 text-sm mb-4">
              Get verified to increase trust, rank higher in search, and attract more leads.
            </p>
            <Link
              href="/dashboard/contractor/verify"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-semibold"
            >
              <Shield className="w-4 h-4" />
              Get Verified
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:relative md:bg-transparent md:border-0 md:p-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Contractor Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
