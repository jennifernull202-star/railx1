/**
 * THE RAIL EXCHANGE™ — Analytics Dashboard
 * 
 * Comprehensive analytics for sellers to track performance,
 * views, inquiries, and trends over time.
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Listing from '@/models/Listing';
import { Types } from 'mongoose';

export const metadata: Metadata = {
  title: 'Analytics | The Rail Exchange',
  description: 'Track your listing performance and marketplace insights.',
};

interface AnalyticsData {
  overview: {
    totalListings: number;
    activeListings: number;
    totalViews: number;
    totalInquiries: number;
    avgViewsPerListing: number;
    featuredListings: number;
  };
  topListings: Array<{
    _id: string;
    title: string;
    slug: string;
    viewCount: number;
    inquiryCount: number;
    status: string;
  }>;
  byCategory: Array<{
    category: string;
    count: number;
    views: number;
    inquiries: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
}

async function getAnalyticsData(userId: string): Promise<AnalyticsData> {
  await connectDB();

  const userObjectId = new Types.ObjectId(userId);

  const [overviewResult, topListings, byCategory, byStatus] = await Promise.all([
    // Overview stats
    Listing.aggregate([
      { $match: { sellerId: userObjectId } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          activeListings: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalViews: { $sum: '$viewCount' },
          totalInquiries: { $sum: '$inquiryCount' },
          featuredListings: { $sum: { $cond: ['$premiumAddOns.featured.active', 1, 0] } },
        },
      },
    ]),
    // Top performing listings
    Listing.find({ sellerId: userObjectId })
      .select('title slug viewCount inquiryCount status')
      .sort({ viewCount: -1 })
      .limit(5)
      .lean(),
    // Stats by category
    Listing.aggregate([
      { $match: { sellerId: userObjectId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          views: { $sum: '$viewCount' },
          inquiries: { $sum: '$inquiryCount' },
        },
      },
      { $sort: { views: -1 } },
    ]),
    // Stats by status
    Listing.aggregate([
      { $match: { sellerId: userObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const overview = overviewResult[0] || {
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    totalInquiries: 0,
    featuredListings: 0,
  };

  return {
    overview: {
      ...overview,
      avgViewsPerListing: overview.totalListings > 0
        ? Math.round(overview.totalViews / overview.totalListings)
        : 0,
    },
    topListings: topListings.map((l) => ({
      _id: String(l._id),
      title: l.title,
      slug: l.slug,
      viewCount: l.viewCount || 0,
      inquiryCount: l.inquiryCount || 0,
      status: l.status,
    })),
    byCategory: byCategory.map((c) => ({
      category: c._id,
      count: c.count,
      views: c.views,
      inquiries: c.inquiries,
    })),
    byStatus: byStatus.map((s) => ({
      status: s._id,
      count: s.count,
    })),
  };
}

function getCategoryLabel(value: string): string {
  const labels: Record<string, string> = {
    locomotives: 'Locomotives',
    'railcars-freight': 'Railcars (Freight)',
    'railcars-passenger': 'Railcars (Passenger)',
    'track-equipment': 'Track Equipment',
    'maintenance-equipment': 'Maintenance Equipment',
    'signaling-systems': 'Signaling Systems',
    materials: 'Materials & Parts',
    'tools-safety': 'Tools & Safety',
    other: 'Other',
  };
  return labels[value] || value;
}

export default async function AnalyticsPage() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return null; // STABILIZATION: Never throw in Server Components
  }

  if (!session?.user?.id) {
    return null;
  }

  const data = await getAnalyticsData(session.user.id);

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-status-success', text: 'text-status-success' },
    draft: { bg: 'bg-gray-400', text: 'text-gray-600' },
    pending: { bg: 'bg-status-warning', text: 'text-status-warning' },
    sold: { bg: 'bg-navy-600', text: 'text-navy-600' },
    expired: { bg: 'bg-status-error', text: 'text-status-error' },
  };

  const totalByStatus = data.byStatus.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-xl mb-2">Analytics</h1>
        <p className="text-body-md text-text-secondary">
          Track your listing performance and marketplace insights.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <OverviewCard
          title="Total Views"
          value={data.overview.totalViews}
          icon="eye"
          trend={null}
        />
        <OverviewCard
          title="Total Inquiries"
          value={data.overview.totalInquiries}
          icon="message"
          trend={null}
        />
        <OverviewCard
          title="Avg Views/Listing"
          value={data.overview.avgViewsPerListing}
          icon="chart"
          trend={null}
        />
        <OverviewCard
          title="Active Listings"
          value={data.overview.activeListings}
          icon="check"
          subtitle={`of ${data.overview.totalListings} total`}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Top Performing Listings */}
        <div className="bg-white rounded-2xl border border-surface-border">
          <div className="flex items-center justify-between p-6 border-b border-surface-border">
            <h2 className="heading-md">Top Performing Listings</h2>
            <Link href="/dashboard/listings" className="text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark">
              View All →
            </Link>
          </div>

          {data.topListings.length > 0 ? (
            <div className="divide-y divide-surface-border">
              {data.topListings.map((listing, index) => (
                <div key={listing._id} className="flex items-center gap-4 p-4">
                  <div className="w-8 h-8 bg-surface-secondary rounded-full flex items-center justify-center text-body-sm font-semibold text-text-secondary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/listings/${listing.slug}`}
                      className="text-body-md font-medium text-navy-900 hover:text-rail-orange transition-colors line-clamp-1"
                    >
                      {listing.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-caption text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {listing.viewCount} views
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {listing.inquiryCount} inquiries
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-caption font-medium ${
                    listing.status === 'active'
                      ? 'bg-status-success/10 text-status-success'
                      : 'bg-surface-tertiary text-text-secondary'
                  }`}>
                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-text-secondary">No listings yet</p>
            </div>
          )}
        </div>

        {/* Listings by Status */}
        <div className="bg-white rounded-2xl border border-surface-border">
          <div className="p-6 border-b border-surface-border">
            <h2 className="heading-md">Listings by Status</h2>
          </div>

          {data.byStatus.length > 0 ? (
            <div className="p-6">
              {/* Status Breakdown */}
              <div className="space-y-4">
                {data.byStatus.map((item) => {
                  const percentage = totalByStatus > 0
                    ? Math.round((item.count / totalByStatus) * 100)
                    : 0;
                  const colors = statusColors[item.status] || { bg: 'bg-gray-400', text: 'text-gray-600' };

                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-body-sm font-medium text-navy-900 capitalize">
                          {item.status}
                        </span>
                        <span className="text-body-sm text-text-secondary">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-3 bg-surface-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-surface-border">
                {data.byStatus.map((item) => {
                  const colors = statusColors[item.status] || { bg: 'bg-gray-400', text: 'text-gray-600' };
                  return (
                    <div key={item.status} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                      <span className="text-caption text-text-secondary capitalize">
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-text-secondary">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance by Category */}
      <div className="bg-white rounded-2xl border border-surface-border">
        <div className="p-6 border-b border-surface-border">
          <h2 className="heading-md">Performance by Category</h2>
        </div>

        {data.byCategory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="text-left py-4 px-6 text-body-sm font-medium text-text-secondary">Category</th>
                  <th className="text-right py-4 px-6 text-body-sm font-medium text-text-secondary">Listings</th>
                  <th className="text-right py-4 px-6 text-body-sm font-medium text-text-secondary">Views</th>
                  <th className="text-right py-4 px-6 text-body-sm font-medium text-text-secondary">Inquiries</th>
                  <th className="text-right py-4 px-6 text-body-sm font-medium text-text-secondary">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {data.byCategory.map((item) => {
                  const conversionRate = item.views > 0
                    ? ((item.inquiries / item.views) * 100).toFixed(1)
                    : '0.0';

                  return (
                    <tr key={item.category} className="hover:bg-surface-secondary/50 transition-colors">
                      <td className="py-4 px-6">
                        <span className="text-body-md font-medium text-navy-900">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-body-md text-text-secondary">
                        {item.count}
                      </td>
                      <td className="py-4 px-6 text-right text-body-md text-text-secondary">
                        {item.views.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right text-body-md text-text-secondary">
                        {item.inquiries.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-caption font-medium ${
                          parseFloat(conversionRate) >= 5
                            ? 'bg-status-success/10 text-status-success'
                            : parseFloat(conversionRate) >= 2
                            ? 'bg-status-warning/10 text-status-warning'
                            : 'bg-surface-tertiary text-text-secondary'
                        }`}>
                          {conversionRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-text-secondary">No category data available</p>
          </div>
        )}
      </div>

      {/* Tips Card */}
      <div className="mt-8 bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-shrink-0 w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="heading-md mb-2">Boost Your Performance</h3>
            <p className="text-body-md text-white/80">
              Listings with high-quality photos get 3x more views. Feature your top listings to increase visibility and get more inquiries from serious buyers.
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

function OverviewCard({
  title,
  value,
  icon,
  trend = null,
  subtitle,
}: {
  title: string;
  value: number;
  icon: string;
  trend?: { value: number; positive: boolean } | null;
  subtitle?: string;
}) {
  const icons: Record<string, React.ReactNode> = {
    eye: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    message: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    chart: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    check: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-surface-secondary rounded-xl flex items-center justify-center text-text-secondary">
          {icons[icon]}
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-caption font-medium ${
            trend.positive ? 'text-status-success' : 'text-status-error'
          }`}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-display-sm font-bold text-navy-900">{value.toLocaleString()}</p>
      <p className="text-body-sm text-text-secondary">{title}</p>
      {subtitle && (
        <p className="text-caption text-text-tertiary mt-1">{subtitle}</p>
      )}
    </div>
  );
}
