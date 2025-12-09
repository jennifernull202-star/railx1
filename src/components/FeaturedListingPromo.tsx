/**
 * THE RAIL EXCHANGE™ — Featured Listing Promo Component
 * 
 * Displayed when no listings exist in a category.
 * Promotes the Featured Listing Example and premium placements.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FeaturedListingPromoProps {
  category?: string;
  className?: string;
}

export function FeaturedListingPromo({ category, className }: FeaturedListingPromoProps) {
  return (
    <div className={cn("text-center py-16", className)}>
      {/* Empty State Icon */}
      <div className="w-20 h-20 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-10 h-10 text-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>

      {/* Message */}
      <h3 className="text-xl font-semibold text-navy-900 mb-2">
        {category ? `No ${category} listings yet` : 'No listings available'}
      </h3>
      <p className="text-text-secondary max-w-md mx-auto mb-8">
        Be the first to list your equipment in this category and reach thousands of rail industry professionals.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/listings/create">
          <Button className="bg-rail-orange hover:bg-rail-orange-dark text-white px-6">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            List Your Equipment
          </Button>
        </Link>
        <Link href="/marketplace/featured-example">
          <Button variant="outline" className="border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white px-6">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            View Featured Example
          </Button>
        </Link>
      </div>

      {/* Premium Placements Info */}
      <div className="mt-12 pt-8 border-t border-border-default">
        <p className="text-sm text-text-tertiary mb-4">
          Boost your listing visibility with premium placements
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-text-secondary">Featured — $25/mo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm text-text-secondary">Premium — $50/mo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-text-secondary">Elite — $99/mo</span>
          </div>
        </div>
        <Link 
          href="/pricing" 
          className="inline-block mt-4 text-sm text-rail-orange hover:underline"
        >
          Learn more about premium placements →
        </Link>
      </div>
    </div>
  );
}

export default FeaturedListingPromo;
