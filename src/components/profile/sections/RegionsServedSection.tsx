/**
 * THE RAIL EXCHANGE™ — Regions Served Section
 * 
 * Displays service regions as text list.
 * NO maps. Hides if empty. NO mock data.
 */

import { MapPin } from 'lucide-react';
import type { RegionsServedSectionProps } from '../types';

export function RegionsServedSection({ regions, location }: RegionsServedSectionProps) {
  // Format primary location
  const primaryLocation = [
    location?.city,
    location?.state,
    location?.country,
  ].filter(Boolean).join(', ');

  // Hide if no regions and no primary location
  if ((!regions || regions.length === 0) && !primaryLocation) {
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
        {regions && regions.length > 0 && (
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

export default RegionsServedSection;
