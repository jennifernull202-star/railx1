/**
 * THE RAIL EXCHANGE™ — Location Autocomplete Component
 * 
 * Google Places Autocomplete input for location selection.
 * Returns city, state, coordinates, and formatted address.
 * 
 * UPDATED: December 2025 - Uses PlaceAutocompleteElement
 * (the new web component API required for keys created after March 1, 2025)
 * 
 * Reference: https://developers.google.com/maps/documentation/javascript/place-autocomplete-element
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
  const autocompleteElementRef = React.useRef<HTMLElement | null>(null);
  const [inputValue, setInputValue] = React.useState(value);
  const [isFallbackMode, setIsFallbackMode] = React.useState(false);
  const { isLoaded } = useGoogleMaps();

  // Store callbacks in refs to avoid stale closures
  const onChangeRef = React.useRef(onChange);
  const onLocationSelectRef = React.useRef(onLocationSelect);
  
  React.useEffect(() => {
    onChangeRef.current = onChange;
    onLocationSelectRef.current = onLocationSelect;
  }, [onChange, onLocationSelect]);

  // Initialize PlaceAutocompleteElement
  React.useEffect(() => {
    if (!isLoaded || !containerRef.current || autocompleteElementRef.current) return;

    // Check if PlaceAutocompleteElement is available
    if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
      console.warn('PlaceAutocompleteElement not available, using fallback input');
      setIsFallbackMode(true);
      return;
    }

    try {
      // Create the PlaceAutocompleteElement
      const autocompleteElement = new google.maps.places.PlaceAutocompleteElement({
        componentRestrictions: countryRestrictions.length > 0 ? { country: countryRestrictions } : undefined,
        types: types.includes('(cities)') ? ['locality', 'administrative_area_level_3'] : undefined,
      });

      // Style the element to match our design
      autocompleteElement.style.cssText = `
        width: 100%;
        --gmpx-color-surface: rgb(248 250 252 / 0.8);
        --gmpx-color-on-surface: #0f172a;
        --gmpx-color-on-surface-variant: #94a3b8;
        --gmpx-color-primary: #f97316;
        --gmpx-font-family-base: inherit;
        --gmpx-font-size-base: 15px;
        --gmpx-input-border-radius: 0.75rem;
        --gmpx-input-padding-block: 0.75rem;
        --gmpx-input-padding-inline: 1rem;
      `;

      // Set placeholder attribute
      autocompleteElement.setAttribute('placeholder', placeholder);

      // Handle place selection - synchronous, no async
      const handlePlaceChanged = (event: Event) => {
        const customEvent = event as CustomEvent;
        const place = customEvent.detail?.place;
        
        if (!place) {
          console.warn('No place in event detail');
          return;
        }

        // Fetch place details synchronously
        place.fetchFields({ fields: ['addressComponents', 'location', 'formattedAddress', 'displayName'] })
          .then((result: { place: google.maps.places.Place }) => {
            const placeData = result.place;
            
            // Parse address components
            let city = '';
            let state = '';
            let country = '';
            let postalCode = '';

            const components = placeData.addressComponents || [];
            for (const component of components) {
              const componentTypes = component.types;
              
              if (componentTypes.includes('locality')) {
                city = component.longText || '';
              } else if (componentTypes.includes('administrative_area_level_1')) {
                state = component.shortText || '';
              } else if (componentTypes.includes('country')) {
                country = component.shortText || '';
              } else if (componentTypes.includes('postal_code')) {
                postalCode = component.longText || '';
              }
            }

            // If no city found, try sublocality
            if (!city) {
              for (const component of components) {
                if (component.types.includes('sublocality') || component.types.includes('administrative_area_level_2')) {
                  city = component.longText || '';
                  break;
                }
              }
            }

            const location = placeData.location;
            if (!location) {
              console.warn('No location data for selected place');
              return;
            }

            const locationResult: LocationResult = {
              formattedAddress: placeData.formattedAddress || '',
              city,
              state,
              country,
              postalCode,
              lat: location.lat(),
              lng: location.lng(),
            };

            // Update display value
            const displayValue = city && state ? `${city}, ${state}` : placeData.formattedAddress || '';
            setInputValue(displayValue);
            
            // Call callbacks
            if (onChangeRef.current) {
              onChangeRef.current(displayValue);
            }
            if (onLocationSelectRef.current) {
              onLocationSelectRef.current(locationResult);
            }
          })
          .catch((err: Error) => {
            console.error('Error fetching place details:', err);
          });
      };

      // Add event listener - NO async, NO return true
      autocompleteElement.addEventListener('gmp-placeselect', handlePlaceChanged);

      // Insert into container
      containerRef.current.appendChild(autocompleteElement);
      autocompleteElementRef.current = autocompleteElement;

      // Cleanup
      return () => {
        if (autocompleteElementRef.current) {
          autocompleteElementRef.current.removeEventListener('gmp-placeselect', handlePlaceChanged);
          autocompleteElementRef.current.remove();
          autocompleteElementRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing PlaceAutocompleteElement:', error);
      setIsFallbackMode(true);
    }
  }, [isLoaded, types, countryRestrictions, placeholder]);

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

  // Fallback input for when PlaceAutocompleteElement is not available
  if (isFallbackMode || !isLoaded) {
    return (
      <div className={cn('relative', className)}>
        <input
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

  return (
    <div 
      ref={containerRef} 
      className={cn(
        'relative location-autocomplete-container',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    />
  );
}

export { LocationAutocomplete };
