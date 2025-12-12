/**
 * THE RAIL EXCHANGE™ — Marketplace Listing Card
 * 
 * FAST DECISION SUPPORT card for marketplace/search results.
 * Shows ONLY the key decision-making information:
 * - Primary image (thumbnail)
 * - Manufacturer + Model (equipment identity)
 * - Year Built (age at a glance)
 * - Quantity (if > 1)
 * - Location (where is it?)
 * - Verified Seller Badge (trust signal)
 * - Price
 * 
 * LIGHT PAYLOAD. NO EXTRA METRICS. NO CHARTS. NO DECORATION.
 */

'use client';

import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';

interface MarketplaceListingCardProps {
  listing: {
    _id: string;
    title: string;
    slug?: string;
    category: string;
    condition: string;
    primaryImageUrl?: string;
    price: {
      type: string;
      amount?: number;
      currency?: string;
    };
    location: {
      city: string;
      state: string;
    };
    quantity?: number;
    equipment?: {
      manufacturer?: string;
      model?: string;
      yearBuilt?: number;
    };
    sellerId?: {
      isVerifiedSeller?: boolean;
    };
    premiumAddOns?: {
      featured?: { active: boolean };
      premium?: { active: boolean };
      elite?: { active: boolean };
    };
  };
}

function formatPrice(price: MarketplaceListingCardProps['listing']['price']): string {
  if (price.type === 'contact') return 'Contact';
  if (price.type === 'rfq') return 'RFQ';
  if (!price.amount) return 'Contact';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price.amount);
}

export function MarketplaceListingCard({ listing }: MarketplaceListingCardProps) {
  // Build equipment title: Manufacturer + Model or fallback to title
  const equipmentTitle = listing.equipment?.manufacturer && listing.equipment?.model
    ? `${listing.equipment.manufacturer} ${listing.equipment.model}`
    : listing.equipment?.manufacturer || listing.equipment?.model || listing.title;

  return (
    <Link
      href={`/listings/${listing.slug || listing._id}`}
      className="group block bg-white rounded-xl border border-surface-border hover:shadow-card hover:border-rail-orange/30 transition-all overflow-hidden"
    >
      {/* Image with tier badges */}
      <div className="relative aspect-[4/3] bg-navy-100 overflow-hidden">
        {listing.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getImageUrl(listing.primaryImageUrl)}
            alt={equipmentTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Tier Badges - Top Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {listing.premiumAddOns?.elite?.active && (
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] px-2 py-0.5 rounded font-semibold shadow-sm">
              ELITE
            </span>
          )}
          {listing.premiumAddOns?.premium?.active && !listing.premiumAddOns?.elite?.active && (
            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded font-semibold shadow-sm">
              PREMIUM
            </span>
          )}
          {listing.premiumAddOns?.featured?.active && !listing.premiumAddOns?.premium?.active && !listing.premiumAddOns?.elite?.active && (
            <span className="bg-rail-orange text-white text-[10px] px-2 py-0.5 rounded font-semibold shadow-sm">
              FEATURED
            </span>
          )}
        </div>

        {/* Verified Badge - Top Right */}
        {listing.sellerId?.isVerifiedSeller && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded font-semibold shadow-sm flex items-center gap-1">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            VERIFIED
          </div>
        )}
      </div>

      {/* Content - Minimal and Fast */}
      <div className="p-4">
        {/* Manufacturer + Model (Primary identifier) */}
        <h3 className="text-sm font-semibold text-navy-900 line-clamp-1 group-hover:text-rail-orange transition-colors">
          {equipmentTitle}
        </h3>

        {/* Year Built + Quantity Row */}
        <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
          {listing.equipment?.yearBuilt && (
            <span>{listing.equipment.yearBuilt}</span>
          )}
          {listing.quantity && listing.quantity > 1 && (
            <span className="font-medium text-navy-900">
              Qty: {listing.quantity}
            </span>
          )}
        </div>

        {/* Location */}
        <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {listing.location.city}, {listing.location.state}
        </p>

        {/* Price - Prominent */}
        <p className="text-base font-bold text-rail-orange mt-2">
          {formatPrice(listing.price)}
        </p>
      </div>
    </Link>
  );
}

export default MarketplaceListingCard;
