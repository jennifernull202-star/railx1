/**
 * THE RAIL EXCHANGE™ — Contact Seller Form
 * 
 * Inline inquiry form for listing detail pages.
 * Allows authenticated users to send inquiries directly.
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ContactSellerFormProps {
  listingId: string;
  listingTitle: string;
  sellerName: string;
}

export default function ContactSellerForm({
  listingId,
  listingTitle,
  sellerName,
}: ContactSellerFormProps) {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          subject: `Inquiry about ${listingTitle}`,
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
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
    return (
      <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
        <h3 className="heading-sm mb-4">Contact Seller</h3>
        <p className="text-body-md text-text-secondary mb-4">
          Sign in to send an inquiry to {sellerName}.
        </p>
        <div className="space-y-3">
          <Link href="/auth/login" className="btn-primary w-full py-3">
            Sign In to Contact
          </Link>
          <p className="text-center text-caption text-text-tertiary">
            Create an account to message sellers directly
          </p>
        </div>
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
    <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
      <h3 className="heading-sm mb-4">Contact {sellerName}</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-status-error/10 border border-status-error/30 rounded-lg text-status-error text-body-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="inquiry-message" className="block text-body-sm font-medium text-navy-900 mb-2">
            Your Message
          </label>
          <textarea
            id="inquiry-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="input-field resize-none"
            placeholder={`Hi, I'm interested in "${listingTitle}". Is it still available?`}
            required
          />
          <p className="text-caption text-text-tertiary mt-1">
            Your contact info will be shared with the seller.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin\" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending...
            </span>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Inquiry
            </>
          )}
        </button>

        <p className="text-caption text-text-tertiary text-center">
          Signed in as {session?.user?.email}
        </p>
      </form>
    </div>
  );
}
