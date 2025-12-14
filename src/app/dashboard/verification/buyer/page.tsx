/**
 * THE RAIL EXCHANGE™ — Buyer Verification Page
 * 
 * /dashboard/verification/buyer
 * 
 * $1 lifetime verification for buyers to:
 * - Confirm they are a real person (spam prevention)
 * - Contact sellers
 * - Submit inquiries
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ BUYER VERIFICATION — $1 LIFETIME                                    │
 * │                                                                      │
 * │ Purpose: Human/spam prevention ONLY                                 │
 * │ Verification ≠ trust, approval, or endorsement                      │
 * │ Payment happens ONLY after document submission                      │
 * └─────────────────────────────────────────────────────────────────────┘
 */

'use client';

import { useState, useEffect } from 'react';
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
  Info,
  ArrowRight,
  CreditCard,
  ShoppingCart,
} from 'lucide-react';
import { BUYER_VERIFICATION } from '@/config/pricing';

interface VerificationStatus {
  isVerifiedBuyer: boolean;
  buyerVerificationStatus: 'none' | 'pending' | 'active' | 'rejected';
  buyerVerifiedAt?: string;
}

export default function BuyerVerificationPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check for success/cancel from Stripe checkout
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccess('Payment successful! Your Buyer Verification is now active.');
      fetchStatus();
    }
    if (searchParams.get('canceled') === 'true') {
      setError('Payment was canceled. Complete payment to verify your account.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (sessionStatus === 'authenticated') {
      fetchStatus();
    }
  }, [sessionStatus, router]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/verification/buyer/status');
      if (res.ok) {
        const data = await res.json();
        setVerificationStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/verification/buyer/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start verification');
      }

      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  };

  if (loading || sessionStatus === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isVerified = verificationStatus?.isVerifiedBuyer === true;

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/dashboard/verification" 
          className="text-sm text-slate-500 hover:text-navy-900 mb-4 inline-flex items-center gap-1"
        >
          ← Back to Verification
        </Link>
        <h1 className="text-2xl font-bold text-navy-900 mb-2">
          Buyer Verification
        </h1>
        <p className="text-slate-500">
          Verify your account to contact sellers and submit inquiries
        </p>
      </div>

      {/* AI Disclosure Banner - MANDATORY */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
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

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Verified State */}
      {isVerified ? (
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">You&apos;re Verified!</h2>
          <p className="text-white/80 mb-6">
            Your Buyer Verification is active. You can now contact sellers and submit inquiries.
          </p>
          {verificationStatus?.buyerVerifiedAt && (
            <p className="text-sm text-white/60">
              Verified on {new Date(verificationStatus.buyerVerifiedAt).toLocaleDateString()}
            </p>
          )}
          <div className="mt-6">
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-xl font-medium hover:bg-white/90 transition-colors"
            >
              Browse Listings
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Verification Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Card Header */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy-900">Buyer Verification</h2>
                  <p className="text-slate-500">One-time verification for buyers</p>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-navy-900">$1</span>
                <span className="text-slate-500">one-time • lifetime access</span>
              </div>
            </div>

            {/* Features */}
            <div className="p-6">
              <h3 className="font-semibold text-navy-900 mb-4">What&apos;s included:</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Verify you are a real person</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Contact sellers directly</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Submit inquiries on any listing</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">&quot;Verified Buyer&quot; badge on profile</span>
                </li>
              </ul>

              {/* What it's NOT */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-slate-500" />
                  Verification does NOT:
                </h4>
                <ul className="space-y-1 text-sm text-slate-500">
                  <li>• Verify purchasing authority or financial capability</li>
                  <li>• Guarantee transaction completion</li>
                  <li>• Imply platform endorsement or approval</li>
                  <li>• Create any obligation for sellers to respond</li>
                </ul>
              </div>

              {/* CTA */}
              <button
                onClick={handleStartVerification}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Verify for $1
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Process Info */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <h3 className="font-medium text-navy-900 mb-3">How it works:</h3>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-white rounded-full text-xs font-semibold text-navy-900 border border-slate-200">1</span>
                <span>Click &quot;Verify for $1&quot; to proceed to secure payment</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-white rounded-full text-xs font-semibold text-navy-900 border border-slate-200">2</span>
                <span>Complete the $1 payment via Stripe</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-white rounded-full text-xs font-semibold text-navy-900 border border-slate-200">3</span>
                <span>Your verification is activated instantly</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-white rounded-full text-xs font-semibold text-navy-900 border border-slate-200">4</span>
                <span>Contact sellers and browse with your verified status</span>
              </li>
            </ol>
          </div>
        </>
      )}

      {/* Compliance Footer */}
      <div className="mt-8 p-4 bg-slate-50 rounded-xl">
        <p className="text-xs text-slate-500 text-center">
          <strong>Important:</strong> Buyer Verification confirms you are a real person for spam prevention. 
          It does not verify purchasing authority, financial capability, or create any guarantee of transactions. 
          The Rail Exchange does not participate in transactions between buyers and sellers.
        </p>
      </div>
    </div>
  );
}
