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
  };
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.isAdmin) {
    redirect('/');
  }

  const stats = await getAdminStats();

  const StatCard = ({
    title,
    value,
    subtitle,
    trend,
    href,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: string;
    href?: string;
  }) => (
    <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
      <h3 className="text-body-sm font-medium text-text-secondary mb-2">{title}</h3>
      <p className="text-display-sm font-bold text-navy-900">{value}</p>
      {subtitle && (
        <p className="text-body-sm text-text-tertiary mt-1">{subtitle}</p>
      )}
      {trend && (
        <p className="text-body-sm text-green-600 mt-1">{trend}</p>
      )}
      {href && (
        <Link
          href={href}
          className="inline-block mt-3 text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark"
        >
          View Details →
        </Link>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-xl text-navy-900">Admin Dashboard</h1>
        <p className="text-body-md text-text-secondary mt-2">
          Welcome back! Here&apos;s an overview of your platform.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.users.total.toLocaleString()}
          subtitle={`+${stats.users.newThisMonth} this month`}
          href="/admin/users"
        />
        <StatCard
          title="Active Listings"
          value={stats.listings.active.toLocaleString()}
          subtitle={`${stats.listings.pending} pending approval`}
          href="/admin/listings"
        />
        <StatCard
          title="Contractors"
          value={stats.contractors.total.toLocaleString()}
          subtitle={`${stats.contractors.pending} pending verification`}
          href="/admin/contractors"
        />
        <StatCard
          title="Add-On Revenue"
          value={`$${(stats.revenue.totalAddOns / 100).toLocaleString()}`}
          subtitle={`${stats.revenue.recentAddOns} purchases this month`}
          href="/admin/addons"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
          <h2 className="heading-md text-navy-900 mb-4">Pending Actions</h2>
          <div className="space-y-4">
            {stats.listings.pending > 0 && (
              <Link
                href="/admin/listings?status=pending"
                className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-body-md font-semibold text-navy-900">Pending Listings</p>
                    <p className="text-body-sm text-text-secondary">Review and approve new listings</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-500 text-white text-body-sm font-semibold rounded-full">
                  {stats.listings.pending}
                </span>
              </Link>
            )}

            {stats.contractors.pending > 0 && (
              <Link
                href="/admin/contractors?status=pending"
                className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-body-md font-semibold text-navy-900">Contractor Verifications</p>
                    <p className="text-body-sm text-text-secondary">Verify contractor applications</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-500 text-white text-body-sm font-semibold rounded-full">
                  {stats.contractors.pending}
                </span>
              </Link>
            )}

            {stats.listings.pending === 0 && stats.contractors.pending === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-body-md font-semibold text-navy-900">All caught up!</p>
                    <p className="text-body-sm text-text-secondary">No pending approvals at this time.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
          <h2 className="heading-md text-navy-900 mb-4">Platform Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-surface-border">
              <span className="text-body-md text-text-secondary">Total Listings</span>
              <span className="text-body-md font-semibold text-navy-900">{stats.listings.total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-surface-border">
              <span className="text-body-md text-text-secondary">New Listings (7 days)</span>
              <span className="text-body-md font-semibold text-navy-900">{stats.listings.newThisWeek}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-surface-border">
              <span className="text-body-md text-text-secondary">Total Inquiries</span>
              <span className="text-body-md font-semibold text-navy-900">{stats.inquiries.total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-body-md text-text-secondary">New Users (30 days)</span>
              <span className="text-body-md font-semibold text-navy-900">{stats.users.newThisMonth}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/users"
          className="p-4 bg-white rounded-xl border border-surface-border hover:shadow-md transition-all text-center"
        >
          <svg className="w-8 h-8 text-rail-orange mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-body-md font-medium text-navy-900">Manage Users</span>
        </Link>
        <Link
          href="/admin/listings"
          className="p-4 bg-white rounded-xl border border-surface-border hover:shadow-md transition-all text-center"
        >
          <svg className="w-8 h-8 text-rail-orange mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-body-md font-medium text-navy-900">All Listings</span>
        </Link>
        <Link
          href="/admin/contractors"
          className="p-4 bg-white rounded-xl border border-surface-border hover:shadow-md transition-all text-center"
        >
          <svg className="w-8 h-8 text-rail-orange mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-body-md font-medium text-navy-900">Contractors</span>
        </Link>
        <Link
          href="/admin/analytics"
          className="p-4 bg-white rounded-xl border border-surface-border hover:shadow-md transition-all text-center"
        >
          <svg className="w-8 h-8 text-rail-orange mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-body-md font-medium text-navy-900">Analytics</span>
        </Link>
      </div>
    </div>
  );
}
