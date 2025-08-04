import { useState, useEffect, useCallback, useRef } from 'react';
import debounce from 'lodash/debounce';

interface Property {
  property_id: number;
  landlord_id: number;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  monthly_rent: number;
  bedrooms: number;
  bathrooms: number;
  square_footage?: number | null;
  amenities?: string[] | null;
  available_from: string;
  created_at?: string;
  images?: string[] | null;
}

interface Filters {
  minPrice: string;
  maxPrice: string;
  beds: string;
  baths: string;
}

interface SearchLocation {
  address: string;
  coordinates: { lat: number; lng: number } | null;
}

interface UsePropertiesOptions {
  initialCenter?: { lat: number; lng: number };
  initialRadius?: number;
  initialFilters?: Filters;
  initialPriceRange?: [number, number];
  initialSelectedAmenities?: string[];
  initialMoveInDate?: Date;
  initialSortOrder?: 'asc' | 'desc' | null;
}

interface UsePropertiesReturn {
  properties: Property[];
  loading: boolean;
  error: string | null;
  fetchProperties: (params: {
    center?: { lat: number; lng: number };
    radius?: number;
    filters?: Filters;
    priceRange?: [number, number];
    selectedAmenities?: string[];
    moveInDate?: Date;
    sortOrder?: 'asc' | 'desc' | null;
  }) => Promise<void>;
  updateMapCenter: (center: { lat: number; lng: number }) => void;
  isFetchingNewArea: boolean;
}

export function useProperties(options: UsePropertiesOptions = {}): UsePropertiesReturn {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingNewArea, setIsFetchingNewArea] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const currentCenter = useRef(options.initialCenter || { lat: 43.6532, lng: -79.3832 });
  const currentRadius = useRef(options.initialRadius || 5);
  const currentFilters = useRef(options.initialFilters || {
    minPrice: '',
    maxPrice: '',
    beds: '',
    baths: '',
  });
  const currentPriceRange = useRef(options.initialPriceRange || [0, 10000]);
  const currentSelectedAmenities = useRef(options.initialSelectedAmenities || []);
  const currentMoveInDate = useRef(options.initialMoveInDate);
  const currentSortOrder = useRef(options.initialSortOrder || null);
  
  const lastFetchedArea = useRef<{
    center: { lat: number; lng: number };
    radius: number;
  } | null>(null);

  // Debounced function to fetch properties for new map areas
  const debouncedFetchNewArea = useCallback(
    debounce(async (center: { lat: number; lng: number }, radius: number) => {
      try {
        setIsFetchingNewArea(true);
        const params = new URLSearchParams({
          lat: center.lat.toString(),
          lng: center.lng.toString(),
          radius: radius.toString(),
        });

        // Add filters to the request
        if (currentPriceRange.current[0] > 0) {
          params.append('minPrice', currentPriceRange.current[0].toString());
        }
        if (currentPriceRange.current[1] < 10000) {
          params.append('maxPrice', currentPriceRange.current[1].toString());
        }
        if (currentFilters.current.beds) {
          params.append('beds', currentFilters.current.beds);
        }
        if (currentFilters.current.baths) {
          params.append('baths', currentFilters.current.baths);
        }
        if (currentMoveInDate.current) {
          params.append('moveInDate', currentMoveInDate.current.toISOString());
        }
        if (currentSelectedAmenities.current.length > 0) {
          params.append('amenities', currentSelectedAmenities.current.join(','));
        }
        if (currentSortOrder.current) {
          params.append('sortOrder', currentSortOrder.current);
        }

        const response = await fetch(`/api/properties?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        
        const newProperties = await response.json();
        
        // Merge new properties with existing ones, avoiding duplicates
        setProperties(prevProperties => {
          const existingIds = new Set(prevProperties.map(p => p.property_id));
          const uniqueNewProperties = newProperties.filter((p: Property) => !existingIds.has(p.property_id));
          return [...prevProperties, ...uniqueNewProperties];
        });

        lastFetchedArea.current = { center, radius };
      } catch (err) {
        console.error('Error fetching properties for new area:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch properties');
      } finally {
        setIsFetchingNewArea(false);
      }
    }, 500), // 500ms debounce
    []
  );

  const fetchProperties = useCallback(async (params: {
    center?: { lat: number; lng: number };
    radius?: number;
    filters?: Filters;
    priceRange?: [number, number];
    selectedAmenities?: string[];
    moveInDate?: Date;
    sortOrder?: 'asc' | 'desc' | null;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // Update current state
      if (params.center) currentCenter.current = params.center;
      if (params.radius) currentRadius.current = params.radius;
      if (params.filters) currentFilters.current = params.filters;
      if (params.priceRange) currentPriceRange.current = params.priceRange;
      if (params.selectedAmenities) currentSelectedAmenities.current = params.selectedAmenities;
      if (params.moveInDate) currentMoveInDate.current = params.moveInDate;
      if (params.sortOrder !== undefined) currentSortOrder.current = params.sortOrder;

      const searchParams = new URLSearchParams({
        lat: currentCenter.current.lat.toString(),
        lng: currentCenter.current.lng.toString(),
        radius: currentRadius.current.toString(),
      });

      // Add filters to the request
      if (currentPriceRange.current[0] > 0) {
        searchParams.append('minPrice', currentPriceRange.current[0].toString());
      }
      if (currentPriceRange.current[1] < 10000) {
        searchParams.append('maxPrice', currentPriceRange.current[1].toString());
      }
      if (currentFilters.current.beds) {
        searchParams.append('beds', currentFilters.current.beds);
      }
      if (currentFilters.current.baths) {
        searchParams.append('baths', currentFilters.current.baths);
      }
      if (currentMoveInDate.current) {
        searchParams.append('moveInDate', currentMoveInDate.current.toISOString());
      }
      if (currentSelectedAmenities.current.length > 0) {
        searchParams.append('amenities', currentSelectedAmenities.current.join(','));
      }
      if (currentSortOrder.current) {
        searchParams.append('sortOrder', currentSortOrder.current);
      }

      const response = await fetch(`/api/properties?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      setProperties(data);
      lastFetchedArea.current = { 
        center: currentCenter.current, 
        radius: currentRadius.current 
      };
      setIsInitialized(true);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMapCenter = useCallback((center: { lat: number; lng: number }) => {
    currentCenter.current = center;
    
    // Always update URL with current map position to prevent slingshot
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('lat', center.lat.toString());
      params.set('lng', center.lng.toString());
      
      // Update URL immediately to prevent slingshot
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}?${params.toString()}`
      );
    }
    
    // Check if we need to fetch new properties for this area
    if (lastFetchedArea.current) {
      const distance = Math.sqrt(
        Math.pow(center.lat - lastFetchedArea.current.center.lat, 2) +
        Math.pow(center.lng - lastFetchedArea.current.center.lng, 2)
      );
      
      // If we've moved significantly (more than 1km), fetch new properties
      if (distance > 0.01) { // About 1km
        debouncedFetchNewArea(center, currentRadius.current);
      }
    }
  }, [debouncedFetchNewArea]);

  // Initial fetch
  useEffect(() => {
    fetchProperties({
      center: options.initialCenter,
      radius: options.initialRadius,
      filters: options.initialFilters,
      priceRange: options.initialPriceRange,
      selectedAmenities: options.initialSelectedAmenities,
      moveInDate: options.initialMoveInDate,
      sortOrder: options.initialSortOrder,
    });
  }, []); // Only run once on mount

  return {
    properties,
    loading,
    error,
    fetchProperties,
    updateMapCenter,
    isFetchingNewArea,
  };
} 