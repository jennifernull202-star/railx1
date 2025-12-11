/**
 * THE RAIL EXCHANGE™ — Seller Dashboard Overview
 * 
 * Primary dashboard view for sellers. Shows listings, analytics, and inquiries.
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

interface Listing {
  _id: string;
  title: string;
  price: number;
  images: string[];
  status: string;
  views: number;
  createdAt: string;
}

interface Inquiry {
  _id: string;
  listingId: {
    _id: string;
    title: string;
  };
  name: string;
  email: string;
  message: string;
  createdAt: string;
  status: string;
}

interface Analytics {
  totalViews: number;
  totalInquiries: number;
  activeListings: number;
  soldListings: number;
}

export default function SellerDashboard() {
  const { data: session } = useSession();
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [inquiries, setInquiries] = React.useState<Inquiry[]>([]);
  const [analytics, setAnalytics] = React.useState<Analytics>({
    totalViews: 0,
    totalInquiries: 0,
    activeListings: 0,
    soldListings: 0,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingsRes, inquiriesRes] = await Promise.all([
          fetch('/api/listings?seller=me'),
          fetch('/api/inquiries?seller=me'),
        ]);

        if (listingsRes.ok) {
          const data = await listingsRes.json();
          setListings(data.listings || []);
          
          // Calculate analytics from listings
          const active = data.listings.filter((l: Listing) => l.status === 'active').length;
          const sold = data.listings.filter((l: Listing) => l.status === 'sold').length;
          const views = data.listings.reduce((acc: number, l: Listing) => acc + (l.views || 0), 0);
          
          setAnalytics((prev) => ({
            ...prev,
            activeListings: active,
            soldListings: sold,
            totalViews: views,
          }));
        }

        if (inquiriesRes.ok) {
          const data = await inquiriesRes.json();
          setInquiries(data.inquiries || []);
          setAnalytics((prev) => ({
            ...prev,
            totalInquiries: data.inquiries?.length || 0,
          }));
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface-secondary rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Seller Dashboard</h1>
          <p className="text-text-secondary">Manage your listings and track performance.</p>
        </div>
        <Link href="/listings/create">
          <Button className="bg-rail-orange hover:bg-rail-orange-dark">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Listing
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Listings"
          value={analytics.activeListings}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          iconColor="blue"
        />
        <StatCard
          title="Total Views"
          value={analytics.totalViews}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
          iconColor="green"
        />
        <StatCard
          title="Inquiries"
          value={analytics.totalInquiries}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
          iconColor="orange"
        />
        <StatCard
          title="Items Sold"
          value={analytics.soldListings}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconColor="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Listings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Your Listings</CardTitle>
            <Link href="/dashboard/listings">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-text-tertiary mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-text-secondary mb-3">No listings yet</p>
                <Link href="/listings/create">
                  <Button size="sm" className="bg-rail-orange hover:bg-rail-orange-dark">
                    Create Your First Listing
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.slice(0, 5).map((listing) => (
                  <Link
                    key={listing._id}
                    href={`/listings/${listing._id}`}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border-default hover:border-rail-orange/30 hover:bg-rail-orange/5 transition-all"
                  >
                    <div className="w-16 h-12 bg-surface-secondary rounded overflow-hidden flex-shrink-0">
                      {listing.images?.[0] ? (
                        <img
                          src={getImageUrl(listing.images[0])}
                          alt={listing.title}
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
                      <h4 className="font-medium text-navy-900 truncate">{listing.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-text-tertiary">
                        <span>{formatPrice(listing.price)}</span>
                        <span>•</span>
                        <span>{listing.views || 0} views</span>
                      </div>
                    </div>
                    <Badge
                      variant={listing.status === 'active' ? 'default' : 'secondary'}
                      className={
                        listing.status === 'active'
                          ? 'bg-status-success text-white border-0'
                          : listing.status === 'sold'
                          ? 'bg-status-info text-white border-0'
                          : ''
                      }
                    >
                      {listing.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Inquiries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Inquiries</CardTitle>
            <Link href="/dashboard/inquiries">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {inquiries.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-text-tertiary mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-text-secondary text-sm">No inquiries yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.slice(0, 5).map((inquiry) => (
                  <div
                    key={inquiry._id}
                    className="p-3 rounded-lg border border-border-default"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-navy-900">{inquiry.name}</span>
                      <span className="text-xs text-text-tertiary">{formatDate(inquiry.createdAt)}</span>
                    </div>
                    <p className="text-xs text-text-secondary truncate mb-2">{inquiry.message}</p>
                    <p className="text-xs text-rail-orange">
                      Re: {inquiry.listingId?.title || 'Unknown listing'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tips to Improve Your Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-surface-secondary rounded-lg">
              <div className="w-8 h-8 rounded-full bg-rail-orange/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-navy-900 text-sm">Add More Photos</h4>
                <p className="text-xs text-text-secondary">Listings with 5+ photos get 3x more views</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-surface-secondary rounded-lg">
              <div className="w-8 h-8 rounded-full bg-rail-orange/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-navy-900 text-sm">Complete All Details</h4>
                <p className="text-xs text-text-secondary">Full specs help buyers make decisions faster</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-surface-secondary rounded-lg">
              <div className="w-8 h-8 rounded-full bg-rail-orange/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-navy-900 text-sm">Respond Quickly</h4>
                <p className="text-xs text-text-secondary">Fast responses lead to 2x more sales</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
