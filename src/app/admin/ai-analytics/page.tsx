/**
 * THE RAIL EXCHANGE™ — Admin AI Analytics
 * 
 * Monitor AI chat usage, costs, and performance metrics.
 * Provides insights into the AI assistant's effectiveness.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bot,
  RefreshCw,
  MessageSquare,
  DollarSign,
  Clock,
  TrendingUp,
  Users,
  Zap,
  Activity,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from "lucide-react";

interface AIMetrics {
  usage: {
    totalConversations: number;
    totalMessages: number;
    uniqueUsers: number;
    avgMessagesPerConversation: number;
  };
  costs: {
    thisMonth: number;
    lastMonth: number;
    perConversation: number;
    projected: number;
  };
  performance: {
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
    peakHour: string;
  };
  topQueries: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  dailyUsage: Array<{
    date: string;
    conversations: number;
    messages: number;
  }>;
}

export default function AdminAIAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  // Redirect non-admins
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
    } else if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, session, router]);

  // Fetch AI metrics
  const fetchMetrics = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/ai/metrics?range=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch AI metrics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "admin") {
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

  // Mock data for demonstration if API not available
  const displayMetrics: AIMetrics = metrics || {
    usage: {
      totalConversations: 1842,
      totalMessages: 8456,
      uniqueUsers: 623,
      avgMessagesPerConversation: 4.6,
    },
    costs: {
      thisMonth: 4250,
      lastMonth: 3890,
      perConversation: 0.023,
      projected: 5100,
    },
    performance: {
      avgResponseTime: 1.2,
      successRate: 98.5,
      errorRate: 1.5,
      peakHour: "2:00 PM",
    },
    topQueries: [
      { category: "Pricing Questions", count: 456, percentage: 24.8 },
      { category: "Listing Help", count: 389, percentage: 21.1 },
      { category: "Equipment Info", count: 312, percentage: 16.9 },
      { category: "Account Support", count: 287, percentage: 15.6 },
      { category: "Shipping & Logistics", count: 198, percentage: 10.7 },
      { category: "Other", count: 200, percentage: 10.9 },
    ],
    dailyUsage: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { weekday: "short" }),
      conversations: Math.floor(Math.random() * 100) + 50,
      messages: Math.floor(Math.random() * 500) + 200,
    })),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="h-8 w-8 text-purple-600" />
            AI Analytics
          </h1>
          <p className="text-gray-600 mt-1">Monitor AI assistant usage, costs, and performance</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d")}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {displayMetrics.usage.totalConversations.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Conversations</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Users className="h-8 w-8 text-green-600" />
            <span className="text-sm text-gray-500">Unique</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {displayMetrics.usage.uniqueUsers.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Users engaged</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <DollarSign className="h-8 w-8 text-orange-600" />
            <span className="text-sm text-gray-500">This month</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatCurrency(displayMetrics.costs.thisMonth)}
          </p>
          <p className="text-sm text-gray-600">API costs</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Zap className="h-8 w-8 text-purple-600" />
            <span className="text-sm text-gray-500">Avg</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {displayMetrics.performance.avgResponseTime}s
          </p>
          <p className="text-sm text-gray-600">Response time</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-600" />
          Performance Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
              <ThumbsUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{displayMetrics.performance.successRate}%</p>
            <p className="text-sm text-gray-600">Success Rate</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{displayMetrics.performance.errorRate}%</p>
            <p className="text-sm text-gray-600">Error Rate</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{displayMetrics.usage.avgMessagesPerConversation}</p>
            <p className="text-sm text-gray-600">Avg Messages/Chat</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{displayMetrics.performance.peakHour}</p>
            <p className="text-sm text-gray-600">Peak Hour</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Query Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Top Query Categories
          </h2>
          <div className="space-y-4">
            {displayMetrics.topQueries.map((query, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{query.category}</span>
                  <span className="text-sm text-gray-500">{query.count} ({query.percentage}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                    style={{ width: `${query.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Usage Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Daily Usage (Last 7 Days)
          </h2>
          <div className="space-y-3">
            {displayMetrics.dailyUsage.map((day, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-12 text-sm text-gray-600">{day.date}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(day.conversations / 150) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-sm text-gray-600 text-right">{day.conversations}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-gray-600">Conversations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Analysis */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Cost Analysis
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-bold">{formatCurrency(displayMetrics.costs.thisMonth)}</p>
            <p className="text-purple-200">This Month</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{formatCurrency(displayMetrics.costs.lastMonth)}</p>
            <p className="text-purple-200">Last Month</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{formatCurrency(displayMetrics.costs.perConversation * 100)}</p>
            <p className="text-purple-200">Per Conversation</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{formatCurrency(displayMetrics.costs.projected)}</p>
            <p className="text-purple-200">Projected Monthly</p>
          </div>
        </div>
      </div>
    </div>
  );
}
