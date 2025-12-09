/**
 * THE RAIL EXCHANGE™ — Contractor Verification Payment Page
 * 
 * Payment gate for approved contractor verification.
 * Redirects to Stripe Checkout for $100/mo subscription.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  BadgeCheck, 
  Check, 
  CreditCard, 
  Loader2, 
  Shield,
  ArrowLeft,
  TrendingUp,
  Star,
  Users,
  Clock,
  XCircle
} from 'lucide-react';

export default function VerificationPaymentPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [error, setError] = useState('');

  // Check verification status
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/contractors/verify');
        if (res.ok) {
          const data = await res.json();
          setVerificationStatus(data.verificationStatus);
          
          // Redirect if not approved
          if (data.verificationStatus !== 'ai_approved' && data.verificationStatus !== 'approved') {
            if (data.verificationStatus === 'verified') {
              router.push('/dashboard/contractor');
            } else {
              router.push('/dashboard/contractor/verify');
            }
          }
        }
      } catch (err) {
        console.error('Failed to check status:', err);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      checkStatus();
    }
  }, [session, router]);

  // Redirect if not authenticated
  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/login?callbackUrl=/dashboard/contractor/verify/payment');
    return null;
  }

  // Handle checkout
  const handleCheckout = async () => {
    setProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'verified',
          type: 'contractor',
          billingPeriod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not approved - shouldn't happen but handle it
  if (verificationStatus !== 'ai_approved' && verificationStatus !== 'approved') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-text-primary mb-2">Not Available</h1>
        <p className="text-text-secondary mb-4">
          Verification payment is only available after your documents have been approved.
        </p>
        <Link href="/dashboard/contractor/verify" className="btn-primary">
          Start Verification
        </Link>
      </div>
    );
  }

  const monthlyPrice = 100;
  const yearlyPrice = 1200;
  const yearlySavings = (monthlyPrice * 12) - yearlyPrice;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Link */}
      <Link 
        href="/dashboard/contractor/verify"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to verification
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <BadgeCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Complete Your Verification
        </h1>
        <p className="text-text-secondary">
          Your documents have been approved! Subscribe to activate your Verified badge.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-1 p-1 bg-surface-secondary rounded-full">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-surface-primary text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              billingPeriod === 'yearly'
                ? 'bg-surface-primary text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Yearly
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
              Save ${yearlySavings}
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border border-green-500/20 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Verified Contractor</h2>
            <p className="text-sm text-text-secondary">Stand out from the competition</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-text-primary">
              ${billingPeriod === 'monthly' ? monthlyPrice : yearlyPrice}
            </div>
            <div className="text-sm text-text-secondary">
              {billingPeriod === 'monthly' ? '/month' : '/year'}
            </div>
          </div>
        </div>

        {billingPeriod === 'yearly' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <Check className="w-4 h-4" />
              Save ${yearlySavings}/year with annual billing (2 months free!)
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {[
            { icon: BadgeCheck, text: 'Verified badge on your profile' },
            { icon: TrendingUp, text: 'Priority search placement' },
            { icon: Star, text: 'Featured in directory' },
            { icon: Users, text: 'Increased buyer trust' },
            { icon: Shield, text: 'Document verification seal' },
            { icon: Clock, text: 'Analytics dashboard access' },
          ].map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <benefit.icon className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-sm text-text-secondary">{benefit.text}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={processing}
          className="w-full py-4 px-6 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Complete Payment - ${billingPeriod === 'monthly' ? monthlyPrice : yearlyPrice}{billingPeriod === 'monthly' ? '/mo' : '/yr'}
            </>
          )}
        </button>

        <p className="text-xs text-text-tertiary text-center mt-4">
          Secure payment powered by Stripe. Cancel anytime.
        </p>
      </div>

      {/* FAQ */}
      <div className="bg-surface-secondary rounded-xl p-6">
        <h3 className="font-semibold text-text-primary mb-4">Common Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-1">When does my badge activate?</h4>
            <p className="text-sm text-text-secondary">
              Your Verified badge activates immediately after successful payment.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-1">Can I cancel anytime?</h4>
            <p className="text-sm text-text-secondary">
              Yes, you can cancel your subscription at any time. Your badge stays active until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-1">Do I need to re-verify?</h4>
            <p className="text-sm text-text-secondary">
              No re-verification needed as long as your subscription is active. We may request updated documents if yours expire.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
