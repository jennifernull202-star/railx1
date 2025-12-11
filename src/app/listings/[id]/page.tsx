/**
 * THE RAIL EXCHANGE™ — Listing Detail Page
 * 
 * Displays a single listing with all details, images, and contact options.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';
import connectDB from '@/lib/db';
import Listing from '@/models/Listing';
import mongoose from 'mongoose';
import ContactSellerForm from '@/components/ContactSellerForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface PopulatedSeller {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface ListingData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string;
  condition: string;
  status: string;
  sellerId: PopulatedSeller;
  sellerType: string;
  price: {
    type: string;
    amount?: number;
    currency: string;
    originalAmount?: number;
    pricePerUnit?: string;
  };
  location: {
    city: string;
    state: string;
    country: string;
    zipCode?: string;
  };
  media: Array<{
    url: string;
    type: string;
    caption?: string;
    isPrimary?: boolean;
    order: number;
  }>;
  specifications: Array<{
    label: string;
    value: string;
    unit?: string;
  }>;
  quantity: number;
  quantityUnit?: string;
  shippingOptions: {
    localPickup: boolean;
    sellerShips: boolean;
    buyerArranges: boolean;
    estimatedWeight?: number;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      unit: string;
    };
  };
  premiumAddOns: {
    featured: { active: boolean; expiresAt?: string };
    premium?: { active: boolean; expiresAt?: string };
    elite?: { active: boolean; expiresAt?: string };
    verifiedBadge?: { active: boolean; expiresAt?: string };
    aiEnhanced?: boolean;
    specSheet?: { generated: boolean; url?: string };
  };
  tags: string[];
  viewCount: number;
  inquiryCount: number;
  saveCount: number;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'locomotives': 'Locomotives',
  'freight-cars': 'Freight Cars',
  'passenger-cars': 'Passenger Cars',
  'maintenance-of-way': 'Maintenance of Way',
  'track-materials': 'Track Materials',
  'signals-communications': 'Signals & Communications',
  'parts-components': 'Parts & Components',
  'tools-equipment': 'Tools & Equipment',
  'real-estate': 'Real Estate',
  'services': 'Services',
};

const CONDITION_LABELS: Record<string, string> = {
  'new': 'New',
  'rebuilt': 'Rebuilt',
  'refurbished': 'Refurbished',
  'used-excellent': 'Used - Excellent',
  'used-good': 'Used - Good',
  'used-fair': 'Used - Fair',
  'for-parts': 'For Parts',
  'as-is': 'As-Is',
};

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    await connectDB();
    const { id } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const listing = await Listing.findOne(
      isObjectId ? { _id: id } : { slug: id }
    );

    if (!listing) {
      return { title: 'Listing Not Found | The Rail Exchange' };
    }

    return {
      title: `${listing.title} | The Rail Exchange`,
      description: listing.description.substring(0, 160),
      openGraph: {
        title: listing.title,
        description: listing.description.substring(0, 160),
        images: listing.primaryImageUrl ? [listing.primaryImageUrl] : [],
      },
    };
  } catch {
    return { title: 'Listing | The Rail Exchange' };
  }
}

function formatPrice(price: ListingData['price']): string {
  if (price.type === 'contact') return 'Contact for Price';
  if (price.type === 'rfq') return 'Request for Quote';
  if (!price.amount) return 'Price Not Set';
  
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price.amount);

  if (price.pricePerUnit) {
    return `${formatted} ${price.pricePerUnit}`;
  }

  return formatted;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function ListingDetailPage({ params }: PageProps) {
  await connectDB();

  const { id } = await params;
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const listing = await Listing.findOne(
    isObjectId ? { _id: id } : { slug: id }
  )
    .populate('sellerId', 'name email image')
    .lean() as ListingData | null;

  if (!listing || listing.status !== 'active') {
    notFound();
  }

  // Increment view count (in real app, do this via API with rate limiting)
  await Listing.updateOne({ _id: listing._id }, { $inc: { viewCount: 1 } });

  // Sort media by order and find primary
  const sortedMedia = [...listing.media].sort((a, b) => a.order - b.order);
  const primaryImage = sortedMedia.find(m => m.isPrimary) || sortedMedia[0];
  const images = sortedMedia.filter(m => m.type === 'image');
  const documents = sortedMedia.filter(m => m.type === 'document');

  return (
    <>
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-border/50">
        <nav className="container-rail">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center">
              <span className="text-heading-lg font-bold text-navy-900">The Rail</span>
              <span className="text-heading-lg font-bold text-rail-orange ml-1">Exchange</span>
              <span className="text-rail-orange text-sm font-medium ml-0.5">™</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/listings" className="text-body-md font-medium text-text-secondary hover:text-navy-900">
                ← All Listings
              </Link>
              <Link href="/listings/create" className="btn-primary py-2 px-4">
                List Your Equipment
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 bg-surface-secondary pb-16">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-surface-border">
          <div className="container-rail py-4">
            <nav className="flex items-center gap-2 text-body-sm">
              <Link href="/listings" className="text-text-secondary hover:text-navy-900">
                Listings
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link
                href={`/listings?category=${listing.category}`}
                className="text-text-secondary hover:text-navy-900"
              >
                {CATEGORY_LABELS[listing.category] || listing.category}
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-navy-900 font-medium truncate">{listing.title}</span>
            </nav>
          </div>
        </div>

        <div className="container-rail py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Images & Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image Gallery */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden">
                {/* Main Image */}
                <div className="aspect-[4/3] bg-navy-100 relative">
                  {primaryImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getImageUrl(primaryImage.url)}
                      alt={listing.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-24 h-24 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Elite Badge */}
                  {listing.premiumAddOns.elite?.active && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1.5 rounded-lg font-semibold text-sm flex items-center shadow-lg">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Elite
                    </div>
                  )}

                  {/* Premium Badge */}
                  {listing.premiumAddOns.premium?.active && !listing.premiumAddOns.elite?.active && (
                    <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1.5 rounded-lg font-semibold text-sm flex items-center shadow-lg">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Premium
                    </div>
                  )}

                  {/* Featured Badge */}
                  {listing.premiumAddOns.featured?.active && !listing.premiumAddOns.premium?.active && !listing.premiumAddOns.elite?.active && (
                    <div className="absolute top-4 left-4 badge-featured">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Featured
                    </div>
                  )}

                  {/* AI Enhanced Badge (additional indicator) */}
                  {listing.premiumAddOns.aiEnhanced && (
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.5 3a1.5 1.5 0 100 3h.5a.5.5 0 01.5.5v.5a1.5 1.5 0 003 0V6a1 1 0 00-1-1h-.5a1.5 1.5 0 01-1.5-1.5V3zm-5 0A1.5 1.5 0 017 4.5V5a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3H6a.5.5 0 01.5.5v.5a1.5 1.5 0 003 0V9.5a.5.5 0 01.5-.5h.5a1.5 1.5 0 000-3H10a1 1 0 01-1-1v-.5A1.5 1.5 0 008.5 3z" />
                      </svg>
                      AI
                    </div>
                  )}

                  {/* Verified Asset Badge */}
                  {listing.premiumAddOns.verifiedBadge?.active && (
                    <div className={`absolute ${listing.premiumAddOns.aiEnhanced ? 'top-12' : 'top-4'} right-4 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center`}>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified Asset
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="p-4 border-t border-surface-border">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.slice(0, 8).map((img, index) => (
                        <button
                          key={index}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                            img.isPrimary ? 'border-rail-orange' : 'border-surface-border'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getImageUrl(img.url)}
                            alt={`${listing.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                      {images.length > 8 && (
                        <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-surface-secondary flex items-center justify-center text-body-sm font-medium text-text-secondary">
                          +{images.length - 8}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 md:p-8">
                <h2 className="heading-lg mb-4">Description</h2>
                <div className="prose max-w-none text-body-md text-text-primary whitespace-pre-wrap">
                  {listing.description}
                </div>
              </div>

              {/* Specifications */}
              {listing.specifications && listing.specifications.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 md:p-8">
                  <h2 className="heading-lg mb-6">Specifications</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {listing.specifications.map((spec, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-4 bg-surface-secondary rounded-xl"
                      >
                        <span className="text-body-md text-text-secondary">{spec.label}</span>
                        <span className="text-body-md font-semibold text-navy-900">
                          {spec.value}
                          {spec.unit && <span className="text-text-secondary ml-1">{spec.unit}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {documents.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 md:p-8">
                  <h2 className="heading-lg mb-4">Documents</h2>
                  <div className="space-y-3">
                    {documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-surface-secondary rounded-xl hover:bg-navy-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-rail-orange/10 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-rail-orange" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-body-md font-medium text-navy-900">
                            {doc.caption || `Document ${index + 1}`}
                          </p>
                          <p className="text-caption text-text-secondary">PDF Document</p>
                        </div>
                        <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 md:p-8">
                <h2 className="heading-lg mb-4">Shipping & Pickup</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl text-center ${listing.shippingOptions.localPickup ? 'bg-green-50 border border-green-200' : 'bg-surface-secondary'}`}>
                    <svg className={`w-6 h-6 mx-auto mb-2 ${listing.shippingOptions.localPickup ? 'text-green-600' : 'text-text-tertiary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className={`text-body-sm font-medium ${listing.shippingOptions.localPickup ? 'text-green-800' : 'text-text-tertiary'}`}>
                      Local Pickup
                    </p>
                    <p className="text-caption text-text-secondary mt-1">
                      {listing.shippingOptions.localPickup ? 'Available' : 'Not Available'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl text-center ${listing.shippingOptions.sellerShips ? 'bg-green-50 border border-green-200' : 'bg-surface-secondary'}`}>
                    <svg className={`w-6 h-6 mx-auto mb-2 ${listing.shippingOptions.sellerShips ? 'text-green-600' : 'text-text-tertiary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <p className={`text-body-sm font-medium ${listing.shippingOptions.sellerShips ? 'text-green-800' : 'text-text-tertiary'}`}>
                      Seller Ships
                    </p>
                    <p className="text-caption text-text-secondary mt-1">
                      {listing.shippingOptions.sellerShips ? 'Available' : 'Not Available'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl text-center ${listing.shippingOptions.buyerArranges ? 'bg-green-50 border border-green-200' : 'bg-surface-secondary'}`}>
                    <svg className={`w-6 h-6 mx-auto mb-2 ${listing.shippingOptions.buyerArranges ? 'text-green-600' : 'text-text-tertiary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <p className={`text-body-sm font-medium ${listing.shippingOptions.buyerArranges ? 'text-green-800' : 'text-text-tertiary'}`}>
                      Buyer Arranges
                    </p>
                    <p className="text-caption text-text-secondary mt-1">
                      {listing.shippingOptions.buyerArranges ? 'Available' : 'Not Available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sticky Sidebar */}
            <div className="space-y-6">
              <div className="sticky top-24">
                {/* Price Card */}
                <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="badge-primary">{CATEGORY_LABELS[listing.category]}</span>
                    <span className="badge-secondary">{CONDITION_LABELS[listing.condition]}</span>
                  </div>

                  {/* Title */}
                  <h1 className="heading-lg mb-4">{listing.title}</h1>

                  {/* Price */}
                  <div className="mb-6">
                    <p className="text-display-sm font-bold text-rail-orange">
                      {formatPrice(listing.price)}
                    </p>
                    {listing.price.type === 'negotiable' && (
                      <p className="text-body-sm text-text-secondary mt-1">Negotiable</p>
                    )}
                    {listing.quantity > 1 && (
                      <p className="text-body-sm text-text-secondary mt-1">
                        Qty: {listing.quantity} {listing.quantityUnit}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-body-md text-text-secondary mb-6">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {listing.location.city}, {listing.location.state}
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <ContactSellerForm 
                      listingId={listing._id} 
                      listingTitle={listing.title}
                      sellerName={listing.sellerId.name}
                    />
                    <button className="btn-outline w-full py-4">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Save Listing
                    </button>
                  </div>

                  {/* Spec Sheet */}
                  {listing.premiumAddOns.specSheet?.generated && listing.premiumAddOns.specSheet?.url && (
                    <a
                      href={listing.premiumAddOns.specSheet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 mt-4 text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      Download Spec Sheet (PDF)
                    </a>
                  )}
                </div>

                {/* Seller Card */}
                <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                  <h3 className="heading-sm mb-4">Seller Information</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-surface-secondary rounded-full flex items-center justify-center overflow-hidden">
                      {listing.sellerId.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.sellerId.image}
                          alt={listing.sellerId.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-text-tertiary">
                          {listing.sellerId.name?.charAt(0) || 'S'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-body-md font-semibold text-navy-900">
                        {listing.sellerId.name}
                      </p>
                      <p className="text-caption text-text-secondary capitalize">
                        {listing.sellerType}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`mailto:${listing.sellerId.email}`}
                    className="text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark"
                  >
                    View Seller Profile →
                  </a>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mt-6">
                  <h3 className="heading-sm mb-4">Listing Stats</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-heading-lg font-bold text-navy-900">
                        {listing.viewCount.toLocaleString()}
                      </p>
                      <p className="text-caption text-text-secondary">Views</p>
                    </div>
                    <div>
                      <p className="text-heading-lg font-bold text-navy-900">
                        {listing.inquiryCount}
                      </p>
                      <p className="text-caption text-text-secondary">Inquiries</p>
                    </div>
                    <div>
                      <p className="text-heading-lg font-bold text-navy-900">
                        {listing.saveCount}
                      </p>
                      <p className="text-caption text-text-secondary">Saves</p>
                    </div>
                  </div>
                  <p className="text-caption text-text-tertiary text-center mt-4">
                    Listed on {formatDate(listing.createdAt)}
                  </p>
                </div>

                {/* Tags */}
                {listing.tags && listing.tags.length > 0 && (
                  <div className="mt-6">
                    <p className="text-caption text-text-secondary mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {listing.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/listings?search=${encodeURIComponent(tag)}`}
                          className="px-3 py-1 bg-surface-secondary rounded-full text-caption text-text-secondary hover:bg-navy-100 transition-colors"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy-900 text-white py-8">
        <div className="container-rail text-center">
          <p className="text-body-sm text-white/60">
            © {new Date().getFullYear()} The Rail Exchange™. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
