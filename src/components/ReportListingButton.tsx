/**
 * THE RAIL EXCHANGE™ — Report Listing Button
 * 
 * BATCH E-3: Abuse & Misrepresentation Controls
 * 
 * Allows verified users to report suspicious listings.
 * Requirements:
 * - Visible on public listing pages (below gallery, above contact)
 * - Requires signed-in, email-verified user
 * - Reason dropdown + optional text (max 500 chars)
 * - One report per user per listing
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * PERFORMANCE OPTIMIZATION:
 * Check session status via API instead of requiring SessionProvider.
 */
function useSessionStatus() {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.ok ? res.json() : null)
      .then(data => setStatus(data?.user ? 'authenticated' : 'unauthenticated'))
      .catch(() => setStatus('unauthenticated'));
  }, []);
  
  return status;
}

interface ReportListingButtonProps {
  listingId: string;
  listingTitle: string;
  className?: string;
}

// S-14.1: Simplified report reasons (4 options for UI clarity)
const REPORT_REASONS = [
  'scam',
  'misleading_price',
  'sold_item',
  'other',
] as const;

type ReportReason = typeof REPORT_REASONS[number];

// Reason labels for UI - S-14.1: Neutral, non-accusatory labels
const REASON_LABELS: Record<ReportReason, string> = {
  scam: 'Suspected scam',
  misleading_price: 'Misleading information',
  sold_item: 'Item not actually available',
  other: 'Other',
};

export function ReportListingButton({ listingId, listingTitle, className = '' }: ReportListingButtonProps) {
  const status = useSessionStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason for your report.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/listings/${listingId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          description: description.trim() || 'No additional details provided.',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases with user-friendly messages
        if (response.status === 401) {
          setError('Please sign in to report this listing.');
        } else if (response.status === 403) {
          setError('This action requires a verified email address.');
        } else if (response.status === 409) {
          setError('You have already reported this listing.');
          setHasReported(true);
        } else if (response.status === 429) {
          setError('Too many requests. Please try again later.');
        } else {
          setError(data.error || 'Unable to submit report. Please try again.');
        }
        return;
      }

      setSuccess(true);
      setHasReported(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpen = () => {
    if (status === 'unauthenticated') {
      setError('Please sign in to report this listing.');
      return;
    }
    setIsOpen(true);
    setError('');
    setReason('');
    setDescription('');
  };

  // Don't show if already reported
  if (hasReported && !isOpen) {
    return (
      <div className={`text-sm text-text-tertiary flex items-center gap-1.5 ${className}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Report submitted
      </div>
    );
  }

  return (
    <>
      {/* Report Button */}
      <button
        onClick={handleOpen}
        className={`text-sm text-text-tertiary hover:text-red-600 flex items-center gap-1.5 transition-colors ${className}`}
        title="Report this listing"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      {/* BATCH E-5: Visible Reporting Transparency Disclosure */}
      {/* S-10.1: Report Listing Consequence Signaling */}
      <p className="text-[10px] text-text-tertiary mt-1">
        Reports are reviewed by our team. False or abusive reports may result in account restrictions.
      </p>
    </button>

      {/* Error Toast (when not signed in) */}
      {error && !isOpen && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => setError('')}
            className="absolute top-1 right-2 text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Report Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-navy-900">Report Listing</h2>
                  <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                    {listingTitle}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-text-tertiary hover:text-navy-900 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {/* S-14.1: Neutral confirmation message */}
                  <p className="text-navy-900 font-medium">Thank you</p>
                  <p className="text-sm text-text-secondary mt-1">
                    This report has been submitted for review.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Reason Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                      Why are you reporting this listing? <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value as ReportReason)}
                      className="w-full px-3 py-2 border border-surface-border rounded-lg focus:ring-2 focus:ring-rail-orange focus:border-rail-orange text-sm"
                      required
                    >
                      <option value="">Select a reason...</option>
                      {REPORT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {REASON_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                      Additional details <span className="text-text-tertiary">(optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                      placeholder="Please provide any additional context that would help us investigate..."
                      rows={4}
                      className="w-full px-3 py-2 border border-surface-border rounded-lg focus:ring-2 focus:ring-rail-orange focus:border-rail-orange text-sm resize-none"
                    />
                    <p className="text-xs text-text-tertiary mt-1 text-right">
                      {description.length}/500
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* S-6.1: Reporting Transparency Disclaimer */}
                  <p className="text-xs text-text-tertiary mb-4">
                    Reports are reviewed by our team.
                    False or abusive reports may result in account restrictions.
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 px-4 py-2 border border-surface-border rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !reason}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ReportListingButton;
