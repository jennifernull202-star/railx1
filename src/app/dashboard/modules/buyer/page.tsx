/**
 * THE RAIL EXCHANGE™ — Buyer Dashboard Overview
 * 
 * Primary dashboard view for buyers. Shows saved searches, watchlist, and recent activity.
 */

'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/cards';

interface SavedSearch {
  _id: string;
  name: string;
  criteria: Record<string, unknown>;
  lastRun?: string;
  matchCount: number;
}

interface WatchlistItem {
  _id: string;
  listing: {
    _id: string;
    title: string;
    price: number;
    images: string[];
    status: string;
  };
  createdAt: string;
}

export default function BuyerDashboard() {
  const { data: session } = useSession();
  const [savedSearches, setSavedSearches] = React.useState<SavedSearch[]>([]);
  const [watchlist, setWatchlist] = React.useState<WatchlistItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [searchesRes, watchlistRes] = await Promise.all([
          fetch('/api/savedsearches'),
          fetch('/api/watchlist'),
        ]);

        if (searchesRes.ok) {
          const data = await searchesRes.json();
          setSavedSearches(data.savedSearches || []);
        }

        if (watchlistRes.ok) {
          const data = await watchlistRes.json();
          setWatchlist(data.items || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface-secondary rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface-secondary rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-surface-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Welcome back, {session?.user?.name?.split(' ')[0]}</h1>
        <p className="text-text-secondary">Here&apos;s what&apos;s happening with your searches and watchlist.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Saved Searches"
          value={savedSearches.length}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          iconColor="blue"
        />
        <StatCard
          title="Watchlist Items"
          value={watchlist.length}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          iconColor="red"
        />
        <StatCard
          title="New Matches"
          value={savedSearches.reduce((acc, s) => acc + (s.matchCount || 0), 0)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          iconColor="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved Searches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Saved Searches</CardTitle>
            <Link href="/dashboard/saved">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {savedSearches.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-text-tertiary mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-text-secondary mb-3">No saved searches yet</p>
                <Link href="/search">
                  <Button size="sm" className="bg-rail-orange hover:bg-rail-orange-dark">
                    Search Equipment
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {savedSearches.slice(0, 5).map((search) => (
                  <Link
                    key={search._id}
                    href={`/search?saved=${search._id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border-default hover:border-rail-orange/30 hover:bg-rail-orange/5 transition-all"
                  >
                    <div>
                      <h4 className="font-medium text-navy-900">{search.name}</h4>
                      <p className="text-xs text-text-tertiary">
                        {search.lastRun
                          ? `Last run: ${new Date(search.lastRun).toLocaleDateString()}`
                          : 'Never run'}
                      </p>
                    </div>
                    {search.matchCount > 0 && (
                      <Badge className="bg-status-success text-white border-0">
                        {search.matchCount} new
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Watchlist */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Watchlist</CardTitle>
            <Link href="/dashboard/saved?tab=watchlist">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {watchlist.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-text-tertiary mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <p className="text-text-secondary mb-3">Your watchlist is empty</p>
                <Link href="/listings">
                  <Button size="sm" className="bg-rail-orange hover:bg-rail-orange-dark">
                    Browse Listings
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {watchlist.slice(0, 5).map((item) => (
                  <Link
                    key={item._id}
                    href={`/listings/${item.listing._id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border-default hover:border-rail-orange/30 hover:bg-rail-orange/5 transition-all"
                  >
                    <div className="w-16 h-12 bg-surface-secondary rounded overflow-hidden flex-shrink-0">
                      {item.listing.images?.[0] ? (
                        <img
                          src={getImageUrl(item.listing.images[0])}
                          alt={item.listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-navy-900 truncate">{item.listing.title}</h4>
                      <p className="text-sm text-rail-orange font-semibold">
                        {formatPrice(item.listing.price)}
                      </p>
                    </div>
                    <Badge
                      variant={item.listing.status === 'active' ? 'default' : 'secondary'}
                      className={item.listing.status === 'active' ? 'bg-status-success text-white border-0' : ''}
                    >
                      {item.listing.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/search"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:border-rail-orange/30 hover:bg-rail-orange/5 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-rail-orange/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-navy-900">Search</span>
            </Link>
            <Link
              href="/contractors"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:border-rail-orange/30 hover:bg-rail-orange/5 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-rail-orange/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-navy-900">Contractors</span>
            </Link>
            <Link
              href="/dashboard/messages"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:border-rail-orange/30 hover:bg-rail-orange/5 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-rail-orange/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-navy-900">Messages</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:border-rail-orange/30 hover:bg-rail-orange/5 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-rail-orange/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-navy-900">Settings</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
