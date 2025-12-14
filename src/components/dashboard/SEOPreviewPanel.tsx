/**
 * THE RAIL EXCHANGE™ — SEO Preview Panel
 * 
 * Read-only panel showing how a profile/listing appears to search engines.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ SEO VISIBILITY TOOLING (READ-ONLY)                                      │
 * │                                                                          │
 * │ This panel displays:                                                     │
 * │ • Page title (as appears in search results)                             │
 * │ • Meta description preview                                              │
 * │ • Canonical URL                                                         │
 * │ • Indexable status (Indexed, Pending, Excluded)                         │
 * │ • Geo/Map SEO status                                                    │
 * │ • Structured data indicators                                            │
 * │ • Sitemap inclusion status                                              │
 * │                                                                          │
 * │ NOTE: This is READ-ONLY. No SEO editing or optimization.                │
 * │ Users cannot modify SEO settings through this panel.                    │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

'use client';

import { 
  Search, 
  Globe, 
  MapPin, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileCode,
  List,
  Info,
  ExternalLink
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type IndexingStatus = 'indexed' | 'pending' | 'excluded' | 'unknown';

export interface SEOPreviewData {
  /** Page title as it appears in search results */
  title: string;
  /** Meta description (max ~160 chars) */
  description: string;
  /** Canonical URL */
  canonicalUrl: string;
  /** Current indexing status */
  indexingStatus: IndexingStatus;
  /** Whether entity appears on map */
  hasMapVisibility: boolean;
  /** Geographic location for local SEO */
  geoLocation?: {
    city?: string;
    state?: string;
    region?: string;
  };
  /** Structured data types present */
  structuredData: {
    organization?: boolean;
    localBusiness?: boolean;
    product?: boolean;
    review?: boolean;
  };
  /** Sitemap inclusion */
  inSitemap: boolean;
  /** Last crawled date (if known) */
  lastCrawled?: string;
}

interface SEOPreviewPanelProps {
  data: SEOPreviewData;
  loading?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function SEOPreviewPanel({ data, loading, className = '' }: SEOPreviewPanelProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-4">
            <div className="h-20 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-gray-100 rounded" />
              <div className="h-16 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">SEO Visibility</h3>
            <p className="text-sm text-gray-500">How search engines see your profile</p>
          </div>
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Read-only
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Search Result Preview */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Search Result Preview</h4>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            {/* Title */}
            <p className="text-lg text-blue-700 font-medium line-clamp-1 hover:underline cursor-default">
              {data.title || 'Untitled Page'}
            </p>
            {/* URL */}
            <p className="text-sm text-green-700 mt-1">
              {data.canonicalUrl || 'https://therailexchange.com/...'}
            </p>
            {/* Description */}
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {data.description || 'No description available'}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-2 italic">
            Preview of how your profile may appear in Google search results
          </p>
        </div>

        {/* Status Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Indexing Status */}
          <StatusCard
            label="Indexing Status"
            icon={
              data.indexingStatus === 'indexed' ? CheckCircle :
              data.indexingStatus === 'pending' ? Clock :
              data.indexingStatus === 'excluded' ? XCircle : Info
            }
            iconColor={
              data.indexingStatus === 'indexed' ? 'text-green-600' :
              data.indexingStatus === 'pending' ? 'text-yellow-600' :
              data.indexingStatus === 'excluded' ? 'text-red-600' : 'text-gray-400'
            }
            status={getIndexingStatusLabel(data.indexingStatus)}
            statusColor={
              data.indexingStatus === 'indexed' ? 'bg-green-100 text-green-700' :
              data.indexingStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              data.indexingStatus === 'excluded' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
            }
          />

          {/* Sitemap Status */}
          <StatusCard
            label="Sitemap"
            icon={List}
            iconColor={data.inSitemap ? 'text-green-600' : 'text-gray-400'}
            status={data.inSitemap ? 'Included' : 'Not Included'}
            statusColor={data.inSitemap ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
          />

          {/* Map/Geo SEO */}
          <StatusCard
            label="Map Visibility"
            icon={MapPin}
            iconColor={data.hasMapVisibility ? 'text-green-600' : 'text-gray-400'}
            status={data.hasMapVisibility ? 'Visible' : 'Not Visible'}
            statusColor={data.hasMapVisibility ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
            subtitle={data.geoLocation ? 
              `${[data.geoLocation.city, data.geoLocation.state].filter(Boolean).join(', ')}` : 
              undefined
            }
          />

          {/* Structured Data */}
          <StatusCard
            label="Structured Data"
            icon={FileCode}
            iconColor={hasStructuredData(data.structuredData) ? 'text-green-600' : 'text-gray-400'}
            status={getStructuredDataStatus(data.structuredData)}
            statusColor={hasStructuredData(data.structuredData) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
          />
        </div>

        {/* Structured Data Details */}
        {hasStructuredData(data.structuredData) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Schema Markup</h4>
            <div className="flex flex-wrap gap-2">
              {data.structuredData.organization && (
                <SchemaTag label="Organization" />
              )}
              {data.structuredData.localBusiness && (
                <SchemaTag label="LocalBusiness" />
              )}
              {data.structuredData.product && (
                <SchemaTag label="Product" />
              )}
              {data.structuredData.review && (
                <SchemaTag label="Review" />
              )}
            </div>
          </div>
        )}

        {/* Canonical URL */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Canonical URL</h4>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <code className="text-sm text-gray-600 break-all flex-1">
              {data.canonicalUrl}
            </code>
            <a
              href={data.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Last Crawled */}
        {data.lastCrawled && (
          <p className="text-xs text-gray-400">
            Last crawled: {new Date(data.lastCrawled).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
        <p className="text-xs text-gray-500 text-center italic">
          SEO visibility is determined by platform configuration and cannot be edited.
          Search engine indexing may take time to reflect current status.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StatusCard({
  label,
  icon: Icon,
  iconColor,
  status,
  statusColor,
  subtitle,
}: {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  status: string;
  statusColor: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-600">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
            {status}
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function SchemaTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
      <FileCode className="w-3 h-3" />
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getIndexingStatusLabel(status: IndexingStatus): string {
  switch (status) {
    case 'indexed': return 'Indexed';
    case 'pending': return 'Pending';
    case 'excluded': return 'Excluded';
    default: return 'Unknown';
  }
}

function hasStructuredData(data: SEOPreviewData['structuredData']): boolean {
  return !!(data.organization || data.localBusiness || data.product || data.review);
}

function getStructuredDataStatus(data: SEOPreviewData['structuredData']): string {
  const count = [data.organization, data.localBusiness, data.product, data.review].filter(Boolean).length;
  if (count === 0) return 'None';
  return `${count} type${count > 1 ? 's' : ''}`;
}

export default SEOPreviewPanel;
