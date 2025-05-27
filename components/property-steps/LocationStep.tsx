'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import debounce from 'lodash/debounce';

// Mapbox access token from environment variables
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Location search result interface
interface LocationResult {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
}

interface LocationStepProps {
  address: string;
  setAddress: (value: string) => void;
  coordinates: { lat: number; lng: number } | null;
  setCoordinates: (value: { lat: number; lng: number }) => void;
  errors: {
    address?: string;
  };
}

export function LocationStep({
  address,
  setAddress,
  coordinates,
  setCoordinates,
  errors
}: LocationStepProps) {
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

  // Trigger search when address value changes
  useEffect(() => {
    if (debouncedSearch.current) {
      debouncedSearch.current(address);
    }
  }, [address]);

  const handleLocationSelect = useCallback((result: LocationResult) => {
    setAddress(result.place_name);
    setCoordinates({
      lat: result.center[1], // Mapbox returns as [lng, lat]
      lng: result.center[0]
    });
    setShowResults(false);
  }, [setAddress, setCoordinates]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium text-primary">
        <MapPin className="h-5 w-5" />
        <h3>Property Location</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Enter your property's exact address to help renters find it easily. This will also allow us to show it on the map.
      </p>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="address" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Property Address <span className="text-destructive">*</span>
          </label>
          
          <div className="relative">
            <Input 
              id="address"
              placeholder="Enter property address"
              className={`pl-10 h-12 hover:border-primary transition-colors ${errors.address ? 'border-destructive' : ''}`}
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => {
                // Delay hiding to allow for click on the suggestions
                setTimeout(() => setShowResults(false), 200);
              }}
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
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
          
          {errors.address && (
            <p className="text-sm font-medium text-destructive">{errors.address}</p>
          )}
          
          <p className="text-xs text-muted-foreground">
            Start typing and select your address from the dropdown. This helps accurately place your property on maps.
          </p>
        </div>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4 mt-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-full text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Location Accuracy</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Accurate location information is crucial for renters. Properties with precise addresses get 30% more views and inquiries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 