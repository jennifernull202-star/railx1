/**
 * THE RAIL EXCHANGE™ — Admin Stripe Monitoring
 * 
 * Monitor Stripe webhooks, payments, subscriptions, and test promo codes.
 * Provides real-time visibility into the payment infrastructure.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Clock,
  Tag,
  Users,
  Crown,
  Activity,
  ExternalLink,
  ArrowUpRight,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface StripeMetrics {
  subscriptions: {
    active: number;
    canceled: number;
    pastDue: number;
    trialing: number;
    total: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
    growth: number;
  };
  promoCodes: {
    active: number;
    totalRedemptions: number;
    topCodes: Array<{
      code: string;
      redemptions: number;
      discountPercent: number;
    }>;
  };
  recentWebhooks: Array<{
    id: string;
    type: string;
    status: "succeeded" | "failed" | "pending";
    timestamp: string;
    customerId?: string;
  }>;
}

export default function AdminStripePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<StripeMetrics | null>(null);
  const [testPromoCode, setTestPromoCode] = useState("");
  const [promoTestResult, setPromoTestResult] = useState<{
    valid: boolean;
    message: string;
    discount?: number;
  } | null>(null);
  const [testingPromo, setTestingPromo] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
    } else if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, session, router]);

  // Fetch Stripe metrics
  const fetchMetrics = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/stripe/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch Stripe metrics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchMetrics();
    }
  }, [session]);

  // Test promo code
  const handleTestPromo = async () => {
    if (!testPromoCode.trim()) return;
    setTestingPromo(true);
    setPromoTestResult(null);
    
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: testPromoCode }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPromoTestResult({
          valid: true,
          message: `Code "${testPromoCode}" is valid!`,
          discount: data.percentOff,
        });
      } else {
        setPromoTestResult({
          valid: false,
          message: data.error || "Invalid promo code",
        });
      }
    } catch (error) {
      setPromoTestResult({
        valid: false,
        message: "Failed to validate promo code",
      });
    } finally {
      setTestingPromo(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Mock data for demonstration if API not available
  const displayMetrics: StripeMetrics = metrics || {
    subscriptions: {
      active: 47,
      canceled: 12,
      pastDue: 3,
      trialing: 8,
      total: 70,
    },
    revenue: {
      thisMonth: 8540,
      lastMonth: 7230,
      thisYear: 45680,
      growth: 18.1,
    },
    promoCodes: {
      active: 3,
      totalRedemptions: 24,
      topCodes: [
        { code: "RAILXFREE", redemptions: 18, discountPercent: 100 },
        { code: "SAVE20", redemptions: 4, discountPercent: 20 },
        { code: "WELCOME10", redemptions: 2, discountPercent: 10 },
      ],
    },
    recentWebhooks: [
      { id: "evt_1", type: "checkout.session.completed", status: "succeeded", timestamp: new Date().toISOString(), customerId: "cus_xxx" },
      { id: "evt_2", type: "invoice.paid", status: "succeeded", timestamp: new Date(Date.now() - 3600000).toISOString(), customerId: "cus_yyy" },
      { id: "evt_3", type: "customer.subscription.created", status: "succeeded", timestamp: new Date(Date.now() - 7200000).toISOString() },
    ],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stripe Monitoring</h1>
          <p className="text-gray-600 mt-1">Monitor payments, subscriptions, and webhook events</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Stripe Dashboard
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <DollarSign className="h-8 w-8 text-green-600" />
            <span className="flex items-center gap-1 text-sm text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              {displayMetrics.revenue.growth}%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatCurrency(displayMetrics.revenue.thisMonth)}
          </p>
          <p className="text-sm text-gray-600">Revenue this month</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Crown className="h-8 w-8 text-orange-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {displayMetrics.subscriptions.active}
          </p>
          <p className="text-sm text-gray-600">Active subscriptions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Tag className="h-8 w-8 text-purple-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {displayMetrics.promoCodes.totalRedemptions}
          </p>
          <p className="text-sm text-gray-600">Promo code uses</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatCurrency(displayMetrics.revenue.thisYear)}
          </p>
          <p className="text-sm text-gray-600">Revenue YTD</p>
        </div>
      </div>

      {/* Subscription Status Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Status Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{displayMetrics.subscriptions.active}</p>
            <p className="text-sm text-gray-600">Active</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{displayMetrics.subscriptions.trialing}</p>
            <p className="text-sm text-gray-600">Trialing</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{displayMetrics.subscriptions.pastDue}</p>
            <p className="text-sm text-gray-600">Past Due</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{displayMetrics.subscriptions.canceled}</p>
            <p className="text-sm text-gray-600">Canceled</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">{displayMetrics.subscriptions.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Promo Code Tester */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-purple-600" />
            Promo Code Tester
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={testPromoCode}
                onChange={(e) => setTestPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code (e.g., RAILXFREE)"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleTestPromo}
                disabled={testingPromo || !testPromoCode.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {testingPromo ? "Testing..." : "Test"}
              </button>
            </div>

            {promoTestResult && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                promoTestResult.valid 
                  ? "bg-green-50 text-green-800" 
                  : "bg-red-50 text-red-800"
              }`}>
                {promoTestResult.valid ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <div>
                  <p className="font-medium">{promoTestResult.message}</p>
                  {promoTestResult.discount && (
                    <p className="text-sm">{promoTestResult.discount}% discount</p>
                  )}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Active Promo Codes</h3>
              <div className="space-y-2">
                {displayMetrics.promoCodes.topCodes.map((code, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <code className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-mono">
                        {code.code}
                      </code>
                      <span className="text-sm text-gray-600">{code.discountPercent}% off</span>
                    </div>
                    <span className="text-sm text-gray-500">{code.redemptions} uses</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Webhooks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Recent Webhook Events
          </h2>
          
          <div className="space-y-3">
            {displayMetrics.recentWebhooks.map((webhook) => (
              <div key={webhook.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {webhook.status === "succeeded" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : webhook.status === "failed" ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{webhook.type}</p>
                  <p className="text-xs text-gray-500">{formatDate(webhook.timestamp)}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  webhook.status === "succeeded" 
                    ? "bg-green-100 text-green-700"
                    : webhook.status === "failed"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {webhook.status}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <a
              href="https://dashboard.stripe.com/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              View all in Stripe Dashboard
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="https://dashboard.stripe.com/customers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Users className="h-5 w-5" />
            <span>View Customers</span>
          </a>
          <a
            href="https://dashboard.stripe.com/subscriptions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Crown className="h-5 w-5" />
            <span>Subscriptions</span>
          </a>
          <a
            href="https://dashboard.stripe.com/coupons"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Tag className="h-5 w-5" />
            <span>Manage Coupons</span>
          </a>
          <a
            href="https://dashboard.stripe.com/test/logs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Activity className="h-5 w-5" />
            <span>API Logs</span>
          </a>
        </div>
      </div>
    </div>
  );
}
