/**
 * THE RAIL EXCHANGE™ — Source Attribution Analytics Card
 * 
 * Displays traffic source attribution breakdown
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ANALYTICS EXPANSION (POST-PROFILES)                                     │
 * │                                                                          │
 * │ Sources: Search, Map, Profile, Listing, Direct, External                │
 * │ Pie chart visualization with legend                                     │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { Search, Map, User, FileText, Link2, ExternalLink, TrendingUp } from 'lucide-react';

interface SourceAttributionData {
  search: number;
  map: number;
  profile: number;
  listing: number;
  direct: number;
  external: number;
  total: number;
}

interface SourceAttributionCardProps {
  data: SourceAttributionData;
  loading?: boolean;
}

export function SourceAttributionCard({ data, loading }: SourceAttributionCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-40 bg-gray-100 rounded-full w-40 mx-auto mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-6 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sources = [
    { key: 'search', label: 'Search Results', icon: Search, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { key: 'map', label: 'Map View', icon: Map, color: 'bg-green-500', textColor: 'text-green-600' },
    { key: 'profile', label: 'Profile Links', icon: User, color: 'bg-purple-500', textColor: 'text-purple-600' },
    { key: 'listing', label: 'Listing Pages', icon: FileText, color: 'bg-orange-500', textColor: 'text-orange-600' },
    { key: 'direct', label: 'Direct/Bookmark', icon: Link2, color: 'bg-gray-500', textColor: 'text-gray-600' },
    { key: 'external', label: 'External Sites', icon: ExternalLink, color: 'bg-cyan-500', textColor: 'text-cyan-600' },
  ] as const;

  // Calculate percentages and filter out zero values
  const sourcesWithData = sources
    .map(s => ({
      ...s,
      count: data[s.key],
      percentage: data.total > 0 ? Math.round((data[s.key] / data.total) * 100) : 0,
    }))
    .filter(s => s.count > 0);

  // Sort by count descending
  sourcesWithData.sort((a, b) => b.count - a.count);

  // Create pie chart segments
  let cumulativePercentage = 0;
  const segments = sourcesWithData.map(s => {
    const start = cumulativePercentage;
    cumulativePercentage += s.percentage;
    return { ...s, start, end: cumulativePercentage };
  });

  // Generate pie chart gradient
  const pieGradient = segments.length > 0
    ? segments.map((s, i) => {
        const colorMap: Record<string, string> = {
          'bg-blue-500': '#3b82f6',
          'bg-green-500': '#22c55e',
          'bg-purple-500': '#a855f7',
          'bg-orange-500': '#f97316',
          'bg-gray-500': '#6b7280',
          'bg-cyan-500': '#06b6d4',
        };
        const color = colorMap[s.color] || '#6b7280';
        return `${color} ${s.start}% ${s.end}%`;
      }).join(', ')
    : '#e5e7eb 0% 100%';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Traffic Sources</h3>
          <p className="text-sm text-gray-500">How visitors find you</p>
        </div>
      </div>

      {data.total === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No traffic data yet</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Pie Chart */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <div
              className="w-full h-full rounded-full"
              style={{
                background: `conic-gradient(${pieGradient})`,
              }}
            />
            {/* Center hole for donut effect */}
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{data.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2 w-full">
            {sourcesWithData.slice(0, 5).map(({ key, label, icon: Icon, color, textColor, count, percentage }) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color} flex-shrink-0`} />
                <Icon className={`w-3.5 h-3.5 ${textColor} flex-shrink-0`} />
                <span className="text-sm text-gray-700 flex-1 truncate">{label}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
                <span className="text-xs text-gray-500 w-8 text-right">{percentage}%</span>
              </div>
            ))}
            {sourcesWithData.length > 5 && (
              <p className="text-xs text-gray-400 pl-5">
                +{sourcesWithData.length - 5} more sources
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SourceAttributionCard;
