/**
 * THE RAIL EXCHANGE™ — Forgot Password Page
 * 
 * Premium password reset request experience.
 */

'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center mb-12">
            <span className="text-heading-lg font-bold text-navy-900">The Rail</span>
            <span className="text-heading-lg font-bold text-rail-orange ml-1">Exchange</span>
            <span className="text-rail-orange text-sm font-medium ml-0.5">™</span>
          </Link>

          {!isSubmitted ? (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-display-sm font-bold text-navy-900 mb-3">
                  Reset your password
                </h1>
                <p className="body-md">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
                  <p className="text-body-sm text-status-error font-medium">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-body-sm font-medium text-navy-900 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                    className="input-primary"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-4 text-body-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Sending reset link...
                    </span>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <p className="mt-8 text-center body-sm">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-rail-orange font-medium hover:text-rail-orange-dark">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            /* Success State */
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-status-success/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-status-success" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h1 className="text-display-sm font-bold text-navy-900 mb-3">
                Check your email
              </h1>
              <p className="body-md mb-8">
                We&apos;ve sent a password reset link to{' '}
                <span className="font-medium text-navy-900">{email}</span>.
                Please check your inbox and follow the instructions.
              </p>
              <p className="body-sm text-text-tertiary mb-6">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-rail-orange font-medium hover:text-rail-orange-dark"
                >
                  try again
                </button>
                .
              </p>
              <Link href="/auth/login" className="btn-outline py-3 px-6 inline-flex">
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 items-center justify-center p-12">
        <div className="max-w-lg text-center">
          {/* Decorative Element */}
          <div className="w-24 h-24 mx-auto mb-8 bg-rail-orange/20 rounded-3xl flex items-center justify-center">
            <svg
              className="w-12 h-12 text-rail-orange"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h2 className="text-display-sm font-bold text-white mb-4">
            We&apos;ve Got You Covered
          </h2>
          <p className="text-body-lg text-white/70 mb-8">
            Forgot your password? No problem. We&apos;ll help you get back into your
            account quickly and securely.
          </p>

          {/* Security Note */}
          <div className="bg-white/5 rounded-xl p-6 text-left">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-status-info/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-status-info" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-heading-sm font-semibold text-white mb-1">
                  Security Tip
                </h3>
                <p className="text-body-sm text-white/60">
                  For your security, password reset links expire after 1 hour.
                  Never share your password or reset link with anyone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
