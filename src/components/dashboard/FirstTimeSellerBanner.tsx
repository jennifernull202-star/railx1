/**
 * THE RAIL EXCHANGE™ — First-Time Seller Welcome Banner
 * 
 * UX Item #2: Post-Registration Guidance
 * Shows only on first seller dashboard visit with clear CTAs.
 * Dismissed permanently after CTA click or explicit dismissal.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Package, Shield, Sparkles } from 'lucide-react';

interface FirstTimeSellerBannerProps {
  userName: string;
}

const STORAGE_KEY = 'railx_seller_welcome_dismissed';

export default function FirstTimeSellerBanner({ userName }: FirstTimeSellerBannerProps) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if already dismissed
    const wasDismissed = localStorage.getItem(STORAGE_KEY);
    if (!wasDismissed) {
      setShow(true);
      // Log event: seller_dashboard_first_visit_shown
      console.log('[EVENT] seller_dashboard_first_visit_shown');
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    // Log event: seller_dashboard_welcome_dismissed
    console.log('[EVENT] seller_dashboard_welcome_dismissed');
  };

  const handleCreateListingClick = () => {
    // Log event: seller_dashboard_cta_create_listing_clicked
    console.log('[EVENT] seller_dashboard_cta_create_listing_clicked');
    localStorage.setItem(STORAGE_KEY, 'true');
    router.push('/listings/create');
  };

  const handleGetVerifiedClick = () => {
    // Log event: seller_dashboard_cta_get_verified_clicked
    console.log('[EVENT] seller_dashboard_cta_get_verified_clicked');
    localStorage.setItem(STORAGE_KEY, 'true');
    router.push('/dashboard/verification/seller');
  };

  // Don't render on server or if dismissed
  if (!mounted || !show) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-rail-orange to-amber-500 rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden shadow-lg">
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
        aria-label="Dismiss welcome banner"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Welcome, {userName}! Ready to sell? 🚂
          </h2>
          <p className="text-white/90 text-lg max-w-2xl">
            You&apos;re just two steps away from listing your first equipment on The Rail Exchange.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Primary CTA: Create Your First Listing */}
          <button
            onClick={handleCreateListingClick}
            className="flex items-center justify-center gap-3 bg-white text-navy-900 font-semibold px-6 py-4 rounded-xl hover:bg-white/90 transition-colors shadow-md"
          >
            <Package className="w-5 h-5 text-rail-orange" />
            <span>Create Your First Listing</span>
          </button>

          {/* Secondary CTA: Get Verified to Publish */}
          <button
            onClick={handleGetVerifiedClick}
            className="flex items-center justify-center gap-3 bg-white/20 backdrop-blur text-white font-semibold px-6 py-4 rounded-xl border border-white/30 hover:bg-white/30 transition-colors"
          >
            <Shield className="w-5 h-5" />
            <span>Get Verified to Publish</span>
          </button>
        </div>

        {/* Helper text */}
        <p className="text-white/70 text-sm mt-4">
          💡 You can create listings as drafts first, then verify to publish them.
        </p>
      </div>
    </div>
  );
}
