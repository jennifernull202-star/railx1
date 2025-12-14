/**
 * THE RAIL EXCHANGE™ — Listings Block
 * 
 * Displays listings for seller entities.
 * NO auth. NO enforcement. Pure display.
 * 
 * Empty state: "Be the First Seller" pattern from marketplace.
 */

import Image from 'next/image';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { ENTITY_TYPES } from '@/types/entity';
import { ListingsBlockProps } from '../types';

export function ListingsBlock({ entity, maxItems = 6, showEmptyState = false }: ListingsBlockProps) {
  // Only render for sellers
  if (!entity || entity.type !== ENTITY_TYPES.SELLER) {
    return null;
  }

  // Check entitlements
  if (!entity.entitlements.canDisplayListings) {
    return null;
  }

  const listings = entity.listings || [];
  const hasListings = listings.length > 0;

  // If no listings and showEmptyState is false, hide block
  if (!hasListings && !showEmptyState) {
    return null;
  }

  const displayedListings = listings.slice(0, maxItems);
  const hasMore = listings.length > maxItems;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-400" />
          Active Listings
        </h2>
        {hasListings && (
          <span className="text-sm text-gray-500">{listings.length} item{listings.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {hasListings ? (
        <>
          {/* Listings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayedListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Listing Image */}
                <div className="aspect-[4/3] relative bg-gray-200">
                  {listing.primaryImageUrl ? (
                    <Image
                      src={listing.primaryImageUrl}
                      alt={listing.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Listing Info */}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                    {listing.title}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-500">{listing.category}</span>
                    {listing.price && (
                      <span className="font-semibold text-gray-900">
                        ${listing.price.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {listing.condition && (
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                      {listing.condition}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* View More Link */}
          {hasMore && (
            <div className="mt-4 text-center">
              <Link
                href={`/listings?seller=${entity.id}`}
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                View all {listings.length} listings →
              </Link>
            </div>
          )}
        </>
      ) : (
        /* Empty State - "Be the First Seller" Pattern */
        <div className="text-center py-10">
          <svg className="w-14 h-14 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-[18px] font-bold text-navy-900 mb-2">No Active Listings</h3>
          <p className="text-[14px] text-slate-500 max-w-xs mx-auto leading-relaxed">
            This seller hasn&apos;t listed any equipment yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default ListingsBlock;
