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
import SessionRefresher from '@/components/dashboard/SessionRefresher';
import TrialBanner from '@/components/dashboard/TrialBanner';

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
  sellerTier: string | null;
  trialEndsAt: Date | null;
  subscriptionStatus: string | null;
  unreadInquiryCount: number;
}> {
  await connectDB();

  const userObjectId = new Types.ObjectId(userId);

  // Get listing stats, user info, and unread inquiries
  const Inquiry = (await import('@/models/Inquiry')).default;
  
  const [statsResult, recentListings, user, listingIds] = await Promise.all([
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
    User.findById(userId).select('sellerTier isContractor contractorTier sellerSubscriptionStatus subscriptionCurrentPeriodEnd').lean(),
    Listing.find({ sellerId: userObjectId }).select('_id').lean(),
  ]);
  
  // Count unread inquiries for user's listings
  const unreadInquiryCount = await Inquiry.countDocuments({
    listing: { $in: listingIds.map(l => l._id) },
    status: 'new',
  });

  const stats = statsResult[0] || {
    total: 0,
    active: 0,
    draft: 0,
    views: 0,
    featured: 0,
  };

  // Check if user is on a trial (using promo code or Stripe trial)
  const isTrialing = user?.sellerSubscriptionStatus === 'trialing';
  const trialEndsAt = isTrialing && user?.subscriptionCurrentPeriodEnd 
    ? new Date(user.subscriptionCurrentPeriodEnd) 
    : null;

  return {
    stats,
    recentListings: recentListings as unknown as RecentListing[],
    hasSubscription: !!(user?.sellerTier && user.sellerTier !== 'buyer'),
    isContractor: user?.isContractor || user?.contractorTier === 'verified' || false,
    sellerTier: user?.sellerTier || null,
    trialEndsAt,
    subscriptionStatus: user?.sellerSubscriptionStatus || null,
    unreadInquiryCount,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const { stats, recentListings, hasSubscription, isContractor, sellerTier, trialEndsAt, subscriptionStatus, unreadInquiryCount } = await getDashboardData(session.user.id);

  // Calculate days remaining in trial
  const daysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Session Sync - Updates session when subscription changes */}
      <SessionRefresher 
        currentTier={sellerTier || undefined} 
        isContractor={isContractor} 
      />

      {/* S-4.7: Trial Countdown Banner - dismissible, once per session */}
      {subscriptionStatus === 'trialing' && daysRemaining !== null && (
        <TrialBanner daysRemaining={daysRemaining} userId={session.user.id} />
      )}

      {/* Welcome Message for New Users */}
      <WelcomeMessage
        userName={session.user.name?.split(' ')[0] || 'there'}
        hasListings={stats.total > 0}
        hasSubscription={hasSubscription}
        isContractor={isContractor}
      />

      {/* Header with Hero CTA */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-xl mb-1">Welcome back, {session.user.name?.split(' ')[0] || 'there'}!</h1>
          <p className="text-body-md text-text-secondary">
            {stats.active} active {stats.active === 1 ? 'listing' : 'listings'} • {stats.views.toLocaleString()} total views
            {unreadInquiryCount > 0 && (
              <Link href="/dashboard/inquiries" className="ml-2 text-rail-orange font-medium hover:text-rail-orange-dark">
                • {unreadInquiryCount} new {unreadInquiryCount === 1 ? 'inquiry' : 'inquiries'} →
              </Link>
            )}
          </p>
        </div>
        <Link
          href="/listings/create"
          className="btn-primary inline-flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Listing
        </Link>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-4 mb-8 text-body-sm">
        <Link href="/dashboard/listings" className="text-text-secondary hover:text-navy-900 font-medium">
          Manage Listings
        </Link>
        <span className="text-text-tertiary">•</span>
        <Link href="/dashboard/inquiries" className="text-text-secondary hover:text-navy-900 font-medium">
          View Inquiries
        </Link>
        <span className="text-text-tertiary">•</span>
        <Link href="/dashboard/billing" className="text-text-secondary hover:text-navy-900 font-medium">
          Billing
        </Link>
        <span className="text-text-tertiary">•</span>
        <Link href="/dashboard/settings" className="text-text-secondary hover:text-navy-900 font-medium">
          Settings
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

      {/* Premium Add-ons Promo - Secondary placement */}
      {stats.active > 0 && (
        <div className="mt-8 bg-surface-secondary rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-body-sm text-text-secondary">
            <span className="font-medium text-navy-900">Want more visibility?</span> Feature or highlight your listings to get more inquiries.
          </p>
          <Link
            href="/dashboard/listings"
            className="text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark whitespace-nowrap"
          >
            View Add-ons →
          </Link>
        </div>
      )}
    </div>
  );
}
