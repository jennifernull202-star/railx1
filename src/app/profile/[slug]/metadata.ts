/**
 * THE RAIL EXCHANGE™ — Unified Profile Page Metadata
 * 
 * Dynamic SEO metadata for profile pages.
 * Generates:
 * - title: {Entity Name} | Rail Contractor / Seller / Company
 * - description: Dynamic from entity description
 * - OpenGraph + Twitter tags
 * - Canonical URL
 * - Indexable by default
 */

import type { Metadata, ResolvingMetadata } from 'next';

interface ProfilePageParams {
  params: Promise<{ slug: string }>;
}

// Type labels for title
const TYPE_LABELS: Record<string, string> = {
  seller: 'Rail Seller',
  contractor: 'Rail Contractor',
  company: 'Rail Company',
};

export async function generateMetadata(
  { params }: ProfilePageParams,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;

  // Fetch SEO data from API
  let seoData = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.therailexchange.com';
    const response = await fetch(`${baseUrl}/api/seo?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        seoData = result.data;
      }
    }
  } catch (error) {
    console.error('[Profile Metadata] Failed to fetch SEO data:', error);
  }

  // Default metadata if no SEO data available
  if (!seoData) {
    return {
      title: 'Profile | The Rail Exchange',
      description: 'View this profile on The Rail Exchange - the premier marketplace for rail industry equipment, services, and contractors.',
      openGraph: {
        title: 'Profile | The Rail Exchange',
        description: 'View this profile on The Rail Exchange.',
        type: 'profile',
        url: `/profile/${slug}`,
      },
      twitter: {
        card: 'summary',
        title: 'Profile | The Rail Exchange',
        description: 'View this profile on The Rail Exchange.',
      },
    };
  }

  // Build dynamic metadata from SEO data
  const typeLabel = TYPE_LABELS[seoData.entityType] || 'Rail Professional';
  const title = seoData.title || `${slug} | ${typeLabel}`;
  const description = seoData.description || 
    `Rail industry ${seoData.entityType} specializing in equipment, materials, and services.`;

  // Build location string for description
  const locationParts = [
    seoData.locationData?.city,
    seoData.locationData?.state,
    seoData.locationData?.country,
  ].filter(Boolean);
  const locationString = locationParts.length > 0 ? ` Based in ${locationParts.join(', ')}.` : '';

  // Enhanced description with location
  const fullDescription = `${description}${locationString}`;

  return {
    title,
    description: fullDescription,
    keywords: seoData.keywords?.join(', '),
    alternates: {
      canonical: seoData.canonicalUrl || `/profile/${slug}`,
    },
    robots: seoData.isIndexable 
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title,
      description: fullDescription,
      type: 'profile',
      url: seoData.canonicalUrl || `/profile/${slug}`,
      siteName: 'The Rail Exchange',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: fullDescription,
    },
  };
}
