/**
 * THE RAIL EXCHANGE™ — Login Page
 * 
 * Premium, modern login experience with email/password authentication.
 */

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState, FormEvent, Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setFormError(result.error);
        setIsLoading(false);
        return;
      }

      // Successful login - redirect
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setFormError('An unexpected error occurred. Please try again.');
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

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-display-sm font-bold text-navy-900 mb-3">
              Welcome back
            </h1>
            <p className="body-md">
              Sign in to access your account and continue where you left off.
            </p>
          </div>

          {/* Error Messages */}
          {(formError || error) && (
            <div className="mb-6 p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
              <p className="text-body-sm text-status-error font-medium">
                {formError || error === 'CredentialsSignin' 
                  ? 'Invalid email or password' 
                  : error}
              </p>
            </div>
          )}

          {/* Login Form */}
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

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-body-sm font-medium text-navy-900">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
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
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center text-body-sm">
              <span className="bg-white px-4 text-text-tertiary">New to The Rail Exchange?</span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            href="/auth/register"
            className="w-full btn-outline py-4 text-body-md block text-center"
          >
            Create an account
          </Link>
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h2 className="text-display-sm font-bold text-white mb-4">
            Secure & Trusted
          </h2>
          <p className="text-body-lg text-white/70 mb-8">
            Your data is protected with enterprise-grade security. Join thousands of
            rail industry professionals who trust The Rail Exchange.
          </p>

          {/* Trust Indicators */}
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-heading-lg font-bold text-white">2,500+</p>
              <p className="text-body-sm text-white/60">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-heading-lg font-bold text-white">99.9%</p>
              <p className="text-body-sm text-white/60">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-heading-lg font-bold text-white">256-bit</p>
              <p className="text-body-sm text-white/60">Encryption</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-rail-orange border-t-transparent rounded-full" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
