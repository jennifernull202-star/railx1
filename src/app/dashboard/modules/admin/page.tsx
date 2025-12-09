/**
 * THE RAIL EXCHANGE™ — Admin Dashboard Overview
 * 
 * Enterprise control panel for platform administrators.
 */

'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/cards';

interface PlatformStats {
  totalUsers: number;
  totalListings: number;
  totalContractors: number;
  activeListings: number;
  pendingListings: number;
  verifiedContractors: number;
  monthlyRevenue: number;
  newUsersThisMonth: number;
}

interface RecentActivity {
  _id: string;
  type: 'user_registered' | 'listing_created' | 'contractor_verified' | 'payment_received';
  description: string;
  timestamp: string;
  actor?: string;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = React.useState<PlatformStats>({
    totalUsers: 0,
    totalListings: 0,
    totalContractors: 0,
    activeListings: 0,
    pendingListings: 0,
    verifiedContractors: 0,
    monthlyRevenue: 0,
    newUsersThisMonth: 0,
  });
  const [activity, setActivity] = React.useState<RecentActivity[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/activity'),
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }

        if (activityRes.ok) {
          const data = await activityRes.json();
          setActivity(data.activities || []);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return (
          <div className="w-8 h-8 rounded-full bg-status-info/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-status-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case 'listing_created':
        return (
          <div className="w-8 h-8 rounded-full bg-status-success/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'contractor_verified':
        return (
          <div className="w-8 h-8 rounded-full bg-rail-orange/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-rail-orange" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'payment_received':
        return (
          <div className="w-8 h-8 rounded-full bg-status-success/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center">
            <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
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
          <h1 className="text-2xl font-bold text-navy-900">Admin Dashboard</h1>
          <p className="text-text-secondary">Platform overview and management.</p>
        </div>
        <Badge className="bg-status-error text-white border-0">Admin Access</Badge>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          iconColor="blue"
          change={`+${stats.newUsersThisMonth} this month`}
          changeDirection="up"
        />
        <StatCard
          title="Active Listings"
          value={stats.activeListings}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          iconColor="green"
          change={stats.pendingListings > 0 ? `${stats.pendingListings} pending` : undefined}
          changeDirection="up"
        />
        <StatCard
          title="Verified Contractors"
          value={stats.verifiedContractors}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
          iconColor="orange"
          change={`of ${stats.totalContractors} total`}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconColor="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/admin/users"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:border-rail-orange/30 hover:bg-rail-orange/5 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-status-info/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-status-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-navy-900 text-center">Manage Users</span>
              </Link>
              <Link
                href="/admin/listings"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:border-rail-orange/30 hover:bg-rail-orange/5 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-status-success/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-navy-900 text-center">Review Listings</span>
              </Link>
              <Link
                href="/admin/contractors"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:border-rail-orange/30 hover:bg-rail-orange/5 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-rail-orange/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-navy-900 text-center">Verify Contractors</span>
              </Link>
              <Link
                href="/admin/analytics"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:border-rail-orange/30 hover:bg-rail-orange/5 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-status-warning/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-status-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-navy-900 text-center">Analytics</span>
              </Link>
            </div>

            {/* Additional Admin Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <Link
                href="/admin/addons"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:border-rail-orange/30 hover:bg-rail-orange/5 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-navy-900 text-center">Add-Ons</span>
              </Link>
              <Link
                href="/admin/settings"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border-default hover:border-rail-orange/30 hover:bg-rail-orange/5 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-navy-900 text-center">Settings</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-text-tertiary mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-text-secondary text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activity.slice(0, 8).map((item) => (
                  <div key={item._id} className="flex items-start gap-3">
                    {getActivityIcon(item.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-navy-900">{item.description}</p>
                      <p className="text-xs text-text-tertiary">{formatDate(item.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Items Alert */}
      {stats.pendingListings > 0 && (
        <Card className="border-status-warning/30 bg-status-warning/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-status-warning/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-status-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-navy-900">
                  {stats.pendingListings} listing{stats.pendingListings !== 1 ? 's' : ''} pending review
                </h4>
                <p className="text-sm text-text-secondary">
                  Review and approve new listings to make them visible on the marketplace.
                </p>
              </div>
              <Link href="/admin/listings?status=pending">
                <Button size="sm" className="bg-status-warning text-navy-900 hover:bg-status-warning/90">
                  Review Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
