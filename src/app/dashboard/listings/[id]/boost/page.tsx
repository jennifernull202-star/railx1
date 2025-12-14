/**
 * THE RAIL EXCHANGE™ — Boost Listing Page
 * 
 * Quick upsell page for sellers to purchase Premium or Elite placement
 * for an existing listing. Direct CTA from the My Listings dashboard.
 * 
 * GLOBAL UI ENFORCEMENT:
 * - Skeleton loaders (no spinners)
 * 
 * FLOW:
 * 1. Seller clicks "Boost" on their listing in dashboard
 * 2. Page shows listing preview + tier options (Elite > Premium > Featured)
 * 3. Seller selects tier and goes to Stripe checkout
 * 4. After payment, add-on is activated on listing
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import {
  ArrowLeft,
  Crown,
  TrendingUp,
  Star,
  Zap,
  Check,
  Loader2,
  Eye,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import { ADD_ON_PRICING, ADD_ON_DURATION } from '@/config/pricing';

interface Listing {
  _id: string;
  title: string;
  slug: string;
  category: string;
  condition: string;
  status: string;
  price: {
    amount: number;
    negotiable: boolean;
  };
  images: Array<{ url: string; alt: string }>;
  viewCount: number;
  inquiryCount: number;
  premiumAddOns: {
    featured?: { active: boolean; expiresAt?: string };
    premium?: { active: boolean; expiresAt?: string };
    elite?: { active: boolean; expiresAt?: string };
  };
}

interface BoostTier {
  id: string;
  name: string;
  price: number;
  duration: string;
  icon: typeof Crown;
  color: string;
  bgColor: string;
  borderColor: string;
  benefits: string[];
  popular?: boolean;
}

// Elite is the ONLY placement tier (no Premium/Featured tiers)
const BOOST_TIERS: BoostTier[] = [
  {
    id: 'elite',
    name: 'Elite Placement',
    price: ADD_ON_PRICING.elite / 100,
    duration: `${ADD_ON_DURATION.elite} days`,
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    benefits: [
      'Homepage hero rotation',
      'Priority in all search results',
      'Elite badge on listing',
      'Maximum buyer visibility',
      'Map visibility included',
      '"Sponsored" disclosure',
    ],
    popular: true,
  },
];

export default function BoostListingPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('elite');
  const [checkingOut, setCheckingOut] = useState(false);

  // Fetch listing details
  useEffect(() => {
    if (!listingId) return;

    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${listingId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to load listing');
          return;
        }

        // Verify ownership
        if (data.listing.sellerId !== session?.user?.id) {
          setError('You can only boost your own listings');
          return;
        }

        setListing(data.listing);
      } catch {
        setError('Failed to load listing');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchListing();
    }
  }, [listingId, session?.user?.id]);

  // Handle checkout
  const handleBoost = async () => {
    if (!listing || !selectedTier) return;

    setCheckingOut(true);
    try {
      const res = await fetch('/api/checkout/listing-addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing._id,
          addons: [selectedTier],
          successUrl: `${window.location.origin}/dashboard/listings?boosted=true`,
          cancelUrl: `${window.location.origin}/dashboard/listings/${listing._id}/boost`,
        }),
      });

      const data = await res.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
        setCheckingOut(false);
      }
    } catch {
      setError('Failed to start checkout');
      setCheckingOut(false);
    }
  };

  // Get current boost status
  const getCurrentBoost = () => {
    if (!listing?.premiumAddOns) return null;
    if (listing.premiumAddOns.elite?.active) return 'elite';
    if (listing.premiumAddOns.premium?.active) return 'premium';
    if (listing.premiumAddOns.featured?.active) return 'featured';
    return null;
  };

  const currentBoost = listing ? getCurrentBoost() : null;

  // Auth check
  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {/* Skeleton pulse dots instead of spinner */}
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-status-error/10 border border-status-error/20 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-status-error mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-navy-900 mb-2">Error</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <Link
            href="/dashboard/listings"
            className="inline-flex items-center gap-2 text-rail-orange hover:text-rail-orange/80"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Listings
          </Link>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/listings"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-navy-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Listings
        </Link>
        <h1 className="text-display-sm font-semibold text-navy-900 flex items-center gap-3">
          <Zap className="w-8 h-8 text-rail-orange" />
          Boost Your Listing
        </h1>
        <p className="text-body-md text-text-secondary mt-2">
          Get more visibility and sell faster with premium placement options
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Listing Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-surface-border rounded-xl overflow-hidden sticky top-24">
            {/* Image */}
            <div className="aspect-[4/3] relative bg-surface-secondary">
              {listing.images?.[0] ? (
                <Image
                  src={getImageUrl(listing.images[0].url)}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-text-tertiary">
                  <span>No image</span>
                </div>
              )}
              {currentBoost && (
                <div className="absolute top-2 left-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    currentBoost === 'elite' ? 'bg-purple-100 text-purple-700' :
                    currentBoost === 'premium' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {currentBoost === 'elite' && <Crown className="w-3 h-3" />}
                    {currentBoost === 'premium' && <TrendingUp className="w-3 h-3" />}
                    {currentBoost === 'featured' && <Star className="w-3 h-3" />}
                    Currently {currentBoost.charAt(0).toUpperCase() + currentBoost.slice(1)}
                  </span>
                </div>
              )}
            </div>
            {/* Info */}
            <div className="p-4">
              <h3 className="font-semibold text-navy-900 line-clamp-2 mb-1">
                {listing.title}
              </h3>
              <p className="text-lg font-bold text-rail-orange mb-3">
                ${listing.price.amount.toLocaleString()}
              </p>
              <div className="flex items-center gap-4 text-sm text-text-tertiary">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {listing.viewCount} views
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {listing.inquiryCount} inquiries
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Boost Options */}
        <div className="lg:col-span-2 space-y-4">
          {currentBoost && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your listing already has {currentBoost} placement. 
                Upgrading will replace your current boost with the new tier.
              </p>
            </div>
          )}

          {BOOST_TIERS.map((tier) => {
            const Icon = tier.icon;
            const isSelected = selectedTier === tier.id;
            const isCurrentTier = currentBoost === tier.id;
            const isDowngrade = currentBoost && 
              BOOST_TIERS.findIndex(t => t.id === currentBoost) < BOOST_TIERS.findIndex(t => t.id === tier.id);

            return (
              <button
                key={tier.id}
                onClick={() => !isCurrentTier && setSelectedTier(tier.id)}
                disabled={isCurrentTier}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                  isCurrentTier
                    ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? `${tier.bgColor} ${tier.borderColor} ring-2 ring-offset-2 ${tier.borderColor.replace('border-', 'ring-')}`
                    : 'bg-white border-surface-border hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-xl ${tier.bgColor}`}>
                    <Icon className={`w-6 h-6 ${tier.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-navy-900">
                        {tier.name}
                      </h3>
                      {tier.popular && !isCurrentTier && (
                        <span className="px-2 py-0.5 bg-rail-orange text-white text-xs font-medium rounded-full">
                          Popular
                        </span>
                      )}
                      {isCurrentTier && (
                        <span className="px-2 py-0.5 bg-gray-400 text-white text-xs font-medium rounded-full">
                          Current
                        </span>
                      )}
                      {isDowngrade && (
                        <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-medium rounded-full">
                          Downgrade
                        </span>
                      )}
                    </div>
                    
                    <ul className="space-y-1.5 mt-3">
                      {tier.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                          <Check className={`w-4 h-4 flex-shrink-0 ${tier.color}`} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-navy-900">
                      ${tier.price}
                    </div>
                    <div className="text-sm text-text-tertiary">
                      {tier.duration}
                    </div>
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected && !isCurrentTier && (
                  <div className="mt-4 pt-4 border-t border-current/10 flex items-center justify-center gap-2 text-sm font-medium">
                    <Check className={`w-4 h-4 ${tier.color}`} />
                    <span className={tier.color}>Selected</span>
                  </div>
                )}
              </button>
            );
          })}

          {/* CTA */}
          <div className="mt-6 p-4 bg-surface-secondary rounded-xl">
            <button
              onClick={handleBoost}
              disabled={checkingOut || selectedTier === currentBoost}
              className="w-full bg-rail-orange text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-rail-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {checkingOut ? (
                <>
                  {/* Skeleton pulse loader instead of spinner */}
                  <span className="w-5 h-5 bg-white/30 rounded-full animate-pulse" />
                  Redirecting to checkout...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Boost with {BOOST_TIERS.find(t => t.id === selectedTier)?.name} — $
                  {BOOST_TIERS.find(t => t.id === selectedTier)?.price}
                </>
              )}
            </button>
            <p className="text-center text-sm text-text-tertiary mt-3">
              Secure checkout powered by Stripe • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
