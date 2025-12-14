/**
 * THE RAIL EXCHANGE™ — Expanded Analytics Section
 * 
 * Client component for expanded analytics display.
 * Uses the new analytics events API.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ANALYTICS EXPANSION (POST-PROFILES)                                     │
 * │                                                                          │
 * │ Displays:                                                                │
 * │ • Outbound clicks (website, LinkedIn, phone, email)                     │
 * │ • Source attribution (Search, Map, Profile, Listing, Direct)            │
 * │ • Map visibility (impressions, opens, click-through)                    │
 * │ • Time range controls (7/30/90 days)                                    │
 * │                                                                          │
 * │ DISCLAIMER: Analytics are provided for informational purposes only      │
 * │ and do not guarantee leads, sales, or outcomes.                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TimeRangeSelector, TimeRange } from './TimeRangeSelector';
import { OutboundClicksCard } from './OutboundClicksCard';
import { SourceAttributionCard } from './SourceAttributionCard';
import { MapMetricsCard } from './MapMetricsCard';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

type TargetType = 'listing' | 'contractor' | 'seller' | 'company';

interface ExpandedAnalyticsData {
  outboundClicks: {
    phone: number;
    email: number;
    website: number;
    linkedin: number;
    inquiry: number;
    total: number;
  };
  sourceAttribution: {
    search: number;
    map: number;
    profile: number;
    listing: number;
    direct: number;
    external: number;
    total: number;
  };
  mapMetrics: {
    impressions: number;
    opens: number;
    clickThrough: number;
  };
  pageViews: {
    total: number;
    bySource: {
      search: number;
      map: number;
      profile: number;
      listing: number;
      direct: number;
      external: number;
    };
  };
  searchImpressions: number;
}

interface ExpandedAnalyticsSectionProps {
  targetType: TargetType;
  targetId: string;
  hasMapVisibility?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ExpandedAnalyticsSection({
  targetType,
  targetId,
  hasMapVisibility = false,
}: ExpandedAnalyticsSectionProps) {
  const searchParams = useSearchParams();
  const [days, setDays] = useState<TimeRange>(() => {
    const param = searchParams.get('days');
    return param ? (parseInt(param, 10) as TimeRange) : 30;
  });
  const [data, setData] = useState<ExpandedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `/api/analytics/events?targetType=${targetType}&targetId=${targetId}&days=${days}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [targetType, targetId, days]);

  // Default empty data structure
  const emptyData: ExpandedAnalyticsData = {
    outboundClicks: { phone: 0, email: 0, website: 0, linkedin: 0, inquiry: 0, total: 0 },
    sourceAttribution: { search: 0, map: 0, profile: 0, listing: 0, direct: 0, external: 0, total: 0 },
    mapMetrics: { impressions: 0, opens: 0, clickThrough: 0 },
    pageViews: { total: 0, bySource: { search: 0, map: 0, profile: 0, listing: 0, direct: 0, external: 0 } },
    searchImpressions: 0,
  };

  const displayData = data || emptyData;

  return (
    <div className="space-y-6">
      {/* Section Header with Time Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Engagement Analytics</h2>
          <p className="text-sm text-gray-500">
            Track how users interact with your profile and listings
          </p>
        </div>
        <TimeRangeSelector
          value={days}
          onChange={setDays}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Analytics Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Outbound Clicks */}
        <OutboundClicksCard
          data={displayData.outboundClicks}
          loading={loading}
        />

        {/* Source Attribution */}
        <SourceAttributionCard
          data={displayData.sourceAttribution}
          loading={loading}
        />

        {/* Map Metrics - Only show if entity has map visibility */}
        <MapMetricsCard
          data={displayData.mapMetrics}
          loading={loading}
          hasMapVisibility={hasMapVisibility}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          label="Page Views"
          value={displayData.pageViews.total}
          loading={loading}
        />
        <SummaryCard
          label="Search Appearances"
          value={displayData.searchImpressions}
          loading={loading}
        />
        <SummaryCard
          label="Total Clicks"
          value={displayData.outboundClicks.total}
          loading={loading}
        />
        <SummaryCard
          label="Direct Inquiries"
          value={displayData.outboundClicks.inquiry}
          loading={loading}
        />
      </div>

      {/* Compliance Disclaimer */}
      <p className="text-center text-xs text-gray-400 italic">
        Analytics are provided for informational purposes only and do not guarantee leads, sales, or outcomes.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function SummaryCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export default ExpandedAnalyticsSection;
