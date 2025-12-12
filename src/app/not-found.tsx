/**
 * THE RAIL EXCHANGE™ — 404 Not Found Page
 * 
 * Custom branded 404 page for invalid routes.
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-100 p-8 text-center">
          {/* 404 Icon */}
          <div className="w-24 h-24 bg-rail-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-rail-orange">404</span>
          </div>

          {/* Logo */}
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <span className="text-[22px] font-bold text-navy-900">The Rail</span>
            <span className="text-[22px] font-bold text-rail-orange ml-1">Exchange</span>
            <span className="text-rail-orange text-[11px] font-semibold -mt-2">™</span>
          </Link>

          {/* Title */}
          <h1 className="text-[24px] md:text-[28px] font-bold text-navy-900 mb-3">
            Page Not Found
          </h1>

          {/* Message */}
          <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. 
            It may have been moved, deleted, or never existed.
          </p>

          {/* Search Suggestion */}
          <div className="bg-slate-50 rounded-xl p-5 mb-8">
            <p className="text-[13px] text-slate-500 mb-3">Looking for something specific?</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link 
                href="/listings" 
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 hover:border-rail-orange hover:text-rail-orange transition-colors"
              >
                Browse Marketplace
              </Link>
              <Link 
                href="/contractors" 
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 hover:border-rail-orange hover:text-rail-orange transition-colors"
              >
                Find Contractors
              </Link>
              <Link 
                href="/search" 
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 hover:border-rail-orange hover:text-rail-orange transition-colors"
              >
                Search
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/"
              className="w-full h-12 px-6 bg-rail-orange hover:bg-[#e55f15] text-white font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Homepage
            </Link>
            <Link
              href="/dashboard"
              className="w-full h-12 px-6 bg-slate-100 hover:bg-slate-200 text-navy-900 font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Go to Dashboard
            </Link>
          </div>

          {/* Help Link */}
          <p className="mt-8 text-[14px] text-slate-500">
            Think this is an error?{' '}
            <Link href="/contact" className="text-rail-orange font-medium hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
