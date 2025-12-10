/**
 * THE RAIL EXCHANGE™ — Pricing Checkout Button
 * 
 * Client component for initiating Stripe checkout for subscriptions.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SellerTier, ContractorTier } from '@/config/pricing';

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
  const router = useRouter();

  async function handleCheckout() {
    setLoading(true);
    
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
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
