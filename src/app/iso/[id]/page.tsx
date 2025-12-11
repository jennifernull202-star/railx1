/**
 * THE RAIL EXCHANGE™ — ISO Request Detail Page
 * 
 * Public page showing details of a single ISO request.
 * Users can view and respond (if logged in).
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/db';
import ISORequest from '@/models/ISORequest';
import { ISO_CATEGORY_LABELS, ISOCategory } from '@/lib/iso-constants';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import ISORespondButton from '@/components/iso/ISORespondButton';

interface ISORequestDoc {
  _id: string;
  title: string;
  category: ISOCategory;
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

async function getISORequest(id: string): Promise<ISORequestDoc | null> {
  try {
    await connectDB();
    
    const request = await ISORequest.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    )
      .populate('userId', 'name email image')
      .lean();
    
    if (!request || request.status === 'deleted') {
      return null;
    }
    
    return JSON.parse(JSON.stringify(request));
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const request = await getISORequest(id);
  
  if (!request) {
    return {
      title: 'ISO Request Not Found | THE RAIL EXCHANGE™',
    };
  }
  
  return {
    title: `${request.title} | ISO Request | THE RAIL EXCHANGE™`,
    description: request.description.slice(0, 160),
  };
}

function formatBudget(budget?: { min?: number; max?: number; currency?: string; type?: string }) {
  if (!budget) return null;
  
  const currency = budget.currency || 'USD';
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
  
  if (budget.min && budget.max) {
    return `${formatter.format(budget.min)} - ${formatter.format(budget.max)}`;
  }
  if (budget.max) {
    return `Up to ${formatter.format(budget.max)}`;
  }
  if (budget.min) {
    return `From ${formatter.format(budget.min)}`;
  }
  if (budget.type === 'negotiable') {
    return 'Negotiable';
  }
  return null;
}

function formatLocation(location?: { city?: string; state?: string; country?: string }) {
  if (!location) return null;
  const parts = [location.city, location.state, location.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: 'Active', bg: 'bg-green-100', text: 'text-green-800' },
  fulfilled: { label: 'Fulfilled', bg: 'bg-blue-100', text: 'text-blue-800' },
  closed: { label: 'Closed', bg: 'bg-gray-100', text: 'text-gray-600' },
};

export default async function ISODetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getISORequest(id);
  
  if (!request) {
    notFound();
  }
  
  const statusStyle = STATUS_STYLES[request.status] || STATUS_STYLES.active;
  const locationStr = formatLocation(request.location);
  const budgetStr = formatBudget(request.budget);
  
  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/iso" className="text-text-secondary hover:text-navy-900 transition-colors">
              ISO Requests
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-navy-900 font-medium truncate max-w-xs">{request.title}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              {/* Header */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {ISO_CATEGORY_LABELS[request.category] || request.category}
                </span>
                <span className={`px-3 py-1 ${statusStyle.bg} ${statusStyle.text} text-sm font-medium rounded-full`}>
                  {statusStyle.label}
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-navy-900 mb-4">
                {request.title}
              </h1>
              
              {/* Meta Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-6 pb-6 border-b">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Posted {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {request.viewCount} views
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {request.responseCount} responses
                </span>
              </div>
              
              {/* Description */}
              <div className="prose prose-navy max-w-none mb-8">
                <h2 className="text-lg font-semibold text-navy-900 mb-3">Description</h2>
                <p className="text-text-primary whitespace-pre-wrap">{request.description}</p>
              </div>
              
              {/* Details Grid */}
              <div className="grid sm:grid-cols-2 gap-6">
                {locationStr && (
                  <div>
                    <h3 className="text-sm font-medium text-text-secondary mb-1">Location</h3>
                    <p className="flex items-center gap-2 text-navy-900">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {locationStr}
                    </p>
                  </div>
                )}
                
                {budgetStr && (
                  <div>
                    <h3 className="text-sm font-medium text-text-secondary mb-1">Budget</h3>
                    <p className="flex items-center gap-2 text-navy-900">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {budgetStr}
                    </p>
                  </div>
                )}
                
                {request.neededBy && (
                  <div>
                    <h3 className="text-sm font-medium text-text-secondary mb-1">Needed By</h3>
                    <p className="flex items-center gap-2 text-navy-900">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {format(new Date(request.neededBy), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-1">Messaging</h3>
                  <p className="flex items-center gap-2 text-navy-900">
                    {request.allowMessaging ? (
                      <>
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Open for direct messages
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Responses only
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Poster Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-navy-900 mb-4">Posted By</h2>
              <div className="flex items-center gap-4 mb-4">
                {request.userId?.image ? (
                  <img
                    src={request.userId.image}
                    alt={request.userId.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center">
                    <span className="text-lg font-semibold text-navy-600">
                      {request.userId?.name?.[0] || '?'}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-navy-900">{request.userId?.name || 'Unknown'}</p>
                  <p className="text-sm text-text-secondary">Member</p>
                </div>
              </div>
              
              {request.status === 'active' && (
                <ISORespondButton
                  requestId={request._id}
                  requestTitle={request.title}
                  allowMessaging={request.allowMessaging}
                  ownerId={request.userId._id}
                />
              )}
              
              {request.status !== 'active' && (
                <div className={`p-4 rounded-lg ${statusStyle.bg}`}>
                  <p className={`text-sm font-medium ${statusStyle.text}`}>
                    This request is {statusStyle.label.toLowerCase()}.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-navy-900 mb-4">Have Equipment to Sell?</h2>
              <p className="text-sm text-text-secondary mb-4">
                If you don&apos;t have what this buyer needs, consider listing your equipment on the marketplace.
              </p>
              <Link
                href="/listings/create"
                className="block w-full text-center px-4 py-2.5 border border-navy-900 text-navy-900 font-semibold rounded-lg hover:bg-navy-50 transition-colors"
              >
                Create Listing
              </Link>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/iso"
            className="inline-flex items-center text-text-secondary hover:text-navy-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to all ISO requests
          </Link>
        </div>
      </div>
    </div>
  );
}
