/**
 * THE RAIL EXCHANGE™ — Admin ISO Requests Page
 * 
 * Administrative oversight for ISO (In Search Of) requests.
 * Allows admins to view, flag, and delete ISO posts.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  Loader2,
  Trash2,
  Eye,
  MessageSquare,
  Calendar,
  MapPin,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { ISO_CATEGORY_LABELS } from '@/lib/iso-constants';

interface ISORequestData {
  _id: string;
  title: string;
  category: string;
  description: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  budget?: {
    min?: number;
    max?: number;
    currency: string;
    type: string;
  };
  neededBy?: string;
  allowMessaging: boolean;
  status: string;
  responseCount: number;
  viewCount: number;
  userId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_OPTIONS = Object.entries(ISO_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  fulfilled: { label: 'Fulfilled', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-4 h-4" /> },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600', icon: <XCircle className="w-4 h-4" /> },
  deleted: { label: 'Deleted', color: 'bg-red-100 text-red-800', icon: <Trash2 className="w-4 h-4" /> },
};

export default function AdminISOPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ISORequestData[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect non-admins
  useEffect(() => {
    if (authStatus === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/dashboard');
    }
  }, [authStatus, session, router]);

  // Fetch ISO requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
      });

      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/iso?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (err) {
      console.error('Error fetching ISO requests:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, categoryFilter, statusFilter]);

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user?.role === 'admin') {
      fetchRequests();
    }
  }, [authStatus, session, fetchRequests]);

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this ISO request?')) return;

    try {
      const res = await fetch(`/api/iso/${requestId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error('Error deleting request:', err);
    }
  };

  const handleChangeStatus = async (requestId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/iso/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error('Error updating request:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatBudget = (budget?: ISORequestData['budget']) => {
    if (!budget) return 'Negotiable';
    if (budget.type === 'negotiable') return 'Negotiable';
    if (budget.min && budget.max) {
      return `$${budget.min.toLocaleString()} - $${budget.max.toLocaleString()}`;
    }
    if (budget.min) return `From $${budget.min.toLocaleString()}`;
    if (budget.max) return `Up to $${budget.max.toLocaleString()}`;
    return 'Negotiable';
  };

  // Filter by search term
  const filteredRequests = requests.filter((req) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      req.title.toLowerCase().includes(search) ||
      req.description.toLowerCase().includes(search) ||
      req.userId.name.toLowerCase().includes(search) ||
      req.userId.email.toLowerCase().includes(search)
    );
  });

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rail-orange" />
      </div>
    );
  }

  if (session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-white border-b border-surface-border">
        <div className="container-rail py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin"
                className="text-text-secondary hover:text-navy-900 text-sm"
              >
                ← Back to Admin
              </Link>
              <h1 className="text-heading-lg font-bold text-navy-900 mt-2 flex items-center gap-3">
                <Search className="w-7 h-7 text-rail-orange" />
                ISO Requests Oversight
              </h1>
              <p className="text-body-md text-text-secondary mt-1">
                Manage and moderate all ISO (In Search Of) requests
              </p>
            </div>
            <div className="text-right">
              <p className="text-heading-lg font-bold text-navy-900">{pagination.total}</p>
              <p className="text-body-sm text-text-secondary">Total Requests</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-rail py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, description, or user..."
                className="w-full pl-10 pr-4 py-2 border border-surface-border rounded-lg text-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="pl-10 pr-8 py-2 border border-surface-border rounded-lg text-sm appearance-none bg-white cursor-pointer"
              >
                <option value="">All Categories</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 border border-surface-border rounded-lg text-sm appearance-none bg-white cursor-pointer pr-8"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="closed">Closed</option>
                <option value="deleted">Deleted</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-rail-orange" />
          </div>
        ) : (
          <>
            {/* Request Table */}
            <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-secondary border-b border-surface-border">
                    <tr>
                      <th className="text-left p-4 font-medium text-navy-900">Request</th>
                      <th className="text-left p-4 font-medium text-navy-900">User</th>
                      <th className="text-left p-4 font-medium text-navy-900">Category</th>
                      <th className="text-left p-4 font-medium text-navy-900">Status</th>
                      <th className="text-left p-4 font-medium text-navy-900">Stats</th>
                      <th className="text-left p-4 font-medium text-navy-900">Date</th>
                      <th className="text-right p-4 font-medium text-navy-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request._id} className="border-b border-surface-border hover:bg-surface-secondary/50">
                        <td className="p-4">
                          <div className="max-w-[300px]">
                            <p className="font-medium text-navy-900 truncate">{request.title}</p>
                            <p className="text-xs text-text-tertiary line-clamp-1">{request.description}</p>
                            {request.location?.city && (
                              <p className="text-xs text-text-tertiary flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {request.location.city}{request.location.state ? `, ${request.location.state}` : ''}
                              </p>
                            )}
                            <p className="text-xs text-text-tertiary flex items-center gap-1 mt-1">
                              <DollarSign className="w-3 h-3" />
                              {formatBudget(request.budget)}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-surface-secondary rounded-full flex items-center justify-center overflow-hidden">
                              {request.userId.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={request.userId.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-text-tertiary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-navy-900">{request.userId.name}</p>
                              <p className="text-xs text-text-tertiary">{request.userId.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-navy-100 text-navy-800 rounded text-xs font-medium">
                            {ISO_CATEGORY_LABELS[request.category as keyof typeof ISO_CATEGORY_LABELS] || request.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${STATUS_LABELS[request.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[request.status]?.icon}
                            {STATUS_LABELS[request.status]?.label || request.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3 text-xs text-text-tertiary">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {request.viewCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {request.responseCount}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-text-secondary flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(request.createdAt)}
                          </p>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {request.status === 'active' && (
                              <button
                                onClick={() => handleChangeStatus(request._id, 'closed')}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="Close Request"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            )}
                            {request.status !== 'deleted' && (
                              <button
                                onClick={() => handleDelete(request._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete Request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {filteredRequests.length === 0 && (
                <div className="text-center py-16">
                  <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                  <h3 className="text-heading-md font-bold text-navy-900 mb-2">No Requests Found</h3>
                  <p className="text-body-sm text-text-secondary">
                    Try adjusting your filters or search term.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-body-sm text-text-secondary">
                  Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="p-2 border border-surface-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-body-sm font-medium px-3">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 border border-surface-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
