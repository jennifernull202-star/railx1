/**
 * THE RAIL EXCHANGE™ — Admin Listings Page
 * 
 * Listing management with approval workflow.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface Listing {
  _id: string;
  title: string;
  slug: string;
  category: string;
  status: 'draft' | 'pending' | 'active' | 'paused' | 'sold' | 'expired' | 'removed';
  price: {
    type: string;
    amount?: number;
    currency: string;
  };
  sellerId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  viewCount: number;
  // S-14.4: Report visibility fields
  reportCount?: number;
  isFlagged?: boolean;
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-blue-100 text-blue-800',
  sold: 'bg-purple-100 text-purple-800',
  expired: 'bg-red-100 text-red-800',
  removed: 'bg-red-100 text-red-800',
};

function AdminListingsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/listings?${params.toString()}`);
      const data = await res.json();

      if (data.listings) {
        setListings(data.listings);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const updateListingStatus = async (listingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setListings(listings.map(l => 
          l._id === listingId ? { ...l, status: newStatus as Listing['status'] } : l
        ));
      }
    } catch (error) {
      console.error('Failed to update listing:', error);
    }
  };

  const formatPrice = (price: Listing['price']) => {
    if (price.type === 'contact') return 'Contact';
    if (!price.amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency || 'USD',
      maximumFractionDigits: 0,
    }).format(price.amount);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-xl text-navy-900">Listings</h1>
          <p className="text-body-md text-text-secondary mt-2">
            Manage and approve marketplace listings
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings..."
              className="input-field"
            />
          </div>
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="pending">Pending Approval</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="sold">Sold</option>
              <option value="expired">Expired</option>
              <option value="removed">Removed</option>
            </select>
          </div>
          <button onClick={() => fetchListings()} className="btn-primary">
            Search
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-surface-border p-4 text-center">
          <p className="text-heading-md font-bold text-navy-900">{pagination.total}</p>
          <p className="text-body-sm text-text-secondary">Total</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
          <button
            onClick={() => setStatusFilter('pending')}
            className="w-full"
          >
            <p className="text-heading-md font-bold text-amber-600">
              {listings.filter(l => l.status === 'pending').length}
            </p>
            <p className="text-body-sm text-amber-600">Pending</p>
          </button>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <p className="text-heading-md font-bold text-green-600">
            {listings.filter(l => l.status === 'active').length}
          </p>
          <p className="text-body-sm text-green-600">Active</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <p className="text-heading-md font-bold text-red-600">
            {listings.filter(l => l.status === 'removed').length}
          </p>
          <p className="text-body-sm text-red-600">Removed</p>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rail-orange mx-auto" />
            <p className="mt-4 text-text-secondary">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-text-secondary">No listings found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-secondary border-b border-surface-border">
                  <tr>
                    <th className="text-left px-6 py-4 text-body-sm font-semibold text-text-secondary">Listing</th>
                    <th className="text-left px-6 py-4 text-body-sm font-semibold text-text-secondary">Price</th>
                    <th className="text-left px-6 py-4 text-body-sm font-semibold text-text-secondary">Seller</th>
                    <th className="text-left px-6 py-4 text-body-sm font-semibold text-text-secondary">Status</th>
                    <th className="text-left px-6 py-4 text-body-sm font-semibold text-text-secondary">Flags</th>
                    <th className="text-left px-6 py-4 text-body-sm font-semibold text-text-secondary">Views</th>
                    <th className="text-right px-6 py-4 text-body-sm font-semibold text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {listings.map((listing) => (
                    <tr key={listing._id} className="hover:bg-surface-secondary/50">
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/listings/${listing.slug || listing._id}`}
                            className="text-body-md font-semibold text-navy-900 hover:text-rail-orange"
                          >
                            {listing.title}
                          </Link>
                          <p className="text-body-sm text-text-secondary capitalize">
                            {listing.category.replace(/-/g, ' ')}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body-md font-semibold text-navy-900">
                          {formatPrice(listing.price)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-body-md text-navy-900">{listing.sellerId?.name || 'Unknown'}</p>
                          <p className="text-body-sm text-text-secondary">{listing.sellerId?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${STATUS_COLORS[listing.status]}`}>
                          {listing.status}
                        </span>
                      </td>
                      {/* S-14.4: Admin-only flag visibility indicator */}
                      <td className="px-6 py-4">
                        {(listing.reportCount && listing.reportCount > 0) || listing.isFlagged ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Has reports
                            {listing.reportCount && listing.reportCount > 0 && (
                              <span className="ml-1">({listing.reportCount})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-text-tertiary text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-body-md text-text-secondary">
                        {listing.viewCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {listing.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateListingStatus(listing._id, 'active')}
                                className="px-3 py-1 text-body-sm font-medium text-green-600 hover:text-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateListingStatus(listing._id, 'removed')}
                                className="px-3 py-1 text-body-sm font-medium text-red-600 hover:text-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {listing.status === 'active' && (
                            <button
                              onClick={() => updateListingStatus(listing._id, 'removed')}
                              className="px-3 py-1 text-body-sm font-medium text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                          {listing.status === 'removed' && (
                            <button
                              onClick={() => updateListingStatus(listing._id, 'active')}
                              className="px-3 py-1 text-body-sm font-medium text-green-600 hover:text-green-700"
                            >
                              Restore
                            </button>
                          )}
                          <Link
                            href={`/listings/${listing.slug || listing._id}`}
                            className="px-3 py-1 text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border">
                <p className="text-body-sm text-text-secondary">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} listings
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="btn-outline py-1 px-3 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="btn-outline py-1 px-3 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminListingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rail-orange" />
      </div>
    }>
      <AdminListingsContent />
    </Suspense>
  );
}
