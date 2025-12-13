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
 * 
 * S-15: Rate-limit feedback and CAPTCHA after repeated submissions
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { VerifiedSellerBadgeWithLabel } from '@/components/VerifiedSellerBadge';
import { getErrorMessage } from '@/lib/ui';
import { useRateLimitFeedback } from '@/lib/hooks/useRateLimitFeedback';
import { useCaptchaThreshold, InvisibleCaptcha, CAPTCHA_REASONS } from '@/components/InvisibleCaptcha';

/**
 * PERFORMANCE OPTIMIZATION:
 * useOptionalSession - Fetch session via API to avoid requiring SessionProvider.
 */
function useOptionalSession() {
  const [session, setSession] = useState<{ user?: { email?: string } } | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setSession(data);
          setStatus('authenticated');
        } else {
          setSession(null);
          setStatus('unauthenticated');
        }
      })
      .catch(() => {
        setSession(null);
        setStatus('unauthenticated');
      });
  }, []);

  return { data: session, status };
}

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
  const { data: session, status } = useOptionalSession();
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
  // S-12.7: Show welcome message for newly registered users
  const [showWelcome, setShowWelcome] = useState(searchParams.get('registered') === 'true');
  
  // S-15.1: Rate limit feedback with countdown
  const { isRateLimited, message: rateLimitMessage, checkAndHandleRateLimit, clearRateLimit } = useRateLimitFeedback();
  
  // S-15.3: CAPTCHA after repeated submissions (threshold = 3)
  const { showChallenge: showCaptcha, incrementAttempts: incrementCaptchaAttempts, resetAttempts: resetCaptchaAttempts } = useCaptchaThreshold(`inquiry_${listingId}`, 3);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // UX Item #3: Log success shown event once
  useEffect(() => {
    if (success) {
      console.log('[EVENT] contact_seller_success_shown');
    }
  }, [success]);

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
  
  // S-12.7: Auto-dismiss welcome message after 5 seconds
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

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

    // S-15.3: Check if CAPTCHA is required but not completed
    if (showCaptcha && !captchaToken) {
      setError('Please complete the verification challenge to continue.');
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
          ...(captchaToken && { captchaToken }),
        }),
      });

      if (!res.ok) {
        // S-15.1: Check for rate limiting with countdown feedback
        if (res.status === 429) {
          checkAndHandleRateLimit(res);
          incrementCaptchaAttempts(); // S-15.3: Track for CAPTCHA threshold
          return;
        }
        
        const data = await res.json();
        if (res.status === 403) {
          throw new Error(getErrorMessage('forbidden'));
        } else if (data.code === 'verification_required') {
          throw new Error(getErrorMessage('verification_required'));
        }
        throw new Error(data.error || 'Failed to send inquiry');
      }

      // Reset CAPTCHA attempts on success
      resetCaptchaAttempts();
      setCaptchaToken(null);
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
    // S-12.1, S-12.2, S-12.3: Enhanced contact gate clarity with preview
    return (
      <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
        <h3 className="heading-sm mb-4">Contact Seller</h3>
        
        {/* S-12.3: Seller Identity Preview (Non-Sensitive) */}
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
          {/* S-12.3: Contact details protected notice */}
          <p className="text-xs text-text-tertiary mt-3 pt-3 border-t border-surface-border">
            Contact details are shared after account creation.
          </p>
        </div>
        
        {/* S-12.2: Contact Preview (Guest-Safe) */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-navy-900 mb-2">What happens next:</p>
          <ul className="text-sm text-text-secondary space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">1.</span>
              <span>You send a message to the seller</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">2.</span>
              <span>The seller replies directly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">3.</span>
              <span>You continue the conversation privately</span>
            </li>
          </ul>
          <p className="text-xs text-text-tertiary mt-3 pt-2 border-t border-blue-100">
            No payment is required to contact a seller.
          </p>
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
            {/* S-12.1: Contact Gate Clarity */}
            <p className="text-sm text-text-secondary text-center px-4">
              Create a free account to contact the seller.<br />
              <span className="text-text-tertiary">This helps prevent spam and protects both buyers and sellers.</span>
            </p>
          </div>
        </div>

        {/* S-12.1: Updated CTAs with clear buyer-first messaging */}
        <div className="space-y-3 mt-4">
          <Link 
            href={`/auth/register?callbackUrl=${callbackUrl}`} 
            className="btn-primary w-full py-3 text-center block"
          >
            Create Free Account to Contact Seller
          </Link>
          <Link 
            href={`/auth/login?callbackUrl=${callbackUrl}`} 
            className="btn-secondary w-full py-3 text-center block"
          >
            Already have an account? Sign In
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

  // Success state - S-4.8: Clear UI confirmation for leads
  // UX Item #3: Post-success navigation enhancement
  if (success) {
    // Log event: contact_seller_success_shown
    // Note: This logs on every render of success state, but since success state
    // is typically shown once per submission, this is acceptable
    
    return (
      <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-status-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="heading-md mb-2">Message Sent!</h3>
          {/* S-11.2: Post-inquiry confirmation — next steps clarity */}
          <p className="text-body-md text-text-secondary mb-2">
            Your inquiry has been sent to the seller.<br />
            You'll be notified if they respond.
          </p>
          {/* S-6.4: Post-inquiry confirmation clarity */}
          <p className="text-xs text-text-tertiary mb-4">
            The Rail Exchange does not control seller response times.
          </p>
          {/* S-4.8: Clear indication of where replies arrive */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-left">
            <p className="text-sm text-blue-800">
              <strong>📬 Where to find replies:</strong><br/>
              Check your <Link href="/dashboard/messages" className="font-semibold underline hover:text-blue-600">Messages inbox</Link> or your email for seller responses.
            </p>
          </div>
          {/* S-10.7: Non-Responsive Seller Expectation Reset */}
          <p className="text-xs text-text-tertiary mb-4">
            Sellers manage their own responses. Repeated non-responsive behavior may affect listing visibility.
          </p>
          {/* UX Item #3: Post-success CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/messages"
              onClick={() => {
                // Log event: contact_seller_view_messages_clicked
                console.log('[EVENT] contact_seller_view_messages_clicked');
              }}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              View My Messages
            </Link>
            <Link
              href="/listings"
              onClick={() => {
                // Log event: contact_seller_browse_listings_clicked
                console.log('[EVENT] contact_seller_browse_listings_clicked');
              }}
              className="btn-outline inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse More Listings
            </Link>
          </div>
          {/* S-7.5: Report abuse education link */}
          <p className="text-[10px] text-text-tertiary mt-4">
            <Link href="/terms#reporting" className="underline hover:text-text-secondary">
              Report abuse or misuse
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={formRef} className={isPaypalRequest ? "" : "bg-white rounded-2xl shadow-card border border-surface-border p-6"}>
      {/* S-12.7: Post-Signup Welcome Message */}
      {showWelcome && (
        <div className="bg-status-success/10 border border-status-success/20 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-status-success">
            ✓ Your account is ready. You can now contact sellers directly.
          </p>
          <button 
            onClick={() => setShowWelcome(false)}
            className="text-status-success hover:text-status-success/80 ml-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {!isPaypalRequest && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="heading-sm">Contact {sellerName}</h3>
          {isVerifiedSeller && (
            <VerifiedSellerBadgeWithLabel size="xs" />
          )}
        </div>
      )}
      
      {/* S-2.7 + S-3.4: Buyer expectation disclaimer */}
      <p className="text-[11px] text-text-tertiary mb-3 leading-relaxed">
        You are contacting the seller directly. The Rail Exchange does not participate in transactions or payments.
      </p>
      
      {/* S-7.1: Spam deterrence notice */}
      <p className="text-[10px] text-text-tertiary mb-2 leading-relaxed">
        Messages are logged and reviewed for abuse. Promotional or irrelevant inquiries may result in account restrictions.
      </p>
      
      {/* S-7.4: Account age friction (passive, unconditional) */}
      <p className="text-[10px] text-amber-600/80 mb-4 leading-relaxed">
        New accounts may experience limited messaging while activity is reviewed.
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
          {/* S-7.2: Link visibility warning */}
          {!isPaypalRequest && (
            <p className="text-[10px] text-text-tertiary mt-1 italic">
              Including external links or promotional content may reduce response rates.
            </p>
          )}
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

        {/* S-15.1: Rate limit feedback with countdown */}
        {isRateLimited && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            {rateLimitMessage}
          </div>
        )}

        {/* S-15.3: CAPTCHA challenge after repeated attempts */}
        {showCaptcha && (
          <InvisibleCaptcha
            onVerify={(token) => setCaptchaToken(token)}
            showChallenge={showCaptcha}
            challengeReason={CAPTCHA_REASONS.REPEATED_SUBMISSIONS}
          />
        )}

        <button
          type="submit"
          disabled={isSubmitting || !message.trim() || isRateLimited || (showCaptcha && !captchaToken)}
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
        
        {/* S-7.3: Intent signaling helper text */}
        {!isPaypalRequest && (
          <p className="text-[10px] text-text-tertiary text-center">
            Send only serious, relevant inquiries.
          </p>
        )}
        
        {/* S-10.6: Inquiry Form Spam Deterrence */}
        <p className="text-[10px] text-text-tertiary text-center">
          Repeated unsolicited or promotional inquiries may result in account limitations.
        </p>

        {!isPaypalRequest && (
          <p className="text-caption text-text-tertiary text-center">
            Signed in as {session?.user?.email}
          </p>
        )}
      </form>
    </div>
  );
}
