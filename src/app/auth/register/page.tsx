/**
 * THE RAIL EXCHANGE™ — Registration Page
 * 
 * Simplified registration - no role selection.
 * All users get access to buyer features free.
 * Seller and Contractor features unlock via subscription.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // Register user with default 'user' role
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role: 'user', // Everyone starts as a basic user
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Auto sign in after registration
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push('/auth/login?message=Registration successful. Please sign in.');
        return;
      }

      // Everyone goes to the unified dashboard
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center mb-12">
            <span className="text-heading-lg font-bold text-navy-900">The Rail</span>
            <span className="text-heading-lg font-bold text-rail-orange ml-1">Exchange</span>
            <span className="text-rail-orange text-sm font-medium ml-0.5">™</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-display-sm font-bold text-navy-900 mb-3">
              Create your account
            </h1>
            <p className="text-body-md text-text-secondary">
              Join the premier marketplace for rail equipment and services.
            </p>
          </div>

          {/* What you get */}
          <div className="mb-8 p-4 bg-surface-secondary rounded-xl">
            <p className="text-body-sm font-medium text-navy-900 mb-3">With your free account, you can:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-body-sm text-text-secondary">
                <svg className="w-5 h-5 text-status-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Browse all listings and contractors
              </li>
              <li className="flex items-center gap-2 text-body-sm text-text-secondary">
                <svg className="w-5 h-5 text-status-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save searches and watchlist items
              </li>
              <li className="flex items-center gap-2 text-body-sm text-text-secondary">
                <svg className="w-5 h-5 text-status-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Contact sellers and request quotes
              </li>
            </ul>
            <p className="text-caption text-text-tertiary mt-3">
              Want to sell equipment or become a verified contractor? You can upgrade anytime from your dashboard.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
              <p className="text-body-sm text-status-error font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-body-sm font-medium text-navy-900 mb-2">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                required
                autoComplete="name"
                className="input-primary"
              />
            </div>

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

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-body-sm font-medium text-navy-900 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="input-primary"
              />
              <p className="mt-1.5 text-caption text-text-tertiary">
                Must be at least 8 characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-body-sm font-medium text-navy-900 mb-2">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="input-primary"
              />
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                required
                className="mt-1 w-4 h-4 border-surface-border rounded focus:ring-rail-orange text-rail-orange"
              />
              <label htmlFor="terms" className="text-body-sm text-text-secondary">
                I agree to the{' '}
                <Link href="/terms" className="text-rail-orange hover:text-rail-orange-dark">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-rail-orange hover:text-rail-orange-dark">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3.5 text-body-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-8 text-center text-body-sm text-text-secondary">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-rail-orange font-medium hover:text-rail-orange-dark">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-rail-orange rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-rail-orange rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-rail-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-display-sm font-bold text-white mb-4">
            One Account, All Features
          </h2>
          <p className="text-body-lg text-white/70 mb-8">
            Browse for free. Upgrade to sell equipment or become a verified contractor whenever you&apos;re ready.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4">
              <div className="w-10 h-10 bg-rail-orange/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-rail-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Buy Equipment</p>
                <p className="text-white/60 text-sm">Always free</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4">
              <div className="w-10 h-10 bg-rail-orange/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-rail-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Sell Equipment</p>
                <p className="text-white/60 text-sm">From $29/month</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Verified Contractor</p>
                <p className="text-white/60 text-sm">$24/month</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
