/**
 * THE RAIL EXCHANGE™ — Listings Map Component
 * 
 * Interactive map showing all listing locations.
 * Used on search page and marketplace pages.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MapWrapper } from './MapWrapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export interface ListingMapItem {
  id: string;
  title: string;
  slug?: string;
  category: string;
  condition: string;
  price: {
    type: string;
    amount?: number;
    currency?: string;
  };
  location: {
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
  };
  primaryImageUrl?: string;
  premiumAddOns?: {
    featured?: { active: boolean };
    premium?: { active: boolean };
    elite?: { active: boolean };
  };
}

export interface ListingsMapProps {
  listings: ListingMapItem[];
  onListingSelect?: (id: string) => void;
  className?: string;
  height?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'locomotives': 'Locomotives',
  'freight-cars': 'Freight Cars',
  'passenger-cars': 'Passenger Cars',
  'maintenance-of-way': 'Maintenance of Way',
  'track-materials': 'Track Materials',
  'signals-communications': 'Signals & Communications',
  'parts-components': 'Parts & Components',
  'tools-equipment': 'Tools & Equipment',
  'real-estate': 'Real Estate',
  'services': 'Services',
};

function formatPrice(price: ListingMapItem['price']): string {
  if (price.type === 'contact') return 'Contact';
  if (price.type === 'rfq') return 'RFQ';
  if (!price.amount) return 'Contact';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price.amount);
}

export const ListingsMap: React.FC<ListingsMapProps> = ({
  listings,
  onListingSelect,
  className,
  height = '600px',
}) => {
  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [selectedListing, setSelectedListing] = React.useState<ListingMapItem | null>(null);
  const markersRef = React.useRef<google.maps.Marker[]>([]);
  const infoWindowRef = React.useRef<google.maps.InfoWindow | null>(null);

  // Update map markers
  React.useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    // Create info window
    infoWindowRef.current = new google.maps.InfoWindow();

    // Add new markers
    const bounds = new google.maps.LatLngBounds();
    let hasValidLocations = false;

    listings.forEach((listing) => {
      if (listing.location.lat && listing.location.lng) {
        hasValidLocations = true;

        // Determine marker color based on add-ons
        let markerColor = '#0A1A2F'; // Navy default
        if (listing.premiumAddOns?.elite?.active) {
          markerColor = '#F59E0B'; // Gold for elite
        } else if (listing.premiumAddOns?.premium?.active) {
          markerColor = '#8B5CF6'; // Purple for premium
        } else if (listing.premiumAddOns?.featured?.active) {
          markerColor = '#FF6A1A'; // Orange for featured
        }

        const marker = new google.maps.Marker({
          position: { lat: listing.location.lat, lng: listing.location.lng },
          map,
          title: listing.title,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        });

        // Click handler
        marker.addListener('click', () => {
          setSelectedListing(listing);
          onListingSelect?.(listing.id);

          const content = `
            <div style="max-width: 280px; font-family: Inter, sans-serif;">
              ${listing.primaryImageUrl ? `
                <img src="${listing.primaryImageUrl}" alt="${listing.title}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px 8px 0 0;" />
              ` : ''}
              <div style="padding: 12px;">
                <p style="font-size: 12px; color: #FF6A1A; margin: 0 0 4px 0; font-weight: 500;">
                  ${CATEGORY_LABELS[listing.category] || listing.category}
                </p>
                <h3 style="font-size: 14px; font-weight: 600; color: #0A1A2F; margin: 0 0 8px 0; line-height: 1.3;">
                  ${listing.title}
                </h3>
                <p style="font-size: 16px; font-weight: 700; color: #0A1A2F; margin: 0 0 4px 0;">
                  ${formatPrice(listing.price)}
                </p>
                <p style="font-size: 12px; color: #6B7280; margin: 0 0 12px 0;">
                  ${listing.location.city}, ${listing.location.state}
                </p>
                <a href="/listings/${listing.slug || listing.id}" 
                   style="display: inline-block; background: #FF6A1A; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500;">
                  View Listing
                </a>
              </div>
            </div>
          `;

          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open(map, marker);
        });

        markersRef.current.push(marker);
        bounds.extend({ lat: listing.location.lat, lng: listing.location.lng });
      }
    });

    // Fit bounds if we have locations
    if (hasValidLocations && markersRef.current.length > 0) {
      map.fitBounds(bounds);
      
      // Don't zoom in too far for single marker
      const listener = google.maps.event.addListener(map, 'idle', () => {
        const zoom = map.getZoom();
        if (zoom && zoom > 12) {
          map.setZoom(12);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, listings, onListingSelect]);

  // Handle map load
  const handleMapLoad = React.useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  return (
    <div className={cn('relative rounded-xl overflow-hidden border border-border-default', className)}>
      {/* Map Legend */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <p className="text-xs font-semibold text-navy-900 mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-text-secondary">Elite</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-text-secondary">Premium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rail-orange" />
            <span className="text-xs text-text-secondary">Featured</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-navy-900" />
            <span className="text-xs text-text-secondary">Standard</span>
          </div>
        </div>
      </div>

      {/* Listing Count */}
      <div className="absolute top-4 left-4 z-10">
        <Badge className="bg-white text-navy-900 shadow-lg border-0">
          {listings.length} listing{listings.length !== 1 ? 's' : ''} on map
        </Badge>
      </div>

      {/* Map */}
      <div style={{ height }}>
        <MapWrapper
          onMapLoad={handleMapLoad}
          center={{ lat: 39.8283, lng: -98.5795 }}
          zoom={4}
          className="h-full"
        />
      </div>

      {/* Selected Listing Card (Mobile) */}
      {selectedListing && (
        <div className="absolute bottom-4 left-4 right-4 md:hidden bg-white rounded-lg shadow-lg p-4">
          <button 
            onClick={() => setSelectedListing(null)}
            className="absolute top-2 right-2 text-text-tertiary hover:text-navy-900"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="text-xs font-medium text-rail-orange mb-1">
            {CATEGORY_LABELS[selectedListing.category] || selectedListing.category}
          </p>
          <h3 className="font-semibold text-navy-900 mb-1 pr-6">{selectedListing.title}</h3>
          <p className="text-lg font-bold text-navy-900 mb-2">{formatPrice(selectedListing.price)}</p>
          <Link href={`/listings/${selectedListing.slug || selectedListing.id}`}>
            <Button size="sm" className="w-full">View Listing</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ListingsMap;
