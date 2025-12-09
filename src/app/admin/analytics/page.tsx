'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalListings: number;
    totalContractors: number;
    totalInquiries: number;
    totalRevenue: number;
  };
  userGrowth: Array<{ date: string; count: number }>;
  listingsByCategory: Array<{ category: string; count: number }>;
  listingsByStatus: Array<{ status: string; count: number }>;
  topLocations: Array<{ location: string; count: number }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/analytics?range=${dateRange}`);
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A1A]"></div>
      </div>
    );
  }

  // Default data structure if API not yet implemented
  const data = analytics || {
    overview: {
      totalUsers: 0,
      totalListings: 0,
      totalContractors: 0,
      totalInquiries: 0,
      totalRevenue: 0,
    },
    userGrowth: [],
    listingsByCategory: [],
    listingsByStatus: [],
    topLocations: [],
    recentActivity: [],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#0A1A2F]">Analytics Dashboard</h1>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range
                  ? 'bg-[#FF6A1A] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d' && 'Last 7 Days'}
              {range === '30d' && 'Last 30 Days'}
              {range === '90d' && 'Last 90 Days'}
              {range === '1y' && 'Last Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-[#0A1A2F]">{data.overview.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Listings</p>
              <p className="text-3xl font-bold text-[#0A1A2F]">{data.overview.totalListings.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Contractors</p>
              <p className="text-3xl font-bold text-[#0A1A2F]">{data.overview.totalContractors.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Inquiries</p>
              <p className="text-3xl font-bold text-[#0A1A2F]">{data.overview.totalInquiries.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Revenue</p>
              <p className="text-3xl font-bold text-[#0A1A2F]">{formatCurrency(data.overview.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-[#FF6A1A]/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#FF6A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Listings by Category */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-[#0A1A2F] mb-4">Listings by Category</h3>
          {data.listingsByCategory.length > 0 ? (
            <div className="space-y-3">
              {data.listingsByCategory.map((item) => {
                const maxCount = Math.max(...data.listingsByCategory.map((i) => i.count));
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={item.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.category}</span>
                      <span className="text-gray-500">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#FF6A1A] h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No category data available</p>
          )}
        </div>

        {/* Listings by Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-[#0A1A2F] mb-4">Listings by Status</h3>
          {data.listingsByStatus.length > 0 ? (
            <div className="space-y-3">
              {data.listingsByStatus.map((item) => {
                const statusColors: Record<string, string> = {
                  active: 'bg-green-500',
                  pending: 'bg-yellow-500',
                  draft: 'bg-gray-500',
                  sold: 'bg-blue-500',
                  expired: 'bg-red-500',
                };
                const maxCount = Math.max(...data.listingsByStatus.map((i) => i.count));
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={item.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 capitalize">{item.status}</span>
                      <span className="text-gray-500">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${statusColors[item.status] || 'bg-gray-500'} h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No status data available</p>
          )}
        </div>

        {/* Top Locations */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-[#0A1A2F] mb-4">Top Locations</h3>
          {data.topLocations.length > 0 ? (
            <div className="space-y-2">
              {data.topLocations.map((item, index) => (
                <div key={item.location} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                  <span className="flex-1 text-gray-700">{item.location}</span>
                  <span className="text-gray-500">{item.count} listings</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No location data available</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-[#0A1A2F] mb-4">Recent Activity</h3>
          {data.recentActivity.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-[#FF6A1A] mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{activity.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-[#0A1A2F] mb-4">Export Data</h3>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Export Users (CSV)
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Export Listings (CSV)
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Export Revenue Report (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
