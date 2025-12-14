/**
 * THE RAIL EXCHANGE™ — Verification CTA Banner
 * 
 * OPUS EXECUTION COMMAND: Post-Registration Dashboard Banners
 * 
 * Shows role-appropriate verification CTAs based on user's role:
 * - Buyer: Optional $1 lifetime verification for spam prevention
 * - Seller: $29/year verification required before publishing
 * - Professional (Contractor/Company): $2,500/year verification
 * 
 * Dismissible and persists dismissal state in localStorage.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Shield, ShoppingCart, Store, Building2, Sparkles } from 'lucide-react';

export type VerificationRole = 'buyer' | 'seller' | 'contractor';

interface VerificationCTABannerProps {
  userRole: VerificationRole;
  isVerifiedBuyer?: boolean;
  isVerifiedSeller?: boolean;
  isVerifiedContractor?: boolean;
  userName?: string;
}

const STORAGE_KEY_PREFIX = 'railx_verification_banner_dismissed_';

interface BannerContent {
  title: string;
  subtitle: string;
  price: string;
  priceNote: string;
  ctaText: string;
  ctaHref: string;
  gradient: string;
  Icon: React.ElementType;
}

const BANNER_CONTENT: Record<VerificationRole, BannerContent> = {
  buyer: {
    title: 'Verify Your Account',
    subtitle: 'Complete $1 verification to contact sellers and submit inquiries',
    price: '$1',
    priceNote: 'One-time • Lifetime access',
    ctaText: 'Get Verified',
    ctaHref: '/dashboard/verification/buyer',
    gradient: 'from-blue-500 to-blue-600',
    Icon: ShoppingCart,
  },
  seller: {
    title: 'Seller Verification Required',
    subtitle: 'Verify your account to publish listings on The Rail Exchange',
    price: '$29',
    priceNote: 'per year',
    ctaText: 'Get Verified to Sell',
    ctaHref: '/dashboard/verification/seller',
    gradient: 'from-emerald-500 to-emerald-600',
    Icon: Store,
  },
  contractor: {
    title: 'Professional Verification',
    subtitle: 'Get verified to showcase your services and receive leads',
    price: '$2,500',
    priceNote: 'per year • Includes analytics',
    ctaText: 'Start Verification',
    ctaHref: '/dashboard/verification/contractor',
    gradient: 'from-rail-orange to-amber-500',
    Icon: Building2,
  },
};

export default function VerificationCTABanner({
  userRole,
  isVerifiedBuyer = false,
  isVerifiedSeller = false,
  isVerifiedContractor = false,
  userName,
}: VerificationCTABannerProps) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Determine if user already has relevant verification
  const isAlreadyVerified = 
    (userRole === 'buyer' && isVerifiedBuyer) ||
    (userRole === 'seller' && isVerifiedSeller) ||
    (userRole === 'contractor' && isVerifiedContractor);

  useEffect(() => {
    setMounted(true);
    
    // Don't show if already verified
    if (isAlreadyVerified) {
      return;
    }

    // Check if this specific banner was dismissed
    const storageKey = `${STORAGE_KEY_PREFIX}${userRole}`;
    const wasDismissed = localStorage.getItem(storageKey);
    
    if (!wasDismissed) {
      setShow(true);
    }
  }, [userRole, isAlreadyVerified]);

  const handleDismiss = () => {
    setShow(false);
    const storageKey = `${STORAGE_KEY_PREFIX}${userRole}`;
    localStorage.setItem(storageKey, 'true');
  };

  // Don't render on server, if dismissed, or if already verified
  if (!mounted || !show || isAlreadyVerified) {
    return null;
  }

  const content = BANNER_CONTENT[userRole];
  const { Icon } = content;

  return (
    <div className={`bg-gradient-to-r ${content.gradient} rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden shadow-lg`}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />
        <Sparkles className="absolute top-4 right-20 w-6 h-6 text-white/20" />
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors z-10"
        aria-label="Dismiss verification banner"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left content */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                {userName ? `${userName}, ${content.title.toLowerCase()}` : content.title}
              </h2>
              <p className="text-white/90">{content.subtitle}</p>
            </div>
          </div>

          {/* Right - CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:flex-shrink-0">
            <div className="text-center sm:text-right">
              <span className="text-3xl font-bold text-white">{content.price}</span>
              <p className="text-sm text-white/80">{content.priceNote}</p>
            </div>
            <Link
              href={content.ctaHref}
              className="px-6 py-3 bg-white text-navy-900 font-semibold rounded-xl hover:bg-white/90 transition-colors text-center whitespace-nowrap shadow-lg"
            >
              <Shield className="inline w-5 h-5 mr-2 -mt-0.5" />
              {content.ctaText}
            </Link>
          </div>
        </div>

        {/* AI Disclosure - subtle, mandatory */}
        <p className="mt-4 text-xs text-white/60 border-t border-white/20 pt-3">
          Verification is assisted by automated (AI) analysis and human review. 
          Verification confirms document submission only and does not guarantee performance, authority, compliance, or transaction outcomes.
        </p>
      </div>
    </div>
  );
}
