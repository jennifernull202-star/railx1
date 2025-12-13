/**
 * THE RAIL EXCHANGE™ — Admin Dashboard Overview
 * 
 * Main admin dashboard with key metrics and quick actions.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Listing from '@/models/Listing';
import ContractorProfile from '@/models/ContractorProfile';
import AddOnPurchase from '@/models/AddOnPurchase';
import Inquiry from '@/models/Inquiry';
import ListingReport from '@/models/ListingReport';
import Link from 'next/link';

async function getAdminStats() {
  await connectDB();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersThisMonth,
    totalListings,
    activeListings,
    pendingListings,
    newListingsThisWeek,
    totalContractors,
    pendingContractors,
    totalAddOnRevenue,
    recentAddOns,
    totalInquiries,
    // S-1.8: Abuse monitoring signals
    flaggedListings,
    pendingReports,
    spamSuspendedUsers,
    serialReporters,
    // S-14.3: 7-day counts for Trust & Safety Signals panel
    listingsReported7d,
    inquiriesMarkedSpam7d,
    contractorsFlagged,
    sellersFlagged,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Listing.countDocuments(),
    Listing.countDocuments({ status: 'active', isActive: true }),
    Listing.countDocuments({ status: 'pending' }),
    Listing.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ContractorProfile.countDocuments(),
    ContractorProfile.countDocuments({ verificationStatus: 'pending' }),
    AddOnPurchase.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    AddOnPurchase.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Inquiry.countDocuments(),
    // S-1.8: Abuse signals
    Listing.countDocuments({ isFlagged: true, isActive: true }),
    ListingReport.countDocuments({ status: 'pending' }),
    User.countDocuments({ spamSuspendedUntil: { $gt: now } }),
    User.countDocuments({ isSerialReporterFlagged: true }),
    // S-14.3: 7-day counts
    ListingReport.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Inquiry.countDocuments({ status: 'spam', updatedAt: { $gte: sevenDaysAgo } }),
    ContractorProfile.countDocuments({ isFlagged: true }),
    User.countDocuments({ isFlagged: true }),
  ]);

  return {
    users: {
      total: totalUsers,
      newThisMonth: newUsersThisMonth,
    },
    listings: {
      total: totalListings,
      active: activeListings,
      pending: pendingListings,
      newThisWeek: newListingsThisWeek,
    },
    contractors: {
      total: totalContractors,
      pending: pendingContractors,
    },
    revenue: {
      totalAddOns: totalAddOnRevenue[0]?.total || 0,
      recentAddOns,
    },
    inquiries: {
      total: totalInquiries,
    },
    // S-1.8: Abuse signals
    abuse: {
      flaggedListings,
      pendingReports,
      spamSuspendedUsers,
      serialReporters,
      totalIssues: flaggedListings + pendingReports + spamSuspendedUsers + serialReporters,
    },
    // S-14.3: Trust & Safety Signals (7-day counts)
    trustSafety: {
      listingsReported7d,
      inquiriesMarkedSpam7d,
      contractorsFlagged,
      sellersFlagged,
    },
  };
}

export default async function AdminDashboardPage() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return null; // STABILIZATION: Never throw
  }

  if (!session?.user || !session.user.isAdmin) {
    return null; // STABILIZATION: No redirect from RSC
  }

  const stats = await getAdminStats();
  
  const hasPendingActions = stats.listings.pending > 0 || stats.contractors.pending > 0;
  const hasAbuseSignals = stats.abuse.totalIssues > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-xl text-navy-900">Admin Dashboard</h1>
        <p className="text-body-md text-text-secondary mt-2">
          {hasPendingActions 
            ? `You have pending items that need your attention.`
            : `All caught up! No pending approvals.`
          }
        </p>
      </div>

      {/* Pending Actions - Primary Focus */}
      {hasPendingActions ? (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {stats.listings.pending > 0 && (
            <Link
              href="/admin/listings?status=pending"
              className="block p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl hover:bg-amber-100 hover:border-amber-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-navy-900">Pending Listings</p>
                    <p className="text-body-sm text-text-secondary">Review and approve new listings</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 bg-amber-500 text-white text-lg font-bold rounded-full">
                    {stats.listings.pending}
                  </span>
                  <svg className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          )}

          {stats.contractors.pending > 0 && (
            <Link
              href="/admin/contractors?status=pending"
              className="block p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl hover:bg-blue-100 hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-navy-900">Contractor Verifications</p>
                    <p className="text-body-sm text-text-secondary">Verify contractor applications</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 bg-blue-500 text-white text-lg font-bold rounded-full">
                    {stats.contractors.pending}
                  </span>
                  <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          )}
        </div>
      ) : (
        <div className="mb-8 p-8 bg-green-50 border-2 border-green-200 rounded-2xl text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-navy-900 mb-2">All Caught Up!</h2>
          <p className="text-text-secondary">No pending listings or contractor verifications to review.</p>
        </div>
      )}

      {/* Key Stats - Secondary, Compact */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/users" className="bg-white rounded-xl border border-surface-border p-4 hover:border-rail-orange/30 hover:shadow-sm transition-all">
          <p className="text-body-sm text-text-secondary mb-1">Total Users</p>
          <p className="text-xl font-bold text-navy-900">{stats.users.total.toLocaleString()}</p>
          <p className="text-xs text-green-600">+{stats.users.newThisMonth} this month</p>
        </Link>
        <Link href="/admin/listings" className="bg-white rounded-xl border border-surface-border p-4 hover:border-rail-orange/30 hover:shadow-sm transition-all">
          <p className="text-body-sm text-text-secondary mb-1">Active Listings</p>
          <p className="text-xl font-bold text-navy-900">{stats.listings.active.toLocaleString()}</p>
          <p className="text-xs text-text-tertiary">of {stats.listings.total} total</p>
        </Link>
        <Link href="/admin/contractors" className="bg-white rounded-xl border border-surface-border p-4 hover:border-rail-orange/30 hover:shadow-sm transition-all">
          <p className="text-body-sm text-text-secondary mb-1">Contractors</p>
          <p className="text-xl font-bold text-navy-900">{stats.contractors.total.toLocaleString()}</p>
          <p className="text-xs text-text-tertiary">verified providers</p>
        </Link>
        <Link href="/admin/addons" className="bg-white rounded-xl border border-surface-border p-4 hover:border-rail-orange/30 hover:shadow-sm transition-all">
          <p className="text-body-sm text-text-secondary mb-1">Add-On Revenue</p>
          <p className="text-xl font-bold text-navy-900">${(stats.revenue.totalAddOns / 100).toLocaleString()}</p>
          <p className="text-xs text-text-tertiary">{stats.revenue.recentAddOns} this month</p>
        </Link>
      </div>

      {/* S-14.3: Trust & Safety Signals Panel (always visible, read-only counts) */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Trust &amp; Safety Signals
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-body-sm text-text-secondary mb-1">Listings reported</p>
            <p className="text-xl font-bold text-navy-900">{stats.trustSafety.listingsReported7d}</p>
            <p className="text-xs text-text-tertiary">last 7 days</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-body-sm text-text-secondary mb-1">Inquiries marked spam</p>
            <p className="text-xl font-bold text-navy-900">{stats.trustSafety.inquiriesMarkedSpam7d}</p>
            <p className="text-xs text-text-tertiary">last 7 days</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-body-sm text-text-secondary mb-1">Contractors flagged</p>
            <p className="text-xl font-bold text-navy-900">{stats.trustSafety.contractorsFlagged}</p>
            <p className="text-xs text-text-tertiary">if applicable</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-body-sm text-text-secondary mb-1">Sellers flagged</p>
            <p className="text-xl font-bold text-navy-900">{stats.trustSafety.sellersFlagged}</p>
            <p className="text-xs text-text-tertiary">if applicable</p>
          </div>
        </div>
      </div>

      {/* S-1.8: Abuse Monitoring Section */}
      {hasAbuseSignals && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Abuse Monitoring
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/admin/listings?flagged=true" 
              className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-all ${
                stats.abuse.flaggedListings > 0 ? 'border-red-200 bg-red-50' : 'border-surface-border'
              }`}
            >
              <p className="text-body-sm text-text-secondary mb-1">Flagged Listings</p>
              <p className={`text-xl font-bold ${stats.abuse.flaggedListings > 0 ? 'text-red-600' : 'text-navy-900'}`}>
                {stats.abuse.flaggedListings}
              </p>
              <p className="text-xs text-text-tertiary">require review</p>
            </Link>
            <div className={`bg-white rounded-xl border p-4 ${
              stats.abuse.pendingReports > 0 ? 'border-amber-200 bg-amber-50' : 'border-surface-border'
            }`}>
              <p className="text-body-sm text-text-secondary mb-1">Pending Reports</p>
              <p className={`text-xl font-bold ${stats.abuse.pendingReports > 0 ? 'text-amber-600' : 'text-navy-900'}`}>
                {stats.abuse.pendingReports}
              </p>
              <p className="text-xs text-text-tertiary">user reports</p>
            </div>
            <Link 
              href="/admin/users?suspended=true" 
              className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-all ${
                stats.abuse.spamSuspendedUsers > 0 ? 'border-orange-200 bg-orange-50' : 'border-surface-border'
              }`}
            >
              <p className="text-body-sm text-text-secondary mb-1">Spam Suspended</p>
              <p className={`text-xl font-bold ${stats.abuse.spamSuspendedUsers > 0 ? 'text-orange-600' : 'text-navy-900'}`}>
                {stats.abuse.spamSuspendedUsers}
              </p>
              <p className="text-xs text-text-tertiary">users suspended</p>
            </Link>
            <div className={`bg-white rounded-xl border p-4 ${
              stats.abuse.serialReporters > 0 ? 'border-purple-200 bg-purple-50' : 'border-surface-border'
            }`}>
              <p className="text-body-sm text-text-secondary mb-1">Serial Reporters</p>
              <p className={`text-xl font-bold ${stats.abuse.serialReporters > 0 ? 'text-purple-600' : 'text-navy-900'}`}>
                {stats.abuse.serialReporters}
              </p>
              <p className="text-xs text-text-tertiary">flagged accounts</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
