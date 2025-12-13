/**
 * THE RAIL EXCHANGE™ — Location Autocomplete Component
 * 
 * Google Places Autocomplete using the NEW Places API (Autocomplete Data API).
 * Returns city, state, coordinates, and formatted address.
 * 
 * CRITICAL: Does NOT use legacy google.maps.places.Autocomplete
 * Uses the Autocomplete Data API with fetchAutocompleteSuggestions()
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

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
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
  countryRestrictions = ['us'],
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = React.useState(value);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const { isLoaded, apiKey } = useGoogleMaps();

  // Store callbacks in refs to avoid stale closures
  const onChangeRef = React.useRef(onChange);
  const onLocationSelectRef = React.useRef(onLocationSelect);
  
  React.useEffect(() => {
    onChangeRef.current = onChange;
    onLocationSelectRef.current = onLocationSelect;
  }, [onChange, onLocationSelect]);

  // Sync external value changes
  React.useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions using the NEW Autocomplete Data API
  const fetchSuggestions = React.useCallback(async (input: string) => {
    if (!input || input.length < 2 || !isLoaded || !window.google?.maps?.places) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Use the NEW AutocompleteService which still works but we use it differently
      // OR use the Autocomplete Data API if available
      const { AutocompleteSuggestion } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
      
      // Try the new Autocomplete Data API first
      if (AutocompleteSuggestion) {
        const request = {
          input,
          includedRegionCodes: countryRestrictions,
        };

        const { suggestions: results } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        
        const formattedSuggestions: Suggestion[] = results
          .filter((s): s is google.maps.places.AutocompleteSuggestion & { placePrediction: NonNullable<google.maps.places.AutocompleteSuggestion['placePrediction']> } => 
            s.placePrediction !== null && s.placePrediction !== undefined
          )
          .slice(0, 5)
          .map((s) => ({
            placeId: s.placePrediction.placeId,
            description: s.placePrediction.text?.text || '',
            mainText: s.placePrediction.mainText?.text || '',
            secondaryText: s.placePrediction.secondaryText?.text || '',
          }));
        
        setSuggestions(formattedSuggestions);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, countryRestrictions]);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    
    if (onChangeRef.current) {
      onChangeRef.current(newValue);
    }

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
      setIsOpen(true);
    }, 300);
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    setInputValue(suggestion.description);
    setSuggestions([]);
    setIsOpen(false);

    if (onChangeRef.current) {
      onChangeRef.current(suggestion.description);
    }

    // Fetch place details using the NEW Place class
    if (onLocationSelectRef.current && suggestion.placeId) {
      try {
        const { Place } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
        
        const place = new Place({ id: suggestion.placeId });
        await place.fetchFields({ 
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'] 
        });

        let city = '';
        let state = '';
        let country = '';
        let postalCode = '';

        if (place.addressComponents) {
          for (const component of place.addressComponents) {
            const types = component.types;
            if (types.includes('locality')) {
              city = component.longText || '';
            } else if (types.includes('administrative_area_level_1')) {
              state = component.shortText || '';
            } else if (types.includes('country')) {
              country = component.shortText || '';
            } else if (types.includes('postal_code')) {
              postalCode = component.longText || '';
            }
          }
          
          // Fallback for city
          if (!city) {
            for (const component of place.addressComponents) {
              if (component.types.includes('sublocality') || component.types.includes('administrative_area_level_2')) {
                city = component.longText || '';
                break;
              }
            }
          }
        }

        const locationResult: LocationResult = {
          formattedAddress: place.formattedAddress || suggestion.description,
          city,
          state,
          country,
          postalCode,
          lat: place.location?.lat() || 0,
          lng: place.location?.lng() || 0,
        };

        // Update display value
        const displayValue = city && state ? `${city}, ${state}` : suggestion.description;
        setInputValue(displayValue);
        
        if (onChangeRef.current) {
          onChangeRef.current(displayValue);
        }

        onLocationSelectRef.current(locationResult);
      } catch (error) {
        console.error('Failed to fetch place details:', error);
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

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
    <div ref={containerRef} className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || !isLoaded}
        autoComplete="off"
        className={cn(
          'w-full px-4 py-3 bg-slate-50/80 rounded-xl text-[15px] text-navy-900 placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:bg-white transition-colors',
          disabled && 'opacity-50 cursor-not-allowed',
          inputClassName
        )}
      />
      
      {/* Loading indicator */}
      {(isLoading || !isLoaded) && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
          <div className="w-4 h-4 bg-rail-orange/30 rounded-full animate-pulse" />
        </div>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors',
                'border-b border-slate-100 last:border-b-0',
                index === selectedIndex && 'bg-slate-50'
              )}
            >
              <div className="text-sm font-medium text-navy-900">
                {suggestion.mainText}
              </div>
              {suggestion.secondaryText && (
                <div className="text-xs text-slate-500 mt-0.5">
                  {suggestion.secondaryText}
                </div>
              )}
            </button>
          ))}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
            <img 
              src="https://www.gstatic.com/mapspro/images/stock/20180801_googleg_cropped.png" 
              alt="Powered by Google" 
              className="h-3 opacity-60"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { LocationAutocomplete };
