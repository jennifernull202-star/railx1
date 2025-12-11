/**
 * THE RAIL EXCHANGE™ — Location Autocomplete Component
 * 
 * Google Places Autocomplete using the modern PlacePicker web component.
 * Returns city, state, coordinates, and formatted address.
 * 
 * UPDATED: December 2025 - Uses @googlemaps/extended-component-library
 * PlacePicker (gmpx-place-picker) for 2025 API compliance.
 * NO LEGACY API CALLS - fully compliant with new Places API.
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

// Type for the PlacePicker element
interface PlacePickerElement extends HTMLElement {
  value?: {
    displayName?: string;
    formattedAddress?: string;
    location?: { lat: () => number; lng: () => number } | google.maps.LatLng;
    addressComponents?: Array<{
      types: string[];
      longText?: string;
      shortText?: string;
      long_name?: string;
      short_name?: string;
    }>;
  } | null;
}

export default function LocationAutocomplete({
  value = '',
  onChange,
  onLocationSelect,
  placeholder = 'Enter a location...',
  className,
  inputClassName,
  disabled = false,
  types = [],
  countryRestrictions = ['us'],
}: LocationAutocompleteProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const pickerRef = React.useRef<PlacePickerElement | null>(null);
  const [inputValue, setInputValue] = React.useState(value);
  const [pickerLoaded, setPickerLoaded] = React.useState(false);
  const { isLoaded, apiKey } = useGoogleMaps();

  // Dynamically import the PlacePicker component (browser only)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && apiKey) {
      import('@googlemaps/extended-component-library/place_picker.js')
        .then(() => setPickerLoaded(true))
        .catch((err) => console.error('Failed to load PlacePicker:', err));
    }
  }, [apiKey]);

  // Store callbacks in refs to avoid stale closures
  const onChangeRef = React.useRef(onChange);
  const onLocationSelectRef = React.useRef(onLocationSelect);
  
  React.useEffect(() => {
    onChangeRef.current = onChange;
    onLocationSelectRef.current = onLocationSelect;
  }, [onChange, onLocationSelect]);

  // Handle place selection from PlacePicker
  const handlePlaceChange = React.useCallback((event: Event) => {
    const picker = event.target as PlacePickerElement;
    const place = picker?.value;
    
    if (!place) {
      // User cleared the input
      setInputValue('');
      if (onChangeRef.current) {
        onChangeRef.current('');
      }
      return;
    }

    // Get location coordinates
    let lat = 0;
    let lng = 0;
    if (place.location) {
      if (typeof place.location.lat === 'function') {
        lat = place.location.lat();
        lng = (place.location as google.maps.LatLng).lng();
      } else {
        lat = (place.location as unknown as { lat: number }).lat;
        lng = (place.location as unknown as { lng: number }).lng;
      }
    }

    // Parse address components
    let city = '';
    let state = '';
    let country = '';
    let postalCode = '';

    const components = place.addressComponents || [];
    for (const component of components) {
      const componentTypes = component.types;
      const longName = component.longText || component.long_name || '';
      const shortName = component.shortText || component.short_name || '';
      
      if (componentTypes.includes('locality')) {
        city = longName;
      } else if (componentTypes.includes('administrative_area_level_1')) {
        state = shortName;
      } else if (componentTypes.includes('country')) {
        country = shortName;
      } else if (componentTypes.includes('postal_code')) {
        postalCode = longName;
      }
    }

    // If no city found, try sublocality
    if (!city) {
      for (const component of components) {
        if (component.types.includes('sublocality') || component.types.includes('administrative_area_level_2')) {
          city = component.longText || component.long_name || '';
          break;
        }
      }
    }

    const locationResult: LocationResult = {
      formattedAddress: place.formattedAddress || '',
      city,
      state,
      country,
      postalCode,
      lat,
      lng,
    };

    // Update display value
    const displayValue = city && state ? `${city}, ${state}` : place.formattedAddress || place.displayName || '';
    setInputValue(displayValue);
    
    // Call callbacks
    if (onChangeRef.current) {
      onChangeRef.current(displayValue);
    }
    if (onLocationSelectRef.current) {
      onLocationSelectRef.current(locationResult);
    }
  }, []);

  // Set up event listener on PlacePicker
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !apiKey || !pickerLoaded) return;

    // Find or wait for the place-picker element
    const setupPicker = () => {
      const picker = container.querySelector('gmpx-place-picker') as PlacePickerElement | null;
      if (picker) {
        pickerRef.current = picker;
        picker.addEventListener('gmpx-placechange', handlePlaceChange);
        return true;
      }
      return false;
    };

    // Try immediately
    if (setupPicker()) return;

    // If not found, use MutationObserver to wait for it
    const observer = new MutationObserver(() => {
      if (setupPicker()) {
        observer.disconnect();
      }
    });

    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (pickerRef.current) {
        pickerRef.current.removeEventListener('gmpx-placechange', handlePlaceChange);
      }
    };
  }, [apiKey, pickerLoaded, handlePlaceChange]);

  // Sync external value changes
  React.useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Determine the type for PlacePicker
  const pickerType = types.includes('(cities)') ? 'locality' : 
                     types.includes('address') ? 'address' : 
                     types[0]?.replace(/[()]/g, '') || '';

  // Country restriction (PlacePicker uses space-separated format)
  const countryAttr = countryRestrictions.join(' ');

  if (!apiKey) {
    return (
      <div className={cn('relative', className)}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          disabled
          className={cn(
            'w-full px-4 py-3 bg-slate-50/80 rounded-xl text-[15px] text-navy-900 placeholder:text-slate-400 opacity-50 cursor-not-allowed',
            inputClassName
          )}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative location-autocomplete-wrapper', disabled ? 'disabled' : '', className)}>
      <style jsx global>{`
        .location-autocomplete-wrapper gmpx-place-picker {
          --gmpx-color-surface: rgb(248 250 252 / 0.8);
          --gmpx-color-on-surface: #1e293b;
          --gmpx-color-primary: #f97316;
          --gmpx-font-family-base: inherit;
          --gmpx-font-size-base: 15px;
          width: 100%;
        }
        .location-autocomplete-wrapper gmpx-place-picker::part(input) {
          padding: 12px 16px;
          border-radius: 12px;
          border: none;
          background: rgb(248 250 252 / 0.8);
        }
        .location-autocomplete-wrapper gmpx-place-picker:focus-within::part(input) {
          background: white;
          outline: none;
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
        }
        .location-autocomplete-wrapper.disabled gmpx-place-picker {
          opacity: 0.5;
          pointer-events: none;
        }
      `}</style>
      
      {/* Only render PlacePicker after dynamic import completes */}
      {pickerLoaded ? (
        <gmpx-place-picker
          placeholder={placeholder}
          country={countryAttr}
          type={pickerType}
        />
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          disabled
          className={cn(
            'w-full px-4 py-3 bg-slate-50/80 rounded-xl text-[15px] text-navy-900 placeholder:text-slate-400',
            inputClassName
          )}
        />
      )}
      
      {(!isLoaded || !pickerLoaded) && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export { LocationAutocomplete };
