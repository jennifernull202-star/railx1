/**
 * THE RAIL EXCHANGE™ — Auth Error Page
 * 
 * Displays user-friendly error messages for authentication failures.
 */

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const errorMessages: Record<string, { title: string; message: string }> = {
  Configuration: {
    title: 'Server Error',
    message: 'There is a problem with the server configuration. Please try again later.',
  },
  AccessDenied: {
    title: 'Access Denied',
    message: 'You do not have permission to access this resource.',
  },
  Verification: {
    title: 'Verification Failed',
    message: 'The verification link may have expired or already been used.',
  },
  OAuthSignin: {
    title: 'Sign In Error',
    message: 'There was a problem signing in with your account. Please try again.',
  },
  OAuthCallback: {
    title: 'Callback Error',
    message: 'There was a problem with the authentication callback. Please try again.',
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    message: 'Could not create your account. The email may already be in use.',
  },
  EmailCreateAccount: {
    title: 'Account Creation Error',
    message: 'Could not create your account. Please try again.',
  },
  Callback: {
    title: 'Callback Error',
    message: 'There was a problem during authentication. Please try again.',
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    message: 'This email is already associated with another sign-in method. Please use your original sign-in method.',
  },
  EmailSignin: {
    title: 'Email Sign In Error',
    message: 'The email link may have expired or already been used. Please request a new one.',
  },
  CredentialsSignin: {
    title: 'Sign In Failed',
    message: 'Invalid email or password. Please check your credentials and try again.',
  },
  SessionRequired: {
    title: 'Session Required',
    message: 'Please sign in to access this page.',
  },
  Default: {
    title: 'Authentication Error',
    message: 'An unexpected error occurred during authentication. Please try again.',
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') || 'Default';
  const errorInfo = errorMessages[errorCode] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Logo */}
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <span className="text-heading-md font-bold text-navy-900">The Rail</span>
            <span className="text-heading-md font-bold text-rail-orange ml-1">Exchange</span>
            <span className="text-rail-orange text-xs font-medium ml-0.5">™</span>
          </Link>

          {/* Error Title */}
          <h1 className="text-display-sm font-bold text-navy-900 mb-3">
            {errorInfo.title}
          </h1>

          {/* Error Message */}
          <p className="body-md text-gray-600 mb-8">
            {errorInfo.message}
          </p>

          {/* Error Code (for debugging) */}
          {errorCode !== 'Default' && (
            <p className="text-body-sm text-gray-400 mb-6">
              Error code: {errorCode}
            </p>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="btn-primary w-full py-3 inline-flex items-center justify-center"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="btn-secondary w-full py-3 inline-flex items-center justify-center"
            >
              Go to Homepage
            </Link>
          </div>

          {/* Help Link */}
          <p className="mt-8 text-body-sm text-gray-500">
            Need help?{' '}
            <Link href="/contact" className="text-rail-orange font-medium hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rail-orange"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
