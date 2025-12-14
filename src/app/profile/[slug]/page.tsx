/**
 * THE RAIL EXCHANGE™ — Unified Profile Page
 * 
 * /profile/[slug]
 * 
 * ONE canonical URL per entity.
 * NO role-based routing.
 * NO auth gating.
 * Sections render based on data presence only.
 * Same page for Seller / Contractor / Company.
 */

import { UnifiedProfileShell } from '@/components/profile';
import type { UnifiedProfile } from '@/components/profile/types';

// Re-export metadata generation
export { generateMetadata } from './metadata';

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
}

// Fetch profile data server-side
async function getProfile(slug: string): Promise<UnifiedProfile | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.therailexchange.com';
    
    // Fetch profile data
    const profileRes = await fetch(`${baseUrl}/api/profiles/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 }, // Cache for 1 minute
    });
    
    if (!profileRes.ok) {
      return null;
    }
    
    const profileData = await profileRes.json();
    
    if (!profileData.success || !profileData.data) {
      return null;
    }

    const profile = profileData.data;

    // Fetch additional data in parallel
    const [verificationRes, ratingsRes, visibilityRes] = await Promise.all([
      fetch(`${baseUrl}/api/verification?entityId=${encodeURIComponent(profile.id)}`, {
        next: { revalidate: 60 },
      }).catch(() => null),
      fetch(`${baseUrl}/api/ratings?entityId=${encodeURIComponent(profile.id)}`, {
        next: { revalidate: 60 },
      }).catch(() => null),
      fetch(`${baseUrl}/api/visibility?entityId=${encodeURIComponent(profile.id)}`, {
        next: { revalidate: 60 },
      }).catch(() => null),
    ]);

    // Parse responses safely
    const verificationData = verificationRes?.ok 
      ? await verificationRes.json().catch(() => ({ data: null }))
      : { data: null };
    
    const ratingsData = ratingsRes?.ok 
      ? await ratingsRes.json().catch(() => ({ data: null }))
      : { data: null };
    
    const visibilityData = visibilityRes?.ok 
      ? await visibilityRes.json().catch(() => ({ data: null }))
      : { data: null };

    // Construct unified profile with safe defaults
    const unifiedProfile: UnifiedProfile = {
      ...profile,
      verification: verificationData.data || {
        status: 'not_verified',
        certificationBadges: [],
      },
      ratings: ratingsData.data || {
        averageRating: null,
        totalReviews: 0,
      },
      visibility: visibilityData.data || {
        tier: 'basic',
        isFeatured: false,
        isPriority: false,
        addOns: [],
      },
      seo: {
        isIndexable: true,
        canonicalUrl: `/profile/${slug}`,
        title: profile.displayName || profile.name,
        description: profile.description || '',
        entityType: profile.type,
        primaryCategories: [],
      },
    };

    return unifiedProfile;
  } catch (error) {
    console.error('[Profile Page] Error fetching profile:', error);
    return null;
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params;
  
  // Fetch profile data
  const profile = await getProfile(slug);

  return (
    <main className="min-h-screen bg-gray-50">
      <UnifiedProfileShell 
        profile={profile}
        isLoading={false}
        error={profile === null ? undefined : null}
      />
    </main>
  );
}
