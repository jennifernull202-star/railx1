/**
 * THE RAIL EXCHANGE™ — Saved Items Page
 * 
 * Shows listings and searches the user has saved/watchlisted.
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import WatchlistItem from '@/models/WatchlistItem';
import SavedSearch from '@/models/SavedSearch';
import { Types } from 'mongoose';

export const metadata: Metadata = {
  title: 'Saved Items | The Rail Exchange',
  description: 'View your saved listings and searches on The Rail Exchange.',
};

interface SavedListing {
  _id: string;
  listingId: {
    _id: string;
    title: string;
    slug: string;
    price: {
      type: string;
      amount?: number;
      currency: string;
    };
    media: Array<{ url: string; type: string }>;
    status: string;
  };
  createdAt: Date;
}

interface SavedSearchItem {
  _id: string;
  name: string;
  query: string;
  filters: Record<string, unknown>;
  notifyOnNew: boolean;
  createdAt: Date;
}

async function getSavedItems(userId: string): Promise<{
  listings: SavedListing[];
  searches: SavedSearchItem[];
}> {
  try {
    await connectDB();
    const userObjectId = new Types.ObjectId(userId);

    const [watchlistItems, savedSearches] = await Promise.all([
      WatchlistItem.find({ userId: userObjectId })
        .populate({
          path: 'listingId',
          select: 'title slug price media status',
        })
        .sort({ createdAt: -1 })
        .lean(),
      SavedSearch.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return {
      listings: watchlistItems as unknown as SavedListing[],
      searches: savedSearches as unknown as SavedSearchItem[],
    };
  } catch {
    return { listings: [], searches: [] };
  }
}

export default async function SavedPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const { listings, searches } = await getSavedItems(session.user.id);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 mb-2">Saved Items</h1>
        <p className="text-slate-500">
          Your watchlisted listings and saved searches.
        </p>
      </div>

      {/* Saved Listings */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">
          Watchlist ({listings.length})
        </h2>
        
        {listings.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-slate-500 mb-4">No saved listings yet</p>
            <Link href="/listings" className="text-rail-orange font-medium hover:underline">
              Browse listings to save your favorites
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((item) => {
              const listing = item.listingId;
              if (!listing) return null;
              
              return (
                <Link 
                  key={item._id} 
                  href={`/listings/${listing.slug}`}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/3] bg-slate-100 relative">
                    {listing.media?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={listing.media[0].url} 
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {listing.status !== 'active' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium uppercase">{listing.status}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-navy-900 line-clamp-1 mb-1">{listing.title}</h3>
                    <p className="text-rail-orange font-semibold">
                      {listing.price?.type === 'fixed' && listing.price?.amount
                        ? `$${listing.price.amount.toLocaleString()}`
                        : listing.price?.type === 'negotiable'
                        ? 'Negotiable'
                        : 'Contact for Price'
                      }
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Saved Searches */}
      <div>
        <h2 className="text-lg font-semibold text-navy-900 mb-4">
          Saved Searches ({searches.length})
        </h2>
        
        {searches.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-slate-500 mb-4">No saved searches yet</p>
            <Link href="/search" className="text-rail-orange font-medium hover:underline">
              Search and save your filters for quick access
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {searches.map((search) => (
              <div key={search._id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-navy-900">{search.name}</h3>
                  <p className="text-sm text-slate-500">
                    {search.query && `"${search.query}"`}
                    {search.notifyOnNew && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Notifications on
                      </span>
                    )}
                  </p>
                </div>
                <Link
                  href={`/search?q=${encodeURIComponent(search.query || '')}`}
                  className="text-sm font-medium text-rail-orange hover:underline"
                >
                  Run Search →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
