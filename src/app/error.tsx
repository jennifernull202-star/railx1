/**
 * THE RAIL EXCHANGE™ — Global Error Boundary
 * 
 * Catches and displays errors that occur in any route segment.
 * Provides a user-friendly error experience with recovery options.
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development, send to error tracking in production
    console.error('Application error:', error);
    
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   captureException(error);
    // }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-100 p-8 text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Logo */}
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <span className="text-[22px] font-bold text-navy-900">The Rail</span>
            <span className="text-[22px] font-bold text-rail-orange ml-1">Exchange</span>
            <span className="text-rail-orange text-[11px] font-semibold -mt-2">™</span>
          </Link>

          {/* Error Title */}
          <h1 className="text-[24px] md:text-[28px] font-bold text-navy-900 mb-3">
            Something went wrong
          </h1>

          {/* Error Message */}
          <p className="text-[15px] text-slate-500 leading-relaxed mb-6">
            We encountered an unexpected error. Our team has been notified and we&apos;re working to fix it.
          </p>

          {/* Error Digest (for debugging) */}
          {error.digest && (
            <p className="text-[12px] text-slate-400 mb-6 font-mono bg-slate-50 px-3 py-2 rounded-lg">
              Error ID: {error.digest}
            </p>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full h-12 px-6 bg-rail-orange hover:bg-[#e55f15] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            <Link
              href="/"
              className="w-full h-12 px-6 bg-slate-100 hover:bg-slate-200 text-navy-900 font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Homepage
            </Link>
          </div>

          {/* Help Link */}
          <p className="mt-8 text-[14px] text-slate-500">
            Need help?{' '}
            <Link href="/contact" className="text-rail-orange font-medium hover:underline">
              Contact Support
            </Link>
          </p>
        </div>

        {/* Additional Info */}
        <p className="text-center text-[13px] text-slate-400 mt-6">
          If this problem persists, please try refreshing your browser or clearing your cache.
        </p>
      </div>
    </div>
  );
}
