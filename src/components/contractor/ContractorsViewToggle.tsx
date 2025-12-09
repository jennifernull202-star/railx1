/**
 * THE RAIL EXCHANGE™ — Contractors View Toggle
 * 
 * Client component for toggling between map and list views.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MapWrapper } from '@/components/maps/MapWrapper';

interface Contractor {
  _id: string;
  businessName: string;
  businessDescription: string;
  logo?: string;
  services: string[];
  regionsServed: string[];
  yearsInBusiness: number;
  verificationStatus: string;
  address: {
    city: string;
    state: string;
  };
}

interface ContractorsViewToggleProps {
  contractors: Contractor[];
  children: React.ReactNode; // The list view content
}

// Approximate state centroids for mapping (lowercase)
const STATE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  al: { lat: 32.806671, lng: -86.791130 },
  ak: { lat: 61.370716, lng: -152.404419 },
  az: { lat: 33.729759, lng: -111.431221 },
  ar: { lat: 34.969704, lng: -92.373123 },
  ca: { lat: 36.116203, lng: -119.681564 },
  co: { lat: 39.059811, lng: -105.311104 },
  ct: { lat: 41.597782, lng: -72.755371 },
  de: { lat: 39.318523, lng: -75.507141 },
  fl: { lat: 27.766279, lng: -81.686783 },
  ga: { lat: 33.040619, lng: -83.643074 },
  hi: { lat: 21.094318, lng: -157.498337 },
  id: { lat: 44.240459, lng: -114.478828 },
  il: { lat: 40.349457, lng: -88.986137 },
  in: { lat: 39.849426, lng: -86.258278 },
  ia: { lat: 42.011539, lng: -93.210526 },
  ks: { lat: 38.526600, lng: -96.726486 },
  ky: { lat: 37.668140, lng: -84.670067 },
  la: { lat: 31.169546, lng: -91.867805 },
  me: { lat: 44.693947, lng: -69.381927 },
  md: { lat: 39.063946, lng: -76.802101 },
  ma: { lat: 42.230171, lng: -71.530106 },
  mi: { lat: 43.326618, lng: -84.536095 },
  mn: { lat: 45.694454, lng: -93.900192 },
  ms: { lat: 32.741646, lng: -89.678696 },
  mo: { lat: 38.456085, lng: -92.288368 },
  mt: { lat: 46.921925, lng: -110.454353 },
  ne: { lat: 41.125370, lng: -98.268082 },
  nv: { lat: 38.313515, lng: -117.055374 },
  nh: { lat: 43.452492, lng: -71.563896 },
  nj: { lat: 40.298904, lng: -74.521011 },
  nm: { lat: 34.840515, lng: -106.248482 },
  ny: { lat: 42.165726, lng: -74.948051 },
  nc: { lat: 35.630066, lng: -79.806419 },
  nd: { lat: 47.528912, lng: -99.784012 },
  oh: { lat: 40.388783, lng: -82.764915 },
  ok: { lat: 35.565342, lng: -96.928917 },
  or: { lat: 44.572021, lng: -122.070938 },
  pa: { lat: 40.590752, lng: -77.209755 },
  ri: { lat: 41.680893, lng: -71.511780 },
  sc: { lat: 33.856892, lng: -80.945007 },
  sd: { lat: 44.299782, lng: -99.438828 },
  tn: { lat: 35.747845, lng: -86.692345 },
  tx: { lat: 31.054487, lng: -97.563461 },
  ut: { lat: 40.150032, lng: -111.862434 },
  vt: { lat: 44.045876, lng: -72.710686 },
  va: { lat: 37.769337, lng: -78.169968 },
  wa: { lat: 47.400902, lng: -121.490494 },
  wv: { lat: 38.491226, lng: -80.954453 },
  wi: { lat: 44.268543, lng: -89.616508 },
  wy: { lat: 42.755966, lng: -107.302490 },
  dc: { lat: 38.897438, lng: -77.026817 },
};

export default function ContractorsViewToggle({ contractors, children }: ContractorsViewToggleProps) {
  const [viewMode, setViewMode] = React.useState<'list' | 'map'>('list');
  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const markersRef = React.useRef<google.maps.Marker[]>([]);

  // Get coordinates for a contractor based on their state
  const getContractorCoords = (contractor: Contractor) => {
    const stateAbbr = contractor.address?.state?.toLowerCase();
    return STATE_COORDINATES[stateAbbr] || null;
  };

  // Count contractors with mappable locations
  const mappableCount = contractors.filter(c => getContractorCoords(c)).length;

  // Update markers when contractors or map changes
  React.useEffect(() => {
    if (!map || viewMode !== 'map') return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    contractors.forEach(contractor => {
      const coords = getContractorCoords(contractor);
      if (!coords) return;

      hasMarkers = true;
      const position = { lat: coords.lat, lng: coords.lng };
      bounds.extend(position);

      const isVerified = contractor.verificationStatus === 'verified';
      
      const marker = new google.maps.Marker({
        position,
        map,
        title: contractor.businessName,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isVerified ? 12 : 10,
          fillColor: isVerified ? '#10B981' : '#FF6A1A',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">${contractor.businessName}</h3>
            <p style="margin: 0; color: #64748b; font-size: 12px;">${contractor.address.city}, ${contractor.address.state}</p>
            ${isVerified ? '<span style="display: inline-block; margin-top: 4px; padding: 2px 6px; background: #D1FAE5; color: #059669; font-size: 10px; border-radius: 4px;">✓ Verified</span>' : ''}
            <a href="/contractors/${contractor._id}" style="display: block; margin-top: 8px; color: #FF6A1A; font-size: 12px; font-weight: 500;">View Profile →</a>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    if (hasMarkers) {
      map.fitBounds(bounds);
      // Prevent too much zoom on single marker
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 10) map.setZoom(10);
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, contractors, viewMode]);

  return (
    <>
      {/* View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-surface-border p-1">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              viewMode === 'list'
                ? 'bg-navy-900 text-white'
                : 'text-text-secondary hover:text-navy-900'
            )}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              viewMode === 'map'
                ? 'bg-navy-900 text-white'
                : 'text-text-secondary hover:text-navy-900'
            )}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Map
            </span>
          </button>
        </div>
        
        {viewMode === 'map' && (
          <p className="text-sm text-text-tertiary">
            Showing {mappableCount} of {contractors.length} contractors on map
          </p>
        )}
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        children
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden">
          <MapWrapper
            className="h-[600px]"
            onMapLoad={setMap}
            zoom={4}
          />
          {contractors.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="text-center">
                <p className="text-text-secondary">No contractors to display</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Legend for map view */}
      {viewMode === 'map' && (
        <div className="flex items-center gap-6 mt-4 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            Verified Contractor
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rail-orange"></span>
            Standard Contractor
          </div>
        </div>
      )}
    </>
  );
}
