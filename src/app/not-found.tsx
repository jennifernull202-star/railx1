/**
 * THE RAIL EXCHANGE™ — 404 Not Found Page
 * 
 * Custom branded 404 page for invalid routes.
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* 404 Icon */}
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-orange-500">404</span>
          </div>

          {/* Logo */}
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <span className="text-heading-lg font-bold text-navy-900">The Rail</span>
            <span className="text-heading-lg font-bold text-orange-500 ml-1">Exchange</span>
            <span className="text-orange-500 text-sm font-medium ml-0.5">™</span>
          </Link>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Page Not Found
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. 
            It may have been moved, deleted, or never existed.
          </p>

          {/* Search Suggestion */}
          <div className="bg-gray-50 rounded-xl p-4 mb-8">
            <p className="text-sm text-gray-500 mb-3">Looking for something specific?</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link 
                href="/marketplace" 
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors"
              >
                Browse Marketplace
              </Link>
              <Link 
                href="/contractors" 
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors"
              >
                Find Contractors
              </Link>
              <Link 
                href="/search" 
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors"
              >
                Search
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/"
              className="w-full py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors inline-flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Homepage
            </Link>
            <Link
              href="/dashboard"
              className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors inline-flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Go to Dashboard
            </Link>
          </div>

          {/* Help Link */}
          <p className="mt-8 text-sm text-gray-500">
            Think this is an error?{' '}
            <Link href="/contact" className="text-orange-500 font-medium hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
