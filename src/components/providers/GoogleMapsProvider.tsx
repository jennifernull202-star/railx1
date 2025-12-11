/**
 * THE RAIL EXCHANGE™ — Google Maps Provider
 * 
 * Centralized Google Maps script loader that:
 * 1. Prevents duplicate script loading
 * 2. Provides loading state via context
 * 3. Handles errors gracefully
 * 4. Works with Places API (New PlaceAutocompleteElement)
 * 
 * UPDATED: December 2025 - Uses new Places API with async/defer
 * per Google's 2025 migration guide.
 */

'use client';

import * as React from 'react';

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

// Global state to track script loading across all instances
let globalScriptLoading = false;
let globalScriptLoaded = false;
let globalLoadError: Error | null = null;
const loadCallbacks: Array<(error: Error | null) => void> = [];

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded - check for both maps and places
    if (globalScriptLoaded && window.google?.maps) {
      resolve();
      return;
    }

    // Add callback to queue
    loadCallbacks.push((error) => {
      if (error) reject(error);
      else resolve();
    });

    // Script already loading, just wait for callback
    if (globalScriptLoading) {
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      if (window.google?.maps) {
        globalScriptLoaded = true;
        loadCallbacks.forEach(cb => cb(null));
        loadCallbacks.length = 0;
        resolve();
        return;
      }
      // Wait for existing script to load
      const handleLoad = () => {
        globalScriptLoaded = true;
        loadCallbacks.forEach(cb => cb(null));
        loadCallbacks.length = 0;
      };
      const handleError = () => {
        const error = new Error('Failed to load Google Maps script');
        globalLoadError = error;
        loadCallbacks.forEach(cb => cb(error));
        loadCallbacks.length = 0;
      };
      existingScript.addEventListener('load', handleLoad);
      existingScript.addEventListener('error', handleError);
      return;
    }

    // Start loading
    globalScriptLoading = true;

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    // Use loading=async for modern Google Maps loading pattern
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      globalScriptLoaded = true;
      globalScriptLoading = false;
      loadCallbacks.forEach(cb => cb(null));
      loadCallbacks.length = 0;
    };

    script.onerror = () => {
      const error = new Error('Failed to load Google Maps script');
      globalLoadError = error;
      globalScriptLoading = false;
      loadCallbacks.forEach(cb => cb(error));
      loadCallbacks.length = 0;
    };

    document.head.appendChild(script);
  });
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = React.useState(globalScriptLoaded);
  const [loadError, setLoadError] = React.useState<Error | null>(globalLoadError);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;

  React.useEffect(() => {
    if (!apiKey) {
      setLoadError(new Error('Google Maps API key not configured'));
      return;
    }

    // Already loaded
    if (globalScriptLoaded) {
      setIsLoaded(true);
      return;
    }

    // Already errored
    if (globalLoadError) {
      setLoadError(globalLoadError);
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => setIsLoaded(true))
      .catch((error) => setLoadError(error));
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
