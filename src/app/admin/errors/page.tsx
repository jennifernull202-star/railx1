/**
 * THE RAIL EXCHANGE™ — Admin Error Logs
 * 
 * View and analyze application errors and exceptions.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  User,
  Globe,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react";

interface ErrorLog {
  id: string;
  level: "error" | "warning" | "info";
  message: string;
  stack?: string;
  endpoint?: string;
  userId?: string;
  userAgent?: string;
  timestamp: string;
  count: number;
  lastOccurrence: string;
}

export default function AdminErrorsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [filter, setFilter] = useState<"all" | "error" | "warning" | "info">("all");
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h");

  // Redirect non-admins
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
    } else if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, session, router]);

  // Fetch error logs
  const fetchErrors = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/errors?range=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setErrors(data.errors || []);
      }
    } catch (error) {
      console.error("Failed to fetch errors:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchErrors();
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
  const displayErrors: ErrorLog[] = errors.length > 0 ? errors : [
    {
      id: "err_1",
      level: "error",
      message: "MongoServerError: E11000 duplicate key error",
      stack: "MongoServerError: E11000 duplicate key error collection: railx.users index: email_1 dup key: { email: \"test@example.com\" }\n    at Connection.onMessage (/app/node_modules/mongodb/lib/cmap/connection.js:203:30)\n    at MessageStream.<anonymous> (/app/node_modules/mongodb/lib/cmap/connection.js:63:60)",
      endpoint: "/api/auth/register",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      count: 3,
      lastOccurrence: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "err_2",
      level: "error",
      message: "TypeError: Cannot read properties of undefined (reading 'id')",
      stack: "TypeError: Cannot read properties of undefined (reading 'id')\n    at GET (/app/.next/server/app/api/listings/[id]/route.js:45:23)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)",
      endpoint: "/api/listings/[id]",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      count: 5,
      lastOccurrence: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "err_3",
      level: "warning",
      message: "Stripe webhook signature verification failed",
      endpoint: "/api/subscriptions/webhook",
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      count: 2,
      lastOccurrence: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: "err_4",
      level: "error",
      message: "Failed to send email: Connection timeout",
      endpoint: "/api/inquiries",
      timestamp: new Date(Date.now() - 21600000).toISOString(),
      count: 1,
      lastOccurrence: new Date(Date.now() - 21600000).toISOString(),
    },
    {
      id: "err_5",
      level: "info",
      message: "Rate limit exceeded for IP 192.168.1.1",
      endpoint: "/api/listings/search",
      userAgent: "Mozilla/5.0 (compatible; Bot/1.0)",
      timestamp: new Date(Date.now() - 28800000).toISOString(),
      count: 47,
      lastOccurrence: new Date(Date.now() - 25200000).toISOString(),
    },
  ];

  const filteredErrors = filter === "all" 
    ? displayErrors 
    : displayErrors.filter(e => e.level === filter);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLevelIcon = (level: "error" | "warning" | "info") => {
    switch (level) {
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getLevelStyle = (level: "error" | "warning" | "info") => {
    switch (level) {
      case "error":
        return "bg-red-100 text-red-700 border-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "info":
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const errorCounts = {
    error: displayErrors.filter(e => e.level === "error").length,
    warning: displayErrors.filter(e => e.level === "warning").length,
    info: displayErrors.filter(e => e.level === "info").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            Error Logs
          </h1>
          <p className="text-gray-600 mt-1">Monitor and analyze application errors</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "1h" | "24h" | "7d")}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          <button
            onClick={() => fetchErrors(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{errorCounts.error}</p>
          <p className="text-sm text-gray-600">Errors</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{errorCounts.warning}</p>
          <p className="text-sm text-gray-600">Warnings</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Info className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{errorCounts.info}</p>
          <p className="text-sm text-gray-600">Info</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {(["all", "error", "warning", "info"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === level
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20">
                {level === "all" ? displayErrors.length : errorCounts[level]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Error List */}
      <div className="space-y-4">
        {filteredErrors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No errors found</h3>
            <p className="text-gray-600 mt-1">Everything is running smoothly!</p>
          </div>
        ) : (
          filteredErrors.map((error) => (
            <div
              key={error.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden ${getLevelStyle(error.level)}`}
            >
              <button
                onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
                className="w-full p-4 flex items-start gap-4 text-left hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getLevelIcon(error.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{error.message}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                    {error.endpoint && (
                      <span className="flex items-center gap-1">
                        <Code className="h-4 w-4" />
                        {error.endpoint}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDate(error.lastOccurrence)}
                    </span>
                    {error.count > 1 && (
                      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                        {error.count}x
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {expandedError === error.id ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedError === error.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Details</h4>
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-gray-500">First seen</dt>
                          <dd className="text-gray-900">{formatDate(error.timestamp)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Last seen</dt>
                          <dd className="text-gray-900">{formatDate(error.lastOccurrence)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Occurrences</dt>
                          <dd className="text-gray-900">{error.count}</dd>
                        </div>
                        {error.userId && (
                          <div>
                            <dt className="text-gray-500">User ID</dt>
                            <dd className="text-gray-900 font-mono text-xs">{error.userId}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {error.stack && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Stack Trace</h4>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                          {error.stack}
                        </pre>
                      </div>
                    )}

                    {error.userAgent && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">User Agent</h4>
                        <p className="text-sm text-gray-600 font-mono">{error.userAgent}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
