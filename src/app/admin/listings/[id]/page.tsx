/**
 * THE RAIL EXCHANGE™ — Admin Listing Detail Page
 * 
 * View and manage individual listings with approval workflow.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  Eye,
  DollarSign,
  MapPin,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  Play,
  Trash2,
  AlertTriangle,
  ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface ListingDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string;
  status: 'draft' | 'pending' | 'active' | 'paused' | 'sold' | 'expired' | 'removed';
  price: {
    type: string;
    amount?: number;
    currency: string;
  };
  location: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
  images: string[];
  sellerId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  inquiryCount?: number;
  condition?: string;
  specifications?: Record<string, string>;
  // S-14.4: Report visibility fields
  reportCount?: number;
  isFlagged?: boolean;
  flagReason?: string;
}

const STATUS_CONFIG = {
  draft: { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Draft' },
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending Review' },
  active: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Active' },
  paused: { color: 'bg-blue-100 text-blue-700', icon: Pause, label: 'Paused' },
  sold: { color: 'bg-purple-100 text-purple-700', icon: CheckCircle, label: 'Sold' },
  expired: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Expired' },
  removed: { color: 'bg-red-100 text-red-700', icon: Trash2, label: 'Removed' },
};

export default function AdminListingDetailPage() {
  const params = useParams();
  const listingId = params.id as string;
  
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/listings/${listingId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Listing not found');
            return;
          }
          throw new Error('Failed to fetch listing');
        }
        const data = await res.json();
        setListing(data.listing);
      } catch (err) {
        setError('Failed to load listing details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const updateStatus = async (newStatus: string) => {
    if (!listing) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      const data = await res.json();
      setListing(data.listing);
    } catch (err) {
      console.error('Failed to update listing status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: ListingDetail['price']) => {
    if (price.type === 'contact') return 'Contact for Price';
    if (price.type === 'auction') return 'Auction';
    if (price.amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: price.currency || 'USD',
        maximumFractionDigits: 0,
      }).format(price.amount);
    }
    return 'Price not set';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            {error || 'Listing not found'}
          </h2>
          <Link
            href="/admin/listings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[listing.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/listings"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Listings
        </Link>
        <a
          href={`/listings/${listing.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          View Public Listing
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Images */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {listing.images && listing.images.length > 0 ? (
              <>
                <div className="aspect-[4/3] relative bg-gray-100">
                  <Image
                    src={getImageUrl(listing.images[selectedImage])}
                    alt={listing.title}
                    fill
                    className="object-contain"
                  />
                </div>
                {listing.images.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {listing.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                          selectedImage === idx ? 'border-purple-600' : 'border-gray-200'
                        }`}
                      >
                        <Image
                          src={getImageUrl(img)}
                          alt={`${listing.title} ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[4/3] flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-400">
                  <ImageIcon className="h-16 w-16 mx-auto mb-2" />
                  <p>No images</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <div className="prose prose-sm max-w-none text-gray-600">
              {listing.description || 'No description provided.'}
            </div>
          </div>

          {/* Specifications */}
          {listing.specifications && Object.keys(listing.specifications).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(listing.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-gray-100 pb-2">
                    <dt className="text-sm text-gray-500">{key}</dt>
                    <dd className="text-sm font-medium text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status & Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Status</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full ${statusConfig.color}`}>
                <StatusIcon className="h-4 w-4" />
                {statusConfig.label}
              </span>
            </div>

            <div className="space-y-2">
              {listing.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateStatus('active')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Listing
                  </button>
                  <button
                    onClick={() => updateStatus('removed')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Listing
                  </button>
                </>
              )}
              {listing.status === 'active' && (
                <>
                  <button
                    onClick={() => updateStatus('paused')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Pause className="h-4 w-4" />
                    Pause Listing
                  </button>
                  <button
                    onClick={() => updateStatus('removed')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Listing
                  </button>
                </>
              )}
              {listing.status === 'paused' && (
                <button
                  onClick={() => updateStatus('active')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  Reactivate Listing
                </button>
              )}
            </div>
          </div>

          {/* S-14.4: Reports Section - Admin-only visibility */}
          {((listing.reportCount && listing.reportCount > 0) || listing.isFlagged) && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 space-y-3">
              <h2 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Has reports
              </h2>
              <div className="space-y-2 text-sm">
                {listing.reportCount && listing.reportCount > 0 && (
                  <p className="text-amber-700">
                    <span className="font-medium">{listing.reportCount}</span> report{listing.reportCount !== 1 ? 's' : ''} received
                  </p>
                )}
                {listing.isFlagged && (
                  <p className="text-amber-700">
                    Listing flagged for review
                  </p>
                )}
                {listing.flagReason && (
                  <p className="text-amber-600 text-xs">
                    Reason: {listing.flagReason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Listing Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{listing.title}</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-gray-900">{formatPrice(listing.price)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="h-4 w-4 flex-shrink-0" />
                <span className="capitalize">{listing.category}</span>
                {listing.subcategory && (
                  <>
                    <span>→</span>
                    <span className="capitalize">{listing.subcategory}</span>
                  </>
                )}
              </div>

              {listing.location && (listing.location.city || listing.location.state) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {[listing.location.city, listing.location.state, listing.location.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}

              {listing.condition && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="h-4 w-4 flex-shrink-0" />
                  <span>Condition: {listing.condition}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-600">
                <Eye className="h-4 w-4 flex-shrink-0" />
                <span>{listing.viewCount} views</span>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Seller
            </h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <Link 
                  href={`/admin/users/${listing.sellerId._id}`}
                  className="font-medium text-purple-600 hover:underline"
                >
                  {listing.sellerId.name}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{listing.sellerId.email}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Timeline
            </h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">{formatDate(listing.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="font-medium">{formatDate(listing.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
