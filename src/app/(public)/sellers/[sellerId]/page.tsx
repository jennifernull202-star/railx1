/**
 * THE RAIL EXCHANGE™ — Public Seller Profile Page
 * 
 * Purpose: Inventory visibility.
 * 
 * MUST include:
 * - Business / individual name
 * - Location (city/state)
 * - Listings for sale
 * - Verification badge (if verified)
 * - Sponsored badge (if Elite active)
 * - Contact / inquiry CTA
 * 
 * MUST NOT include:
 * - Contractor service taxonomy
 * - Regulatory claims without disclaimers
 * - Analytics data
 * 
 * NO auth. NO enforcement. Safe fail.
 */

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Listing from '@/models/Listing';
import AddOnPurchase from '@/models/AddOnPurchase';
import { Package, MapPin, Mail, ExternalLink, Shield, Star } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { PageViewTracker } from '@/lib/hooks/useAnalyticsEvent';

interface PageProps {
  params: Promise<{ sellerId: string }>;
}

// User type from database
interface SellerUser {
  _id: string;
  name: string;
  displayName?: string;
  tagline?: string;
  bio?: string;
  image?: string;
  bannerImage?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  publicEmail?: string;
  publicPhone?: string;
  website?: string;
  isActive: boolean;
  isVerifiedSeller?: boolean;
  sellerVerificationStatus?: 'none' | 'pending-ai' | 'pending-admin' | 'active' | 'revoked';
  sellerTier?: string;
  createdAt?: Date;
}

// Listing type
interface SellerListing {
  _id: string;
  title: string;
  category: string;
  price?: number;
  condition?: string;
  images?: string[];
  status: string;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sellerId } = await params;
  
  try {
    await connectDB();
    const user = await User.findById(sellerId)
      .select('name displayName bio')
      .lean() as SellerUser | null;
    
    if (user && user.name) {
      const displayName = user.displayName || user.name;
      return {
        title: `${displayName} | Seller Profile | The Rail Exchange`,
        description: user.bio || `View ${displayName}'s listings on The Rail Exchange marketplace.`,
      };
    }
  } catch {
    // Fail silently
  }
  
  return {
    title: 'Seller Profile | The Rail Exchange',
    description: 'View seller profile on The Rail Exchange marketplace.',
  };
}

// Format date for display
function formatMemberSince(date?: Date): string {
  if (!date) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(date));
}

export default async function SellerProfilePage({ params }: PageProps) {
  const { sellerId } = await params;

  // Validate ID format (MongoDB ObjectId)
  if (!sellerId || !/^[0-9a-fA-F]{24}$/.test(sellerId)) {
    return (
      <main className="min-h-screen bg-surface-secondary">
        <div className="container-rail py-12">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-card border border-surface-border p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Invalid Profile</h2>
            <p className="text-gray-500">This seller profile link is not valid.</p>
          </div>
        </div>
      </main>
    );
  }

  let user: SellerUser | null = null;
  let listings: SellerListing[] = [];
  let hasElitePlacement = false;
  let error: string | null = null;

  try {
    await connectDB();
    
    // Fetch user data
    user = await User.findById(sellerId)
      .select('name displayName tagline bio image bannerImage location publicEmail publicPhone website isActive isVerifiedSeller sellerVerificationStatus sellerTier createdAt')
      .lean() as SellerUser | null;

    if (!user || !user.isActive) {
      return (
        <main className="min-h-screen bg-surface-secondary">
          <div className="container-rail py-12">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-card border border-surface-border p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile Not Found</h2>
              <p className="text-gray-500">This seller profile may have been removed or is not publicly available.</p>
            </div>
          </div>
        </main>
      );
    }

    // Fetch seller's active listings
    listings = await Listing.find({
      userId: sellerId,
      status: 'active',
    })
      .select('title category price condition images status')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean() as unknown as SellerListing[];

    // Check for Elite Placement (any active elite add-on)
    const eliteAddOn = await AddOnPurchase.findOne({
      userId: sellerId,
      addonType: 'elite_placement',
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).lean();

    hasElitePlacement = !!eliteAddOn;

  } catch (err) {
    console.error('Error loading seller profile:', err);
    error = 'Unable to load seller profile';
  }

  if (error) {
    return (
      <main className="min-h-screen bg-surface-secondary">
        <div className="container-rail py-12">
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  // Determine verification status
  const isVerified = user?.isVerifiedSeller === true || user?.sellerVerificationStatus === 'active';
  const displayName = user?.displayName || user?.name || 'Unknown Seller';
  const locationString = user?.location?.city && user?.location?.state 
    ? `${user.location.city}, ${user.location.state}`
    : user?.location?.state || null;

  return (
    <>
      {/* Analytics: Track page views for seller profiles */}
      <PageViewTracker targetType="seller" targetId={sellerId} />
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-border/50">
        <nav className="container-rail">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center">
              <span className="text-heading-lg font-bold text-navy-900">The Rail</span>
              <span className="text-heading-lg font-bold text-rail-orange ml-1">Exchange</span>
              <span className="text-rail-orange text-sm font-medium ml-0.5">™</span>
            </Link>
            <Link href="/marketplace" className="text-body-md font-medium text-text-secondary hover:text-navy-900">
              ← Marketplace
            </Link>
          </div>
        </nav>
      </header>

      <main className="min-h-screen bg-surface-secondary pb-12">
        <div className="container-rail py-8">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header Card */}
            <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden mb-6">
              {/* Banner (if available) */}
              {user?.bannerImage && (
                <div className="h-32 bg-gradient-to-r from-navy-900 to-navy-700 relative">
                  <Image
                    src={getImageUrl(user.bannerImage)}
                    alt="Seller banner"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-20 h-20 bg-surface-secondary rounded-xl border border-surface-border flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getImageUrl(user.image)}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-text-tertiary">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h1 className="text-xl font-bold text-navy-900">{displayName}</h1>
                      
                      {/* Verified Seller Badge */}
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                          <Shield className="w-3 h-3" />
                          Verified Seller
                        </span>
                      )}
                      
                      {/* Sponsored Badge (Elite Placement) */}
                      {hasElitePlacement && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                          <Star className="w-3 h-3" />
                          Sponsored
                        </span>
                      )}
                    </div>

                    {/* Tagline */}
                    {user?.tagline && (
                      <p className="text-sm text-text-secondary mb-2">{user.tagline}</p>
                    )}

                    {/* Location */}
                    {locationString && (
                      <p className="text-sm text-text-secondary flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-text-tertiary" />
                        {locationString}
                      </p>
                    )}

                    {/* Member Since */}
                    <p className="text-xs text-text-tertiary mt-2">
                      Member since {formatMemberSince(user?.createdAt)}
                    </p>
                  </div>

                  {/* Contact CTA */}
                  <div className="flex-shrink-0">
                    <Link
                      href={`/contact?sellerId=${sellerId}&subject=${encodeURIComponent(`Inquiry about ${displayName}'s listings`)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rail-orange text-white font-medium rounded-lg hover:bg-rail-orange/90 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Contact Seller
                    </Link>
                  </div>
                </div>

                {/* About / Bio */}
                {user?.bio && (
                  <div className="mt-4 pt-4 border-t border-surface-border">
                    <p className="text-text-primary whitespace-pre-wrap text-sm">{user.bio}</p>
                  </div>
                )}

                {/* Website Link */}
                {user?.website && (
                  <div className="mt-4 pt-4 border-t border-surface-border">
                    <a
                      href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-rail-orange hover:underline text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Listings Section */}
            <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-navy-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-text-tertiary" />
                  Active Listings
                </h2>
                {listings.length > 0 && (
                  <span className="text-sm text-text-tertiary">{listings.length} item{listings.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              {listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listings.map((listing) => (
                    <Link
                      key={String(listing._id)}
                      href={`/listings/${listing._id}`}
                      className="group block bg-surface-secondary rounded-lg overflow-hidden hover:shadow-md transition-shadow border border-surface-border"
                    >
                      {/* Listing Image */}
                      <div className="aspect-[4/3] relative bg-gray-200">
                        {listing.images && listing.images[0] ? (
                          <Image
                            src={getImageUrl(listing.images[0])}
                            alt={listing.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="h-12 w-12 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Listing Info */}
                      <div className="p-3">
                        <h3 className="font-medium text-navy-900 truncate group-hover:text-rail-orange transition-colors">
                          {listing.title}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-text-tertiary">{listing.category}</span>
                          {listing.price && (
                            <span className="font-semibold text-navy-900 text-sm">
                              ${listing.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {listing.condition && (
                          <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-white text-text-secondary rounded border border-surface-border">
                            {listing.condition}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-text-tertiary">
                  <Package className="w-12 h-12 mx-auto mb-3 text-surface-border" />
                  <p className="text-sm">No active listings at this time</p>
                </div>
              )}
            </div>

            {/* Verification Disclosure */}
            {isVerified && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">About Seller Verification</p>
                    <p className="text-blue-700">
                      Verification reflects document review only and does not guarantee performance, quality, or outcomes. 
                      Verification is assisted by automated (AI) analysis and human review.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sponsored Disclosure */}
            {hasElitePlacement && (
              <p className="text-xs text-text-tertiary text-center mb-4">
                This seller has purchased Elite Placement for enhanced visibility.
              </p>
            )}

            {/* Platform Disclaimer */}
            <p className="text-xs text-text-tertiary text-center">
              The Rail Exchange connects buyers and sellers. We do not participate in or guarantee transactions. 
              Buyers should conduct their own due diligence before any purchase.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
