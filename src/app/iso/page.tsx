/**
 * THE RAIL EXCHANGE™ — Public ISO (In Search Of) Browse Page
 * 
 * Public page where anyone can browse active ISO requests.
 * Users can filter by category and respond if logged in.
 */

import { Metadata } from 'next';
import connectDB from '@/lib/db';
import ISORequest from '@/models/ISORequest';
import { ISO_CATEGORY_LABELS, ISOCategory } from '@/lib/iso-constants';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export const metadata: Metadata = {
  title: 'In Search Of (ISO) Requests | THE RAIL EXCHANGE™',
  description: 'Browse ISO requests from railroad professionals looking for equipment, materials, contractors, and services. Find what buyers need.',
};

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
  status: string;
  responseCount: number;
  viewCount: number;
  userId: {
    _id: string;
    name: string;
    image?: string;
  };
  createdAt: string;
}

async function getISORequests(category?: string): Promise<ISORequestDoc[]> {
  await connectDB();
  
  const query: Record<string, unknown> = { status: 'active' };
  if (category && category !== 'all') {
    query.category = category;
  }
  
  const requests = await ISORequest.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('userId', 'name image')
    .lean();
  
  return JSON.parse(JSON.stringify(requests));
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

export default async function ISOBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const selectedCategory = params.category || 'all';
  const requests = await getISORequests(selectedCategory);

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Hero Section */}
      <div className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            In Search Of (ISO) Requests
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mb-6">
            Browse what buyers are looking for. Have the equipment, materials, or services they need? Respond and connect!
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/iso/create"
              className="inline-flex items-center px-5 py-2.5 bg-rail-orange text-white font-semibold rounded-lg hover:bg-rail-orange-dark transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post ISO Request
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-5 py-2.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-text-secondary">Filter by category:</span>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/iso"
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-navy-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </Link>
              {Object.entries(ISO_CATEGORY_LABELS).map(([value, label]) => (
                <Link
                  key={value}
                  href={`/iso?category=${value}`}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === value
                      ? 'bg-navy-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-text-secondary">
            {requests.length} {requests.length === 1 ? 'request' : 'requests'} found
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-navy-900 mb-2">No ISO Requests Found</h3>
            <p className="text-text-secondary mb-6">
              {selectedCategory !== 'all'
                ? `No active requests in the "${ISO_CATEGORY_LABELS[selectedCategory as ISOCategory]}" category.`
                : 'No active ISO requests at the moment.'}
            </p>
            <Link
              href="/iso/create"
              className="inline-flex items-center px-5 py-2.5 bg-rail-orange text-white font-semibold rounded-lg hover:bg-rail-orange-dark transition-colors"
            >
              Be the First to Post
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Link
                key={request._id}
                href={`/iso/${request._id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 block"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {ISO_CATEGORY_LABELS[request.category] || request.category}
                      </span>
                      <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Active
                      </span>
                    </div>
                    
                    <h2 className="text-lg font-semibold text-navy-900 mb-2 hover:text-rail-orange transition-colors">
                      {request.title}
                    </h2>
                    
                    <p className="text-text-secondary text-sm line-clamp-2 mb-3">
                      {request.description}
                    </p>
                    
                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                      {formatLocation(request.location) && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {formatLocation(request.location)}
                        </span>
                      )}
                      {formatBudget(request.budget) && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatBudget(request.budget)}
                        </span>
                      )}
                      {request.neededBy && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Needed by {new Date(request.neededBy).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Stats & User */}
                  <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-2 text-sm">
                    <div className="flex items-center gap-1 text-text-secondary">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {request.responseCount} {request.responseCount === 1 ? 'response' : 'responses'}
                    </div>
                    <div className="flex items-center gap-2">
                      {request.userId?.image ? (
                        <img
                          src={request.userId.image}
                          alt={request.userId.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {request.userId?.name?.[0] || '?'}
                          </span>
                        </div>
                      )}
                      <span className="text-text-secondary">{request.userId?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-navy-900 text-white py-12 mt-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Looking for Something Specific?</h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            Post an ISO request and let sellers come to you. It&apos;s free for all members!
          </p>
          <Link
            href="/iso/create"
            className="inline-flex items-center px-6 py-3 bg-rail-orange text-white font-semibold rounded-lg hover:bg-rail-orange-dark transition-colors"
          >
            Post Your ISO Request
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
