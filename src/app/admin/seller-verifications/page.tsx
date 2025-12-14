/**
 * THE RAIL EXCHANGE™ — Admin Seller Verification Report
 * 
 * Admin page to view and manage seller verifications.
 * Shows all sellers with verification status, tier, expiration dates.
 * Includes ability to force expire a verification.
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ ARCHITECTURAL NOTE: Does NOT consume /api/verification              │
 * │                                                                      │
 * │ This page uses /api/admin/seller-verifications because it needs:    │
 * │ - Admin-only access (role gated)                                    │
 * │ - Full seller list with verification details                        │
 * │ - Tier, expiration dates, approval history                          │
 * │ - Force expire action endpoint                                      │
 * │                                                                      │
 * │ The public /api/verification endpoint returns badge status only.    │
 * │ It cannot serve admin management needs. This separation is correct. │
 * └─────────────────────────────────────────────────────────────────────┘
 * 
 * RETIREMENT CANDIDATE: This page and /admin/verification/sellers serve
 * similar purposes. Consider consolidating into single verification queue.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Search,
  Calendar,
  Zap,
  RefreshCw,
  ChevronDown,
  Download,
} from 'lucide-react';

interface SellerVerification {
  _id: string;
  name: string;
  email: string;
  verifiedSellerStatus: string;
  verifiedSellerTier: 'standard' | 'priority' | null;
  verifiedSellerApprovedAt: string | null;
  verifiedSellerExpiresAt: string | null;
  isVerifiedSeller: boolean;
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'active': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active' },
  'pending-ai': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Pending AI' },
  'pending-admin': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending Admin' },
  'pending-payment': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Pending Payment' },
  'expired': { bg: 'bg-red-100', text: 'text-red-700', label: 'Expired' },
  'revoked': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Revoked' },
  'none': { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Not Verified' },
};

export default function AdminSellerVerificationReportPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState<SellerVerification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check admin role
  useEffect(() => {
    if (sessionStatus === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/dashboard');
    }
  }, [session, sessionStatus, router]);

  // Fetch seller verifications
  const fetchSellers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/seller-verifications');
      if (res.ok) {
        const data = await res.json();
        setSellers(data.sellers || []);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
      setError('Failed to load seller verifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchSellers();
    }
  }, [session, fetchSellers]);

  // Force expire a verification
  const handleForceExpire = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to force expire the verification for ${email}? This will restrict their ability to create listings.`)) {
      return;
    }

    setProcessing(userId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/seller-verifications/force-expire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to force expire');
      }

      setSuccess(`Verification for ${email} has been expired`);
      await fetchSellers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to force expire');
    } finally {
      setProcessing(null);
    }
  };

  // Calculate days remaining
  const getDaysRemaining = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter sellers
  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = 
      seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || seller.verifiedSellerStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: sellers.length,
    active: sellers.filter(s => s.verifiedSellerStatus === 'active').length,
    pending: sellers.filter(s => s.verifiedSellerStatus.startsWith('pending')).length,
    expired: sellers.filter(s => s.verifiedSellerStatus === 'expired').length,
    expiringIn30Days: sellers.filter(s => {
      const days = getDaysRemaining(s.verifiedSellerExpiresAt);
      return days !== null && days > 0 && days <= 30;
    }).length,
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Seller Verification Report</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage and monitor seller verification status
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-slate-500 hover:text-navy-900"
        >
          ← Back to Admin
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-bold text-navy-900">{stats.total}</div>
          <div className="text-sm text-slate-500">Total Sellers</div>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
          <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
          <div className="text-sm text-emerald-600">Active</div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          <div className="text-sm text-amber-600">Pending</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          <div className="text-sm text-red-600">Expired</div>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.expiringIn30Days}</div>
          <div className="text-sm text-blue-600">Expiring Soon</div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <p className="text-emerald-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending-ai">Pending AI</option>
              <option value="pending-admin">Pending Admin</option>
              <option value="pending-payment">Pending Payment</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
              <option value="none">Not Verified</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            onClick={fetchSellers}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Seller</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Tier</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Approved</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Expires</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Days Left</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No sellers found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredSellers.map((seller) => {
                  const daysRemaining = getDaysRemaining(seller.verifiedSellerExpiresAt);
                  const statusConfig = STATUS_COLORS[seller.verifiedSellerStatus] || STATUS_COLORS['none'];
                  
                  return (
                    <tr key={seller._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-navy-900">{seller.name}</div>
                          <div className="text-sm text-slate-500">{seller.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {seller.verifiedSellerTier ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            seller.verifiedSellerTier === 'priority' 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {seller.verifiedSellerTier === 'priority' && <Zap className="w-3 h-3" />}
                            {seller.verifiedSellerTier === 'priority' ? 'Priority' : 'Standard'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          {seller.verifiedSellerStatus === 'active' && <CheckCircle2 className="w-3 h-3" />}
                          {seller.verifiedSellerStatus === 'expired' && <XCircle className="w-3 h-3" />}
                          {seller.verifiedSellerStatus.startsWith('pending') && <Clock className="w-3 h-3" />}
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(seller.verifiedSellerApprovedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(seller.verifiedSellerExpiresAt)}
                      </td>
                      <td className="px-4 py-3">
                        {daysRemaining !== null ? (
                          <span className={`text-sm font-medium ${
                            daysRemaining <= 0 ? 'text-red-600' :
                            daysRemaining <= 7 ? 'text-red-500' :
                            daysRemaining <= 30 ? 'text-amber-500' :
                            'text-slate-600'
                          }`}>
                            {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} days`}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {seller.verifiedSellerStatus === 'active' && (
                          <button
                            onClick={() => handleForceExpire(seller._id, seller.email)}
                            disabled={processing === seller._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
                          >
                            {processing === seller._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            Force Expire
                          </button>
                        )}
                        {seller.verifiedSellerStatus === 'pending-admin' && (
                          <Link
                            href={`/admin/verifications?userId=${seller._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                          >
                            <Shield className="w-3 h-3" />
                            Review
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
