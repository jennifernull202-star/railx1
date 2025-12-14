/**
 * THE RAIL EXCHANGE™ — Listing Card Component
 * 
 * Premium listing card for marketplace grid displays.
 * AutoTrader-style design with add-on indicators.
 * 
 * GLOBAL UI ENFORCEMENT:
 * - Single badge rule: Elite > Premium > Featured > Verified
 * - Skeleton loaders (no spinners)
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, getImageUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { VerifiedSellerBadgeCompact } from '@/components/VerifiedSellerBadge';
import { getHighestBadge, BADGE_STYLES } from '@/lib/ui';

// Equipment data subset for card display
export interface ListingCardEquipment {
  reportingMarks?: string;
  manufacturer?: string;
  model?: string;
  yearBuilt?: number;
  horsepower?: number;
  fraCompliant?: boolean;
  availability?: string;
  aarCarType?: string;
}

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
  
  // BUYER AUDIT: Structured equipment fields
  equipment?: ListingCardEquipment;
  quantity?: number;
  daysOnMarket?: number;
  inquiryCount?: number;
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
  // BUYER AUDIT: New equipment fields
  equipment,
  quantity,
  daysOnMarket,
  inquiryCount,
}) => {
  // Route featured-example to its special page, others to standard listing page
  const href = id === 'featured-example' 
    ? '/marketplace/featured-example' 
    : slug 
      ? `/listings/${slug}` 
      : `/listings/${id}`;
  
  // Handle multiple image formats and convert S3 URLs to proxy URLs
  let rawImageUrl = '/placeholders/listing-no-image.png';
  if (image) {
    rawImageUrl = image;
  } else if (images && images.length > 0) {
    const firstImage = images[0];
    rawImageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url || rawImageUrl;
  }
  // Convert S3 URLs to proxy URLs
  const imageUrl = getImageUrl(rawImageUrl);
  
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

        {/* Single Badge Rule: Elite > Premium > Featured > Verified (show only highest) */}
        {/* S-2.1 & S-2.2: All badges have clarifying tooltips */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {(() => {
            const highestBadge = getHighestBadge({ elite: isElite, premium: isPremium, featured: isFeatured, verified: hasVerifiedBadge });
            if (!highestBadge) return null;
            const style = BADGE_STYLES[highestBadge];
            return (
              <Badge 
                className={cn(style.bg, style.text, 'border-0 text-xs font-semibold cursor-help')}
                title={style.title}
              >
                {style.label}
              </Badge>
            );
          })()}
          {premiumAddOns?.aiEnhanced && (
            <Badge variant="outline" className="bg-white/90 text-navy-900 border-navy-900/20 text-xs cursor-help" title="Listing enhanced with automated optimization">
              ✨ Enhanced
            </Badge>
          )}
        </div>

        {/* Watchlist Button - Always visible, prompts login for anonymous users */}
        <button
          onClick={(e) => {
            e.preventDefault();
            if (onWatchlistToggle) {
              onWatchlistToggle(id);
            }
          }}
          className={cn(
            "absolute top-3 right-3 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center",
            "shadow-sm transition-all duration-200",
            onWatchlistToggle 
              ? "bg-white/90 hover:bg-white cursor-pointer" 
              : "bg-white/60 cursor-default",
            isWatchlisted && "text-status-error",
            !onWatchlistToggle && "text-slate-300"
          )}
          aria-label={!onWatchlistToggle ? 'Sign in to save' : isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          title={!onWatchlistToggle ? 'Sign in to save to watchlist' : isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
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

        {/* Condition Badge */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <Badge variant="outline" className="bg-white/90 text-navy-900 border-0 text-xs capitalize">
            {condition}
          </Badge>
          {/* COMPLIANCE: Regulatory badges (FRA/DOT/Hazmat) removed per enterprise compliance audit.
              Only platform-owned badges (Identity Verified, Sponsored) allowed on listing cards.
              Regulatory claims appear ONLY in listing detail compliance section with disclaimer. */}
          {/* BUYER AUDIT: Quantity badge */}
          {quantity && quantity > 1 && (
            <Badge className="bg-blue-600 text-white border-0 text-xs font-medium">
              {quantity} avail
            </Badge>
          )}
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

          {/* BUYER AUDIT: Equipment Details Line */}
          {equipment && (equipment.reportingMarks || equipment.manufacturer || equipment.yearBuilt) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary mb-2">
              {equipment.reportingMarks && (
                <span className="font-mono font-medium text-navy-900">
                  {equipment.reportingMarks}
                </span>
              )}
              {equipment.yearBuilt && (
                <span>{equipment.yearBuilt}</span>
              )}
              {equipment.manufacturer && equipment.model && (
                <span className="truncate max-w-[120px]">
                  {equipment.manufacturer} {equipment.model}
                </span>
              )}
              {equipment.manufacturer && !equipment.model && (
                <span>{equipment.manufacturer}</span>
              )}
              {equipment.horsepower && (
                <span className="text-text-tertiary">
                  {equipment.horsepower.toLocaleString()} HP
                </span>
              )}
            </div>
          )}

          {/* BUYER AUDIT: Social Proof Line */}
          {(daysOnMarket !== undefined || inquiryCount !== undefined) && (
            <div className="flex items-center gap-2 text-xs text-text-tertiary mb-2">
              {daysOnMarket !== undefined && (
                <span className={cn(
                  daysOnMarket <= 7 && 'text-green-600 font-medium'
                )}>
                  {daysOnMarket <= 1 ? 'New today' : `${daysOnMarket}d ago`}
                </span>
              )}
              {inquiryCount !== undefined && inquiryCount > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {inquiryCount} {inquiryCount === 1 ? 'inquiry' : 'inquiries'}
                </span>
              )}
            </div>
          )}

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
              <VerifiedSellerBadgeCompact />
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

export { ListingCard };
