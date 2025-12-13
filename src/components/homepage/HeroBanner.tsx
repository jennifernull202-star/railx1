/**
 * THE RAIL EXCHANGE™ — Hero Banner Component
 * 
 * Full-width Amazon-style hero with rotating carousel option.
 * Height: 480px desktop / 360px mobile
 */

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface HeroSlide {
  headline: string;
  subheadline: string;
  cta: string;
  ctaLink: string;
  bgImage?: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    headline: 'Buy. Sell. Rent. Build.',
    subheadline: 'The Entire Rail Industry in One Marketplace.',
    cta: 'Browse Listings',
    ctaLink: '/listings',
  },
  {
    headline: 'Locomotives For Sale',
    subheadline: 'Browse 200+ units from sellers nationwide.',
    cta: 'Shop Locomotives',
    ctaLink: '/marketplace/category/locomotives',
  },
  {
    headline: 'Railcars & Rolling Stock',
    subheadline: 'Freight, tank, hoppers, gondolas & more.',
    cta: 'Browse Railcars',
    ctaLink: '/marketplace/category/railcars',
  },
  {
    headline: 'Rail Contractors Directory',
    subheadline: 'Find contractors with reviewed credentials.',
    cta: 'Find Contractors',
    ctaLink: '/contractors',
  },
  {
    headline: 'Track Materials & Tools',
    subheadline: 'Rail, ties, spikes, switches, and equipment.',
    cta: 'Shop Materials',
    ctaLink: '/marketplace/category/track-materials',
  },
];

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section 
      className="relative h-[360px] md:h-[420px] lg:h-[480px] bg-navy-900 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: `url('/railxphoto.png')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-900/90 via-navy-900/70 to-navy-900/40" />
      
      {/* Content */}
      <div className="relative h-full container-rail max-w-[1440px] mx-auto px-4 md:px-8 flex items-center">
        <div className="max-w-2xl">
          {/* Animated Content */}
          <div 
            key={currentSlide}
            className="animate-fadeIn"
          >
            <h1 className="text-[32px] md:text-[42px] lg:text-[48px] font-bold text-white leading-[1.1] tracking-tight mb-4 md:mb-5">
              {slide.headline}
            </h1>
            <p className="text-[16px] md:text-[18px] lg:text-[20px] text-white/80 mb-6 md:mb-8 leading-relaxed">
              {slide.subheadline}
            </p>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <Link
                href={slide.ctaLink}
                className="inline-flex items-center justify-center h-12 md:h-14 px-6 md:px-8 bg-rail-orange text-white text-[15px] md:text-[16px] font-semibold rounded-xl hover:bg-[#e55f15] shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {slide.cta}
              </Link>
              <Link
                href="/contractors"
                className="inline-flex items-center justify-center h-12 md:h-14 px-6 md:px-8 bg-white/10 backdrop-blur text-white text-[15px] md:text-[16px] font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
              >
                Find Contractors
              </Link>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="flex items-center gap-2 mt-8 md:mt-10">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide 
                    ? 'w-8 bg-rail-orange' 
                    : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Arrows (Desktop only) */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
        className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white/10 backdrop-blur rounded-full text-white hover:bg-white/20 transition-all"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
        className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white/10 backdrop-blur rounded-full text-white hover:bg-white/20 transition-all"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Category Quick Links (Mobile) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy-900 via-navy-900/80 to-transparent pt-12 pb-4 md:hidden">
        <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
          {['Locomotives', 'Railcars', 'Materials', 'Contractors'].map((cat) => (
            <Link
              key={cat}
              href={cat === 'Contractors' ? '/contractors' : `/listings?category=${cat.toLowerCase()}`}
              className="flex-shrink-0 px-4 py-2 bg-white/10 backdrop-blur text-white text-[13px] font-medium rounded-full border border-white/10"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HeroBanner;
