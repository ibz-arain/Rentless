'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Check, ChevronDown, Search, SlidersHorizontal, PanelLeftClose, PanelLeftOpen, Menu, Globe, MapPin, Calendar as CalendarIcon, DollarSign, Bed, Bath, Coffee, X, ChevronLeft, ChevronRight, ChevronUp, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { PropertyCard, transformPropertyData } from '@/components/properties'
import * as Slider from '@radix-ui/react-slider'
import debounce from 'lodash/debounce'
import { Header } from '@/components/header'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapboxMap from '@/components/MapboxMap'
import { AMENITIES_CONFIG } from '@/lib/amenities'
import { useSession } from 'next-auth/react'
import { useProperties } from '@/lib/hooks/useProperties'
import { LocationAutocomplete } from '@/components/LocationAutocomplete'
import { handleApiResponse } from '@/lib/utils'

// Constants
const RADIUS_KM = 50
const SIGNIFICANT_MOVE_THRESHOLD = 0.1 // About 100 meters
const DEBOUNCE_TIME = 200
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// Define interfaces
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

interface LocationResult {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
}

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

// Filter properties based on filters, price range, selected amenities, and move-in date
const filterProperties = (
  properties: Property[],
  filters: Filters,
  priceRange: number[],
  selectedAmenities: string[],
  moveInDate?: Date
) => {
  return properties.filter(property => {
    // Price Range Filter
    if (priceRange[0] > 0 || priceRange[1] < 10000) {
      const price = property.monthly_rent;
      if (price < priceRange[0]) return false;
      if (priceRange[1] < 10000 && price > priceRange[1]) return false;
    }

    // Bedrooms Filter
    if (filters.beds) {
      const bedsRequired = parseInt(filters.beds);
      const propertyBeds = property.bedrooms;
      if (filters.beds === '5+') {
        if (propertyBeds < 5) return false;
      } else if (propertyBeds !== bedsRequired) {
        return false;
      }
    }

    // Bathrooms Filter
    if (filters.baths) {
      const bathsRequired = parseFloat(filters.baths);
      const propertyBaths = property.bathrooms;
      if (filters.baths === '4+') {
        if (propertyBaths < 4) return false;
      } else if (propertyBaths !== bathsRequired) {
        return false;
      }
    }

    // Move-in Date Filter
    if (moveInDate) {
      const availableDate = new Date(property.available_from);
      if (availableDate > moveInDate) {
        return false;
      }
    }

    // Amenities Filter
    if (selectedAmenities.length > 0) {
      const propertyAmenities = property.amenities || [];
      if (!selectedAmenities.every(amenity => propertyAmenities.includes(amenity))) {
        return false;
      }
    }

    return true;
  });
};

// Empty state component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full py-20">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-900">No listings found</h3>
      <p className="mt-1 text-sm text-gray-500">
        Try adjusting your search or filter parameters
      </p>
    </div>
  </div>
);

// Zoom warning component
const ZoomWarning = ({ onDismiss }: { onDismiss: () => void }) => (
  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4 max-w-sm mx-4 backdrop-blur-sm">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-amber-800">Zoom in to see properties</h3>
        <p className="mt-1 text-sm text-amber-700">
          You're zoomed out too far. Zoom in to see available properties in this area.
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-amber-400 hover:text-amber-600"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
);

// Get stored state from sessionStorage
const getStoredState = () => {
  if (typeof window === 'undefined') {
    return {
      filters: {
        minPrice: '',
        maxPrice: '',
        beds: '',
        baths: '',
      },
      moveInDate: undefined,
      selectedAmenities: [],
      priceRange: [0, 10000],
      mapCenter: undefined,
      mapZoom: 12,
      searchLocation: '',
      sortOrder: null
    };
  }
  
  const stored = sessionStorage.getItem('propertyFilters');
  if (stored) {
    const state = JSON.parse(stored);
    if (state.moveInDate) {
      state.moveInDate = new Date(state.moveInDate);
    }
    return state;
  }
  
  return {
    filters: {
      minPrice: '',
      maxPrice: '',
      beds: '',
      baths: '',
    },
    moveInDate: undefined,
    selectedAmenities: [],
    priceRange: [0, 10000],
    mapCenter: undefined,
    mapZoom: 12,
    searchLocation: '',
    sortOrder: null
  };
};

export default function PropertiesPage() {
  // Initialize states with stored values or defaults
  const storedState = getStoredState();
  
  const [isListVisible, setIsListVisible] = useState(true);
  const [filters, setFilters] = useState<Filters>(storedState?.filters || {
    minPrice: '',
    maxPrice: '',
    beds: '',
    baths: '',
  });
  const [moveInDate, setMoveInDate] = useState<Date | undefined>(
    storedState?.moveInDate || undefined
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    storedState?.selectedAmenities || []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(
    storedState?.mapCenter || undefined
  );
  const [searchLocation, setSearchLocation] = useState<SearchLocation>({
    address: storedState?.searchLocation?.address || "",
    coordinates: storedState?.searchLocation?.coordinates || null
  });
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [isLocationSearching, setIsLocationSearching] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(
    storedState?.sortOrder || null
  );
  const [mapBounds, setMapBounds] = useState<mapboxgl.LngLatBounds | null>(null);
  const [searchKey, setSearchKey] = useState(0);
  const [mapZoom, setMapZoom] = useState<number>(
    storedState?.mapZoom || 12
  );
  const [isClient, setIsClient] = useState(false);
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | undefined>(undefined);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(12);
  const [showZoomWarning, setShowZoomWarning] = useState(false);

  // Update the mobile drawer state to have three positions: minimized, peek, and expanded
  const [mobileDrawerState, setMobileDrawerState] = useState<'minimized' | 'peek' | 'expanded'>('peek');

  // Use the new useProperties hook for server-side filtering
  const {
    properties,
    loading,
    error,
    fetchProperties,
    updateMapCenter,
    isFetchingNewArea
  } = useProperties({
    initialCenter: mapCenter || { lat: 43.6532, lng: -79.3832 },
    initialRadius: 50,
    initialFilters: filters,
    initialPriceRange: priceRange,
    initialSelectedAmenities: selectedAmenities,
    initialMoveInDate: moveInDate,
    initialSortOrder: sortOrder,
  });

  // Debounced function to refetch properties when filters change
  const debouncedRefetchProperties = useCallback(
    debounce(() => {
      fetchProperties({
        center: mapCenter,
        filters,
        priceRange,
        selectedAmenities,
        moveInDate,
        sortOrder,
      });
    }, DEBOUNCE_TIME),
    [fetchProperties, mapCenter, filters, priceRange, selectedAmenities, moveInDate, sortOrder]
  );

  const isSignificantMove = useCallback((
    currentCenter: mapboxgl.LngLat,
    originalCenter: mapboxgl.LngLat
  ): boolean => {
    const latDiff = Math.abs(currentCenter.lat - originalCenter.lat);
    const lngDiff = Math.abs(currentCenter.lng - originalCenter.lng);
    const SIGNIFICANT_DISTANCE = 0.001; // About 100 meters
    return latDiff > SIGNIFICANT_DISTANCE || lngDiff > SIGNIFICANT_DISTANCE;
  }, []);

  const handlePlaceSelect = useCallback(async (place: any) => {
    if (!place.geometry?.location) return;
    
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const viewport = place.geometry.viewport;
    
    setSearchLocation({
      address: place.formatted_address || "",
      coordinates: { lat, lng }
    });
    
    const newCenter = { lat, lng };
    setMapCenter(newCenter);
    setSearchKey(prev => prev + 1);

    // Fetch properties for the new location with current filters
    await fetchProperties({
      center: newCenter,
      filters,
      priceRange,
      selectedAmenities,
      moveInDate,
      sortOrder,
    });

    if (viewport) {
      const bounds = {
        ne: {
          lat: viewport.getNorthEast().lat(),
          lng: viewport.getNorthEast().lng(),
        },
        sw: {
          lat: viewport.getSouthWest().lat(),
          lng: viewport.getSouthWest().lng(),
        }
      };
      
      if (typeof window !== 'undefined' && window.mapboxgl) {
        const mapBounds = new mapboxgl.LngLatBounds(
          new mapboxgl.LngLat(bounds.sw.lng, bounds.sw.lat),
          new mapboxgl.LngLat(bounds.ne.lng, bounds.ne.lat)
        );
        setMapBounds(mapBounds);
      }
    }

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('location', place.formatted_address || '');
    searchParams.set('lat', lat.toString());
    searchParams.set('lng', lng.toString());
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${searchParams.toString()}`
    );
  }, [fetchProperties, filters, priceRange, selectedAmenities, moveInDate, sortOrder]);

  const formatPrice = (price: number) => {
    if (price >= 10000) return '$10,000+';
    return `$${price.toLocaleString()}`;
  };

  const formatPriceShort = (price: number) => {
    if (price >= 1000) {
      return `${(price/1000).toFixed(1)}K`;
    }
    return price;
  };

  const hasActiveFilters = () => {
    return (
      moveInDate !== undefined ||
      priceRange[0] !== 0 ||
      priceRange[1] !== 10000 ||
      filters.beds !== '' ||
      filters.baths !== '' ||
      selectedAmenities.length > 0 ||
      sortOrder !== null
    );
  };

  const clearAllFilters = () => {
    setMoveInDate(undefined);
    setPriceRange([0, 10000]);
    setFilters({
      minPrice: '',
      maxPrice: '',
      beds: '',
      baths: '',
    });
    setSelectedAmenities([]);
    setSortOrder(null);
    sessionStorage.removeItem('propertyFilters');
  };

  // Store state changes in sessionStorage
  useEffect(() => {
    const stateToStore = {
      filters,
      moveInDate,
      selectedAmenities,
      priceRange,
      mapCenter,
      mapZoom,
      searchLocation,
      sortOrder
    };
    
    sessionStorage.setItem('propertyFilters', JSON.stringify(stateToStore));
  }, [
    filters,
    moveInDate,
    selectedAmenities,
    priceRange,
    mapCenter,
    mapZoom,
    searchLocation,
    sortOrder
  ]);

  // Initial data fetch and URL parameter handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    const location = params.get('location');
    const moveInDateParam = params.get('moveInDate');
    const bedsParam = params.get('beds');
    const bathsParam = params.get('baths');
    const minPriceParam = params.get('minPrice');
    const maxPriceParam = params.get('maxPrice');
    const amenitiesParam = params.get('amenities');
    const sortOrderParam = params.get('sortOrder') as 'asc' | 'desc' | null;

    // Set initial map center from URL or default
    if (lat && lng) {
      const coordinates = {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
      setMapCenter(coordinates);
      setSearchLocation({
        address: location || "",
        coordinates: coordinates
      });
    } else {
      const defaultCenter = { lat: 43.6532, lng: -79.3832 };
      setMapCenter(defaultCenter);
      // Update URL with default coordinates to prevent slingshot
      const newParams = new URLSearchParams(window.location.search);
      newParams.set('lat', defaultCenter.lat.toString());
      newParams.set('lng', defaultCenter.lng.toString());
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}?${newParams.toString()}`
      );
    }

    setFilters((prev: Filters) => ({
      ...prev,
      beds: bedsParam || '',
      baths: bathsParam || '',
      minPrice: minPriceParam || '',
      maxPrice: maxPriceParam || ''
    }));

    if (minPriceParam && maxPriceParam) {
      setPriceRange([parseInt(minPriceParam), parseInt(maxPriceParam)]);
    }

    if (moveInDateParam) {
      setMoveInDate(new Date(moveInDateParam));
    }

    if (amenitiesParam) {
      setSelectedAmenities(amenitiesParam.split(','));
    }

    if (sortOrderParam) {
      setSortOrder(sortOrderParam);
    }

    if (location) {
      setSearchLocation({
        address: location,
        coordinates: null
      });
    }
  }, []);

  // Refetch properties when filters change
  useEffect(() => {
    if (mapCenter) {
      debouncedRefetchProperties();
    }
  }, [filters, priceRange, moveInDate, selectedAmenities, sortOrder, debouncedRefetchProperties]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (mapCenter) {
      params.set('lat', mapCenter.lat.toString());
      params.set('lng', mapCenter.lng.toString());
    }
    if (searchLocation.address) {
      params.set('location', searchLocation.address);
    }

    if (filters.beds) params.set('beds', filters.beds);
    else params.delete('beds');
    
    if (filters.baths) params.set('baths', filters.baths);
    else params.delete('baths');

    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    else params.delete('minPrice');
    
    if (priceRange[1] < 10000) params.set('maxPrice', priceRange[1].toString());
    else params.delete('maxPrice');

    if (moveInDate) params.set('moveInDate', moveInDate.toISOString());
    else params.delete('moveInDate');

    if (selectedAmenities.length > 0) params.set('amenities', selectedAmenities.join(','));
    else params.delete('amenities');

    if (sortOrder) params.set('sortOrder', sortOrder);
    else params.delete('sortOrder');

    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    );
  }, [
    mapCenter,
    searchLocation,
    filters,
    priceRange,
    moveInDate,
    selectedAmenities,
    sortOrder
  ]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePriceRangeCommit = useMemo(
    () => debounce((newValue: number[]) => {
      const minPrice = Math.max(0, Math.min(newValue[0] || 0, 10000));
      const maxPrice = Math.max(0, Math.min(newValue[1] || 10000, 10000));
      
      setPriceRange([minPrice, maxPrice] as [number, number]);
      setFilters((prev: Filters) => ({
        ...prev,
        minPrice: minPrice.toString(),
        maxPrice: maxPrice.toString()
      }));
    }, DEBOUNCE_TIME),
    []
  );

  // Add a function to detect mobile screen
  const isMobileScreen = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024; // lg breakpoint
    }
    return false;
  };

  // Debounced zoom warning handler
  const debouncedZoomWarning = useMemo(
    () => debounce((zoom: number) => {
      setShowZoomWarning(zoom < 8); // Lower threshold since we have larger radius
    }, 500),
    []
  );

  // Handle zoom changes and show warning if zoomed out too far
  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
    // Show warning if zoom is less than 8 (too far out to see properties effectively)
    debouncedZoomWarning(zoom);
  }, [debouncedZoomWarning]);

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Function to toggle mobile drawer between expanded and peek
  const toggleMobileDrawer = () => {
    setMobileDrawerState(prev => prev === 'expanded' ? 'peek' : 'expanded');
  };

  // Add a body scroll lock effect to prevent page scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Add search function for location
  const debouncedLocationSearch = useMemo(() => 
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setLocationResults([]);
        return;
      }

      try {
        setIsLocationSearching(true);
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
          setLocationResults(locations);
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
      } finally {
        setIsLocationSearching(false);
      }
    }, DEBOUNCE_TIME),
    []
  );

  // Trigger search when search location address changes
  useEffect(() => {
    debouncedLocationSearch(searchLocation.address);
  }, [searchLocation.address, debouncedLocationSearch]);

  // Clear zoom warning when zooming back in
  useEffect(() => {
    if (currentZoom >= 8) {
      setShowZoomWarning(false);
    }
  }, [currentZoom]);



  // Handle location selection from autocomplete
  const handleLocationSelect = useCallback((result: LocationResult) => {
    const newLocation = {
      address: result.place_name,
      coordinates: {
        // Mapbox returns coordinates as [longitude, latitude]
        lat: result.center[1],
        lng: result.center[0]
      }
    };
    
    setSearchLocation(newLocation);
    
    if (newLocation.coordinates) {
      // Use the selected coordinates to update the map and search
      setMapCenter(newLocation.coordinates);
      handlePlaceSelect({
        formatted_address: result.place_name,
        geometry: {
          location: {
            lat: () => newLocation.coordinates!.lat,
            lng: () => newLocation.coordinates!.lng
          }
        }
      });
    }
  }, [handlePlaceSelect]);

  // Favorites state to hydrate heart icons
  const { data: session, status } = useSession();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set<number>());
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchFavorites = async () => {
        try {
          const res = await fetch('/api/favorites');
          const data = await handleApiResponse(res);
          if (data) {
            setFavoriteIds(new Set<number>(data.map((p: any) => p.property_id as number)));
          }
        } catch (err) {
          console.error('Error fetching favorites:', err);
        }
      };
      fetchFavorites();
    }
  }, [status]);

  // Memoize transformed properties for stable prop reference
  const transformedProperties = useMemo(
    () => properties.map(transformPropertyData),
    [properties]
  );

  if (!isClient) {
    return <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1">
        <div className="p-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>;
  }

  if (loading) {
    return <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1">
        <div className="p-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      {/* Search Header */}
      <div className="sticky top-16 z-40 bg-background border-b shadow-sm flex-shrink-0">
        <div className="container mx-auto px-4 py-2">
          {isMobileScreen() ? (
            <>  {/* Mobile view: search + toggle on first row */}
              <div className="flex items-center gap-2 max-w-7xl mx-auto">
                {/* Location Search */}
                <div className="flex-1 relative">
                  <LocationAutocomplete
                    value={searchLocation.address}
                    onChange={(value) => setSearchLocation({ ...searchLocation, address: value })}
                    onLocationSelect={handleLocationSelect}
                    placeholder="Location"
                    height="h-10"
                  />
                </div>
                {/* Toggle filter row */}
                <Button
                  variant="outline"
                  className="h-10 w-10 p-0 xl:p-2 flex-shrink-0"
                  onClick={() => setShowMobileFilters(prev => !prev)}
                >
                  {showMobileFilters ? <ChevronUp className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
                </Button>
              </div>
              {showMobileFilters && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2 max-w-7xl mx-auto">
                  {/* Move in Date */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={`w-[170px] xl:w-[170px] lg:w-[170px] w-[40px] p-0 xl:p-2 
                          ${moveInDate 
                            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground' 
                            : 'hover:border-primary hover:bg-background text-muted-foreground'
                          }
                        `}
                      >
                        <div className="flex items-center justify-center w-full xl:justify-between lg:justify-between">
                          <div className="flex items-center">
                            <CalendarIcon className={`h-4 w-4 xl:mr-2 lg:mr-2 flex-shrink-0 ${moveInDate ? 'text-primary-foreground' : ''}`} />
                            <span className="hidden lg:inline truncate">
                              {moveInDate ? format(moveInDate, 'MMM d, yyyy') : 'Move in Date'}
                            </span>
                          </div>
                          <ChevronDown className={`h-4 w-4 opacity-50 hidden lg:inline-block flex-shrink-0 ${moveInDate ? 'text-primary-foreground' : ''}`} />
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={moveInDate}
                        onSelect={setMoveInDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Price Range */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={`w-[140px] xl:w-[140px] w-[40px] p-0 xl:p-2
                          ${(priceRange[0] > 0 || priceRange[1] < 10000 || sortOrder)
                            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground'
                            : 'hover:border-primary hover:bg-background text-muted-foreground'
                          }
                        `}
                      >
                        <div className="flex items-center justify-center w-full xl:justify-between">
                          <div className="flex items-center">
                            <DollarSign className={`h-4 w-4 xl:mr-2 flex-shrink-0 
                              ${(priceRange[0] > 0 || priceRange[1] < 10000 || sortOrder) ? 'text-primary-foreground' : ''}`} 
                            />
                            <span className="hidden xl:inline truncate">
                              {priceRange[0] === 0 && priceRange[1] === 10000 
                                ? 'Price'
                                : `${formatPriceShort(priceRange[0])} - ${formatPriceShort(priceRange[1])}`
                              }
                            </span>
                          </div>
                          <ChevronDown className={`h-4 w-4 opacity-50 hidden xl:inline-block flex-shrink-0 
                            ${(priceRange[0] > 0 || priceRange[1] < 10000 || sortOrder) ? 'text-primary-foreground' : ''}`} 
                          />
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="">
                      <div className="space-y-4">
                        {/* Price Range Slider */}
                        <div>
                          <div className="flex justify-between mb-4">
                            <div className="font-medium">{formatPrice(tempPriceRange[0])}</div>
                            <div className="font-medium">{formatPrice(tempPriceRange[1])}</div>
                          </div>
                          <Slider.Root
                            defaultValue={[0, 10000]}
                            min={0}
                            max={10000}
                            step={100}
                            value={tempPriceRange}
                            onValueChange={(newValue) => setTempPriceRange(newValue as [number, number])}
                            onValueCommit={handlePriceRangeCommit}
                            className="relative flex items-center select-none touch-none w-full h-5"
                          >
                            <Slider.Track className="bg-secondary relative grow rounded-full h-[3px]">
                              <Slider.Range className="absolute bg-primary rounded-full h-full" />
                            </Slider.Track>
                            <Slider.Thumb
                              className="block w-5 h-5 bg-background border-2 border-primary rounded-full hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                              aria-label="Min price"
                            />
                            <Slider.Thumb
                              className="block w-5 h-5 bg-background border-2 border-primary rounded-full hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                              aria-label="Max price"
                            />
                          </Slider.Root>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-border" />

                        {/* Sort Options */}
                        <div className="space-y-2">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              className={`justify-between ${sortOrder === 'asc' ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground' : 'hover:border-primary hover:bg-background text-muted-foreground'}`}
                              onClick={() => setSortOrder(sortOrder === 'asc' ? null : 'asc')}
                            >
                              Low to High
                            </Button>
                            <Button
                              variant="ghost"
                              className={`justify-between ${sortOrder === 'desc' ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground' : 'hover:border-primary hover:bg-background text-muted-foreground'}`}
                              onClick={() => setSortOrder(sortOrder === 'desc' ? null : 'desc')}
                            >
                              High to Low
                            </Button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Beds */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={`w-[140px] xl:w-[140px] w-[40px] p-0 xl:p-2
                          ${filters.beds 
                            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground'
                            : 'hover:border-primary hover:bg-background text-muted-foreground'
                          }
                        `}
                      >
                        <div className="flex items-center justify-center w-full xl:justify-between">
                          <div className="flex items-center">
                            <Bed className={`h-4 w-4 xl:mr-2 flex-shrink-0 ${filters.beds ? 'text-primary-foreground' : ''}`} />
                            <span className="hidden xl:inline truncate">
                              {filters.beds ? `${filters.beds} ${filters.beds === '1' ? 'Bed' : 'Beds'}` : 'Beds'}
                            </span>
                          </div>
                          <ChevronDown className={`h-4 w-4 opacity-50 hidden xl:inline-block flex-shrink-0 ${filters.beds ? 'text-primary-foreground' : ''}`} />
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="flex flex-col justify-center">
                        {[1, 2, 3, 4, '5+'].map((num) => (
                          <Button
                            key={num}
                            variant="ghost"
                            className="justify-between"
                            onClick={() => {
                              if (filters.beds === String(num)) {
                                setFilters({ ...filters, beds: '' });
                              } else {
                                setFilters({ ...filters, beds: String(num) });
                              }
                            }}
                          >
                            {num} {num === 1 ? 'Bed' : 'Beds'}
                            {filters.beds === String(num) && (
                              <Check className="h-4 w-4 ml-2" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Baths */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={`w-[140px] xl:w-[140px] w-[40px] p-0 xl:p-2
                          ${filters.baths 
                            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground'
                            : 'hover:border-primary hover:bg-background text-muted-foreground'
                          }
                        `}
                      >
                        <div className="flex items-center justify-center w-full xl:justify-between">
                          <div className="flex items-center">
                            <Bath className={`h-4 w-4 xl:mr-2 flex-shrink-0 ${filters.baths ? 'text-primary-foreground' : ''}`} />
                            <span className="hidden xl:inline truncate">
                              {filters.baths ? `${filters.baths} ${filters.baths === '1' ? 'Bath' : 'Baths'}` : 'Baths'}
                            </span>
                          </div>
                          <ChevronDown className={`h-4 w-4 opacity-50 hidden xl:inline-block flex-shrink-0 ${filters.baths ? 'text-primary-foreground' : ''}`} />
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="flex flex-col justify-center">
                        {[1, 2, 3, '4+'].map((num) => (
                          <Button
                            key={num}
                            variant="ghost"
                            className="justify-between"
                            onClick={() => {
                              if (filters.baths === String(num)) {
                                setFilters({ ...filters, baths: '' });
                              } else {
                                setFilters({ ...filters, baths: String(num) });
                              }
                            }}
                          >
                            {num} {num === 1 ? 'Bath' : 'Baths'}
                            {filters.baths === String(num) && (
                              <Check className="h-4 w-4 ml-2" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Amenities */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={`w-[160px] xl:w-[160px] w-[40px] p-0 xl:p-2
                          ${selectedAmenities.length > 0 
                            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground'
                            : 'hover:border-primary hover:bg-background text-muted-foreground'
                          }
                        `}
                      >
                        <div className="flex items-center justify-center w-full xl:justify-between">
                          <div className="flex items-center">
                            <Coffee className={`h-4 w-4 xl:mr-2 flex-shrink-0 ${selectedAmenities.length > 0 ? 'text-primary-foreground' : ''}`} />
                            <span className="hidden xl:inline truncate">
                              {selectedAmenities.length > 0 ? `${selectedAmenities.length} selected` : 'Amenities'}
                            </span>
                          </div>
                          <ChevronDown className={`h-4 w-4 opacity-50 hidden xl:inline-block flex-shrink-0 ${selectedAmenities.length > 0 ? 'text-primary-foreground' : ''}`} />
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] max-h-[400px] overflow-y-auto p-2">
                      <div className="flex flex-col gap-3">
                        {Object.entries(AMENITIES_CONFIG.categories).map(([categoryKey, category]) => (
                          <div key={categoryKey} className="space-y-1.5">
                            <h3 className="font-medium text-sm text-muted-foreground">{category.title}</h3>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(category.items).map(([amenityKey, amenity]) => {
                                const AmenityIcon = amenity.icon;
                                const isSelected = selectedAmenities.includes(amenityKey);
                                return (
                                  <Button
                                    key={amenityKey}
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 py-1 px-2 transition-all duration-200 ${
                                      isSelected 
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' 
                                        : 'hover:bg-secondary'
                                    }`}
                                    onClick={() => {
                                      setSelectedAmenities(prev =>
                                        prev.includes(amenityKey)
                                          ? prev.filter(a => a !== amenityKey)
                                          : [...prev, amenityKey]
                                      );
                                    }}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <AmenityIcon className={`h-3.5 w-3.5 transition-colors duration-200 ${
                                        isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                                      }`} />
                                      <span className="text-xs whitespace-nowrap">{amenity.label}</span>
                                    </div>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Clear filters button in second row */}
                  {hasActiveFilters() && (
                    <Button
                      variant="outline"
                      className="w-[40px] p-0 xl:p-2 flex-shrink-0"
                      onClick={clearAllFilters}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-7xl mx-auto">
              {/* Location Search */}
              <div className="w-[300px] relative basis-full sm:basis-auto">
                <LocationAutocomplete
                  value={searchLocation.address}
                  onChange={(value) => setSearchLocation({ ...searchLocation, address: value })}
                  onLocationSelect={handleLocationSelect}
                  placeholder="Location"
                  height="h-10"
                />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 basis-full sm:basis-auto">
                {/* Move in Date */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-[170px] xl:w-[170px] lg:w-[170px] w-[40px] p-0 xl:p-2 
                        ${moveInDate 
                          ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground' 
                          : 'hover:border-primary hover:bg-background text-muted-foreground'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center w-full xl:justify-between lg:justify-between">
                        <div className="flex items-center">
                          <CalendarIcon className={`h-4 w-4 xl:mr-2 lg:mr-2 flex-shrink-0 ${moveInDate ? 'text-primary-foreground' : ''}`} />
                          <span className="hidden lg:inline truncate">
                            {moveInDate ? format(moveInDate, 'MMM d, yyyy') : 'Move in Date'}
                          </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 opacity-50 hidden lg:inline-block flex-shrink-0 ${moveInDate ? 'text-primary-foreground' : ''}`} />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={moveInDate}
                      onSelect={setMoveInDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Price Range */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-[140px] xl:w-[140px] w-[40px] p-0 xl:p-2
                        ${(priceRange[0] > 0 || priceRange[1] < 10000 || sortOrder)
                          ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground'
                          : 'hover:border-primary hover:bg-background text-muted-foreground'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center w-full xl:justify-between">
                        <div className="flex items-center">
                          <DollarSign className={`h-4 w-4 xl:mr-2 flex-shrink-0 
                            ${(priceRange[0] > 0 || priceRange[1] < 10000 || sortOrder) ? 'text-primary-foreground' : ''}`} 
                          />
                          <span className="hidden xl:inline truncate">
                            {priceRange[0] === 0 && priceRange[1] === 10000 
                              ? 'Price'
                              : `${formatPriceShort(priceRange[0])} - ${formatPriceShort(priceRange[1])}`
                            }
                          </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 opacity-50 hidden xl:inline-block flex-shrink-0 
                          ${(priceRange[0] > 0 || priceRange[1] < 10000 || sortOrder) ? 'text-primary-foreground' : ''}`} 
                        />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="">
                    <div className="space-y-4">
                      {/* Price Range Slider */}
                      <div>
                        <div className="flex justify-between mb-4">
                          <div className="font-medium">{formatPrice(tempPriceRange[0])}</div>
                          <div className="font-medium">{formatPrice(tempPriceRange[1])}</div>
                        </div>
                        <Slider.Root
                          defaultValue={[0, 10000]}
                          min={0}
                          max={10000}
                          step={100}
                          value={tempPriceRange}
                          onValueChange={(newValue) => setTempPriceRange(newValue as [number, number])}
                          onValueCommit={handlePriceRangeCommit}
                          className="relative flex items-center select-none touch-none w-full h-5"
                        >
                          <Slider.Track className="bg-secondary relative grow rounded-full h-[3px]">
                            <Slider.Range className="absolute bg-primary rounded-full h-full" />
                          </Slider.Track>
                          <Slider.Thumb
                            className="block w-5 h-5 bg-background border-2 border-primary rounded-full hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-label="Min price"
                          />
                          <Slider.Thumb
                            className="block w-5 h-5 bg-background border-2 border-primary rounded-full hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-label="Max price"
                          />
                        </Slider.Root>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-border" />

                      {/* Sort Options */}
                      <div className="space-y-2">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            className={`justify-between ${sortOrder === 'asc' ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground' : 'hover:border-primary hover:bg-background text-muted-foreground'}`}
                            onClick={() => setSortOrder(sortOrder === 'asc' ? null : 'asc')}
                          >
                            Low to High
                          </Button>
                          <Button
                            variant="ghost"
                            className={`justify-between ${sortOrder === 'desc' ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground' : 'hover:border-primary hover:bg-background text-muted-foreground'}`}
                            onClick={() => setSortOrder(sortOrder === 'desc' ? null : 'desc')}
                          >
                            High to Low
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Beds */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-[140px] xl:w-[140px] w-[40px] p-0 xl:p-2
                        ${filters.beds 
                          ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground'
                          : 'hover:border-primary hover:bg-background text-muted-foreground'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center w-full xl:justify-between">
                        <div className="flex items-center">
                          <Bed className={`h-4 w-4 xl:mr-2 flex-shrink-0 ${filters.beds ? 'text-primary-foreground' : ''}`} />
                          <span className="hidden xl:inline truncate">
                            {filters.beds ? `${filters.beds} ${filters.beds === '1' ? 'Bed' : 'Beds'}` : 'Beds'}
                          </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 opacity-50 hidden xl:inline-block flex-shrink-0 ${filters.beds ? 'text-primary-foreground' : ''}`} />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="flex flex-col justify-center">
                      {[1, 2, 3, 4, '5+'].map((num) => (
                        <Button
                          key={num}
                          variant="ghost"
                          className="justify-between"
                          onClick={() => {
                            if (filters.beds === String(num)) {
                              setFilters({ ...filters, beds: '' });
                            } else {
                              setFilters({ ...filters, beds: String(num) });
                            }
                          }}
                        >
                          {num} {num === 1 ? 'Bed' : 'Beds'}
                          {filters.beds === String(num) && (
                            <Check className="h-4 w-4 ml-2" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Baths */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-[140px] xl:w-[140px] w-[40px] p-0 xl:p-2
                        ${filters.baths 
                          ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground'
                          : 'hover:border-primary hover:bg-background text-muted-foreground'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center w-full xl:justify-between">
                        <div className="flex items-center">
                          <Bath className={`h-4 w-4 xl:mr-2 flex-shrink-0 ${filters.baths ? 'text-primary-foreground' : ''}`} />
                          <span className="hidden xl:inline truncate">
                            {filters.baths ? `${filters.baths} ${filters.baths === '1' ? 'Bath' : 'Baths'}` : 'Baths'}
                          </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 opacity-50 hidden xl:inline-block flex-shrink-0 ${filters.baths ? 'text-primary-foreground' : ''}`} />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="flex flex-col justify-center">
                      {[1, 2, 3, '4+'].map((num) => (
                        <Button
                          key={num}
                          variant="ghost"
                          className="justify-between"
                          onClick={() => {
                            if (filters.baths === String(num)) {
                              setFilters({ ...filters, baths: '' });
                            } else {
                              setFilters({ ...filters, baths: String(num) });
                            }
                          }}
                        >
                          {num} {num === 1 ? 'Bath' : 'Baths'}
                          {filters.baths === String(num) && (
                            <Check className="h-4 w-4 ml-2" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Amenities */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-[160px] xl:w-[160px] w-[40px] p-0 xl:p-2
                        ${selectedAmenities.length > 0 
                          ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground [&>*]:hover:text-primary-foreground'
                          : 'hover:border-primary hover:bg-background text-muted-foreground'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center w-full xl:justify-between">
                        <div className="flex items-center">
                          <Coffee className={`h-4 w-4 xl:mr-2 flex-shrink-0 ${selectedAmenities.length > 0 ? 'text-primary-foreground' : ''}`} />
                          <span className="hidden xl:inline truncate">
                            {selectedAmenities.length > 0 ? `${selectedAmenities.length} selected` : 'Amenities'}
                          </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 opacity-50 hidden xl:inline-block flex-shrink-0 ${selectedAmenities.length > 0 ? 'text-primary-foreground' : ''}`} />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] max-h-[400px] overflow-y-auto p-2">
                    <div className="flex flex-col gap-3">
                      {Object.entries(AMENITIES_CONFIG.categories).map(([categoryKey, category]) => (
                        <div key={categoryKey} className="space-y-1.5">
                          <h3 className="font-medium text-sm text-muted-foreground">{category.title}</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(category.items).map(([amenityKey, amenity]) => {
                              const AmenityIcon = amenity.icon;
                              const isSelected = selectedAmenities.includes(amenityKey);
                              return (
                                <Button
                                  key={amenityKey}
                                  variant="ghost"
                                  size="sm"
                                  className={`h-7 py-1 px-2 transition-all duration-200 ${
                                    isSelected 
                                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' 
                                      : 'hover:bg-secondary'
                                  }`}
                                  onClick={() => {
                                    setSelectedAmenities(prev =>
                                      prev.includes(amenityKey)
                                        ? prev.filter(a => a !== amenityKey)
                                        : [...prev, amenityKey]
                                    );
                                  }}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <AmenityIcon className={`h-3.5 w-3.5 transition-colors duration-200 ${
                                      isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                                    }`} />
                                    <span className="text-xs whitespace-nowrap">{amenity.label}</span>
                                  </div>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Clear filters button for desktop */}
                {hasActiveFilters() && (
                  <Button
                    variant="outline"
                    className="w-[40px] p-0 xl:p-2 flex-shrink-0"
                    onClick={clearAllFilters}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Desktop View - Original Implementation */}
        <div className="h-full w-full">
          {/* Map Container - Always Visible */}
          <div className="absolute inset-0">
            <MapboxMap
              center={mapCenter || { lat: 43.6532, lng: -79.3832 }}
              zoom={mapZoom}
              properties={transformedProperties}
              isListVisible={isListVisible}
              favoriteIds={favoriteIds}
              selectedPropertyId={selectedPropertyId}
              onPropertySelect={(id) => setSelectedPropertyId(id)}
              onFavoriteToggle={(id, liked) => {
                setFavoriteIds(prev => {
                  const newSet = new Set(prev);
                  if (liked) newSet.add(id);
                  else newSet.delete(id);
                  return newSet;
                });
              }}
              onMove={(center, zoom, bounds) => {
                // Always update map center to keep URL in sync
                updateMapCenter(center);
                
                if (Math.abs(zoom - mapZoom) > 0.1) {
                  setMapZoom(zoom);
                }
              }}
              onMapInitialized={() => setMapInitialized(true)}
              onZoomChange={handleZoomChange}
            />
            {showZoomWarning && (
              <ZoomWarning onDismiss={() => setShowZoomWarning(false)} />
            )}
          </div>

          {/* Property List Drawer - Original Desktop Implementation */}
          <div className={`
            absolute top-0 left-0 h-full
            ${isListVisible ? 'lg:w-2/5 w-full translate-x-0' : 'lg:w-2/5 w-full -translate-x-full'}
            transition-transform duration-300 ease-in-out
            bg-background
            lg:border-r border-border
            flex flex-col
            z-[5]
            lg:block hidden
          `}>
            {/* Toggle Button - Original Position */}
            <Button 
              variant="outline"
              onClick={() => setIsListVisible(!isListVisible)}
              className={`
                absolute top-2 -right-32
                z-[10] bg-background shadow-md hover:shadow-lg
                transition-transform duration-300 ease-in-out
                ${!isListVisible ? 'translate-x-1' : ''}
              `}
            >
              {isListVisible ? (
                <>
                  <ChevronLeft className="z-10 h-4 w-4 mr-2" />
                  Hide List
                </>
              ) : (
                <>
                  <ChevronRight className="z-10 h-4 w-4 mr-2" />
                  Show List
                </>
              )}
            </Button>

            <div className="flex-1 overflow-y-auto h-full">
              <div className="p-3">
                {loading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-6 bg-secondary rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : properties.length > 0 ? (
                  <div className="grid gap-4" style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
                    maxWidth: '100%',
                  }}>
                    {properties.map((property: Property) => (
                      <div key={property.property_id} style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>
                        <PropertyCard
                          property={transformPropertyData(property)}
                          initialIsLiked={favoriteIds.has(transformPropertyData(property).propertyId)}
                          onFavoriteToggle={(id, liked) => {
                            setFavoriteIds(prev => {
                              const newSet = new Set(prev);
                              if (liked) newSet.add(id);
                              else newSet.delete(id);
                              return newSet;
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile Property List Drawer - Apple Maps Style */}
          <div 
            className={`
              lg:hidden fixed left-0 right-0 bottom-0
              transition-all duration-300 ease-in-out
              bg-background
              border-t border-border rounded-t-xl shadow-lg
              flex flex-col
              z-[50] overflow-hidden
              ${mobileDrawerState === 'expanded' ? 'h-[50%]' : mobileDrawerState === 'peek' ? 'h-[60px]' : 'h-[40px]'}
            `}
            onClick={mobileDrawerState === 'peek' ? () => setMobileDrawerState('expanded') : undefined}
          >
            {/* Mobile Drawer Handle with better visual cue */}
            <div 
              className={`py-2 cursor-pointer flex flex-col items-center ${mobileDrawerState === 'peek' ? 'pb-0' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMobileDrawer();
              }}
            >
              <div className="w-20 h-2 bg-foreground rounded-full mx-auto"></div>
            </div>
            
            {/* Property Count & Context */}
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {properties.length} {properties.length === 1 ? 'property' : 'properties'}
                </div>
              </div>
            </div>
            
            {/* Full Listing Content - Only visible when expanded */}
            <div className={`flex-1 overflow-y-auto ${mobileDrawerState !== 'expanded' ? 'hidden' : ''}`}>
              <div className="p-4 pt-0">
                {loading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-6 bg-secondary rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : properties.length > 0 ? (
                  <div className="grid gap-2 sm:gap-4" style={{
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    maxWidth: '100%',
                  }}>
                    {properties.map((property: Property) => (
                      <div key={property.property_id} className="w-full">
                        <PropertyCard
                          property={transformPropertyData(property)}
                          isMobile={true}
                          initialIsLiked={favoriteIds.has(transformPropertyData(property).propertyId)}
                          onFavoriteToggle={(id, liked) => {
                            setFavoriteIds(prev => {
                              const newSet = new Set(prev);
                              if (liked) newSet.add(id);
                              else newSet.delete(id);
                              return newSet;
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


