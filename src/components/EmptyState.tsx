/**
 * THE RAIL EXCHANGE™ — Empty State Component
 * 
 * Reusable empty state with icon, title, description, and action.
 * Used when there's no data to display.
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: 'search' | 'listings' | 'messages' | 'notifications' | 'contractors' | 'watchlist' | 'inquiries';
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

const icons = {
  search: (
    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  listings: (
    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  messages: (
    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  notifications: (
    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  contractors: (
    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  watchlist: (
    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  inquiries: (
    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

export function EmptyState({
  icon = 'search',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
        {icons[icon]}
      </div>
      <h3 className="text-[18px] font-semibold text-navy-900 mb-2">{title}</h3>
      <p className="text-[14px] text-slate-500 max-w-sm leading-relaxed mb-6">{description}</p>
      
      {(actionLabel && actionHref) && (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center h-11 px-6 bg-rail-orange text-white text-[14px] font-semibold rounded-xl hover:bg-[#e55f15] transition-colors shadow-sm"
        >
          {actionLabel}
        </Link>
      )}
      
      {(actionLabel && onAction) && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center h-11 px-6 bg-rail-orange text-white text-[14px] font-semibold rounded-xl hover:bg-[#e55f15] transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases
export function NoSearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon="search"
      title="No Results Found"
      description={query ? `We couldn't find any results for "${query}". Try adjusting your search or filters.` : 'Try adjusting your search criteria or browse our categories.'}
      actionLabel="Browse All Listings"
      actionHref="/listings"
    />
  );
}

export function NoListings() {
  return (
    <EmptyState
      icon="listings"
      title="No Listings Yet"
      description="You haven't created any listings yet. Start selling your rail equipment today."
      actionLabel="Create a Listing"
      actionHref="/listings/create"
    />
  );
}

export function NoMessages() {
  return (
    <EmptyState
      icon="messages"
      title="No Messages"
      description="You don't have any messages yet. Start a conversation by contacting a seller."
      actionLabel="Browse Marketplace"
      actionHref="/listings"
    />
  );
}

export function NoNotifications() {
  return (
    <EmptyState
      icon="notifications"
      title="All Caught Up!"
      description="You don't have any notifications. Check back later for updates on your listings and inquiries."
    />
  );
}

export function NoWatchlistItems() {
  return (
    <EmptyState
      icon="watchlist"
      title="Your Watchlist is Empty"
      description="Save listings you're interested in to compare them later."
      actionLabel="Browse Listings"
      actionHref="/listings"
    />
  );
}

export function NoInquiries() {
  return (
    <EmptyState
      icon="inquiries"
      title="No Inquiries Yet"
      description="When buyers inquire about your listings, they'll appear here."
      actionLabel="Promote Your Listing"
      actionHref="/pricing"
    />
  );
}
