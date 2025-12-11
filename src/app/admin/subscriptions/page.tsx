/**
 * THE RAIL EXCHANGE™ — Admin Subscription Reports
 * 
 * View subscription analytics, tier breakdowns, and user upgrade patterns.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Crown,
  RefreshCw,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface SubscriptionMetrics {
  tierBreakdown: Array<{
    tier: string;
    count: number;
    revenue: number;
    percentageOfTotal: number;
  }>;
  monthlyGrowth: {
    newSubscriptions: number;
    cancellations: number;
    upgrades: number;
    downgrades: number;
    netGrowth: number;
  };
  mrr: {
    current: number;
    lastMonth: number;
    growthPercent: number;
  };
  recentSubscribers: Array<{
    userId: string;
    email: string;
    tier: string;
    startDate: string;
    status: string;
  }>;
  churnRate: number;
  avgLifetimeValue: number;
}

export default function AdminSubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "1y">("30d");

  // Redirect non-admins
  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/dashboard");
    } else if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, session, router]);

  // Fetch subscription metrics
  const fetchMetrics = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/metrics?range=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription metrics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchMetrics();
    }
  }, [session, timeRange]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Mock data for demonstration
  const displayMetrics: SubscriptionMetrics = metrics || {
    tierBreakdown: [
      { tier: "Starter", count: 28, revenue: 83720, percentageOfTotal: 40 },
      { tier: "Professional", count: 15, revenue: 89850, percentageOfTotal: 21 },
      { tier: "Enterprise", count: 4, revenue: 47600, percentageOfTotal: 6 },
      { tier: "Free", count: 156, revenue: 0, percentageOfTotal: 33 },
    ],
    monthlyGrowth: {
      newSubscriptions: 18,
      cancellations: 4,
      upgrades: 7,
      downgrades: 2,
      netGrowth: 14,
    },
    mrr: {
      current: 22117,
      lastMonth: 19450,
      growthPercent: 13.7,
    },
    recentSubscribers: [
      { userId: "1", email: "john@example.com", tier: "Professional", startDate: new Date().toISOString(), status: "active" },
      { userId: "2", email: "sarah@railco.com", tier: "Starter", startDate: new Date(Date.now() - 86400000).toISOString(), status: "active" },
      { userId: "3", email: "mike@trains.io", tier: "Starter", startDate: new Date(Date.now() - 172800000).toISOString(), status: "active" },
      { userId: "4", email: "anna@logistics.com", tier: "Enterprise", startDate: new Date(Date.now() - 259200000).toISOString(), status: "active" },
      { userId: "5", email: "bob@railway.net", tier: "Professional", startDate: new Date(Date.now() - 345600000).toISOString(), status: "trialing" },
    ],
    churnRate: 4.2,
    avgLifetimeValue: 89500,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const tierColors: Record<string, string> = {
    Starter: "bg-blue-100 text-blue-700",
    Professional: "bg-purple-100 text-purple-700",
    Enterprise: "bg-orange-100 text-orange-700",
    Free: "bg-gray-100 text-gray-700",
  };

  const tierBarColors: Record<string, string> = {
    Starter: "bg-blue-500",
    Professional: "bg-purple-500",
    Enterprise: "bg-orange-500",
    Free: "bg-gray-400",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Crown className="h-8 w-8 text-orange-600" />
            Subscription Reports
          </h1>
          <p className="text-gray-600 mt-1">Analyze subscription tiers, growth, and revenue</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "30d" | "90d" | "1y")}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* MRR and Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <DollarSign className="h-8 w-8 text-green-600" />
            <span className={`flex items-center gap-1 text-sm ${displayMetrics.mrr.growthPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
              {displayMetrics.mrr.growthPercent >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(displayMetrics.mrr.growthPercent)}%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatCurrency(displayMetrics.mrr.current)}
          </p>
          <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            +{displayMetrics.monthlyGrowth.netGrowth}
          </p>
          <p className="text-sm text-gray-600">Net Growth This Month</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {displayMetrics.churnRate}%
          </p>
          <p className="text-sm text-gray-600">Churn Rate</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Users className="h-8 w-8 text-purple-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatCurrency(displayMetrics.avgLifetimeValue)}
          </p>
          <p className="text-sm text-gray-600">Avg Lifetime Value</p>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Growth Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">+{displayMetrics.monthlyGrowth.newSubscriptions}</p>
            <p className="text-sm text-gray-600">New</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">-{displayMetrics.monthlyGrowth.cancellations}</p>
            <p className="text-sm text-gray-600">Canceled</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">+{displayMetrics.monthlyGrowth.upgrades}</p>
            <p className="text-sm text-gray-600">Upgrades</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">-{displayMetrics.monthlyGrowth.downgrades}</p>
            <p className="text-sm text-gray-600">Downgrades</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">+{displayMetrics.monthlyGrowth.netGrowth}</p>
            <p className="text-sm text-gray-600">Net Growth</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tier Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Tier Breakdown</h2>
          <div className="space-y-4">
            {displayMetrics.tierBreakdown.map((tier, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${tierColors[tier.tier] || "bg-gray-100 text-gray-700"}`}>
                      {tier.tier}
                    </span>
                    <span className="text-sm text-gray-600">{tier.count} users</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {tier.tier !== "Free" ? formatCurrency(tier.revenue) : "—"}/mo
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${tierBarColors[tier.tier] || "bg-gray-400"}`}
                    style={{ width: `${tier.percentageOfTotal}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Subscribers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Subscribers</h2>
            <Link
              href="/admin/users"
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {displayMetrics.recentSubscribers.map((subscriber) => (
              <div key={subscriber.userId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{subscriber.email}</p>
                  <p className="text-xs text-gray-500">{formatDate(subscriber.startDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${tierColors[subscriber.tier] || "bg-gray-100 text-gray-700"}`}>
                    {subscriber.tier}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    subscriber.status === "active" 
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {subscriber.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by Tier */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl shadow-sm p-6 text-white">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Revenue by Tier
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {displayMetrics.tierBreakdown.filter(t => t.tier !== "Free").map((tier, idx) => (
            <div key={idx} className="bg-white/10 rounded-lg p-4">
              <p className="text-orange-200 text-sm">{tier.tier}</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(tier.revenue)}/mo</p>
              <p className="text-orange-200 text-sm mt-1">{tier.count} subscribers</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
