/**
 * THE RAIL EXCHANGE™ — Map Wrapper Component
 * 
 * Google Maps wrapper with lazy loading and error handling.
 * Provides base map functionality for contractor and listing maps.
 * Uses centralized GoogleMapsProvider for script loading.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider';

export interface MapWrapperProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
  onMapLoad?: (map: google.maps.Map) => void;
}

// Default center (USA)
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const DEFAULT_ZOOM = 4;

const MapWrapper: React.FC<MapWrapperProps> = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className,
  children,
  onMapLoad,
}) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const { isLoaded, loadError } = useGoogleMaps();

  // Initialize map when script is loaded
  React.useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    try {
      const newMap = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      setMap(newMap);
      onMapLoad?.(newMap);
    } catch (err) {
      console.error('Map initialization error:', err);
    }
  }, [isLoaded, center, zoom, map, onMapLoad]);

  // Update center when prop changes
  React.useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  // Update zoom when prop changes
  React.useEffect(() => {
    if (map && zoom) {
      map.setZoom(zoom);
    }
  }, [map, zoom]);

  if (loadError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-surface-secondary rounded-xl border border-surface-border",
        className
      )}>
        <div className="text-center p-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-status-error/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary">{loadError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-xl overflow-hidden", className)}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-secondary">
          <div className="flex flex-col items-center gap-3">
            {/* Skeleton pulse dots instead of spinner */}
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2.5 h-2.5 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2.5 h-2.5 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-sm text-text-secondary">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />
      {map && children}
    </div>
  );
};

export { MapWrapper };
