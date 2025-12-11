/**
 * THE RAIL EXCHANGE™ — ISO (In Search Of) Request Dashboard
 * 
 * Lightweight "wanted" posts for users looking for equipment,
 * tools, railcars, materials, contractors, or services.
 * 
 * Available for ALL membership tiers (free feature).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Plus,
  Loader2,
  MessageSquare,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Tag,
  X,
  CheckCircle,
  Clock,
  Filter,
  ChevronDown,
  Send,
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

interface ISOFormData {
  title: string;
  category: string;
  description: string;
  city: string;
  state: string;
  budgetMin: string;
  budgetMax: string;
  budgetType: string;
  neededBy: string;
  allowMessaging: boolean;
}

const CATEGORY_OPTIONS = Object.entries(ISO_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  fulfilled: { label: 'Fulfilled', color: 'bg-blue-100 text-blue-800' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600' },
};

export default function ISODashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState<ISORequestData[]>([]);
  const [allRequests, setAllRequests] = useState<ISORequestData[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-requests'>('browse');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ISORequestData | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState<ISOFormData>({
    title: '',
    category: '',
    description: '',
    city: '',
    state: '',
    budgetMin: '',
    budgetMax: '',
    budgetType: 'negotiable',
    neededBy: '',
    allowMessaging: true,
  });

  // Redirect unauthenticated users
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [authStatus, router]);

  // Fetch ISO requests
  const fetchRequests = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      // Fetch all active requests
      const allRes = await fetch(`/api/iso?status=active&limit=50${categoryFilter ? `&category=${categoryFilter}` : ''}`);
      if (allRes.ok) {
        const data = await allRes.json();
        setAllRequests(data.requests);
      }

      // Fetch my requests
      const myRes = await fetch(`/api/iso?userId=${session.user.id}&status=all`);
      if (myRes.ok) {
        const data = await myRes.json();
        setMyRequests(data.requests);
      }
    } catch (err) {
      console.error('Error fetching ISO requests:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, categoryFilter]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchRequests();
    }
  }, [session?.user?.id, fetchRequests]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        location: {
          city: formData.city || undefined,
          state: formData.state || undefined,
        },
        budget: formData.budgetMin || formData.budgetMax ? {
          min: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
          max: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
          currency: 'USD',
          type: formData.budgetType,
        } : undefined,
        neededBy: formData.neededBy || undefined,
        allowMessaging: formData.allowMessaging,
      };

      const res = await fetch('/api/iso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create request');
      }

      setSuccess('ISO request created successfully!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        category: '',
        description: '',
        city: '',
        state: '',
        budgetMin: '',
        budgetMax: '',
        budgetType: 'negotiable',
        neededBy: '',
        allowMessaging: true,
      });
      fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setError('');
    setSending(true);

    try {
      const res = await fetch(`/api/iso/${selectedRequest._id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: responseMessage }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send response');
      }

      setSuccess('Response sent! Check your messages.');
      setShowRespondModal(false);
      setResponseMessage('');
      setSelectedRequest(null);

      // Redirect to the new thread
      router.push(`/dashboard/messages/${data.threadId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleCloseRequest = async (requestId: string, newStatus: string) => {
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

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      const res = await fetch(`/api/iso/${requestId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error('Error deleting request:', err);
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

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rail-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-white border-b border-surface-border">
        <div className="container-rail py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="text-text-secondary hover:text-navy-900 text-sm"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-heading-lg font-bold text-navy-900 mt-2 flex items-center gap-3">
                <Search className="w-7 h-7 text-rail-orange" />
                In Search Of (ISO) Requests
              </h1>
              <p className="text-body-md text-text-secondary mt-1">
                Post what you&apos;re looking for or respond to other requests
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 h-12 px-6 bg-rail-orange text-white font-semibold rounded-xl hover:bg-[#e55f15] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Request
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'browse'
                  ? 'bg-navy-900 text-white'
                  : 'text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              Browse All Requests
            </button>
            <button
              onClick={() => setActiveTab('my-requests')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'my-requests'
                  ? 'bg-navy-900 text-white'
                  : 'text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              My Requests ({myRequests.length})
            </button>
          </div>
        </div>
      </header>

      <main className="container-rail py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">{success}</p>
            </div>
            <button onClick={() => setSuccess('')}>
              <X className="w-5 h-5 text-green-600" />
            </button>
          </div>
        )}

        {/* Filter Bar (Browse Tab) */}
        {activeTab === 'browse' && (
          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
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
          </div>
        )}

        {/* Request Cards */}
        <div className="space-y-4">
          {(activeTab === 'browse' ? allRequests : myRequests).map((request) => (
            <div
              key={request._id}
              className="bg-white rounded-2xl shadow-card border border-surface-border p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-navy-100 text-navy-800 rounded text-xs font-medium">
                      {ISO_CATEGORY_LABELS[request.category as keyof typeof ISO_CATEGORY_LABELS] || request.category}
                    </span>
                    {request.status !== 'active' && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_LABELS[request.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[request.status]?.label || request.status}
                      </span>
                    )}
                  </div>
                  <h3 className="text-heading-md font-bold text-navy-900 mb-2">
                    {request.title}
                  </h3>
                  <p className="text-body-sm text-text-secondary line-clamp-2 mb-4">
                    {request.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-tertiary">
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 bg-surface-secondary rounded-full flex items-center justify-center overflow-hidden">
                        {request.userId.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={request.userId.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium">{request.userId.name?.charAt(0)}</span>
                        )}
                      </div>
                      <span className="font-medium text-navy-900">{request.userId.name}</span>
                    </div>
                    {request.location?.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {request.location.city}{request.location.state ? `, ${request.location.state}` : ''}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatBudget(request.budget)}
                    </div>
                    {request.neededBy && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Need by: {formatDate(request.neededBy)}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Posted: {formatDate(request.createdAt)}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {request.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {request.responseCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {activeTab === 'browse' && request.userId._id !== session?.user?.id && request.allowMessaging && request.status === 'active' && (
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRespondModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rail-orange text-white text-sm font-medium rounded-lg hover:bg-[#e55f15] transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Respond
                    </button>
                  )}
                  {activeTab === 'my-requests' && (
                    <>
                      {request.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleCloseRequest(request._id, 'fulfilled')}
                            className="px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Mark Fulfilled
                          </button>
                          <button
                            onClick={() => handleCloseRequest(request._id, 'closed')}
                            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Close
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteRequest(request._id)}
                        className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {(activeTab === 'browse' ? allRequests : myRequests).length === 0 && !loading && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <h3 className="text-heading-md font-bold text-navy-900 mb-2">
                {activeTab === 'browse' ? 'No Active Requests' : 'No Requests Yet'}
              </h3>
              <p className="text-body-sm text-text-secondary mb-6">
                {activeTab === 'browse'
                  ? 'Be the first to post what you\'re looking for!'
                  : 'Create your first ISO request to let others know what you need.'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-rail-orange text-white font-semibold rounded-xl hover:bg-[#e55f15] transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Request
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-surface-border">
              <div className="flex items-center justify-between">
                <h2 className="text-heading-md font-bold text-navy-900">
                  Create ISO Request
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-text-tertiary hover:text-navy-900 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Looking for GP38-2 Locomotive"
                  className="w-full px-4 py-3 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rail-orange/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rail-orange/50"
                  required
                >
                  <option value="">Select a category...</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what you're looking for in detail..."
                  rows={4}
                  className="w-full px-4 py-3 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rail-orange/50 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    City (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-4 py-3 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rail-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    State (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="w-full px-4 py-3 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rail-orange/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">
                  Budget (optional)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                    placeholder="Min $"
                    className="px-4 py-3 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rail-orange/50"
                  />
                  <input
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    placeholder="Max $"
                    className="px-4 py-3 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rail-orange/50"
                  />
                  <select
                    value={formData.budgetType}
                    onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}
                    className="px-4 py-3 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rail-orange/50"
                  >
                    <option value="negotiable">Negotiable</option>
                    <option value="fixed">Fixed</option>
                    <option value="range">Range</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">
                  Needed By (optional)
                </label>
                <input
                  type="date"
                  value={formData.neededBy}
                  onChange={(e) => setFormData({ ...formData, neededBy: e.target.value })}
                  className="w-full px-4 py-3 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rail-orange/50"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowMessaging"
                  checked={formData.allowMessaging}
                  onChange={(e) => setFormData({ ...formData, allowMessaging: e.target.checked })}
                  className="w-5 h-5 rounded border-surface-border text-rail-orange focus:ring-rail-orange"
                />
                <label htmlFor="allowMessaging" className="text-sm text-navy-900">
                  Allow others to respond to this request
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-surface-secondary text-navy-900 font-medium rounded-xl hover:bg-navy-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-rail-orange text-white font-semibold rounded-xl hover:bg-[#e55f15] disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Respond Modal */}
      {showRespondModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-surface-border">
              <div className="flex items-center justify-between">
                <h2 className="text-heading-md font-bold text-navy-900">
                  Respond to Request
                </h2>
                <button
                  onClick={() => {
                    setShowRespondModal(false);
                    setSelectedRequest(null);
                    setResponseMessage('');
                  }}
                  className="p-2 text-text-tertiary hover:text-navy-900 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleRespond} className="p-6 space-y-4">
              <div className="p-4 bg-surface-secondary rounded-xl">
                <p className="text-sm font-medium text-navy-900 mb-1">
                  {selectedRequest.title}
                </p>
                <p className="text-xs text-text-secondary">
                  by {selectedRequest.userId.name}
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">
                  Your Message
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Introduce yourself and explain how you can help..."
                  rows={4}
                  className="w-full px-4 py-3 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rail-orange/50 resize-none"
                  required
                />
              </div>

              <p className="text-xs text-text-tertiary">
                This will start a message thread with the requester.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRespondModal(false);
                    setSelectedRequest(null);
                    setResponseMessage('');
                  }}
                  className="flex-1 px-6 py-3 bg-surface-secondary text-navy-900 font-medium rounded-xl hover:bg-navy-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !responseMessage.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-rail-orange text-white font-semibold rounded-xl hover:bg-[#e55f15] disabled:opacity-50 transition-colors"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Response
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
