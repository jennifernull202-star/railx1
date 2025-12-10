/**
 * THE RAIL EXCHANGE™ — Dashboard Overview
 * 
 * Main dashboard with stats, recent activity, and quick actions.
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Listing from '@/models/Listing';
import User from '@/models/User';
import { Types } from 'mongoose';

import WelcomeMessage from '@/components/dashboard/WelcomeMessage';

export const metadata: Metadata = {
  title: 'Dashboard | The Rail Exchange',
  description: 'Manage your listings, inquiries, and profile on The Rail Exchange.',
};

interface UserListingStats {
  total: number;
  active: number;
  draft: number;
  views: number;
  featured: number;
}

interface RecentListing {
  _id: string;
  title: string;
  slug: string;
  status: string;
  viewCount: number;
  createdAt: Date;
}

async function getDashboardData(userId: string): Promise<{
  stats: UserListingStats;
  recentListings: RecentListing[];
  hasSubscription: boolean;
  isContractor: boolean;
}> {
  await connectDB();

  const userObjectId = new Types.ObjectId(userId);

  // Get listing stats and user info
  const [statsResult, recentListings, user] = await Promise.all([
    Listing.aggregate([
      { $match: { sellerId: userObjectId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          views: { $sum: '$viewCount' },
          featured: { $sum: { $cond: ['$premiumAddOns.featured.active', 1, 0] } },
        },
      },
    ]),
    Listing.find({ sellerId: userObjectId })
      .select('title slug status viewCount createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    User.findById(userId).select('sellerTier role').lean(),
  ]);

  const stats = statsResult[0] || {
    total: 0,
    active: 0,
    draft: 0,
    views: 0,
    featured: 0,
  };

  return {
    stats,
    recentListings: recentListings as unknown as RecentListing[],
    hasSubscription: user?.sellerTier && user.sellerTier !== 'buyer',
    isContractor: user?.role === 'contractor',
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const { stats, recentListings, hasSubscription, isContractor } = await getDashboardData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Message for New Users */}
      <WelcomeMessage
        userName={session.user.name?.split(' ')[0] || 'there'}
        hasListings={stats.total > 0}
        hasSubscription={hasSubscription}
        isContractor={isContractor}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-xl mb-2">Welcome back, {session.user.name?.split(' ')[0] || 'there'}!</h1>
        <p className="text-body-md text-text-secondary">
          Here&apos;s an overview of your account activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Listings"
          value={stats.total}
          icon="listings"
          color="navy"
        />
        <StatCard
          title="Active Listings"
          value={stats.active}
          icon="active"
          color="green"
        />
        <StatCard
          title="Total Views"
          value={stats.views}
          icon="views"
          color="blue"
        />
        <StatCard
          title="Featured"
          value={stats.featured}
          icon="featured"
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/listings/create"
          className="group bg-white rounded-2xl p-6 border border-surface-border hover:border-rail-orange/30 hover:shadow-card transition-all"
        >
          <div className="w-12 h-12 bg-rail-orange/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-rail-orange/20 transition-colors">
            <svg className="w-6 h-6 text-rail-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="heading-md mb-2 group-hover:text-rail-orange transition-colors">Create Listing</h3>
          <p className="text-body-sm text-text-secondary">List your equipment or materials for sale</p>
        </Link>

        <Link
          href="/dashboard/listings"
          className="group bg-white rounded-2xl p-6 border border-surface-border hover:border-rail-orange/30 hover:shadow-card transition-all"
        >
          <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-navy-200 transition-colors">
            <svg className="w-6 h-6 text-navy-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="heading-md mb-2 group-hover:text-rail-orange transition-colors">Manage Listings</h3>
          <p className="text-body-sm text-text-secondary">View and edit your existing listings</p>
        </Link>

        <Link
          href="/dashboard/inquiries"
          className="group bg-white rounded-2xl p-6 border border-surface-border hover:border-rail-orange/30 hover:shadow-card transition-all"
        >
          <div className="w-12 h-12 bg-status-info/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-status-info/20 transition-colors">
            <svg className="w-6 h-6 text-status-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="heading-md mb-2 group-hover:text-rail-orange transition-colors">View Inquiries</h3>
          <p className="text-body-sm text-text-secondary">Respond to buyer questions and offers</p>
        </Link>
      </div>

      {/* Recent Listings */}
      <div className="bg-white rounded-2xl border border-surface-border">
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <h2 className="heading-md">Recent Listings</h2>
          <Link href="/dashboard/listings" className="text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark">
            View All →
          </Link>
        </div>

        {recentListings.length > 0 ? (
          <div className="divide-y divide-surface-border">
            {recentListings.map((listing) => (
              <div key={listing._id} className="flex items-center justify-between p-6">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/listings/${listing.slug}`}
                    className="text-body-md font-medium text-navy-900 hover:text-rail-orange transition-colors line-clamp-1"
                  >
                    {listing.title}
                  </Link>
                  <p className="text-caption text-text-tertiary mt-1">
                    Created {new Date(listing.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded-full text-caption font-medium ${
                    listing.status === 'active'
                      ? 'bg-status-success/10 text-status-success'
                      : listing.status === 'draft'
                      ? 'bg-surface-tertiary text-text-secondary'
                      : 'bg-status-warning/10 text-status-warning'
                  }`}>
                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                  </span>
                  <span className="text-body-sm text-text-secondary">
                    {listing.viewCount} views
                  </span>
                  <Link
                    href={`/dashboard/listings/${listing._id}/edit`}
                    className="text-body-sm font-medium text-text-secondary hover:text-navy-900"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="heading-md mb-2">No listings yet</h3>
            <p className="text-body-md text-text-secondary mb-6">
              Start selling by creating your first listing.
            </p>
            <Link href="/listings/create" className="btn-primary">
              Create Your First Listing
            </Link>
          </div>
        )}
      </div>

      {/* Premium Add-ons Promo */}
      <div className="mt-8 bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="heading-lg mb-2">Boost Your Visibility</h2>
            <p className="text-body-md text-white/80 max-w-xl">
              Get more views and inquiries with premium add-ons. Feature your listings, highlight them in search, and generate professional PDF spec sheets.
            </p>
          </div>
          <Link
            href="/dashboard/listings"
            className="flex-shrink-0 bg-rail-orange hover:bg-rail-orange-dark text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Upgrade Listings
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: 'navy' | 'green' | 'blue' | 'orange';
}) {
  const colorClasses = {
    navy: 'bg-navy-100 text-navy-900',
    green: 'bg-status-success/10 text-status-success',
    blue: 'bg-status-info/10 text-status-info',
    orange: 'bg-rail-orange/10 text-rail-orange',
  };

  const icons: Record<string, React.ReactNode> = {
    listings: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    active: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    views: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    featured: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-surface-border">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          {icons[icon]}
        </div>
      </div>
      <p className="text-display-sm font-bold text-navy-900">{value.toLocaleString()}</p>
      <p className="text-body-sm text-text-secondary">{title}</p>
    </div>
  );
}
