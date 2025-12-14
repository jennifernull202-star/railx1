/**
 * THE RAIL EXCHANGE™ — Public Buyer Profile Page
 * 
 * Purpose: Trust + reviews only.
 * 
 * MUST include:
 * - Display name
 * - Location (city/state only)
 * - Reviews received
 * - "Verified Buyer" badge (if $1 verification completed)
 * 
 * MUST NOT include:
 * - Listings
 * - Services
 * - Analytics
 * - Map visibility
 * - Contact CTAs
 * 
 * NO auth. NO enforcement. Safe fail.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import connectDB from '@/lib/db';
import User from '@/models/User';

interface PageProps {
  params: Promise<{ buyerId: string }>;
}

// User type from database
interface BuyerUser {
  _id: string;
  name: string;
  displayName?: string;
  image?: string;
  location?: {
    city?: string;
    state?: string;
  };
  createdAt?: Date;
  // Buyer verification status
  sellerVerificationStatus?: 'none' | 'pending-ai' | 'pending-admin' | 'active' | 'revoked';
  isBuyerVerified?: boolean;
  buyerVerifiedAt?: Date;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { buyerId } = await params;
  
  try {
    await connectDB();
    const user = await User.findById(buyerId)
      .select('name displayName')
      .lean() as BuyerUser | null;
    
    if (user && user.name) {
      const displayName = user.displayName || user.name;
      return {
        title: `${displayName} | Buyer Profile | The Rail Exchange`,
        description: `View ${displayName}'s buyer profile on The Rail Exchange.`,
      };
    }
  } catch {
    // Fail silently
  }
  
  return {
    title: 'Buyer Profile | The Rail Exchange',
    description: 'View buyer profile on The Rail Exchange.',
  };
}

// Format date for display
function formatMemberSince(date?: Date): string {
  if (!date) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(date));
}

export default async function BuyerProfilePage({ params }: PageProps) {
  const { buyerId } = await params;

  // Validate ID format (MongoDB ObjectId)
  if (!buyerId || !/^[0-9a-fA-F]{24}$/.test(buyerId)) {
    return (
      <main className="min-h-screen bg-surface-secondary">
        <div className="container-rail py-12">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-card border border-surface-border p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Invalid Profile</h2>
            <p className="text-gray-500">This buyer profile link is not valid.</p>
          </div>
        </div>
      </main>
    );
  }

  let user: BuyerUser | null = null;
  let error: string | null = null;

  try {
    await connectDB();
    
    user = await User.findById(buyerId)
      .select('name displayName image location createdAt sellerVerificationStatus isBuyerVerified buyerVerifiedAt')
      .lean() as BuyerUser | null;

    if (!user) {
      return (
        <main className="min-h-screen bg-surface-secondary">
          <div className="container-rail py-12">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-card border border-surface-border p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile Not Found</h2>
              <p className="text-gray-500">This buyer profile may have been removed or is not publicly available.</p>
            </div>
          </div>
        </main>
      );
    }
  } catch (err) {
    console.error('Error loading buyer profile:', err);
    error = 'Unable to load buyer profile';
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
  // Buyer is verified if they completed $1 identity verification
  const isVerifiedBuyer = user?.isBuyerVerified === true;
  const displayName = user?.displayName || user?.name || 'Unknown Buyer';
  const locationString = user?.location?.city && user?.location?.state 
    ? `${user.location.city}, ${user.location.state}`
    : user?.location?.state || null;

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
            <Link href="/marketplace" className="text-body-md font-medium text-text-secondary hover:text-navy-900">
              ← Marketplace
            </Link>
          </div>
        </nav>
      </header>

      <main className="min-h-screen bg-surface-secondary pb-12">
        <div className="container-rail py-8">
          <div className="max-w-2xl mx-auto">
            {/* Profile Header Card */}
            <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 bg-surface-secondary rounded-xl border border-surface-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-navy-900">{displayName}</h1>
                    
                    {/* Verified Buyer Badge */}
                    {isVerifiedBuyer && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified Buyer
                      </span>
                    )}
                  </div>

                  {/* Location (city/state only) */}
                  {locationString && (
                    <p className="text-sm text-text-secondary mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {locationString}
                    </p>
                  )}

                  {/* Member Since */}
                  <p className="text-xs text-text-tertiary mt-2">
                    Member since {formatMemberSince(user?.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
              <h2 className="font-semibold text-navy-900 mb-4">Reviews Received</h2>
              
              {/* Placeholder - No reviews yet */}
              <div className="text-center py-8 text-text-tertiary">
                <svg className="w-12 h-12 mx-auto mb-3 text-surface-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <p className="text-sm">No reviews yet</p>
                <p className="text-xs mt-1">Reviews from sellers will appear here</p>
              </div>
            </div>

            {/* Verification Disclosure */}
            {isVerifiedBuyer && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">About Buyer Verification</p>
                    <p className="text-blue-700">
                      Verified Buyer status confirms identity submission only. It does not guarantee financial capability, 
                      purchasing authority, or transaction outcomes. Verification is assisted by automated (AI) analysis and human review.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Platform Disclaimer */}
            <p className="text-xs text-text-tertiary text-center">
              Buyer profiles are for trust and reference purposes only. 
              The Rail Exchange does not facilitate payments or guarantee transactions.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
