/**
 * THE RAIL EXCHANGE™ — Regions Served Block
 * 
 * Displays service regions as text list.
 * NO maps. NO mock data. Pure display.
 * Hide if no data.
 */

import { MapPin } from 'lucide-react';
import { Entity } from '@/types/entity';

export interface RegionsServedBlockProps {
  entity: Entity | null;
}

export function RegionsServedBlock({ entity }: RegionsServedBlockProps) {
  // Don't render if no entity
  if (!entity) {
    return null;
  }

  // Get service regions from entity location data
  const regions: string[] = entity.location?.serviceArea || [];

  // Also include primary location if exists
  const primaryLocation = [
    entity.location?.city,
    entity.location?.state,
    entity.location?.country,
  ].filter(Boolean).join(', ');

  // Hide block if no regions and no primary location
  if (regions.length === 0 && !primaryLocation) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-gray-400" />
        Regions Served
      </h2>

      <div className="space-y-3">
        {/* Primary Location */}
        {primaryLocation && (
          <div className="flex items-center gap-2 text-gray-700">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full">
              <span className="w-2 h-2 bg-orange-500 rounded-full" />
            </span>
            <span className="text-sm font-medium">Headquarters: {primaryLocation}</span>
          </div>
        )}

        {/* Service Areas */}
        {regions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {regions.map((region, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-full"
              >
                {region}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
