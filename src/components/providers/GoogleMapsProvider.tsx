/**
 * THE RAIL EXCHANGE™ — Google Maps Provider
 * 
 * Uses the official @googlemaps/js-api-loader for reliable loading.
 * Uses the new functional API: setOptions() and importLibrary().
 * 
 * UPDATED: December 2025 - Functional API for 2025 requirements.
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

// Track if options have been set
let optionsSet = false;
let loadPromise: Promise<google.maps.PlacesLibrary> | null = null;

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<Error | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;

  React.useEffect(() => {
    if (!apiKey) {
      setLoadError(new Error('Google Maps API key not configured'));
      return;
    }

    // Check if already loaded
    if (window.google?.maps?.places?.Autocomplete) {
      setIsLoaded(true);
      return;
    }

    // Set options only once (before first importLibrary call)
    if (!optionsSet) {
      setOptions({
        key: apiKey,
        v: 'weekly',
      });
      optionsSet = true;
    }

    // Use existing promise or create new one
    if (!loadPromise) {
      loadPromise = importLibrary('places');
    }

    loadPromise
      .then(() => {
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        setLoadError(error);
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
