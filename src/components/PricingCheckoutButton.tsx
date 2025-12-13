/**
 * THE RAIL EXCHANGE™ — Pricing Checkout Button
 * 
 * Client component for initiating Stripe checkout for subscriptions.
 * 
 * GLOBAL UI ENFORCEMENT:
 * - CTA blocked states with helper text
 * - Inline, non-alarmist error feedback
 * - Skeleton loaders (no spinners)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SellerTier, ContractorTier } from '@/config/pricing';
import { getErrorMessage } from '@/lib/ui';

interface PricingCheckoutButtonProps {
  tier: SellerTier | ContractorTier;
  type: 'seller' | 'contractor';
  billingPeriod?: 'monthly' | 'yearly';
  promoCode?: string;
  children: React.ReactNode;
  className?: string;
}

export default function PricingCheckoutButton({
  tier,
  type,
  billingPeriod = 'monthly',
  promoCode,
  children,
  className = '',
}: PricingCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          type,
          billingPeriod,
          promoCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use standardized error messages for common API errors
        if (response.status === 429) {
          throw new Error(getErrorMessage('rate_limited'));
        } else if (response.status === 403) {
          throw new Error(getErrorMessage('forbidden'));
        } else if (data.code === 'verification_required') {
          throw new Error(getErrorMessage('verification_required'));
        }
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // If this was a free tier, just reload
      if (data.success && data.message === 'Free tier activated') {
        router.refresh();
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            {/* Skeleton pulse loader instead of spinner */}
            <span className="w-4 h-4 bg-current opacity-30 rounded-full animate-pulse" />
            Processing...
          </span>
        ) : (
          children
        )}
      </button>
      {/* Inline error feedback - non-alarmist copy */}
      {error && (
        <p className="mt-2 text-sm text-status-error text-center">{error}</p>
      )}
    </div>
  );
}
