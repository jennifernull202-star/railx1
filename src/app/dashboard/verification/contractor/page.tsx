/**
 * THE RAIL EXCHANGE™ — Contractor Verification Dashboard
 * 
 * /dashboard/verification/contractor
 * 
 * Allows contractors to:
 * - View verification status
 * - Submit for verification (AI + Admin review)
 * - Complete subscription payment after approval
 * - Manage verified contractor badge
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ ARCHITECTURAL NOTE: Does NOT consume /api/verification              │
 * │                                                                      │
 * │ This page uses /api/contractors/verification/status because:        │
 * │ - Auth-gated access to contractor's own verification                │
 * │ - Profile-specific verification documents                           │
 * │ - Badge purchase and subscription status                            │
 * │ - Submission and payment workflow data                              │
 * │                                                                      │
 * │ The public /api/verification endpoint returns badge status only.    │
 * │ It cannot serve management UI needs. This separation is correct.    │
 * └─────────────────────────────────────────────────────────────────────┘
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  CreditCard,
  Info,
  RefreshCw,
  Wrench,
  Building2,
  Star,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContractorProfile {
  _id: string;
  companyName: string;
  verificationStatus: string;
  verifiedBadgePurchased: boolean;
  verifiedAt?: string;
  verifiedBadgeExpiresAt?: string;
}

interface UserStatus {
  isVerifiedContractor: boolean;
  contractorVerificationStatus?: string;
  contractorSubscriptionId?: string;
}

export default function ContractorVerificationPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/contractors/verification/status');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setUserStatus(data.userStatus);
      }
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for success/cancel from Stripe checkout
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccess('Payment successful! Your Verified Contractor badge is now active.');
      fetchStatus();
    }
    if (searchParams.get('canceled') === 'true') {
      setError('Payment was canceled. Complete payment to activate your badge.');
    }
  }, [searchParams, fetchStatus]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (sessionStatus === 'authenticated') {
      fetchStatus();
    }
  }, [sessionStatus, router, fetchStatus]);

  const handleSubmitVerification = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/contractors/verification/submit', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit for verification');
      }

      setSuccess('Verification request submitted! We will review your profile.');
      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartSubscription = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contractor',
          tier: 'verified',
          successUrl: `${window.location.origin}/dashboard/verification/contractor?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/verification/contractor?canceled=true`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // No profile - show setup prompt
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Create Your Profile First</h2>
          <p className="text-slate-500 mb-6">
            Set up your contractor profile before applying for the Verified Contractor badge.
          </p>
          <Link 
            href="/dashboard/contractor/profile" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Profile
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = profile.verificationStatus === 'verified' && profile.verifiedBadgePurchased;
  const isPending = profile.verificationStatus === 'pending';
  const isApproved = profile.verificationStatus === 'approved' && !profile.verifiedBadgePurchased;
  const isRejected = profile.verificationStatus === 'rejected';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Verified Contractor Badge</h1>
        <p className="text-slate-500">Stand out with trust and credibility</p>
      </div>

      {/* AI Disclosure Notice - MANDATORY */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 mb-1">AI-Assisted Verification</p>
            <p className="text-amber-700">
              Verification is assisted by automated (AI) analysis and human review. 
              Verification confirms document submission only and does not guarantee 
              performance, authority, compliance, or transaction outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isVerified ? 'bg-green-100' : 
                isPending ? 'bg-yellow-100' : 
                isApproved ? 'bg-blue-100' :
                'bg-slate-100'
              }`}>
                {isVerified ? (
                  <Shield className="w-6 h-6 text-green-600" />
                ) : isPending ? (
                  <Clock className="w-6 h-6 text-yellow-600" />
                ) : isApproved ? (
                  <CreditCard className="w-6 h-6 text-blue-600" />
                ) : (
                  <Star className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-navy-900">{profile.companyName}</h2>
                <p className={`text-sm ${
                  isVerified ? 'text-green-600' : 
                  isPending ? 'text-yellow-600' : 
                  isApproved ? 'text-blue-600' :
                  isRejected ? 'text-red-600' :
                  'text-slate-500'
                }`}>
                  {isVerified ? 'Verified Contractor' :
                   isPending ? 'Verification Pending' :
                   isApproved ? 'Approved - Complete Payment' :
                   isRejected ? 'Verification Rejected' :
                   'Not Verified'}
                </p>
              </div>
            </div>
            {isVerified && profile.verifiedBadgeExpiresAt && (
              <span className="text-sm text-slate-500">
                Expires: {new Date(profile.verifiedBadgeExpiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Already Verified */}
          {isVerified && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-4 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Your Verified Contractor badge is active!</span>
              </div>
              <p className="text-slate-600">
                Your badge is displayed on your profile, helping you stand out to potential clients.
              </p>
              <div className="flex gap-3">
                <Link
                  href={`/contractors/${profile._id}`}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                >
                  View Public Profile
                </Link>
                <button
                  onClick={fetchStatus}
                  className="px-4 py-2 text-slate-600 hover:text-slate-700 transition-colors text-sm flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          )}

          {/* Pending Review */}
          {isPending && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 p-4 rounded-lg">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Your verification is under review</span>
              </div>
              <p className="text-slate-600">
                Our team is reviewing your profile. This usually takes 1-2 business days.
                We&apos;ll notify you once a decision is made.
              </p>
            </div>
          )}

          {/* Approved - Needs Payment */}
          {isApproved && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-4 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Congratulations! Your verification is approved.</span>
              </div>
              <p className="text-slate-600">
                Complete your subscription to activate the Verified Contractor badge on your profile.
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-navy-900">Verified Contractor Badge</span>
                  <span className="text-lg font-bold text-navy-900">$150/year</span>
                </div>
                <ul className="text-sm text-slate-600 space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Verified badge on your profile
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Priority placement in search
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Trust indicator for clients
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Full analytics dashboard included
                  </li>
                </ul>
                <Button
                  onClick={handleStartSubscription}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Activate Badge - $150/year
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Rejected */}
          {isRejected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-700 bg-red-50 p-4 rounded-lg">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Verification was not approved</span>
              </div>
              <p className="text-slate-600">
                Please update your profile and try again, or contact support for assistance.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/dashboard/contractor/profile"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Update Profile
                </Link>
                <Link
                  href="/contact"
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          )}

          {/* Not Started */}
          {!isVerified && !isPending && !isApproved && !isRejected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-4 rounded-lg">
                <Info className="w-5 h-5" />
                <span>Apply for document review and verification badge</span>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-navy-900">Benefits of document review:</h3>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    Verification badge displayed on your profile
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-green-500" />
                    Priority placement in contractor search
                  </li>
                  <li className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-green-500" />
                    Enhanced visibility to potential clients
                  </li>
                </ul>
              </div>
              <Button
                onClick={handleSubmitVerification}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Apply for Verification
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-500 text-center">
                $150/year after approval. Analytics included. Cancel anytime.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-navy-900 mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-navy-900 text-sm">What is the Verified Contractor badge?</h4>
            <p className="text-sm text-slate-600 mt-1">
              The Verified Contractor badge shows clients that your business has been reviewed and approved by The Rail Exchange team.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-navy-900 text-sm">How long does verification take?</h4>
            <p className="text-sm text-slate-600 mt-1">
              Most verifications are completed within 1-2 business days.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-navy-900 text-sm">Can I cancel my subscription?</h4>
            <p className="text-sm text-slate-600 mt-1">
              Yes, you can cancel anytime from your billing settings. Your badge will remain active until the end of your billing period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
