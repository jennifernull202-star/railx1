/**
 * THE RAIL EXCHANGE™ — Conversation Thread
 * 
 * View and reply to a specific inquiry conversation.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { useRateLimitFeedback } from '@/lib/hooks/useRateLimitFeedback';

interface InquiryUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface InquiryListing {
  _id: string;
  title: string;
  slug: string;
  images?: Array<{ url: string; alt: string }>;
  price?: { amount: number };
}

interface Message {
  _id: string;
  sender: InquiryUser;
  content: string;
  createdAt: string;
  readAt?: string;
}

interface Inquiry {
  _id: string;
  listing: InquiryListing;
  buyer: InquiryUser;
  seller: InquiryUser;
  subject: string;
  status: string;
  messages: Message[];
  lastMessageAt: string;
  createdAt: string;
}

export default function ConversationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const inquiryId = params.id as string;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // S-15.1: Rate limit feedback
  const {
    isRateLimited,
    message: rateLimitMessage,
    checkAndHandleRateLimit,
  } = useRateLimitFeedback();

  const fetchInquiry = useCallback(async () => {
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Conversation not found');
        if (res.status === 403) throw new Error('Not authorized');
        throw new Error('Failed to load conversation');
      }
      const data = await res.json();
      setInquiry(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    fetchInquiry();
  }, [fetchInquiry]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [inquiry?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      // S-15.1: Handle rate limiting with countdown feedback
      if (res.status === 429) {
        checkAndHandleRateLimit(res);
        return;
      }

      if (!res.ok) throw new Error('Failed to send message');

      const updatedInquiry = await res.json();
      setInquiry(updatedInquiry);
      setNewMessage('');
    } catch {
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseInquiry = async () => {
    if (!confirm('Are you sure you want to close this conversation?')) return;

    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });

      if (!res.ok) throw new Error('Failed to close conversation');
      await fetchInquiry();
    } catch {
      alert('Failed to close conversation');
    }
  };

  const handleArchive = async () => {
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true }),
      });

      if (!res.ok) throw new Error('Failed to archive conversation');
      router.push('/dashboard/messages');
    } catch {
      alert('Failed to archive conversation');
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isOwnMessage = (message: Message) => {
    return message.sender._id === session?.user?.id;
  };

  const getOtherParty = () => {
    if (!inquiry) return null;
    return inquiry.buyer._id === session?.user?.id ? inquiry.seller : inquiry.buyer;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-12 h-12 border-4 border-rail-orange/30 border-t-rail-orange rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Loading conversation...</p>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-status-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="heading-lg mb-2">Unable to Load Conversation</h2>
        <p className="text-text-secondary mb-6">{error}</p>
        <Link href="/dashboard/messages" className="btn-primary">
          Back to Messages
        </Link>
      </div>
    );
  }

  const otherParty = getOtherParty();
  const isSeller = inquiry.seller._id === session?.user?.id;
  
  // S-11.7: Check if buyer is viewing a thread with no seller response
  const isBuyer = !isSeller;
  const hasSellerResponded = inquiry.messages.some(
    (msg) => msg.sender._id === inquiry.seller._id
  );
  const showNoResponseHint = isBuyer && !hasSellerResponded && inquiry.messages.length > 0;

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex-shrink-0 bg-white rounded-t-2xl border border-surface-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/messages"
              className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 font-semibold">
                {otherParty?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-body-md font-semibold text-navy-900">
                  {otherParty?.name}
                </p>
                <p className="text-caption text-text-tertiary">
                  {otherParty?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSeller && inquiry.status !== 'closed' && (
              <button
                onClick={handleCloseInquiry}
                className="px-3 py-1.5 text-body-sm font-medium text-text-secondary hover:text-navy-900 hover:bg-surface-secondary rounded-lg transition-colors"
              >
                Close
              </button>
            )}
            <button
              onClick={handleArchive}
              className="px-3 py-1.5 text-body-sm font-medium text-text-secondary hover:text-navy-900 hover:bg-surface-secondary rounded-lg transition-colors"
            >
              Archive
            </button>
          </div>
        </div>

        {/* Listing Card */}
        <div className="mt-4 p-3 bg-surface-secondary rounded-lg">
          <Link
            href={`/listings/${inquiry.listing.slug}`}
            className="flex items-center gap-3 group"
          >
            <div className="relative w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0">
              {inquiry.listing.images?.[0] ? (
                <Image
                  src={getImageUrl(inquiry.listing.images[0].url)}
                  alt={inquiry.listing.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-navy-900 group-hover:text-rail-orange transition-colors line-clamp-1">
                {inquiry.listing.title}
              </p>
              {inquiry.listing.price && (
                <p className="text-caption text-text-secondary">
                  ${typeof inquiry.listing.price === 'object' && 'amount' in inquiry.listing.price && inquiry.listing.price.amount 
                    ? Number(inquiry.listing.price.amount).toLocaleString() 
                    : typeof inquiry.listing.price === 'number' 
                      ? Number(inquiry.listing.price).toLocaleString()
                      : 'Contact for price'}
                </p>
              )}
            </div>
            <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white border-x border-surface-border p-4 space-y-4">
        {inquiry.messages.map((message, index) => {
          const isOwn = isOwnMessage(message);
          const showAvatar =
            index === 0 ||
            inquiry.messages[index - 1].sender._id !== message.sender._id;

          return (
            <div
              key={message._id || index}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                {showAvatar ? (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isOwn ? 'bg-rail-orange text-white' : 'bg-navy-100 text-navy-600'
                  }`}>
                    <span className="text-caption font-semibold">
                      {message.sender.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}

                <div>
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    isOwn
                      ? 'bg-rail-orange text-white rounded-tr-sm'
                      : 'bg-surface-secondary text-navy-900 rounded-tl-sm'
                  }`}>
                    <p className="text-body-md whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className={`text-xs text-text-tertiary mt-1 ${isOwn ? 'text-right' : ''}`}>
                    {formatMessageTime(message.createdAt)}
                    {isOwn && message.readAt && (
                      <span className="ml-1">• Read</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
        
        {/* S-11.7: No-Response Edge State (Buyer View) */}
        {showNoResponseHint && (
          <div className="text-center py-4 border-t border-surface-border mt-4">
            <p className="text-xs text-text-tertiary">
              Some sellers may not respond to every inquiry.<br />
              Consider contacting additional sellers.
            </p>
          </div>
        )}
      </div>

      {/* Message Input */}
      {inquiry.status !== 'closed' && inquiry.status !== 'spam' ? (
        <form
          onSubmit={handleSendMessage}
          className="flex-shrink-0 bg-white rounded-b-2xl border border-t-0 border-surface-border p-4"
        >
          {/* S-15.1: Rate limit feedback */}
          {isRateLimited && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              {rateLimitMessage}
            </div>
          )}
          <div className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type your message..."
              rows={2}
              className="flex-1 input-field resize-none"
              disabled={isRateLimited}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending || isRateLimited}
              className="btn-primary px-6 self-end disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-caption text-text-tertiary mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      ) : (
        <div className="flex-shrink-0 bg-surface-secondary rounded-b-2xl border border-t-0 border-surface-border p-4 text-center">
          {/* S-6.5: Abuse Feedback Loop - neutral status, no accusation */}
          <p className="text-body-sm text-text-secondary">
            This conversation is no longer active.
          </p>
        </div>
      )}
    </div>
  );
}
