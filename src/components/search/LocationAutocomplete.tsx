/**
 * THE RAIL EXCHANGE™ — Location Autocomplete Component
 * 
 * Google Places Autocomplete input for location selection.
 * Returns city, state, coordinates, and formatted address.
 * 
 * UPDATED: December 2025 - Uses new Places Autocomplete API
 * with proper event handling (no async in listeners).
 * 
 * Note: PlaceAutocompleteElement is the new web component approach,
 * but for maximum compatibility we use the Places Service with
 * synchronous event handling.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider';

export interface LocationResult {
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  lat: number;
  lng: number;
}

interface LocationAutocompleteProps {
  value?: string;
  onChange?: (value: string) => void;
  onLocationSelect?: (location: LocationResult) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  types?: string[]; // e.g., ['(cities)', '(regions)']
  countryRestrictions?: string[]; // e.g., ['us', 'ca']
}

export default function LocationAutocomplete({
  value = '',
  onChange,
  onLocationSelect,
  placeholder = 'Enter a location...',
  className,
  inputClassName,
  disabled = false,
  types = ['(cities)'],
  countryRestrictions = ['us'],
}: LocationAutocompleteProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);
  const listenerRef = React.useRef<google.maps.MapsEventListener | null>(null);
  const [inputValue, setInputValue] = React.useState(value);
  const { isLoaded } = useGoogleMaps();

  // Store callbacks in refs to avoid stale closures in event listener
  const onChangeRef = React.useRef(onChange);
  const onLocationSelectRef = React.useRef(onLocationSelect);
  
  React.useEffect(() => {
    onChangeRef.current = onChange;
    onLocationSelectRef.current = onLocationSelect;
  }, [onChange, onLocationSelect]);

  // Initialize autocomplete - synchronous event handling only
  React.useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    // Ensure google.maps.places is available
    if (!window.google?.maps?.places?.Autocomplete) {
      console.warn('Google Maps Places API not available');
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types,
      componentRestrictions: countryRestrictions.length > 0 ? { country: countryRestrictions } : undefined,
      fields: ['address_components', 'geometry', 'formatted_address', 'name'],
    });

    // CRITICAL: Synchronous event handler - no async/await inside
    const handlePlaceChanged = () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry?.location) {
        console.warn('No location data for selected place');
        return;
      }

      // Parse address components synchronously
      let city = '';
      let state = '';
      let country = '';
      let postalCode = '';

      const components = place.address_components || [];
      for (let i = 0; i < components.length; i++) {
        const component = components[i];
        const componentTypes = component.types;
        
        if (componentTypes.includes('locality')) {
          city = component.long_name;
        } else if (componentTypes.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (componentTypes.includes('country')) {
          country = component.short_name;
        } else if (componentTypes.includes('postal_code')) {
          postalCode = component.long_name;
        }
      }

      // If no city found, try sublocality
      if (!city) {
        for (let i = 0; i < components.length; i++) {
          const component = components[i];
          if (component.types.includes('sublocality') || component.types.includes('administrative_area_level_2')) {
            city = component.long_name;
            break;
          }
        }
      }

      const result: LocationResult = {
        formattedAddress: place.formatted_address || '',
        city,
        state,
        country,
        postalCode,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      // Update input value synchronously
      const displayValue = city && state ? `${city}, ${state}` : place.formatted_address || '';
      setInputValue(displayValue);
      
      // Call callbacks using refs (avoids stale closure)
      if (onChangeRef.current) {
        onChangeRef.current(displayValue);
      }
      if (onLocationSelectRef.current) {
        onLocationSelectRef.current(result);
      }
    };

    // Add listener and store reference for cleanup
    listenerRef.current = autocomplete.addListener('place_changed', handlePlaceChanged);
    autocompleteRef.current = autocomplete;

    // Cleanup function
    return () => {
      if (listenerRef.current) {
        google.maps.event.removeListener(listenerRef.current);
        listenerRef.current = null;
      }
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, types, countryRestrictions]);

  // Sync external value changes
  React.useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onChangeRef.current) {
      onChangeRef.current(newValue);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-3 bg-slate-50/80 rounded-xl text-[15px] text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:bg-white transition-colors',
          disabled && 'opacity-50 cursor-not-allowed',
          inputClassName
        )}
        autoComplete="off"
      />
      {!isLoaded && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <p className="absolute -bottom-5 left-0 text-xs text-text-tertiary">
          Location autocomplete requires Google Maps API key
        </p>
      )}
    </div>
  );
}

export { LocationAutocomplete };
