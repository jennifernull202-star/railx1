/**
 * THE RAIL EXCHANGE™ — My Listings Dashboard
 * 
 * View, manage, and track all user listings with
 * bulk actions, status filters, and quick edit access.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { EQUIPMENT_TYPES } from '@/lib/constants';

interface Listing {
  _id: string;
  title: string;
  slug: string;
  category: string;
  condition: string;
  status: 'draft' | 'pending' | 'active' | 'sold' | 'expired';
  price: {
    amount: number;
    negotiable: boolean;
  };
  images: Array<{ url: string; alt: string }>;
  viewCount: number;
  inquiryCount: number;
  premiumAddOns: {
    featured?: { active: boolean; expiresAt?: string };
    premium?: { active: boolean; expiresAt?: string };
    elite?: { active: boolean; expiresAt?: string };
    aiEnhanced?: boolean;
    specSheet?: { generated: boolean };
  };
  createdAt: string;
  updatedAt: string;
}

interface ListingsResponse {
  listings: Listing[];
  total: number;
  pages: number;
  page: number;
}

export default function MyListingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // UX Item #6: Track empty state shown event (once per session)
  const [emptyStateLogged, setEmptyStateLogged] = useState(false);

  const fetchListings = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        seller: session.user.id,
        page: page.toString(),
        limit: '10',
      });

      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const res = await fetch(`/api/listings?${params}`);
      if (!res.ok) throw new Error('Failed to fetch listings');

      const data: ListingsResponse = await res.json();
      setListings(data.listings);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, page, statusFilter]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchListings();
    }
  }, [sessionStatus, fetchListings]);
  
  // UX Item #6: Log empty state shown event once when no listings
  useEffect(() => {
    if (!isLoading && listings.length === 0 && statusFilter === 'all' && !emptyStateLogged) {
      console.log('[EVENT] seller_empty_listings_state_shown');
      setEmptyStateLogged(true);
    }
  }, [isLoading, listings.length, statusFilter, emptyStateLogged]);

  const toggleSelect = (id: string) => {
    setSelectedListings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedListings.size === listings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(listings.map(l => l._id)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete listing');
      
      setListings(prev => prev.filter(l => l._id !== id));
      setSelectedListings(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setTotal(prev => prev - 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedListings.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedListings.size} listing(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedListings).map(id =>
        fetch(`/api/listings/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      setListings(prev => prev.filter(l => !selectedListings.has(l._id)));
      setTotal(prev => prev - selectedListings.size);
      setSelectedListings(new Set());
    } catch {
      alert('Some listings could not be deleted');
    } finally {
      setIsDeleting(false);
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-status-success/10 text-status-success',
    draft: 'bg-surface-tertiary text-text-secondary',
    pending: 'bg-status-warning/10 text-status-warning',
    sold: 'bg-navy-100 text-navy-600',
    expired: 'bg-status-error/10 text-status-error',
  };

  // S-10.8: Listing Status Visibility Clarity
  const statusDescriptions: Record<string, string> = {
    active: 'Visible to buyers and accepting inquiries',
    draft: 'Not published — only visible to you',
    pending: 'Under review by our team',
    sold: 'Marked as sold — no longer accepting inquiries',
    expired: 'Unavailable due to policy or seller action',
  };

  const getCategoryLabel = (value: string) => {
    return EQUIPMENT_TYPES.find(t => t.value === value)?.label || value;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="heading-xl mb-1">My Listings</h1>
          <p className="text-body-md text-text-secondary">
            {total} total listing{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/listings/create" className="btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Listing
        </Link>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white rounded-xl border border-surface-border mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 gap-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'draft', 'pending', 'sold', 'expired'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-navy-900 text-white'
                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedListings.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-body-sm text-text-secondary">
                {selectedListings.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-status-error/10 text-status-error text-body-sm font-medium hover:bg-status-error/20 transition-colors disabled:opacity-50"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-2xl border border-surface-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-rail-orange/30 border-t-rail-orange rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading your listings...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-status-error">{error}</p>
            <button onClick={fetchListings} className="mt-4 btn-secondary">
              Try Again
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="heading-md mb-2">
              {statusFilter === 'all' ? 'No listings yet' : `No ${statusFilter} listings`}
            </h3>
            {/* UX Item #6: Enhanced copy clarifying draft vs. publish requirements */}
            <p className="text-body-md text-text-secondary mb-6">
              {statusFilter === 'all'
                ? 'Create your first listing. Drafts are free — verification is only required to publish.'
                : 'Try changing the filter or create a new listing.'}
            </p>
            <Link 
              href="/listings/create" 
              className="btn-primary"
              onClick={() => {
                // UX Item #6: Log create listing click from empty state
                if (statusFilter === 'all') {
                  console.log('[EVENT] seller_empty_listings_create_clicked');
                }
              }}
            >
              Create Listing
            </Link>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 border-b border-surface-border bg-surface-secondary text-body-sm font-medium text-text-secondary">
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selectedListings.size === listings.length && listings.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4 rounded border-surface-border text-rail-orange focus:ring-rail-orange/20"
                />
              </div>
              <div className="col-span-5">Listing</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-surface-border">
              {listings.map((listing) => (
                <div
                  key={listing._id}
                  className={`grid lg:grid-cols-12 gap-4 p-4 items-center hover:bg-surface-secondary/50 transition-colors ${
                    selectedListings.has(listing._id) ? 'bg-rail-orange/5' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <div className="hidden lg:block col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedListings.has(listing._id)}
                      onChange={() => toggleSelect(listing._id)}
                      className="w-4 h-4 rounded border-surface-border text-rail-orange focus:ring-rail-orange/20"
                    />
                  </div>

                  {/* Listing Info */}
                  <div className="lg:col-span-5 flex items-center gap-4">
                    <div className="relative w-20 h-20 bg-surface-secondary rounded-lg overflow-hidden flex-shrink-0">
                      {listing.images[0] ? (
                        <Image
                          src={getImageUrl(listing.images[0].url)}
                          alt={listing.images[0].alt || listing.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* Elite Badge */}
                      {listing.premiumAddOns.elite?.active && (
                        <div className="absolute top-1 left-1 w-5 h-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center" title="Elite">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {/* Premium Badge */}
                      {listing.premiumAddOns.premium?.active && !listing.premiumAddOns.elite?.active && (
                        <div className="absolute top-1 left-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center" title="Premium">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      )}
                      {/* Featured Badge */}
                      {listing.premiumAddOns.featured?.active && !listing.premiumAddOns.premium?.active && !listing.premiumAddOns.elite?.active && (
                        <div className="absolute top-1 left-1 w-5 h-5 bg-rail-orange rounded-full flex items-center justify-center" title="Featured">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/listings/${listing.slug}`}
                        className="text-body-md font-semibold text-navy-900 hover:text-rail-orange transition-colors line-clamp-1"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-caption text-text-tertiary mt-1">
                        {getCategoryLabel(listing.category)} • {listing.condition}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-caption text-text-tertiary">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {listing.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          {listing.inquiryCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status - S-10.8: Listing Status Visibility Clarity */}
                  <div className="lg:col-span-2">
                    <span 
                      className={`inline-flex px-3 py-1 rounded-full text-caption font-medium cursor-help ${statusColors[listing.status]}`}
                      title={statusDescriptions[listing.status]}
                    >
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="lg:col-span-2 text-right">
                    <p className="text-body-md font-semibold text-navy-900">
                      ${listing.price.amount.toLocaleString()}
                    </p>
                    {listing.price.negotiable && (
                      <p className="text-caption text-text-tertiary">Negotiable</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2 flex items-center justify-end gap-2">
                    {/* Boost Button - Only show for active listings without Elite */}
                    {listing.status === 'active' && !listing.premiumAddOns?.elite?.active && (
                      <Link
                        href={`/dashboard/listings/${listing._id}/boost`}
                        className="p-2 rounded-lg text-rail-orange hover:text-white hover:bg-rail-orange transition-colors"
                        title="Boost Listing"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/listings/${listing._id}/edit`}
                      className="p-2 rounded-lg text-text-secondary hover:text-navy-900 hover:bg-surface-secondary transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <Link
                      href={`/listings/${listing.slug}`}
                      className="p-2 rounded-lg text-text-secondary hover:text-navy-900 hover:bg-surface-secondary transition-colors"
                      title="View"
                      target="_blank"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(listing._id)}
                      disabled={isDeleting}
                      className="p-2 rounded-lg text-text-secondary hover:text-status-error hover:bg-status-error/10 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-surface-border">
                <p className="text-body-sm text-text-secondary">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-surface-border text-body-sm font-medium hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-surface-border text-body-sm font-medium hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
