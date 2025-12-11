/**
 * THE RAIL EXCHANGE™ — Location Autocomplete Component
 * 
 * Google Places Autocomplete input for location selection.
 * Returns city, state, coordinates, and formatted address.
 * 
 * UPDATED: December 2025 - Uses standard Autocomplete class
 * which is reliable with the @googlemaps/js-api-loader.
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
  types?: string[];
  countryRestrictions?: string[];
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
  const inputRef = React.useRef<HTMLInputElement>(null);
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = React.useState(value);
  const { isLoaded } = useGoogleMaps();

  // Store callbacks in refs to avoid stale closures
  const onChangeRef = React.useRef(onChange);
  const onLocationSelectRef = React.useRef(onLocationSelect);
  
  React.useEffect(() => {
    onChangeRef.current = onChange;
    onLocationSelectRef.current = onLocationSelect;
  }, [onChange, onLocationSelect]);

  // Initialize Autocomplete
  React.useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    // Check if Autocomplete is available
    if (!window.google?.maps?.places?.Autocomplete) {
      console.warn('Google Maps Places Autocomplete not available');
      return;
    }

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types,
        componentRestrictions: countryRestrictions.length > 0 ? { country: countryRestrictions } : undefined,
        fields: ['address_components', 'geometry', 'formatted_address', 'name'],
      });

      // Handle place selection - synchronous only
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry?.location) {
          console.warn('No location data for selected place');
          return;
        }

        // Parse address components
        let city = '';
        let state = '';
        let country = '';
        let postalCode = '';

        const components = place.address_components || [];
        for (const component of components) {
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
          for (const component of components) {
            if (component.types.includes('sublocality') || component.types.includes('administrative_area_level_2')) {
              city = component.long_name;
              break;
            }
          }
        }

        const locationResult: LocationResult = {
          formattedAddress: place.formatted_address || '',
          city,
          state,
          country,
          postalCode,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        // Update display value
        const displayValue = city && state ? `${city}, ${state}` : place.formatted_address || '';
        setInputValue(displayValue);
        
        // Call callbacks
        if (onChangeRef.current) {
          onChangeRef.current(displayValue);
        }
        if (onLocationSelectRef.current) {
          onLocationSelectRef.current(locationResult);
        }
      });

      autocompleteRef.current = autocomplete;

      // Cleanup
      return () => {
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
          autocompleteRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing Autocomplete:', error);
    }
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
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled || !isLoaded}
        className={cn(
          'w-full px-4 py-3 bg-slate-50/80 rounded-xl text-[15px] text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:bg-white transition-colors',
          disabled && 'opacity-50 cursor-not-allowed',
          inputClassName
        )}
        autoComplete="off"
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export { LocationAutocomplete };
