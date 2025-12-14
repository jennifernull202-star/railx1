/**
 * THE RAIL EXCHANGE™ — SEO Status Section
 * 
 * Dashboard section showing SEO visibility status.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ SEO VISIBILITY TOOLING (READ-ONLY)                                      │
 * │                                                                          │
 * │ This section fetches and displays:                                       │
 * │ • Search result preview                                                  │
 * │ • Indexing status                                                        │
 * │ • Map/Geo SEO status                                                     │
 * │ • Structured data indicators                                            │
 * │ • Sitemap status                                                        │
 * │                                                                          │
 * │ NOTE: READ-ONLY. No SEO editing or optimization allowed.                │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

'use client';

import { useState, useEffect } from 'react';
import { SEOPreviewPanel, SEOPreviewData } from './SEOPreviewPanel';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

type TargetType = 'listing' | 'contractor' | 'seller' | 'company';

interface SEOStatusSectionProps {
  targetType: TargetType;
  targetId: string;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function SEOStatusSection({
  targetType,
  targetId,
  className = '',
}: SEOStatusSectionProps) {
  const [data, setData] = useState<SEOPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSEOStatus() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `/api/analytics/seo-status?targetType=${targetType}&targetId=${targetId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch SEO status');
        }
        
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load SEO status');
      } finally {
        setLoading(false);
      }
    }

    fetchSEOStatus();
  }, [targetType, targetId]);

  // Default empty data
  const defaultData: SEOPreviewData = {
    title: 'Loading...',
    description: 'Loading SEO preview...',
    canonicalUrl: 'https://therailexchange.com/...',
    indexingStatus: 'unknown',
    hasMapVisibility: false,
    structuredData: {},
    inSitemap: false,
  };

  if (error) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-gray-600 hover:text-gray-900"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <SEOPreviewPanel
      data={data || defaultData}
      loading={loading}
      className={className}
    />
  );
}

export default SEOStatusSection;
