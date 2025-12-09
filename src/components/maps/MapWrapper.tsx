/**
 * THE RAIL EXCHANGE™ — Map Wrapper Component
 * 
 * Google Maps wrapper with lazy loading and error handling.
 * Provides base map functionality for contractor and listing maps.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

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
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load Google Maps script
  React.useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    // Load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);
  }, []);

  // Initialize map
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
      setError('Failed to initialize map');
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

  if (error) {
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
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-xl overflow-hidden", className)}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-secondary">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-rail-orange border-t-transparent rounded-full animate-spin" />
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
