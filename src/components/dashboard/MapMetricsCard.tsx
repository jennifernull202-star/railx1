/**
 * THE RAIL EXCHANGE™ — Map Visibility Metrics Card
 * 
 * Displays map visibility analytics (impressions, opens, click-through)
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ANALYTICS EXPANSION (POST-PROFILES)                                     │
 * │                                                                          │
 * │ MAP VISIBILITY RULES (ENFORCED):                                        │
 * │ - Contractors: Always shown on map                                      │
 * │ - Companies: Always shown on map                                        │
 * │ - Sellers: Elite Sponsor only                                           │
 * │ - Buyers: Never shown on map                                            │
 * │                                                                          │
 * │ This card only shows for entities with map visibility.                  │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { Map, Eye, MousePointer, Target } from 'lucide-react';

interface MapMetricsData {
  impressions: number;  // Times appeared on map
  opens: number;        // Times marker was clicked
  clickThrough: number; // Percentage (opens/impressions * 100)
}

interface MapMetricsCardProps {
  data: MapMetricsData;
  loading?: boolean;
  /** If false, shows "Map visibility not available" message */
  hasMapVisibility?: boolean;
}

export function MapMetricsCard({ data, loading, hasMapVisibility = true }: MapMetricsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasMapVisibility) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Map className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Map Visibility</h3>
            <p className="text-sm text-gray-500">Geographic discovery</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">
            Map visibility is not available for your account type.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Elite Sponsor sellers and all Professional accounts appear on the map.
          </p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      key: 'impressions',
      label: 'Map Impressions',
      value: data.impressions,
      icon: Eye,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      description: 'Times shown on map',
    },
    {
      key: 'opens',
      label: 'Marker Opens',
      value: data.opens,
      icon: MousePointer,
      color: 'text-green-600',
      bg: 'bg-green-100',
      description: 'Marker clicks',
    },
    {
      key: 'clickThrough',
      label: 'Click-Through',
      value: `${data.clickThrough}%`,
      icon: Target,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      description: 'Opens / impressions',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Map className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Map Visibility</h3>
          <p className="text-sm text-gray-500">Geographic discovery performance</p>
        </div>
      </div>

      {data.impressions === 0 ? (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">
            No map data recorded yet.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Map metrics will appear as users discover you on the map.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {metrics.map(({ key, label, value, icon: Icon, color, bg, description }) => (
            <div key={key} className="text-center">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-400">{description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Performance indicator */}
      {data.impressions > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Performance Rating</span>
            <span className={`font-medium ${
              data.clickThrough >= 5 ? 'text-green-600' :
              data.clickThrough >= 2 ? 'text-yellow-600' :
              'text-gray-600'
            }`}>
              {data.clickThrough >= 5 ? 'Excellent' :
               data.clickThrough >= 2 ? 'Good' :
               'Building'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapMetricsCard;
