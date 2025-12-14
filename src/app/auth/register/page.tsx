/**
 * THE RAIL EXCHANGE™ — Registration Page
 * ========================================
 * REGISTRATION & VERIFICATION UX (AI-ASSISTED)
 * 
 * Role Selection:
 * - Buyer: Browse free, $1 lifetime verification for actions
 * - Seller: Dashboard + listings, $29/year verification
 * - Professional: Full platform, $2,500/year (Contractor = Company)
 * 
 * All users:
 * - Receive dashboard shell immediately
 * - Can complete basic profile info
 * - Can access settings
 */

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Check, X, ShoppingCart, Store, Building2, Info } from 'lucide-react';

type UserType = 'buyer' | 'seller' | 'professional';

interface RoleOption {
  id: UserType;
  title: string;
  description: string;
  features: string[];
  pricing: string;
  icon: typeof ShoppingCart;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'buyer',
    title: 'Buyer',
    description: 'Browse listings and contact sellers',
    features: [
      'Browse all listings free',
      'Save favorites',
      'Search equipment & services',
    ],
    pricing: 'Free to browse • $1 verification to contact',
    icon: ShoppingCart,
  },
  {
    id: 'seller',
    title: 'Seller',
    description: 'List equipment for sale',
    features: [
      'Create unlimited listings',
      'Receive buyer inquiries',
      'Public seller profile',
    ],
    pricing: 'Free to list • $29/year verification',
    icon: Store,
  },
  {
    id: 'professional',
    title: 'Professional',
    description: 'Company or Contractor with full platform access',
    features: [
      'Full analytics suite',
      'Directory listing',
      'Lead intelligence',
      'Business verification included',
    ],
    pricing: '$2,500/year (all-in)',
    icon: Building2,
  },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserType>('buyer');
  
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  // Password rules check
  const passwordRules = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
  const passwordValid = passwordRules.minLength && passwordRules.hasUppercase && passwordRules.hasLowercase && passwordRules.hasNumber;

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Name is required';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Invalid email format';
        } else {
          delete newErrors.email;
        }
        break;
      case 'confirmPassword':
        if (value !== password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Final validation
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!passwordValid) newErrors.password = 'Password does not meet requirements';
    if (confirmPassword !== password) newErrors.confirmPassword = 'Passwords do not match';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Map 'professional' to 'contractor' for API (same commercial class)
      const apiRole = selectedRole === 'professional' ? 'contractor' : selectedRole;
      
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role: apiRole,
          isProfessional: selectedRole === 'professional',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error || 'Registration failed' });
        setIsLoading(false);
        return;
      }

      // Auto sign in
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push('/auth/login?message=Registration successful. Please sign in.');
        return;
      }

      // S-12.7: Redirect to callbackUrl with success message
      const redirectUrl = callbackUrl.includes('?') 
        ? `${callbackUrl}&registered=true` 
        : `${callbackUrl}?registered=true`;
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center mb-8">
          <span className="text-xl font-bold text-navy-900">The Rail</span>
          <span className="text-xl font-bold text-rail-orange ml-1">Exchange</span>
          <span className="text-rail-orange text-xs font-medium ml-0.5">™</span>
        </Link>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-navy-900 mb-2">Create your account</h1>
        <p className="text-text-secondary text-sm mb-6">
          Choose how you&apos;ll use The Rail Exchange. Browsing is always free.
        </p>

        {/* Role Selection */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {ROLE_OPTIONS.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  isSelected 
                    ? 'border-rail-orange bg-rail-orange/5' 
                    : 'border-surface-border hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-rail-orange/10' : 'bg-slate-100'}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-rail-orange' : 'text-slate-600'}`} />
                  </div>
                  <span className={`font-semibold ${isSelected ? 'text-navy-900' : 'text-slate-700'}`}>
                    {role.title}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mb-3">{role.description}</p>
                <ul className="space-y-1 mb-3">
                  {role.features.map((feature, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className={`text-xs font-medium ${isSelected ? 'text-rail-orange' : 'text-slate-500'}`}>
                  {role.pricing}
                </p>
              </button>
            );
          })}
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg mb-6">
          <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <p className="font-medium text-slate-700 mb-1">All accounts include:</p>
            <p>Dashboard access, profile settings, and saved searches. You can upgrade or add verification anytime.</p>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* General Error */}
          {errors.general && (
            <p className="text-sm text-status-error">{errors.general}</p>
          )}

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-navy-900 mb-1.5">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => validateField('name', e.target.value)}
              placeholder="John Smith"
              required
              autoComplete="name"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange ${
                errors.name ? 'border-status-error' : 'border-surface-border'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-status-error">{errors.name}</p>}
          </div>

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
              onBlur={(e) => validateField('email', e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange ${
                errors.email ? 'border-status-error' : 'border-surface-border'
              }`}
            />
            {errors.email && <p className="mt-1 text-sm text-status-error">{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-navy-900 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange ${
                  errors.password ? 'border-status-error' : 'border-surface-border'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-navy-900"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-status-error">{errors.password}</p>}
            
            {/* Password Rules - Shown Upfront */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className={`flex items-center gap-1.5 text-xs ${passwordRules.minLength ? 'text-green-600' : 'text-text-tertiary'}`}>
                {passwordRules.minLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                8+ characters
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${passwordRules.hasUppercase ? 'text-green-600' : 'text-text-tertiary'}`}>
                {passwordRules.hasUppercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                Uppercase letter
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${passwordRules.hasLowercase ? 'text-green-600' : 'text-text-tertiary'}`}>
                {passwordRules.hasLowercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                Lowercase letter
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${passwordRules.hasNumber ? 'text-green-600' : 'text-text-tertiary'}`}>
                {passwordRules.hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                Number
              </div>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-navy-900 mb-1.5">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={(e) => validateField('confirmPassword', e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange ${
                  errors.confirmPassword ? 'border-status-error' : 'border-surface-border'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-navy-900"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {/* Live Match Indicator */}
            {confirmPassword && (
              <div className={`mt-2 flex items-center gap-1.5 text-xs ${confirmPassword === password ? 'text-green-600' : 'text-text-tertiary'}`}>
                {confirmPassword === password ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                {confirmPassword === password ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}
            {errors.confirmPassword && !confirmPassword && <p className="mt-1 text-sm text-status-error">{errors.confirmPassword}</p>}
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              required
              className="mt-1 w-4 h-4 border-surface-border rounded focus:ring-rail-orange text-rail-orange"
            />
            <label htmlFor="terms" className="text-sm text-text-secondary">
              I agree to the{' '}
              <Link href="/terms" className="text-rail-orange hover:underline">Terms</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-rail-orange hover:underline">Privacy Policy</Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-rail-orange text-white font-medium rounded-lg hover:bg-[#e55f15] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-8 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-rail-orange font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-md animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/2 mb-10" />
          <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
          <div className="space-y-4">
            <div className="h-12 bg-slate-200 rounded" />
            <div className="h-12 bg-slate-200 rounded" />
            <div className="h-12 bg-slate-200 rounded" />
            <div className="h-12 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
