/**
 * THE RAIL EXCHANGE™ — Featured Contractor Promo Card
 * 
 * A promotional card that looks like a real contractor card but promotes
 * featured placement. Used on the contractors page when no contractors exist.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface FeaturedContractorPromoCardProps {
  className?: string;
}

export const FeaturedContractorPromoCard: React.FC<FeaturedContractorPromoCardProps> = ({
  className,
}) => {
  return (
    <Link
      href="/contractors/onboard"
      className={cn(
        "group bg-white rounded-2xl shadow-card border-2 border-dashed border-emerald-400/40 hover:shadow-elevated hover:border-emerald-500 transition-all duration-300 overflow-hidden",
        className
      )}
    >
      {/* Header with Verified Contractor Image */}
      <div className="h-32 relative overflow-hidden">
        <Image
          src="/verifiedcontractor.png"
          alt="Get Verified"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Verified Badge */}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full shadow-lg">
            ✓ Get Verified
          </span>
        </div>
      </div>

      {/* Logo & Content */}
      <div className="p-6 pt-0 -mt-10 relative">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl border-2 border-white shadow-card flex items-center justify-center overflow-hidden mb-4">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>

        <h3 className="heading-md group-hover:text-emerald-600 transition-colors">
          Become a Verified Contractor
        </h3>
        <p className="text-body-sm text-text-secondary mt-1">
          $24/month • Stand Out from the Crowd
        </p>

        <p className="text-body-sm text-text-secondary mt-3 line-clamp-2">
          Get the verified badge, priority search placement, and build trust with buyers on The Rail Exchange.
        </p>

        {/* Benefits */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-caption font-medium">
            ✓ Verified Badge
          </span>
          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-caption font-medium">
            ✓ Search Priority
          </span>
          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-caption font-medium">
            ✓ More Leads
          </span>
        </div>

        {/* CTA */}
        <div className="mt-4 pt-4 border-t border-surface-border">
          <span className="text-body-sm font-semibold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1">
            Get Verified Now
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
};
