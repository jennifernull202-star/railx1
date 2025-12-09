/**
 * THE RAIL EXCHANGE™ — Featured Listing Promo Card
 * 
 * A promotional card that looks like a real listing card but promotes
 * featured placement. Used on every marketplace page instead of fake data.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface FeaturedListingPromoCardProps {
  className?: string;
}

export const FeaturedListingPromoCard: React.FC<FeaturedListingPromoCardProps> = ({
  className,
}) => {
  return (
    <Link href="/marketplace/featured-example">
      <Card className={cn(
        "group overflow-hidden rounded-xl border-2 border-dashed border-amber-400/40 bg-gradient-to-br from-amber-50 to-orange-50",
        "hover:shadow-lg hover:border-amber-500 transition-all duration-300 cursor-pointer",
        className
      )}>
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* Elite Badge */}
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-amber-500 text-white border-0 shadow-lg">
              👑 Elite Spot
            </Badge>
          </div>

          {/* Elite Placement Image */}
          <Image
            src="/elite-placement.png"
            alt="Elite Placement Example"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-rail-orange/0 group-hover:bg-rail-orange/10 transition-colors" />
        </div>

        {/* Card Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-navy-900 text-lg mb-1 group-hover:text-amber-600 transition-colors">
            Get Elite Placement
          </h3>

          {/* Price Area */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-amber-600">Maximum Visibility</span>
          </div>

          {/* Benefits List */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Top of category</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Priority in search</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>More visibility</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-600 group-hover:underline">
              Learn More →
            </span>
            <Badge variant="outline" className="border-amber-500/30 text-amber-600 text-xs">
              Elite
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default FeaturedListingPromoCard;
