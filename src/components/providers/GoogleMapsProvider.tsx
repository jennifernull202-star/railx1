/**
 * THE RAIL EXCHANGE™ — Google Maps Provider
 * 
 * Uses the official @googlemaps/extended-component-library for 2025 compliance.
 * Provides the APILoader component and context for Google Maps components.
 * 
 * UPDATED: December 2025 - Extended Component Library (ECL) for modern Places API.
 */

'use client';

import * as React from 'react';

// Import the API Loader component from extended library
import '@googlemaps/extended-component-library/api_loader.js';

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

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<Error | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;

  React.useEffect(() => {
    if (!apiKey) {
      setLoadError(new Error('Google Maps API key not configured'));
      return;
    }

    // Check if Google Maps is already available (loaded by APILoader)
    const checkLoaded = () => {
      if (window.google?.maps) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    // Initial check
    if (checkLoaded()) return;

    // Poll for load completion (APILoader handles actual loading)
    const interval = setInterval(() => {
      if (checkLoaded()) {
        clearInterval(interval);
      }
    }, 100);

    // Cleanup
    return () => clearInterval(interval);
  }, [apiKey]);

  // Ref for the API loader element
  const loaderRef = React.useRef<HTMLElement | null>(null);

  // Set the API key on the loader element
  React.useEffect(() => {
    if (loaderRef.current && apiKey) {
      loaderRef.current.setAttribute('key', apiKey);
    }
  }, [apiKey]);

  const value = React.useMemo(
    () => ({ isLoaded, loadError, apiKey }),
    [isLoaded, loadError, apiKey]
  );

  return (
    <GoogleMapsContext.Provider value={value}>
      {/* The gmpx-api-loader element handles API loading */}
      {apiKey && (
        <gmpx-api-loader
          ref={loaderRef as React.RefObject<HTMLElement>}
          solution-channel="GMP_EXTENDED_COMPONENT_V0"
        />
      )}
      {children}
    </GoogleMapsContext.Provider>
  );
}

// Declare the custom element for TypeScript
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-api-loader': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'solution-channel'?: string;
          ref?: React.RefObject<HTMLElement>;
        },
        HTMLElement
      >;
      'gmpx-place-picker': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          placeholder?: string;
          country?: string;
          type?: string;
          'strict-bounds'?: boolean;
        },
        HTMLElement
      >;
    }
  }
}

export { GoogleMapsContext };
