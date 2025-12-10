/**
 * THE RAIL EXCHANGE™ — Location Autocomplete Component
 * 
 * Google Places Autocomplete input for location selection.
 * Returns city, state, coordinates, and formatted address.
 * Uses centralized GoogleMapsProvider for script loading.
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
  const inputRef = React.useRef<HTMLInputElement>(null);
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = React.useState(value);
  const { isLoaded } = useGoogleMaps();

  // Initialize autocomplete
  React.useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types,
      componentRestrictions: countryRestrictions.length > 0 ? { country: countryRestrictions } : undefined,
      fields: ['address_components', 'geometry', 'formatted_address', 'name'],
    });

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

      place.address_components?.forEach((component) => {
        const types = component.types;
        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (types.includes('country')) {
          country = component.short_name;
        } else if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
      });

      // If no city found, try sublocality
      if (!city) {
        place.address_components?.forEach((component) => {
          if (component.types.includes('sublocality') || component.types.includes('administrative_area_level_2')) {
            city = component.long_name;
          }
        });
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

      // Update input value
      const displayValue = city && state ? `${city}, ${state}` : place.formatted_address || '';
      setInputValue(displayValue);
      onChange?.(displayValue);
      onLocationSelect?.(result);
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, types, countryRestrictions, onChange, onLocationSelect]);

  // Sync external value changes
  React.useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <div className={cn('relative', className)}>
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
