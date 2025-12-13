/**
 * THE RAIL EXCHANGE™ — Contact Seller Form
 * 
 * Inline inquiry form for listing detail pages.
 * Allows authenticated users to send inquiries directly.
 * 
 * GLOBAL UI ENFORCEMENT:
 * - CTA blocked states with helper text
 * - Inline, non-alarmist error feedback
 * - Skeleton loaders (no spinners)
 * 
 * BATCH 16 - CROSS-PAGE UX:
 * - Post-action confirmation with direction: "Message Sent!" + View in Messages → ✓
 * 
 * S-3 BUYER FRICTION REBALANCING:
 * - Guest preview mode (show seller info before login)
 * - Data minimization (quantity/timeline optional)
 * - Clear trust messaging
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { VerifiedSellerBadgeWithLabel } from '@/components/VerifiedSellerBadge';
import { getErrorMessage } from '@/lib/ui';

interface ContactSellerFormProps {
  listingId: string;
  listingTitle: string;
  sellerName: string;
  sellerLocation?: string;
  isPaypalRequest?: boolean;
  paypalEmail?: string;
  isVerifiedSeller?: boolean;
}

export default function ContactSellerForm({
  listingId,
  listingTitle,
  sellerName,
  sellerLocation,
  isPaypalRequest = false,
  paypalEmail,
  isVerifiedSeller = false,
}: ContactSellerFormProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [timeline, setTimeline] = useState<string>('unspecified');
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // S-3.5: Build callback URL to return to this listing with contact section focused
  const callbackUrl = encodeURIComponent(`${pathname}?contact=open`);

  // S-3.5: Auto-scroll to contact form when returning from login
  useEffect(() => {
    if (searchParams.get('contact') === 'open' && status === 'authenticated' && formRef.current) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [searchParams, status]);

  const timelineOptions = [
    { value: 'immediate', label: 'Within 2 weeks' },
    { value: 'short_term', label: '1-3 months' },
    { value: 'medium_term', label: '3-6 months' },
    { value: 'long_term', label: '6+ months' },
    { value: 'unspecified', label: 'Just browsing' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const subject = isPaypalRequest 
        ? `PayPal Invoice Request: ${listingTitle}`
        : `Inquiry about ${listingTitle}`;
      
      const fullMessage = isPaypalRequest
        ? `[PayPal Invoice Request]\nSeller PayPal: ${paypalEmail}\n\n${message.trim()}\n\n---\nNote: The Rail Exchange does not process payments. This is a request for the seller to send a PayPal invoice directly.`
        : message.trim();

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          subject,
          message: fullMessage,
          buyerIntent: {
            quantity: parseInt(quantity) || 1,
            timeline,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        // Use standardized error messages for common API errors
        if (res.status === 429) {
          throw new Error(getErrorMessage('rate_limited'));
        } else if (res.status === 403) {
          throw new Error(getErrorMessage('forbidden'));
        } else if (data.code === 'verification_required') {
          throw new Error(getErrorMessage('verification_required'));
        }
        throw new Error(data.error || 'Failed to send inquiry');
      }

      setSuccess(true);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not logged in
  if (status === 'loading') {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-surface-secondary rounded w-1/2 mb-4" />
          <div className="h-24 bg-surface-secondary rounded mb-4" />
          <div className="h-12 bg-surface-secondary rounded" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    // S-3.1: Guest Preview Mode - show seller info before requiring login
    return (
      <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
        <h3 className="heading-sm mb-4">Contact Seller</h3>
        
        {/* S-3.1: Seller Preview Info */}
        <div className="bg-surface-secondary rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-text-tertiary">{sellerName?.charAt(0) || 'S'}</span>
            </div>
            <div>
              <p className="font-medium text-navy-900">{sellerName}</p>
              {sellerLocation && (
                <p className="text-sm text-text-secondary">{sellerLocation}</p>
              )}
            </div>
          </div>
          {isVerifiedSeller && (
            <div className="flex items-center gap-2 mb-2">
              <VerifiedSellerBadgeWithLabel size="xs" />
            </div>
          )}
          {isVerifiedSeller && (
            <p className="text-[10px] text-text-tertiary leading-tight">
              Verification reflects document submission and review only.
            </p>
          )}
          <div className="flex items-center gap-2 mt-3 text-sm text-text-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Direct message available after sign-in</span>
          </div>
        </div>

        {/* S-3.1: Locked form preview with overlay */}
        <div className="relative">
          <div className="opacity-40 pointer-events-none">
            <textarea
              className="input-field resize-none w-full"
              rows={3}
              placeholder={`Hi, I'm interested in "${listingTitle}". Is it still available?`}
              disabled
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
            <p className="text-sm text-text-secondary text-center px-4">
              Create a free account to contact this seller.<br />
              <span className="text-text-tertiary">No payment required to send inquiries.</span>
            </p>
          </div>
        </div>

        {/* S-3.1: Dual CTAs */}
        <div className="space-y-3 mt-4">
          <Link 
            href={`/auth/login?callbackUrl=${callbackUrl}`} 
            className="btn-primary w-full py-3 text-center block"
          >
            Sign In to Contact
          </Link>
          <Link 
            href={`/auth/register?callbackUrl=${callbackUrl}`} 
            className="btn-secondary w-full py-3 text-center block"
          >
            Create Free Account
          </Link>
        </div>

        {/* S-3.4: Trust explainer */}
        <p className="text-[11px] text-text-tertiary text-center mt-4 leading-relaxed">
          You are contacting the seller directly.<br />
          The Rail Exchange does not participate in transactions or payments.
        </p>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-status-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="heading-md mb-2">Message Sent!</h3>
          <p className="text-body-md text-text-secondary mb-4">
            Your inquiry has been sent to {sellerName}. They&apos;ll respond to your message soon.
          </p>
          <Link
            href="/dashboard/messages"
            className="text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark"
          >
            View in Messages →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={formRef} className={isPaypalRequest ? "" : "bg-white rounded-2xl shadow-card border border-surface-border p-6"}>
      {!isPaypalRequest && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="heading-sm">Contact {sellerName}</h3>
          {isVerifiedSeller && (
            <VerifiedSellerBadgeWithLabel size="xs" />
          )}
        </div>
      )}
      
      {/* S-2.7 + S-3.4: Buyer expectation disclaimer */}
      <p className="text-[11px] text-text-tertiary mb-4 leading-relaxed">
        You are contacting the seller directly. The Rail Exchange does not participate in transactions or payments.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-status-error/10 border border-status-error/30 rounded-lg text-status-error text-body-sm">
            {error}
          </div>
        )}

        {/* Message field first - S-3.3 prioritizes the message */}
        <div>
          <label htmlFor="inquiry-message" className="block text-body-sm font-medium text-navy-900 mb-2">
            {isPaypalRequest ? 'Invoice Request Message' : 'Your Message'}
          </label>
          <textarea
            id="inquiry-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={isPaypalRequest ? 3 : 4}
            className="input-field resize-none"
            placeholder={isPaypalRequest 
              ? `Hi, I'd like to purchase "${listingTitle}". Please send a PayPal invoice to my email.`
              : `Hi, I'm interested in "${listingTitle}". Is it still available?`}
            required
          />
          {/* S-3.3: Clear data sharing message */}
          <p className="text-caption text-text-tertiary mt-1">
            {isPaypalRequest 
              ? 'The seller will send you a PayPal invoice directly.'
              : 'Only your message and contact info are shared with the seller.'}
          </p>
        </div>

        {/* S-3.3: Buyer Intent Fields - Optional & Collapsed */}
        {!isPaypalRequest && (
          <div className="border-t border-surface-border pt-3">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-navy-900 transition-colors"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Add details (optional)
            </button>
            
            {showDetails && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label htmlFor="inquiry-quantity" className="block text-body-sm font-medium text-navy-900 mb-1.5">
                    Quantity Needed
                  </label>
                  <input
                    id="inquiry-quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="input-field text-sm py-2"
                  />
                </div>
                <div>
                  <label htmlFor="inquiry-timeline" className="block text-body-sm font-medium text-navy-900 mb-1.5">
                    Purchase Timeline
                  </label>
                  <select
                    id="inquiry-timeline"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="input-field text-sm py-2"
                  >
                    {timelineOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className={`w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl transition-colors ${
            isPaypalRequest 
              ? 'bg-[#003087] hover:bg-[#002066] text-white' 
              : 'btn-primary'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              {/* Skeleton pulse loader instead of spinner */}
              <span className="w-5 h-5 bg-current opacity-30 rounded-full animate-pulse" />
              Sending...
            </span>
          ) : isPaypalRequest ? (
            <>
              <span className="inline-flex items-center gap-2">
                <span className="font-bold">PP</span>
                Request PayPal Invoice
              </span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Inquiry
            </>
          )}
        </button>

        {!isPaypalRequest && (
          <p className="text-caption text-text-tertiary text-center">
            Signed in as {session?.user?.email}
          </p>
        )}
      </form>
    </div>
  );
}
