/**
 * THE RAIL EXCHANGE™ — Google Maps Provider
 * 
 * Loads the Google Maps JavaScript API with the new Places API.
 * Uses @googlemaps/js-api-loader functional API (setOptions/importLibrary).
 * 
 * CRITICAL: Must use Places API (New) - legacy Places API is disabled for new projects.
 */

'use client';

import * as React from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | null;
  apiKey: string | null;
}

const GoogleMapsContext = React.createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
  apiKey: null,
});

export function useGoogleMaps() {
  const context = React.useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
}

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

// Track if we've already initialized
let optionsSet = false;
let loadPromise: Promise<void> | null = null;

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<Error | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!apiKey) {
      setLoadError(new Error('Google Maps API key not configured'));
      return;
    }

    // Check if already loaded
    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Set options only once
    if (!optionsSet) {
      setOptions({
        key: apiKey,
        v: 'weekly',
        libraries: ['places', 'marker'],
      });
      optionsSet = true;
    }

    // Start loading only once
    if (!loadPromise) {
      loadPromise = importLibrary('places').then(() => {
        // Also import marker library
        return importLibrary('marker');
      }).then(() => {});
    }

    loadPromise
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        setLoadError(err);
      });
  }, [apiKey]);

  const value = React.useMemo(
    () => ({ isLoaded, loadError, apiKey }),
    [isLoaded, loadError, apiKey]
  );

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export { GoogleMapsContext };
