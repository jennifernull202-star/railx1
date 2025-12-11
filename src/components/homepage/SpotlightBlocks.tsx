/**
 * THE RAIL EXCHANGE™ — Spotlight Blocks Component
 * 
 * Dual side-by-side blocks for Railcars and Locomotives spotlight.
 * Each block shows top deals with compact cards.
 */

import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

interface SpotlightListing {
  _id: string;
  title: string;
  slug: string;
  category: string;
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
}

interface SpotlightBlocksProps {
  railcars: SpotlightListing[];
  locomotives: SpotlightListing[];
}

function formatPrice(price: SpotlightListing['price']): string {
  if (price.type === 'contact') return 'Contact';
  if (price.type === 'auction') return 'Auction';
  if (!price.amount) return 'Contact';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price.amount);
}

function SpotlightCard({ listing }: { listing: SpotlightListing }) {
  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group flex gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
    >
      {/* Thumbnail */}
      <div className="w-20 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
        {listing.images?.[0]?.url ? (
          <Image
            src={getImageUrl(listing.images[0].url)}
            alt={listing.title}
            width={80}
            height={64}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-medium text-navy-900 truncate group-hover:text-rail-orange transition-colors">
          {listing.title}
        </h4>
        <p className="text-[15px] font-bold text-navy-900 mt-0.5">
          {formatPrice(listing.price)}
        </p>
        {(listing.location?.city || listing.location?.state) && (
          <p className="text-[11px] text-slate-500 truncate">
            {[listing.location.city, listing.location.state].filter(Boolean).join(', ')}
          </p>
        )}
      </div>
    </Link>
  );
}

export function SpotlightBlocks({ railcars, locomotives }: SpotlightBlocksProps) {
  if (railcars.length === 0 && locomotives.length === 0) {
    return null;
  }

  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container-rail max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Railcars Block */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-[18px] font-bold text-navy-900">Railcars For Sale</h3>
              </div>
              <Link
                href="/marketplace/category/railcars"
                className="text-[13px] font-semibold text-rail-orange hover:text-[#e55f15] transition-colors"
              >
                See All →
              </Link>
            </div>
            <div className="p-4 space-y-1">
              {railcars.length > 0 ? (
                railcars.slice(0, 4).map((listing) => (
                  <SpotlightCard key={listing._id} listing={listing} />
                ))
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <svg className="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-[14px]">No railcars listed yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Locomotives Block */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-rail-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-[18px] font-bold text-navy-900">Locomotives</h3>
              </div>
              <Link
                href="/marketplace/category/locomotives"
                className="text-[13px] font-semibold text-rail-orange hover:text-[#e55f15] transition-colors"
              >
                See All →
              </Link>
            </div>
            <div className="p-4 space-y-1">
              {locomotives.length > 0 ? (
                locomotives.slice(0, 4).map((listing) => (
                  <SpotlightCard key={listing._id} listing={listing} />
                ))
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <svg className="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-[14px]">No locomotives listed yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SpotlightBlocks;
