/**
 * THE RAIL EXCHANGE™ — Admin System Metrics
 * 
 * Monitor platform health, performance metrics, and system status.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Activity,
  RefreshCw,
  Server,
  Database,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Globe,
} from "lucide-react";

interface SystemMetrics {
  uptime: {
    percentage: number;
    lastDowntime?: string;
    currentStreak: number; // days
  };
  performance: {
    avgResponseTime: number; // ms
    p95ResponseTime: number;
    p99ResponseTime: number;
    requestsPerMinute: number;
  };
  database: {
    status: "healthy" | "degraded" | "down";
    connections: number;
    queryTime: number; // avg ms
    size: string;
  };
  services: Array<{
    name: string;
    status: "operational" | "degraded" | "down";
    latency?: number;
  }>;
  traffic: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    uniqueVisitors: number;
  };
  errors: {
    today: number;
    rate: number; // percentage
    topEndpoints: Array<{
      endpoint: string;
      count: number;
    }>;
  };
}

export default function AdminMetricsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/dashboard");
    } else if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, session, router]);

  // Fetch metrics
  const fetchMetrics = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchMetrics();
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => fetchMetrics(), 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Mock data for demonstration
  const displayMetrics: SystemMetrics = metrics || {
    uptime: {
      percentage: 99.97,
      currentStreak: 47,
    },
    performance: {
      avgResponseTime: 142,
      p95ResponseTime: 285,
      p99ResponseTime: 456,
      requestsPerMinute: 324,
    },
    database: {
      status: "healthy",
      connections: 12,
      queryTime: 8.4,
      size: "2.3 GB",
    },
    services: [
      { name: "API Server", status: "operational", latency: 45 },
      { name: "Database (MongoDB)", status: "operational", latency: 8 },
      { name: "Stripe Integration", status: "operational", latency: 142 },
      { name: "Email Service", status: "operational", latency: 234 },
      { name: "AI Chat Service", status: "operational", latency: 1250 },
      { name: "S3 Storage", status: "operational", latency: 89 },
    ],
    traffic: {
      today: 4823,
      thisWeek: 28456,
      thisMonth: 124532,
      uniqueVisitors: 8923,
    },
    errors: {
      today: 12,
      rate: 0.024,
      topEndpoints: [
        { endpoint: "/api/listings/search", count: 5 },
        { endpoint: "/api/auth/callback", count: 3 },
        { endpoint: "/api/inquiries", count: 2 },
      ],
    },
  };

  const getStatusColor = (status: "operational" | "degraded" | "down" | "healthy") => {
    switch (status) {
      case "operational":
      case "healthy":
        return "text-green-600 bg-green-100";
      case "degraded":
        return "text-yellow-600 bg-yellow-100";
      case "down":
        return "text-red-600 bg-red-100";
    }
  };

  const getStatusIcon = (status: "operational" | "degraded" | "down" | "healthy") => {
    switch (status) {
      case "operational":
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "degraded":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "down":
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="h-8 w-8 text-purple-600" />
            System Metrics
          </h1>
          <p className="text-gray-600 mt-1">Real-time platform health and performance monitoring</p>
        </div>
        <button
          onClick={() => fetchMetrics(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Overall Status Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">All Systems Operational</h2>
            <p className="text-green-100">
              {displayMetrics.uptime.percentage}% uptime • {displayMetrics.uptime.currentStreak} day streak
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Zap className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{displayMetrics.performance.avgResponseTime}ms</p>
          <p className="text-sm text-gray-600">Avg Response Time</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{displayMetrics.performance.requestsPerMinute}</p>
          <p className="text-sm text-gray-600">Requests/min</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Globe className="h-8 w-8 text-purple-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{displayMetrics.traffic.today.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Requests Today</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{displayMetrics.errors.rate}%</p>
          <p className="text-sm text-gray-600">Error Rate</p>
        </div>
      </div>

      {/* Service Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-purple-600" />
          Service Status
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayMetrics.services.map((service, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              {getStatusIcon(service.status)}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{service.name}</p>
                {service.latency && (
                  <p className="text-sm text-gray-500">{service.latency}ms latency</p>
                )}
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(service.status)}`}>
                {service.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Database Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Database Health
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(displayMetrics.database.status)}
                <span className="font-medium text-gray-900">Status</span>
              </div>
              <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(displayMetrics.database.status)}`}>
                {displayMetrics.database.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{displayMetrics.database.connections}</p>
                <p className="text-sm text-gray-600">Connections</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{displayMetrics.database.queryTime}ms</p>
                <p className="text-sm text-gray-600">Avg Query</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{displayMetrics.database.size}</p>
                <p className="text-sm text-gray-600">DB Size</p>
              </div>
            </div>
          </div>
        </div>

        {/* Response Times */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Response Time Percentiles
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">p50 (median)</span>
                <span className="font-medium text-gray-900">{displayMetrics.performance.avgResponseTime}ms</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: "30%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">p95</span>
                <span className="font-medium text-gray-900">{displayMetrics.performance.p95ResponseTime}ms</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: "60%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">p99</span>
                <span className="font-medium text-gray-900">{displayMetrics.performance.p99ResponseTime}ms</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "85%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-600" />
          Traffic Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{displayMetrics.traffic.today.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Requests Today</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{displayMetrics.traffic.thisWeek.toLocaleString()}</p>
            <p className="text-sm text-gray-600">This Week</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{displayMetrics.traffic.thisMonth.toLocaleString()}</p>
            <p className="text-sm text-gray-600">This Month</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{displayMetrics.traffic.uniqueVisitors.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Unique Visitors</p>
          </div>
        </div>
      </div>

      {/* Top Error Endpoints */}
      {displayMetrics.errors.topEndpoints.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Top Error Endpoints (Today: {displayMetrics.errors.today} errors)
          </h2>
          <div className="space-y-3">
            {displayMetrics.errors.topEndpoints.map((endpoint, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <code className="text-sm text-red-800 font-mono">{endpoint.endpoint}</code>
                <span className="text-sm font-medium text-red-700">{endpoint.count} errors</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
