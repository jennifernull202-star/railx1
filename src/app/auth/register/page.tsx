/**
 * THE RAIL EXCHANGE™ — Registration Page
 * 
 * Premium registration experience with role selection.
 * Users can choose Buyer/Seller or Contractor role.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';

type UserRole = 'buyer' | 'seller' | 'contractor';

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const roleOptions: RoleOption[] = [
  {
    id: 'buyer',
    title: 'Buyer',
    description: 'Looking to purchase rail equipment, materials, or services',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'seller',
    title: 'Seller',
    description: 'Selling rail equipment, materials, or offering services',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'contractor',
    title: 'Contractor',
    description: 'Professional rail contractor offering specialized services',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function RegisterPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('details');
  };

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
      // Register user
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role: selectedRole,
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
        // Registration succeeded but sign in failed
        router.push('/auth/login?message=Registration successful. Please sign in.');
        return;
      }

      // Redirect based on role
      if (selectedRole === 'contractor') {
        router.push('/contractors/onboard');
      } else {
        router.push('/dashboard');
      }
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

          {/* Step 1: Role Selection */}
          {step === 'role' && (
            <>
              <div className="mb-8">
                <h1 className="text-display-sm font-bold text-navy-900 mb-3">
                  Create your account
                </h1>
                <p className="body-md">
                  First, tell us how you&apos;ll be using The Rail Exchange.
                </p>
              </div>

              <div className="space-y-4">
                {roleOptions.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className="w-full card p-6 text-left hover:border-rail-orange/50 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-rail-orange/10 rounded-xl flex items-center justify-center text-rail-orange group-hover:bg-rail-orange group-hover:text-white transition-colors">
                        {role.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="heading-md mb-1 group-hover:text-rail-orange transition-colors">
                          {role.title}
                        </h3>
                        <p className="body-sm">{role.description}</p>
                      </div>
                      <div className="w-6 h-6 border-2 border-surface-border rounded-full group-hover:border-rail-orange transition-colors flex items-center justify-center">
                        <div className="w-3 h-3 bg-rail-orange rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Login Link */}
              <p className="mt-8 text-center body-sm">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-rail-orange font-medium hover:text-rail-orange-dark">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* Step 2: Account Details */}
          {step === 'details' && (
            <>
              <div className="mb-8">
                <button
                  onClick={() => setStep('role')}
                  className="inline-flex items-center text-body-sm text-text-secondary hover:text-navy-900 mb-4"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to role selection
                </button>
                <h1 className="text-display-sm font-bold text-navy-900 mb-3">
                  Set up your account
                </h1>
                <p className="body-md">
                  Creating a{' '}
                  <span className="font-medium text-navy-900">
                    {selectedRole === 'contractor' ? 'Contractor' : selectedRole === 'seller' ? 'Seller' : 'Buyer'}
                  </span>{' '}
                  account
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

                {/* Terms */}
                <p className="text-body-sm text-text-secondary">
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" className="text-rail-orange hover:text-rail-orange-dark">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-rail-orange hover:text-rail-orange-dark">
                    Privacy Policy
                  </Link>
                  .
                </p>

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
                      Creating account...
                    </span>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              {/* Login Link */}
              <p className="mt-6 text-center body-sm">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-rail-orange font-medium hover:text-rail-orange-dark">
                  Sign in
                </Link>
              </p>
            </>
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>

          <h2 className="text-display-sm font-bold text-white mb-4">
            Join the Industry Leaders
          </h2>
          <p className="text-body-lg text-white/70 mb-8">
            The Rail Exchange connects buyers, sellers, and contractors across the
            rail industry. Start building valuable connections today.
          </p>

          {/* Features */}
          <div className="text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-status-success/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-status-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-body-md text-white/80">Free to create an account</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-status-success/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-status-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-body-md text-white/80">Access to 2,500+ listings</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-status-success/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-status-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-body-md text-white/80">Connect with verified contractors</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-status-success/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-status-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-body-md text-white/80">Secure messaging & transactions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
