/**
 * THE RAIL EXCHANGE™ — Listing Detail Page
 * 
 * Displays a single listing with all details, images, and contact options.
 * 
 * BATCH 10 - LISTING DETAIL PAGE:
 * Primary Goal: User decides to contact seller.
 * 
 * Above-the-fold: Image, Title, Price, Location, Condition, Seller trust, ONE CTA
 * Content order: Gallery → Title/Price/Location/CTA → Description → Specs (collapsed) → Shipping → Compliance (collapsed) → Price History (collapsed)
 * Single badge on image (highest tier only)
 * Sticky Contact Seller CTA (mobile + desktop)
 * Gallery affordance: "View X photos" overlay
 * Back link only (no breadcrumbs)
 * 
 * BATCH 16 - CROSS-PAGE UX:
 * - Skeleton loader via loading.tsx ✓
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';
import connectDB from '@/lib/db';
import Listing from '@/models/Listing';
import mongoose from 'mongoose';
import ContactSellerForm from '@/components/ContactSellerForm';
import RelevantContractors from '@/components/contractor/RelevantContractors';
import ReportListingButton from '@/components/ReportListingButton';
import { getHighestBadge, BADGE_STYLES } from '@/lib/ui';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface PopulatedSeller {
  _id: string;
  name: string;
  email: string;
  image?: string;
  paypalEmail?: string;
  paypalVerified?: boolean;
  isVerifiedSeller?: boolean;
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
  // BUYER AUDIT: Structured equipment fields
  equipment?: {
    reportingMarks?: string;
    manufacturer?: string;
    model?: string;
    yearBuilt?: number;
    yearRebuilt?: number;
    horsepower?: number;
    tractionMotors?: string;
    fuelCapacity?: number;
    engineHours?: number;
    mileage?: number;
    weight?: number;
    gauge?: string;
    aarCarType?: string;
    loadLimit?: number;
    lightWeight?: number;
    insideLength?: number;
    insideWidth?: number;
    insideHeight?: number;
    cubicCapacity?: number;
    numberOfAxles?: number;
    axleCount?: number;
    fraCompliant?: boolean;
    dotCompliant?: boolean;
    hazmatCertified?: boolean;
    lastInspectionDate?: Date;
    nextInspectionDue?: Date;
    availability?: string;
    currentLocation?: {
      railroad?: string;
      station?: string;
      trackNumber?: string;
    };
    previousOwners?: string[];
    maintenanceHistory?: Array<{
      date: Date;
      type: string;
      description: string;
      vendor?: string;
    }>;
    muCapable?: boolean;
    airBrakeType?: string;
    couplerType?: string;
    handbrakeType?: string;
  };
  priceHistory?: Array<{
    amount: number;
    changedAt: Date;
    reason?: string;
  }>;
  daysOnMarket?: number;
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
  try {
    await connectDB();

    const { id } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const listing = await Listing.findOne(
      isObjectId ? { _id: id } : { slug: id }
    )
      .populate('sellerId', 'name email image paypalEmail paypalVerified isVerifiedSeller')
      .lean() as ListingData | null;

    if (!listing || listing.status !== 'active') {
      notFound();
    }

    // Increment view count (fire-and-forget, don't block render)
    Listing.updateOne({ _id: listing._id }, { $inc: { viewCount: 1 } }).catch(() => {});

    // Sort media by order and find primary (with safe defaults)
    const sortedMedia = listing.media?.length ? [...listing.media].sort((a, b) => a.order - b.order) : [];
    const primaryImage = sortedMedia.find(m => m.isPrimary) || sortedMedia[0];
    const images = sortedMedia.filter(m => m.type === 'image');

    // Get single highest badge (with safe defaults)
    const badge = getHighestBadge({
      elite: listing.premiumAddOns?.elite?.active,
      premium: listing.premiumAddOns?.premium?.active,
      featured: listing.premiumAddOns?.featured?.active,
      verified: listing.sellerId?.isVerifiedSeller,
    });

    // Check if there are specs to show (with safe defaults)
    const hasSpecs = (listing.specifications?.length ?? 0) > 0 || listing.equipment;
    const hasCompliance = listing.equipment && (
      listing.equipment.fraCompliant !== undefined ||
      listing.equipment.dotCompliant !== undefined ||
      listing.equipment.hazmatCertified !== undefined
    );
    const hasPriceHistory = listing.priceHistory && listing.priceHistory.length > 1;
    const hasShipping = listing.shippingOptions;

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
            <Link href="/listings" className="text-body-md font-medium text-text-secondary hover:text-navy-900">
              ← All Listings
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 bg-surface-secondary pb-32">
        <div className="container-rail py-6">
          {/* 1. IMAGE GALLERY */}
          <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden mb-6">
            <div className="aspect-[4/3] md:aspect-[16/9] bg-navy-100 relative">
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

              {/* S-5.1: Single Highest Badge with Sponsored/Identity Verified labels */}
              {badge && (
                <div 
                  className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg font-semibold text-sm flex items-center shadow-lg cursor-help ${
                    badge === 'ELITE' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' :
                    badge === 'PREMIUM' ? 'bg-purple-600 text-white' :
                    badge === 'FEATURED' ? 'bg-rail-orange text-white' :
                    'bg-blue-600 text-white'
                  }`}
                  title={BADGE_STYLES[badge]?.title || 'Badge reflects account status.'}
                >
                  {badge === 'ELITE' && <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                  {badge === 'PREMIUM' && <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                  {badge === 'FEATURED' && <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                  {badge === 'VERIFIED' && <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                  {BADGE_STYLES[badge]?.label || badge}
                </div>
              )}

              {/* Photo count - Gallery affordance */}
              {images.length > 1 && (
                <button className="absolute bottom-4 right-4 bg-black/70 hover:bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  View {images.length} photos
                </button>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="p-3 border-t border-surface-border">
                <div className="flex gap-2 overflow-x-auto">
                  {images.slice(0, 6).map((img, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        img.isPrimary ? 'border-rail-orange' : 'border-surface-border'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(img.url)}
                        alt={`${listing.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {images.length > 6 && (
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-surface-secondary flex items-center justify-center text-sm font-medium text-text-secondary">
                      +{images.length - 6}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. CORE INFO + SELLER */}
          <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
            {/* Category & Condition */}
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="badge-primary">{CATEGORY_LABELS[listing.category]}</span>
              <span className="badge-secondary">{CONDITION_LABELS[listing.condition]}</span>
            </div>
            {/* S-2.4: Condition disclaimer */}
            <p className="text-[10px] text-text-tertiary mb-3 leading-tight">
              Condition is provided by the seller unless accompanied by inspection documentation.
            </p>

            {/* BATCH E-4: Premium Badge Disclosure */}
            {badge && (badge === 'ELITE' || badge === 'PREMIUM' || badge === 'FEATURED') && (
              <p className="text-[10px] text-text-tertiary mb-3">
                Featured placement reflects paid visibility options and does not indicate quality, condition, or endorsement.
              </p>
            )}

            {/* Title */}
            <h1 className="text-xl md:text-2xl font-bold text-navy-900 mb-3">{listing.title}</h1>

            {/* Price */}
            <p className="text-2xl md:text-3xl font-bold text-rail-orange mb-4">
              {formatPrice(listing.price)}
            </p>

            {/* Location */}
            <div className="flex items-center gap-2 text-text-secondary mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {listing.location.city}, {listing.location.state}
            </div>

            {/* Seller Inline */}
            <div className="flex items-center gap-3 pt-4 border-t border-surface-border">
              <div className="w-10 h-10 bg-surface-secondary rounded-full flex items-center justify-center overflow-hidden">
                {listing.sellerId.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.sellerId.image} alt={listing.sellerId.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-text-tertiary">{listing.sellerId.name?.charAt(0) || 'S'}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-navy-900">{listing.sellerId.name}</p>
                {listing.sellerId.isVerifiedSeller && (
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs text-blue-700">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      Identity Verified
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* S-5.3: Inline trust disclosure */}
            <p className="text-[10px] text-text-tertiary mt-3 leading-tight">
              Badges reflect placement or document review only. The Rail Exchange does not verify ownership, condition, or transaction outcomes.
            </p>
          </div>

          {/* 3. DESCRIPTION */}
          <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
            <h2 className="font-semibold text-navy-900 mb-3">Description</h2>
            <div className="text-text-primary whitespace-pre-wrap">
              {listing.description}
            </div>
          </div>

          {/* 4. COLLAPSED SECTIONS */}
          
          {/* Specifications (Collapsed) */}
          {hasSpecs && (
            <details className="bg-white rounded-2xl shadow-card border border-surface-border mb-4 group">
              <summary className="p-4 font-semibold text-navy-900 cursor-pointer list-none flex items-center justify-between">
                Specifications
                <svg className="w-5 h-5 text-text-tertiary group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 pt-0 border-t border-surface-border">
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  {listing.specifications?.map((spec, index) => (
                    <div key={index} className="flex justify-between p-3 bg-surface-secondary rounded-lg">
                      <span className="text-sm text-text-secondary">{spec.label}</span>
                      <span className="text-sm font-medium text-navy-900">{spec.value}{spec.unit && ` ${spec.unit}`}</span>
                    </div>
                  ))}
                  {listing.equipment?.manufacturer && (
                    <div className="flex justify-between p-3 bg-surface-secondary rounded-lg">
                      <span className="text-sm text-text-secondary">Manufacturer</span>
                      <span className="text-sm font-medium text-navy-900">{listing.equipment.manufacturer}</span>
                    </div>
                  )}
                  {listing.equipment?.model && (
                    <div className="flex justify-between p-3 bg-surface-secondary rounded-lg">
                      <span className="text-sm text-text-secondary">Model</span>
                      <span className="text-sm font-medium text-navy-900">{listing.equipment.model}</span>
                    </div>
                  )}
                  {listing.equipment?.yearBuilt && (
                    <div className="flex justify-between p-3 bg-surface-secondary rounded-lg">
                      <span className="text-sm text-text-secondary">Year Built</span>
                      <span className="text-sm font-medium text-navy-900">{listing.equipment.yearBuilt}</span>
                    </div>
                  )}
                  {listing.equipment?.horsepower && (
                    <div className="flex justify-between p-3 bg-surface-secondary rounded-lg">
                      <span className="text-sm text-text-secondary">Horsepower</span>
                      <span className="text-sm font-medium text-navy-900">{listing.equipment.horsepower.toLocaleString()} HP</span>
                    </div>
                  )}
                </div>
              </div>
            </details>
          )}

          {/* Shipping (Collapsed) */}
          {hasShipping && (
            <details className="bg-white rounded-2xl shadow-card border border-surface-border mb-4 group">
              <summary className="p-4 font-semibold text-navy-900 cursor-pointer list-none flex items-center justify-between">
                Shipping & Pickup
                <svg className="w-5 h-5 text-text-tertiary group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 pt-0 border-t border-surface-border">
                <div className="grid sm:grid-cols-3 gap-3 mt-4">
                  <div className={`p-3 rounded-lg text-center ${listing.shippingOptions.localPickup ? 'bg-green-50 text-green-800' : 'bg-surface-secondary text-text-tertiary'}`}>
                    <p className="text-sm font-medium">Local Pickup</p>
                    <p className="text-xs">{listing.shippingOptions.localPickup ? 'Available' : 'Not Available'}</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${listing.shippingOptions.sellerShips ? 'bg-green-50 text-green-800' : 'bg-surface-secondary text-text-tertiary'}`}>
                    <p className="text-sm font-medium">Seller Ships</p>
                    <p className="text-xs">{listing.shippingOptions.sellerShips ? 'Available' : 'Not Available'}</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${listing.shippingOptions.buyerArranges ? 'bg-green-50 text-green-800' : 'bg-surface-secondary text-text-tertiary'}`}>
                    <p className="text-sm font-medium">Buyer Arranges</p>
                    <p className="text-xs">{listing.shippingOptions.buyerArranges ? 'Available' : 'Not Available'}</p>
                  </div>
                </div>
              </div>
            </details>
          )}

          {/* Compliance (Collapsed) */}
          {hasCompliance && (
            <details className="bg-white rounded-2xl shadow-card border border-surface-border mb-4 group">
              <summary className="p-4 font-semibold text-navy-900 cursor-pointer list-none flex items-center justify-between">
                Compliance & Certifications
                <svg className="w-5 h-5 text-text-tertiary group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 pt-0 border-t border-surface-border">
                <div className="grid sm:grid-cols-3 gap-3 mt-4">
                  <div className={`p-3 rounded-lg text-center ${listing.equipment?.fraCompliant ? 'bg-green-50 text-green-800' : 'bg-surface-secondary text-text-tertiary'}`}>
                    <p className="text-sm font-medium">FRA Compliant</p>
                    <p className="text-xs">{listing.equipment?.fraCompliant ? 'Yes' : 'No'}</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${listing.equipment?.dotCompliant ? 'bg-green-50 text-green-800' : 'bg-surface-secondary text-text-tertiary'}`}>
                    <p className="text-sm font-medium">DOT Compliant</p>
                    <p className="text-xs">{listing.equipment?.dotCompliant ? 'Yes' : 'No'}</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${listing.equipment?.hazmatCertified ? 'bg-green-50 text-green-800' : 'bg-surface-secondary text-text-tertiary'}`}>
                    <p className="text-sm font-medium">Hazmat Certified</p>
                    <p className="text-xs">{listing.equipment?.hazmatCertified ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </details>
          )}

          {/* Price History (Collapsed) - Show count only, not actual prices */}
          {hasPriceHistory && (
            <details className="bg-white rounded-2xl shadow-card border border-surface-border mb-4 group">
              <summary className="p-4 font-semibold text-navy-900 cursor-pointer list-none flex items-center justify-between">
                Price History
                <svg className="w-5 h-5 text-text-tertiary group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 pt-0 border-t border-surface-border">
                <div className="mt-4 p-4 bg-surface-secondary rounded-lg text-center">
                  <p className="text-sm text-text-secondary">
                    Price updated <span className="font-medium text-navy-900">{listing.priceHistory?.length || 0}</span> time{(listing.priceHistory?.length || 0) !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-text-tertiary mt-1">
                    Historical price values are not disclosed.
                  </p>
                </div>
              </div>
            </details>
          )}

          {/* Report Listing - BATCH E-3 */}
          <div className="flex justify-end mb-4">
            <ReportListingButton 
              listingId={listing._id} 
              listingTitle={listing.title}
            />
          </div>

          {/* Mobile Contact Form (visible on mobile, anchor target from sticky CTA) */}
          <div className="md:hidden bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6" id="contact-form-mobile">
            <ContactSellerForm 
              listingId={listing._id} 
              listingTitle={listing.title}
              sellerName={listing.sellerId.name}
              sellerLocation={`${listing.location.city}, ${listing.location.state}`}
              isVerifiedSeller={listing.sellerId.isVerifiedSeller}
            />
          </div>

          {/* Relevant Contractors */}
          <RelevantContractors 
            equipmentCategory={listing.category} 
            className="mb-6"
            maxContractors={3}
          />
        </div>
      </main>

      {/* STICKY CONTACT CTA - Mobile shows button, Desktop shows inline form */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-border shadow-lg z-40">
        <div className="container-rail py-4">
          {/* Mobile: Simple CTA button that scrolls to form */}
          <div className="md:hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy-900 text-lg truncate">{formatPrice(listing.price)}</p>
                <p className="text-sm text-text-secondary truncate">{listing.title}</p>
              </div>
              <a 
                href="#contact-form-mobile"
                className="btn-primary px-6 py-3 flex-shrink-0"
              >
                Contact Seller
              </a>
            </div>
            {/* S-11.1: Seller Response Expectation */}
            <p className="text-[10px] text-text-tertiary mt-2 text-center">
              Sellers respond directly and at their discretion. Response times may vary based on availability.
            </p>
            {/* S-6.3: Buyer Expectation Disclosure */}
            <p className="text-[10px] text-text-tertiary mt-1 text-center">
              Buyers are responsible for independent inspection and due diligence.
            </p>
          </div>
          {/* Desktop: Inline contact form */}
          <div className="hidden md:block">
            <ContactSellerForm 
              listingId={listing._id} 
              listingTitle={listing.title}
              sellerName={listing.sellerId.name}
              sellerLocation={`${listing.location.city}, ${listing.location.state}`}
              isVerifiedSeller={listing.sellerId.isVerifiedSeller}
            />
            {/* S-11.1: Seller Response Expectation */}
            <p className="text-[10px] text-text-tertiary mt-2 text-center">
              Sellers respond directly and at their discretion. Response times may vary based on availability.
            </p>
            {/* S-6.3: Buyer Expectation Disclosure */}
            <p className="text-[10px] text-text-tertiary mt-1 text-center">
              Buyers are responsible for independent inspection and due diligence.
            </p>
          </div>
        </div>
      </div>
    </>
  );
  } catch (error) {
    console.error('Listing detail page error:', error);
    notFound();
  }
}
