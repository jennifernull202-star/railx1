/**
 * THE RAIL EXCHANGE™ — Watchlist Empty State Component
 * 
 * UX Item #7: Buyer Watchlist — Empty State Education
 * Shows instructional copy explaining how to save listings.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function WatchlistEmptyState() {
  const [eventLogged, setEventLogged] = useState(false);

  // UX Item #7: Log empty state shown event (once per render)
  useEffect(() => {
    if (!eventLogged) {
      console.log('[EVENT] buyer_watchlist_empty_state_shown');
      setEventLogged(true);
    }
  }, [eventLogged]);

  const handleBrowseClick = () => {
    console.log('[EVENT] buyer_watchlist_browse_clicked');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <p className="text-slate-600 font-medium mb-2">No saved listings yet</p>
      <p className="text-slate-500 text-sm mb-4">
        Save listings by clicking the heart icon on any listing card or detail page.
      </p>
      <Link 
        href="/listings" 
        className="text-rail-orange font-medium hover:underline"
        onClick={handleBrowseClick}
      >
        Browse Listings
      </Link>
    </div>
  );
}
