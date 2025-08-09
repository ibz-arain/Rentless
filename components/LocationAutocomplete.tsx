'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2 } from 'lucide-react'
import debounce from 'lodash/debounce'

// Mapbox access token from environment variables
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// Location search result interface
interface LocationResult {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (result: LocationResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  height?: string; // Add height prop
}

export function LocationAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Location",
  className = "",
  disabled = false,
  height = "h-12" // Default to h-12
}: LocationAutocompleteProps) {
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useRef<any>(null);

  // Initialize debounced search function
  useEffect(() => {
    debouncedSearch.current = debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=place,address,neighborhood,locality,district&limit=5&language=en&country=ca,us`;

        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.features) {
          const locations = data.features.map((feature: any) => ({
            id: feature.id,
            place_name: feature.place_name,
            center: feature.center
          }));
          setSearchResults(locations);
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debouncedSearch.current) {
        debouncedSearch.current.cancel();
      }
    };
  }, []);

  // Trigger search when value changes
  useEffect(() => {
    if (debouncedSearch.current) {
      debouncedSearch.current(value);
    }
  }, [value]);

  const handleLocationSelect = useCallback((result: LocationResult) => {
    onChange(result.place_name);
    onLocationSelect(result);
    setShowResults(false);
  }, [onChange, onLocationSelect]);

  return (
    <div className={`relative ${className}`}>
      <MapPin className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input 
        placeholder={placeholder}
        className={`pl-9 ${height} hover:border-primary transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        onBlur={() => {
          // Delay hiding to allow for click on the suggestions
          setTimeout(() => setShowResults(false), 200);
        }}
        disabled={disabled}
      />
      {isSearching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Location suggestions popup */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-background border rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
              onMouseDown={() => handleLocationSelect(result)}
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{result.place_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 