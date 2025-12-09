/**
 * THE RAIL EXCHANGE™ — Billing Portal Button
 * 
 * Client component to open Stripe Billing Portal.
 */

'use client';

import { useState } from 'react';

interface BillingPortalButtonProps {
  className?: string;
}

export default function BillingPortalButton({ className = '' }: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    
    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Billing portal error:', error);
      alert(error instanceof Error ? error.message : 'Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`btn-primary ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Opening...
        </span>
      ) : (
        'Manage Billing'
      )}
    </button>
  );
}
