/**
 * THE RAIL EXCHANGE™ — Admin Promo Codes Management
 * 
 * View and test promo codes, track usage, and validate Stripe coupons.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Tag,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  DollarSign,
  ExternalLink,
  Search,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  percentOff: number;
  amountOff?: number;
  maxRedemptions?: number;
  timesRedeemed: number;
  active: boolean;
  expiresAt?: string;
  restrictions?: {
    firstTimeTransaction?: boolean;
    minimumAmount?: number;
  };
}

interface PromoCodeUsage {
  userId: string;
  userEmail: string;
  code: string;
  usedAt: string;
  subscriptionType: string;
  tier?: string;
}

export default function AdminPromoCodesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [usageHistory, setUsageHistory] = useState<PromoCodeUsage[]>([]);
  const [testCode, setTestCode] = useState("");
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    message: string;
    details?: PromoCode;
  } | null>(null);
  const [testingCode, setTestingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/dashboard");
    } else if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, session, router]);

  // Fetch promo codes and usage
  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const [codesRes, usageRes] = await Promise.all([
        fetch("/api/admin/promo-codes"),
        fetch("/api/admin/promo-codes/usage"),
      ]);

      if (codesRes.ok) {
        const data = await codesRes.json();
        setPromoCodes(data.promoCodes || []);
      }

      if (usageRes.ok) {
        const data = await usageRes.json();
        setUsageHistory(data.usage || []);
      }
    } catch (error) {
      console.error("Failed to fetch promo code data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchData();
    }
  }, [session]);

  // Test promo code
  const handleTestCode = async () => {
    if (!testCode.trim()) return;
    setTestingCode(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: testCode }),
      });

      const data = await res.json();

      if (res.ok) {
        setTestResult({
          valid: true,
          message: `Code "${testCode}" is valid!`,
          details: {
            id: data.promoCodeId,
            code: testCode,
            percentOff: data.percentOff,
            amountOff: data.amountOff,
            maxRedemptions: data.maxRedemptions,
            timesRedeemed: data.timesRedeemed || 0,
            active: true,
          },
        });
      } else {
        setTestResult({
          valid: false,
          message: data.error || "Invalid promo code",
        });
      }
    } catch {
      setTestResult({
        valid: false,
        message: "Failed to validate promo code",
      });
    } finally {
      setTestingCode(false);
    }
  };

  // Copy code to clipboard
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Mock data for demonstration
  const displayPromoCodes: PromoCode[] = promoCodes.length > 0 ? promoCodes : [
    {
      id: "promo_railxfree",
      code: "RAILXFREE",
      percentOff: 100,
      maxRedemptions: 50,
      timesRedeemed: 18,
      active: true,
      restrictions: { firstTimeTransaction: true },
    },
    {
      id: "promo_save20",
      code: "SAVE20",
      percentOff: 20,
      maxRedemptions: 100,
      timesRedeemed: 34,
      active: true,
    },
    {
      id: "promo_welcome10",
      code: "WELCOME10",
      percentOff: 10,
      timesRedeemed: 67,
      active: true,
    },
    {
      id: "promo_expired",
      code: "SUMMER2024",
      percentOff: 25,
      maxRedemptions: 50,
      timesRedeemed: 50,
      active: false,
      expiresAt: "2024-08-31T23:59:59Z",
    },
  ];

  const displayUsageHistory: PromoCodeUsage[] = usageHistory.length > 0 ? usageHistory : [
    { userId: "1", userEmail: "john@example.com", code: "RAILXFREE", usedAt: new Date().toISOString(), subscriptionType: "seller", tier: "Starter" },
    { userId: "2", userEmail: "sarah@railco.com", code: "RAILXFREE", usedAt: new Date(Date.now() - 86400000).toISOString(), subscriptionType: "seller", tier: "Professional" },
    { userId: "3", userEmail: "mike@trains.io", code: "SAVE20", usedAt: new Date(Date.now() - 172800000).toISOString(), subscriptionType: "seller", tier: "Starter" },
    { userId: "4", userEmail: "anna@logistics.com", code: "RAILXFREE", usedAt: new Date(Date.now() - 259200000).toISOString(), subscriptionType: "seller", tier: "Enterprise" },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalRedemptions = displayPromoCodes.reduce((sum, code) => sum + code.timesRedeemed, 0);
  const activeCodesCount = displayPromoCodes.filter(code => code.active).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Tag className="h-8 w-8 text-purple-600" />
            Promo Codes
          </h1>
          <p className="text-gray-600 mt-1">Manage and test promotional codes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <a
            href="https://dashboard.stripe.com/coupons"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Stripe Coupons
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Tag className="h-8 w-8 text-purple-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{activeCodesCount}</p>
          <p className="text-sm text-gray-600">Active Promo Codes</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{totalRedemptions}</p>
          <p className="text-sm text-gray-600">Total Redemptions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <DollarSign className="h-8 w-8 text-orange-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {displayPromoCodes.filter(c => c.percentOff === 100).length}
          </p>
          <p className="text-sm text-gray-600">100% Off Codes</p>
        </div>
      </div>

      {/* Promo Code Tester */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-purple-600" />
          Test Promo Code
        </h2>

        <div className="flex gap-2 max-w-lg">
          <input
            type="text"
            value={testCode}
            onChange={(e) => setTestCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code to test..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            onKeyDown={(e) => e.key === "Enter" && handleTestCode()}
          />
          <button
            onClick={handleTestCode}
            disabled={testingCode || !testCode.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {testingCode ? "Testing..." : "Test Code"}
          </button>
        </div>

        {testResult && (
          <div className={`mt-4 p-4 rounded-lg ${testResult.valid ? "bg-green-50" : "bg-red-50"}`}>
            <div className="flex items-center gap-3">
              {testResult.valid ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <div>
                <p className={`font-medium ${testResult.valid ? "text-green-800" : "text-red-800"}`}>
                  {testResult.message}
                </p>
                {testResult.details && (
                  <div className="mt-2 text-sm text-green-700 space-y-1">
                    <p>Discount: {testResult.details.percentOff}% off</p>
                    {testResult.details.maxRedemptions && (
                      <p>Redemptions: {testResult.details.timesRedeemed} / {testResult.details.maxRedemptions}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Promo Codes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Promo Codes</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Discount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Usage</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayPromoCodes.map((code) => (
                <tr key={code.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <code className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-mono">
                      {code.code}
                    </code>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900 font-medium">
                      {code.percentOff}% off
                    </span>
                    {code.restrictions?.firstTimeTransaction && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        First month only
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{code.timesRedeemed}</span>
                      {code.maxRedemptions && (
                        <span className="text-gray-500">/ {code.maxRedemptions}</span>
                      )}
                      {code.maxRedemptions && code.timesRedeemed >= code.maxRedemptions && (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      code.active 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {code.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => copyCode(code.code)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy code"
                    >
                      {copiedCode === code.code ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Recent Usage History
        </h2>

        <div className="space-y-3">
          {displayUsageHistory.map((usage, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{usage.userEmail}</p>
                <p className="text-xs text-gray-500">{formatDate(usage.usedAt)}</p>
              </div>
              <code className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-mono">
                {usage.code}
              </code>
              {usage.tier && (
                <span className="text-sm text-gray-600">{usage.tier}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
        <h2 className="text-lg font-semibold mb-3">Managing Promo Codes</h2>
        <p className="text-purple-100 mb-4">
          Promo codes are managed directly in Stripe. Create new coupons and promotion codes there,
          and they will automatically work in the checkout flow.
        </p>
        <a
          href="https://dashboard.stripe.com/coupons/create"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium"
        >
          Create New Coupon in Stripe
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
