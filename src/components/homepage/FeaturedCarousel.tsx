/**
 * THE RAIL EXCHANGE™ — Featured Carousel Component
 * 
 * Amazon-style horizontal scrolling row for elite/featured listings.
 * Desktop: 6 cards visible, Mobile: 2 cards visible
 * Card width: 180px fixed
 */

'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { EQUIPMENT_TYPES } from '@/lib/constants';

export interface FeaturedListing {
  _id: string;
  title: string;
  slug: string;
  category: string;
  condition: string;
  price: {
    type: string;
    amount?: number;
    currency: string;
  };
  images?: Array<{ url: string; alt?: string }>;
  location: {
    city?: string;
    state?: string;
  };
  premiumAddOns?: {
    featured?: { active: boolean };
    premium?: { active: boolean };
    elite?: { active: boolean };
  };
}

interface FeaturedCarouselProps {
  listings: FeaturedListing[];
  title?: string;
}

function getCategoryLabel(value: string): string {
  const category = EQUIPMENT_TYPES.find(t => t.value === value);
  return category?.label || value;
}

function formatPrice(price: FeaturedListing['price']): string {
  if (price.type === 'contact') return 'Contact';
  if (price.type === 'auction') return 'Auction';
  if (!price.amount) return 'Contact';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price.amount);
}

function getTierBadge(listing: FeaturedListing) {
  if (listing.premiumAddOns?.elite?.active) {
    return (
      <span className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold rounded shadow-sm">
        ★ ELITE
      </span>
    );
  }
  if (listing.premiumAddOns?.premium?.active) {
    return (
      <span className="absolute top-2 left-2 px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded shadow-sm">
        PREMIUM
      </span>
    );
  }
  if (listing.premiumAddOns?.featured?.active) {
    return (
      <span className="absolute top-2 left-2 px-2 py-0.5 bg-rail-orange text-white text-[10px] font-bold rounded shadow-sm">
        FEATURED
      </span>
    );
  }
  return null;
}

export function FeaturedCarousel({ listings, title = "Elite Listings" }: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [listings]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200 * 3; // Scroll 3 cards at a time
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="py-10 md:py-14 bg-slate-50">
      <div className="container-rail max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-rail-orange rounded-full" />
            <h2 className="text-[22px] md:text-[26px] font-bold text-navy-900 tracking-tight">
              {title}
            </h2>
          </div>
          <Link
            href="/listings?featured=true"
            className="text-[14px] font-semibold text-navy-900 hover:text-rail-orange transition-colors flex items-center gap-1"
          >
            See All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-navy-900 hover:bg-slate-50 transition-colors -ml-2 md:-ml-5"
              aria-label="Scroll left"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Scrollable Row */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {listings.map((listing) => (
              <Link
                key={listing._id}
                href={`/listings/${listing.slug}`}
                className="flex-shrink-0 w-[180px] bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-slate-200 transition-all duration-200 overflow-hidden group"
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Image */}
                <div className="relative h-[140px] bg-slate-100 overflow-hidden">
                  {listing.images?.[0]?.url ? (
                    <Image
                      src={getImageUrl(listing.images[0].url)}
                      alt={listing.images[0].alt || listing.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {getTierBadge(listing)}
                </div>

                {/* Content */}
                <div className="p-3">
                  <p className="text-[11px] font-medium text-rail-orange mb-1 truncate">
                    {getCategoryLabel(listing.category)}
                  </p>
                  <h3 className="text-[13px] font-semibold text-navy-900 line-clamp-2 mb-2 group-hover:text-rail-orange transition-colors min-h-[36px]">
                    {listing.title}
                  </h3>
                  <p className="text-[16px] font-bold text-navy-900 mb-1">
                    {formatPrice(listing.price)}
                  </p>
                  {(listing.location?.city || listing.location?.state) && (
                    <p className="text-[11px] text-slate-500 truncate">
                      {[listing.location.city, listing.location.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-navy-900 hover:bg-slate-50 transition-colors -mr-2 md:-mr-5"
              aria-label="Scroll right"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default FeaturedCarousel;
