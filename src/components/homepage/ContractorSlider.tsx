/**
 * THE RAIL EXCHANGE™ — Contractor Slider Component
 * 
 * Location-based contractor recommendations similar to Amazon's "Recommended for you".
 * Shows 8 contractor cards in a horizontal scroll.
 */

'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

interface Contractor {
  _id: string;
  businessName: string;
  logo?: string;
  services: string[];
  address?: {
    city?: string;
    state?: string;
  };
  verificationStatus?: string;
  rating?: number;
  reviewCount?: number;
}

interface ContractorSliderProps {
  contractors: Contractor[];
  location?: string;
}

const SERVICE_LABELS: Record<string, string> = {
  'track-construction': 'Track Construction',
  'track-maintenance': 'Track Maintenance',
  'signal-systems': 'Signal Systems',
  'welding': 'Welding',
  'vegetation-control': 'Vegetation',
  'bridge-repair': 'Bridge Repair',
  'demolition': 'Demolition',
  'inspection': 'Inspection',
  'consulting': 'Consulting',
};

export function ContractorSlider({ contractors, location }: ContractorSliderProps) {
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
  }, [contractors]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 220 * 2; // Scroll 2 cards at a time
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (contractors.length === 0) {
    return null;
  }

  return (
    <section className="py-10 md:py-14 bg-slate-50">
      <div className="container-rail max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-rail-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-[22px] md:text-[26px] font-bold text-navy-900 tracking-tight">
              {location ? `Contractors Near ${location}` : 'Contractors Nationwide'}
            </h2>
          </div>
          <Link
            href="/contractors"
            className="text-[14px] font-semibold text-navy-900 hover:text-rail-orange transition-colors flex items-center gap-1"
          >
            View All
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
            {contractors.map((contractor) => (
              <Link
                key={contractor._id}
                href={`/contractors/${contractor._id}`}
                className="flex-shrink-0 w-[200px] bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-slate-200 transition-all duration-200 overflow-hidden p-4 group"
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Logo & Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {contractor.logo ? (
                      <Image
                        src={getImageUrl(contractor.logo)}
                        alt={contractor.businessName}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-lg font-bold text-slate-400">
                        {contractor.businessName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold text-navy-900 truncate group-hover:text-rail-orange transition-colors">
                      {contractor.businessName}
                    </h3>
                    {(contractor.address?.city || contractor.address?.state) && (
                      <p className="text-[11px] text-slate-500 truncate">
                        {[contractor.address.city, contractor.address.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rating */}
                {contractor.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[12px] font-medium text-navy-900">
                      {contractor.rating.toFixed(1)}
                    </span>
                    {contractor.reviewCount && (
                      <span className="text-[11px] text-slate-400">
                        ({contractor.reviewCount})
                      </span>
                    )}
                  </div>
                )}

                {/* Services */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {contractor.services.slice(0, 2).map((service) => (
                    <span
                      key={service}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                    >
                      {SERVICE_LABELS[service] || service}
                    </span>
                  ))}
                  {contractor.services.length > 2 && (
                    <span className="text-[10px] text-slate-400">
                      +{contractor.services.length - 2}
                    </span>
                  )}
                </div>

                {/* Verified Badge */}
                {contractor.verificationStatus === 'verified' && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[11px] font-medium">Verified</span>
                  </div>
                )}

                {/* CTA */}
                <button className="mt-3 w-full py-2 text-[12px] font-semibold text-rail-orange border border-rail-orange rounded-lg hover:bg-rail-orange hover:text-white transition-colors">
                  Request Quote
                </button>
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

export default ContractorSlider;
