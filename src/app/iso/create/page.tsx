/**
 * THE RAIL EXCHANGE™ — Create ISO Request (Public Page)
 * 
 * Public page for creating "In Search Of" requests.
 * Requires login to submit, but anyone can view the form.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  LogIn,
} from 'lucide-react';

const ISO_CATEGORIES = [
  { value: 'locomotives', label: 'Locomotives' },
  { value: 'railcars', label: 'Railcars' },
  { value: 'track-materials', label: 'Track Materials' },
  { value: 'parts', label: 'Parts & Components' },
  { value: 'hi-rail', label: 'Hi-Rail Equipment' },
  { value: 'mow-equipment', label: 'MOW Equipment' },
  { value: 'contractor-services', label: 'Contractor Services' },
  { value: 'other', label: 'Other' },
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
  'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming', 'Nationwide',
];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low - Within 3+ months' },
  { value: 'medium', label: 'Medium - Within 1-3 months' },
  { value: 'high', label: 'High - Within 30 days' },
  { value: 'urgent', label: 'Urgent - ASAP' },
];

export default function CreateISOPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    region: '',
    budget: '',
    urgency: 'medium',
    contactPreference: 'email',
  });
  
  // UX Item #10: Track if preview event has been logged
  const [previewEventLogged, setPreviewEventLogged] = useState(false);
  const isAuthenticated = sessionStatus !== 'loading' && !!session;
  
  // UX Item #10: Log preview shown event for unauthenticated users
  useEffect(() => {
    if (sessionStatus !== 'loading' && !session && !previewEventLogged) {
      console.log('[EVENT] iso_create_preview_shown_unauth');
      setPreviewEventLogged(true);
    }
  }, [sessionStatus, session, previewEventLogged]);
  
  // UX Item #10: Handle sign-in click from preview
  const handleSignInFromPreview = () => {
    console.log('[EVENT] iso_create_signin_clicked_from_preview');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      router.push('/auth/login?callbackUrl=/iso/create');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title for your request');
      return;
    }
    if (!formData.category) {
      setError('Please select a category');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please describe what you are looking for');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/iso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create ISO request');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/iso');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ISO request');
    } finally {
      setSubmitting(false);
    }
  };

  // UX Item #10: Show form preview with overlay for unauthenticated users
  // This allows users to see what information is required before signing in
  if (sessionStatus !== 'loading' && !session) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Back Link */}
          <Link
            href="/iso"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to ISO Requests
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-navy-900 mb-2">Create ISO Request</h1>
            <p className="text-slate-600">
              Describe what you&apos;re looking for and let sellers come to you.
            </p>
          </div>

          {/* Form Preview with Overlay */}
          <div className="relative">
            {/* Sign-in Overlay */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 rounded-xl flex flex-col items-center justify-center p-8">
              <LogIn className="w-12 h-12 text-blue-600 mb-4" />
              <h2 className="text-xl font-bold text-navy-900 mb-2 text-center">Sign in to submit your request</h2>
              <p className="text-slate-600 text-sm text-center mb-6 max-w-sm">
                Preview the form below to see what information is needed.
              </p>
              <Link
                href="/auth/login?callbackUrl=/iso/create"
                onClick={handleSignInFromPreview}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Continue
              </Link>
            </div>
            
            {/* Disabled Form Preview */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 pointer-events-none select-none opacity-60">
              {/* Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-navy-900 mb-1.5">
                  What are you looking for? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 cursor-not-allowed"
                  placeholder="e.g., GP38-2 Locomotive, 50lb Rail, Track Maintenance Contractor"
                />
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-navy-900 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  disabled
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 cursor-not-allowed"
                >
                  <option>Select a category...</option>
                </select>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-navy-900 mb-1.5">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  disabled
                  rows={5}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 cursor-not-allowed resize-none"
                  placeholder="Describe what you need in detail. Include specifications, quantity, condition requirements, etc."
                />
              </div>

              {/* Region */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-navy-900 mb-1.5">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Preferred Region
                </label>
                <select
                  disabled
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 cursor-not-allowed"
                >
                  <option>Any location</option>
                </select>
              </div>

              {/* Budget */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-navy-900 mb-1.5">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Budget Range
                </label>
                <input
                  type="text"
                  disabled
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 cursor-not-allowed"
                  placeholder="e.g., $10,000 - $50,000 or Negotiable"
                />
              </div>

              {/* Urgency */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-navy-900 mb-1.5">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Urgency
                </label>
                <select
                  disabled
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 cursor-not-allowed"
                >
                  <option>Medium - Within 1-3 months</option>
                </select>
              </div>

              {/* Submit Button (disabled) */}
              <button
                type="button"
                disabled
                className="w-full py-3 bg-slate-300 text-slate-500 rounded-lg cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Post ISO Request
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-navy-900 mb-2">Request Created!</h1>
            <p className="text-slate-600 mb-4">
              Your ISO request has been posted. Sellers and contractors will be able to see it and respond.
            </p>
            <p className="text-sm text-slate-500">Redirecting to ISO listings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Link */}
        <Link
          href="/iso"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to ISO Requests
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Create ISO Request</h1>
          <p className="text-slate-600">
            Describe what you&apos;re looking for and let sellers come to you.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-navy-900 mb-1.5">
              What are you looking for? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              placeholder="e.g., GP38-2 Locomotive, 50lb Rail, Track Maintenance Contractor"
            />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-navy-900 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
            >
              <option value="">Select a category...</option>
              {ISO_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-navy-900 mb-1.5">
              <FileText className="w-4 h-4 inline mr-1" />
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={5}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
              placeholder="Describe what you need in detail. Include specifications, quantity, condition requirements, etc."
            />
          </div>

          {/* Region */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-navy-900 mb-1.5">
              <MapPin className="w-4 h-4 inline mr-1" />
              Preferred Region
            </label>
            <select
              value={formData.region}
              onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
            >
              <option value="">Any location</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* Budget */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-navy-900 mb-1.5">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Budget Range
            </label>
            <input
              type="text"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              placeholder="e.g., $10,000 - $50,000 or Negotiable"
            />
          </div>

          {/* Urgency */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-navy-900 mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1" />
              Urgency
            </label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
            >
              {URGENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Request...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Post ISO Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
