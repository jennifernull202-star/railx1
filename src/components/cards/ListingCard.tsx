/**
 * THE RAIL EXCHANGE™ — Listing Card Component
 * 
 * Premium listing card for marketplace grid displays.
 * AutoTrader-style design with add-on indicators.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export interface ListingCardProps {
  id: string;
  slug?: string;
  title: string;
  category: string;
  categoryLabel?: string;
  condition: string;
  price: number | {
    type: 'fixed' | 'negotiable' | 'auction' | 'contact' | 'rfq';
    amount?: number;
    currency?: string;
  };
  image?: string; // Simple image prop
  images?: Array<{ url: string; alt?: string } | string>;
  location?: string | {
    city?: string;
    state?: string;
  };
  seller?: string | {
    name?: string;
    verified?: boolean;
  };
  verified?: boolean; // Direct verified prop
  premiumAddOns?: {
    featured?: { active: boolean };
    premium?: { active: boolean };
    elite?: { active: boolean };
    verifiedBadge?: { active: boolean };
    aiEnhanced?: boolean;
  };
  isWatchlisted?: boolean;
  onWatchlistToggle?: (id: string) => void;
  className?: string;
}

function formatPrice(price: ListingCardProps['price']): string {
  // Handle simple number price
  if (typeof price === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  }
  
  // Handle complex price object
  if (price.type === 'contact') return 'Contact for Price';
  if (price.type === 'auction') return 'Auction';
  if (price.type === 'rfq') return 'Request Quote';
  if (!price.amount) return 'Contact for Price';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price.amount);
}

const ListingCard: React.FC<ListingCardProps> = ({
  id,
  slug,
  title,
  category,
  categoryLabel,
  condition,
  price,
  image,
  images,
  location,
  seller,
  verified,
  premiumAddOns,
  isWatchlisted,
  onWatchlistToggle,
  className,
}) => {
  // Route featured-example to its special page, others to standard listing page
  const href = id === 'featured-example' 
    ? '/marketplace/featured-example' 
    : slug 
      ? `/listings/${slug}` 
      : `/listings/${id}`;
  
  // Handle multiple image formats
  let imageUrl = '/placeholders/listing-no-image.png';
  if (image) {
    imageUrl = image;
  } else if (images && images.length > 0) {
    const firstImage = images[0];
    imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url || imageUrl;
  }
  
  // Handle location formats
  const locationStr = typeof location === 'string' 
    ? location 
    : location?.city && location?.state 
      ? `${location.city}, ${location.state}`
      : location?.city || location?.state || '';
  
  // Handle seller formats
  const sellerName = typeof seller === 'string' ? seller : seller?.name || '';
  const isVerified = verified ?? (typeof seller === 'object' ? seller?.verified : false);
  
  const isElite = premiumAddOns?.elite?.active;
  const isPremium = premiumAddOns?.premium?.active;
  const isFeatured = premiumAddOns?.featured?.active;
  const hasVerifiedBadge = premiumAddOns?.verifiedBadge?.active;

  return (
    <Card className={cn(
      "group overflow-hidden rounded-xl border border-surface-border bg-white",
      "hover:shadow-lg hover:border-surface-border/80 transition-all duration-300",
      isElite && "ring-2 ring-rail-orange",
      className
    )}>
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-secondary">
        <Link href={href}>
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>

        {/* Add-on Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {isElite && (
            <Badge className="bg-rail-orange text-white border-0 text-xs font-semibold">
              Elite
            </Badge>
          )}
          {isPremium && !isElite && (
            <Badge className="bg-navy-900 text-white border-0 text-xs font-semibold">
              Premium
            </Badge>
          )}
          {isFeatured && !isPremium && !isElite && (
            <Badge className="bg-status-info text-white border-0 text-xs font-semibold">
              Featured
            </Badge>
          )}
          {premiumAddOns?.aiEnhanced && (
            <Badge variant="outline" className="bg-white/90 text-navy-900 border-navy-900/20 text-xs">
              ✨ AI Enhanced
            </Badge>
          )}
          {hasVerifiedBadge && (
            <Badge className="bg-green-600 text-white border-0 text-xs font-semibold">
              ✓ Verified Asset
            </Badge>
          )}
        </div>

        {/* Watchlist Button */}
        {onWatchlistToggle && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onWatchlistToggle(id);
            }}
            className={cn(
              "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center",
              "bg-white/90 hover:bg-white shadow-sm transition-all duration-200",
              isWatchlisted && "text-status-error"
            )}
            aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <svg
              className="w-5 h-5"
              fill={isWatchlisted ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}

        {/* Condition Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="outline" className="bg-white/90 text-navy-900 border-0 text-xs capitalize">
            {condition}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <Link href={href} className="block">
          {/* Category */}
          <p className="text-xs font-medium text-rail-orange mb-1">
            {categoryLabel || category}
          </p>

          {/* Title */}
          <h3 className="text-base font-semibold text-navy-900 line-clamp-2 mb-2 group-hover:text-rail-orange transition-colors">
            {title}
          </h3>

          {/* Price */}
          <p className="text-lg font-bold text-navy-900 mb-2">
            {formatPrice(price)}
          </p>

          {/* Location & Seller */}
          <div className="flex items-center justify-between text-xs text-text-secondary">
            {locationStr && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {locationStr}
              </span>
            )}
            {isVerified && (
              <span className="flex items-center gap-1 text-status-success">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

export { ListingCard };
