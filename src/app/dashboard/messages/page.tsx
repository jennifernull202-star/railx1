/**
 * THE RAIL EXCHANGE™ — Messages Inbox
 * 
 * View and manage inquiries and conversations with buyers/sellers.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { Shield, Clock, Package } from 'lucide-react';

interface InquiryListing {
  _id: string;
  title: string;
  slug: string;
  images?: Array<{ url: string; alt: string }>;
}

interface InquiryUser {
  _id: string;
  name: string;
  email: string;
  verifiedSeller?: boolean;
  verifiedSellerExpiresAt?: string;
}

interface BuyerIntent {
  quantity?: number;
  timeline?: 'immediate' | 'short_term' | 'medium_term' | 'long_term' | 'unspecified';
  purpose?: string;
}

interface Inquiry {
  _id: string;
  listing: InquiryListing;
  buyer: InquiryUser;
  seller: InquiryUser;
  subject: string;
  status: string;
  messages: Array<{
    sender: string;
    content: string;
    createdAt: string;
  }>;
  lastMessageAt: string;
  buyerUnreadCount: number;
  sellerUnreadCount: number;
  buyerIntent?: BuyerIntent;
  responseTimeMinutes?: number;
  createdAt: string;
}

export default function InboxPage() {
  useSession();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'seller' | 'buyer'>('seller');
  const [statusFilter, setStatusFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchInquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        role,
        status: statusFilter,
      });

      const res = await fetch(`/api/inquiries?${params}`);
      if (!res.ok) throw new Error('Failed to fetch inquiries');

      const data = await res.json();
      setInquiries(data.inquiries);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [role, statusFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getUnreadCount = (inquiry: Inquiry) => {
    return role === 'seller' ? inquiry.sellerUnreadCount : inquiry.buyerUnreadCount;
  };

  const getOtherParty = (inquiry: Inquiry) => {
    return role === 'seller' ? inquiry.buyer : inquiry.seller;
  };

  const statusColors: Record<string, string> = {
    new: 'bg-rail-orange/10 text-rail-orange',
    read: 'bg-surface-tertiary text-text-secondary',
    replied: 'bg-status-success/10 text-status-success',
    closed: 'bg-navy-100 text-navy-600',
    spam: 'bg-status-error/10 text-status-error',
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="heading-xl mb-1">Messages</h1>
          <p className="text-body-md text-text-secondary">
            {unreadCount > 0
              ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex items-center bg-surface-secondary rounded-lg p-1">
          <button
            onClick={() => setRole('seller')}
            className={`px-4 py-2 rounded-md text-body-sm font-medium transition-colors ${
              role === 'seller'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-text-secondary hover:text-navy-900'
            }`}
          >
            Received
          </button>
          <button
            onClick={() => setRole('buyer')}
            className={`px-4 py-2 rounded-md text-body-sm font-medium transition-colors ${
              role === 'buyer'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-text-secondary hover:text-navy-900'
            }`}
          >
            Sent
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'new', 'read', 'replied', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
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

      {/* Inbox List */}
      <div className="bg-white rounded-2xl border border-surface-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-rail-orange/30 border-t-rail-orange rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading messages...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-status-error mb-4">{error}</p>
            <button onClick={fetchInquiries} className="btn-secondary">
              Try Again
            </button>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="heading-md mb-2">No messages</h3>
            <p className="text-body-md text-text-secondary">
              {role === 'seller'
                ? "You haven't received any inquiries yet."
                : "You haven't sent any inquiries yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {inquiries.map((inquiry) => {
              const unread = getUnreadCount(inquiry);
              const otherParty = getOtherParty(inquiry);
              const lastMessage = inquiry.messages[inquiry.messages.length - 1];
              
              // Check if buyer is verified (for seller view)
              const isBuyerVerified = role === 'seller' && inquiry.buyer?.verifiedSeller && 
                (!inquiry.buyer.verifiedSellerExpiresAt || new Date(inquiry.buyer.verifiedSellerExpiresAt) > new Date());
              
              // Format buyer intent timeline
              const timelineLabels: Record<string, string> = {
                immediate: 'Urgent',
                short_term: '1-3 mo',
                medium_term: '3-6 mo',
                long_term: '6+ mo',
                unspecified: '',
              };

              return (
                <Link
                  key={inquiry._id}
                  href={`/dashboard/messages/${inquiry._id}`}
                  className={`block p-4 hover:bg-surface-secondary/50 transition-colors ${
                    unread > 0 ? 'bg-rail-orange/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Listing Image */}
                    <div className="relative w-14 h-14 bg-surface-secondary rounded-lg overflow-hidden flex-shrink-0">
                      {inquiry.listing.images?.[0] ? (
                        <Image
                          src={getImageUrl(inquiry.listing.images[0].url)}
                          alt={inquiry.listing.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {unread > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-rail-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {unread}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-body-md ${unread > 0 ? 'font-semibold text-navy-900' : 'font-medium text-navy-900'} line-clamp-1`}>
                              {otherParty.name}
                            </p>
                            {/* Verified Buyer Badge - only show in seller view */}
                            {isBuyerVerified && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                <Shield className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-body-sm text-text-secondary line-clamp-1">
                            {inquiry.subject}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-caption text-text-tertiary whitespace-nowrap">
                            {formatDate(inquiry.lastMessageAt)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inquiry.status]}`}>
                            {inquiry.status}
                          </span>
                        </div>
                      </div>

                      {/* Buyer Intent Tags - only show in seller view */}
                      {role === 'seller' && inquiry.buyerIntent && (inquiry.buyerIntent.quantity || inquiry.buyerIntent.timeline !== 'unspecified') && (
                        <div className="flex items-center gap-2 mt-1.5">
                          {inquiry.buyerIntent.quantity && inquiry.buyerIntent.quantity > 1 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              <Package className="w-3 h-3" />
                              Qty: {inquiry.buyerIntent.quantity}
                            </span>
                          )}
                          {inquiry.buyerIntent.timeline && timelineLabels[inquiry.buyerIntent.timeline] && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                              <Clock className="w-3 h-3" />
                              {timelineLabels[inquiry.buyerIntent.timeline]}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Last Message Preview */}
                      <p className="text-body-sm text-text-tertiary mt-1 line-clamp-1">
                        {lastMessage?.content}
                      </p>

                      {/* Listing Title */}
                      <p className="text-caption text-text-tertiary mt-1 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="line-clamp-1">{inquiry.listing.title}</span>
                      </p>
                    </div>

                    {/* Chevron */}
                    <svg className="w-5 h-5 text-text-tertiary flex-shrink-0 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
