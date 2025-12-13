/**
 * THE RAIL EXCHANGE™ — Login Page
 * =================================
 * BATCH 13 REQUIREMENTS:
 * - Inline error messages (no red boxes) ✓
 * - Improved error copy ✓
 * - Show/hide password toggle ✓
 * - OMIT: Marketing content, alarmist error styling
 * 
 * S-15: Rate-limit feedback and CAPTCHA after repeated failures
 * 
 * Simplified login with inline error text and show/hide password.
 */

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState, FormEvent, Suspense } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRateLimitFeedback, getRateLimitMessage } from '@/lib/hooks/useRateLimitFeedback';
import { useCaptchaThreshold, InvisibleCaptcha, CAPTCHA_REASONS } from '@/components/InvisibleCaptcha';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // S-15.1: Rate limit feedback with countdown
  const { isRateLimited, message: rateLimitMessage, checkAndHandleRateLimit, clearRateLimit } = useRateLimitFeedback();
  
  // S-15.3: CAPTCHA after repeated failures (threshold = 3)
  const { showChallenge, incrementAttempts, resetAttempts } = useCaptchaThreshold('login', 3);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    // S-15.1: Don't allow submit if rate limited
    if (isRateLimited) {
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        // S-15.3: Include CAPTCHA token if present
        ...(captchaToken && { captchaToken }),
      });

      if (result?.error) {
        // S-15.3: Track failed attempts for CAPTCHA threshold
        incrementAttempts();
        
        // Improved error copy
        const errorMessages: Record<string, string> = {
          CredentialsSignin: 'Email or password is incorrect. Please try again.',
          SessionRequired: 'Please sign in to continue.',
          RateLimited: getRateLimitMessage(60), // S-15.1: Rate limit message
          Default: 'Something went wrong. Please try again.',
        };
        setError(errorMessages[result.error] || errorMessages.Default);
        setIsLoading(false);
        return;
      }

      // S-15.3: Reset attempts on successful login
      resetAttempts();
      clearRateLimit();
      
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Display URL error on mount with improved copy
  const getDisplayError = () => {
    // S-15.1: Rate limit error takes priority
    if (isRateLimited) return rateLimitMessage;
    if (error) return error;
    if (!urlError) return '';
    const urlErrorMessages: Record<string, string> = {
      CredentialsSignin: 'Email or password is incorrect. Please try again.',
      SessionRequired: 'Please sign in to continue.',
      OAuthAccountNotLinked: 'This email is already linked to another account.',
      AccessDenied: 'Access denied. Please contact support if this continues.',
    };
    return urlErrorMessages[urlError] || urlError;
  };
  const displayError = getDisplayError();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center mb-10">
          <span className="text-xl font-bold text-navy-900">The Rail</span>
          <span className="text-xl font-bold text-rail-orange ml-1">Exchange</span>
          <span className="text-rail-orange text-xs font-medium ml-0.5">™</span>
        </Link>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-navy-900 mb-2">Welcome back</h1>
        <p className="text-text-secondary text-sm mb-8">Sign in to continue</p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-navy-900 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange"
            />
          </div>

          {/* Password Field with Show/Hide */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-navy-900">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-rail-orange hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-navy-900"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* S-15.3: CAPTCHA after repeated failures */}
          {showChallenge && (
            <InvisibleCaptcha
              action="login"
              onVerify={setCaptchaToken}
              showChallenge={showChallenge}
              challengeReason={CAPTCHA_REASONS.REPEATED_LOGIN_FAILURES}
            />
          )}

          {/* Inline Error Text */}
          {displayError && (
            <p className="text-sm text-status-error">{displayError}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isRateLimited || (showChallenge && !captchaToken)}
            className="w-full py-3 bg-rail-orange text-white font-medium rounded-lg hover:bg-[#e55f15] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Signing in...' : isRateLimited ? 'Please wait...' : 'Sign in'}
          </button>
        </form>

        {/* Register Link */}
        <p className="mt-8 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-rail-orange font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm animate-pulse">
          <div className="h-6 bg-surface-secondary rounded w-32 mb-10" />
          <div className="h-8 bg-surface-secondary rounded w-40 mb-2" />
          <div className="h-4 bg-surface-secondary rounded w-24 mb-8" />
          <div className="space-y-5">
            <div className="h-12 bg-surface-secondary rounded-lg" />
            <div className="h-12 bg-surface-secondary rounded-lg" />
            <div className="h-12 bg-surface-secondary rounded-lg" />
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
