/**
 * THE RAIL EXCHANGE™ — Billing Portal Button
 * 
 * Client component to open Stripe Billing Portal.
 * 
 * GLOBAL UI ENFORCEMENT:
 * - Inline, non-alarmist error feedback
 * - Skeleton loaders (no spinners)
 */

'use client';

import { useState } from 'react';
import { getErrorMessage } from '@/lib/ui';

interface BillingPortalButtonProps {
  className?: string;
}

export default function BillingPortalButton({ className = '' }: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        // Use standardized error messages for common API errors
        if (response.status === 429) {
          throw new Error(getErrorMessage('rate_limited'));
        } else if (response.status === 403) {
          throw new Error(getErrorMessage('forbidden'));
        }
        throw new Error(data.error || 'Failed to open billing portal');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Billing portal error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`btn-primary ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            {/* Skeleton pulse loader instead of spinner */}
            <span className="w-4 h-4 bg-current opacity-30 rounded-full animate-pulse" />
            Opening...
          </span>
        ) : (
          'Manage Billing'
        )}
      </button>
      {/* Inline error feedback - non-alarmist copy */}
      {error && (
        <p className="mt-2 text-sm text-status-error">{error}</p>
      )}
    </div>
  );
}
