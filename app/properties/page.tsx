'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Check, ChevronDown, Search, SlidersHorizontal, PanelLeftClose, PanelLeftOpen, Menu, Globe, MapPin, Calendar as CalendarIcon, DollarSign, Bed, Bath, Coffee, X } from 'lucide-react'
import Link from 'next/link'
import { PropertyCard, transformPropertyData } from '@/components/properties'
import * as Slider from '@radix-ui/react-slider'
import debounce from 'lodash/debounce'
import { Header } from '@/components/header'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapboxMap from '@/components/MapboxMap'

// Constants
const RADIUS_KM = 5
const SIGNIFICANT_MOVE_THRESHOLD = 0.1 // About 100 meters
const DEBOUNCE_TIME = 200

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

// Amenities configuration
const AMENITIES_CONFIG = {
  categories: {
    interior: {
      title: 'Interior',
      items: {
        airConditioning: { label: 'Air Conditioning', icon: Globe },
        dishwasher: { label: 'Dishwasher', icon: Coffee },
        washer: { label: 'Washer', icon: Coffee },
        dryer: { label: 'Dryer', icon: Coffee },
        // Add more amenities as needed
      }
    },
    exterior: {
      title: 'Exterior',
      items: {
        parking: { label: 'Parking', icon: Globe },
        balcony: { label: 'Balcony', icon: Globe },
        // Add more amenities as needed
      }
    }
  }
};

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
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [visibleProperties, setVisibleProperties] = useState<Property[]>([]);
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

  // Optimized debounced filter update
  const debouncedSetFilteredProperties = useCallback(
    debounce((filtered: Property[]) => {
      setFilteredProperties(filtered);
    }, DEBOUNCE_TIME),
    []
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

  const handleBoundsChanged = useCallback(
    debounce(async (propertiesInView: Property[], bounds: mapboxgl.LngLatBounds, zoom: number) => {
      const center = bounds.getCenter();
      if (!center) return;

      if (mapCenter) {
        const currentCenter = new mapboxgl.LngLat(mapCenter.lat, mapCenter.lng);
        const newCenter = new mapboxgl.LngLat(center.lng, center.lat);
        
        if (!isSignificantMove(newCenter, currentCenter)) {
          const filtered = filterProperties(
            propertiesInView,
            filters,
            priceRange,
            selectedAmenities,
            moveInDate
          );
          setVisibleProperties(propertiesInView);
          setFilteredProperties(filtered);
          return;
        }
      }

      setMapCenter({
        lat: center.lat,
        lng: center.lng
      });
      setMapZoom(zoom);
      
      if (searchLocation.coordinates) {
        const originalCenter = new mapboxgl.LngLat(
          searchLocation.coordinates.lat,
          searchLocation.coordinates.lng
        );
        if (isSignificantMove(center, originalCenter)) {
          setSearchLocation({
            address: "",
            coordinates: null
          });
          setSearchKey(prev => prev + 1);
        }
      }

      try {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        const params = new URLSearchParams({
          neLat: ne.lat.toString(),
          neLng: ne.lng.toString(),
          swLat: sw.lat.toString(),
          swLng: sw.lng.toString()
        });

        const response = await fetch(`/api/properties?${params}`);
        const data = await response.json();
        
        const filtered = filterProperties(
          data,
          filters,
          priceRange,
          selectedAmenities,
          moveInDate
        );
        
        setVisibleProperties(data);
        setFilteredProperties(filtered);
        
        setProperties(prevProperties => {
          const newProperties = data.filter(
            (newProp: Property) => !prevProperties.some(
              (existingProp: Property) => existingProp.property_id === newProp.property_id
            )
          );
          return [...prevProperties, ...newProperties];
        });

        if (sortOrder) {
          setFilteredProperties(prev => 
            [...prev].sort((a, b) => {
              if (sortOrder === 'asc') {
                return a.monthly_rent - b.monthly_rent;
              } else {
                return b.monthly_rent - a.monthly_rent;
              }
            })
          );
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    }, DEBOUNCE_TIME),
    [mapCenter, searchLocation, filters, priceRange, selectedAmenities, moveInDate, sortOrder, isSignificantMove]
  );

  const handlePlaceSelect = useCallback(async (place: any) => {
    if (!place.geometry?.location) return;
    
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const viewport = place.geometry.viewport;
    
    setSearchLocation({
      address: place.formatted_address || "",
      coordinates: { lat, lng }
    });
    
    setMapCenter({ lat, lng });
    setSearchKey(prev => prev + 1);

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: RADIUS_KM.toString()
      });

      const response = await fetch(`/api/properties?${params}`);
      const data = await response.json();
      
      setProperties(data);
      setVisibleProperties(data);
      
      let filtered = filterProperties(
        data,
        filters,
        priceRange,
        selectedAmenities,
        moveInDate
      );

      if (sortOrder) {
        filtered = filtered.sort((a, b) => {
          if (sortOrder === 'asc') {
            return a.monthly_rent - b.monthly_rent;
          } else {
            return b.monthly_rent - a.monthly_rent;
          }
        });
      }

      setFilteredProperties(filtered);

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
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  }, [filters, priceRange, selectedAmenities, moveInDate, sortOrder]);

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

    setLoading(false);
  }, []);

  // Initial properties fetch
  useEffect(() => {
    if (!mapCenter || loading) return;

    const fetchInitialProperties = async () => {
      try {
        const params = new URLSearchParams({
          lat: mapCenter.lat.toString(),
          lng: mapCenter.lng.toString(),
          radius: RADIUS_KM.toString()
        });
        const response = await fetch(`/api/properties?${params}`);
        const data = await response.json();
        setProperties(data);
        setVisibleProperties(data);
        setFilteredProperties(data);
      } catch (error) {
        console.error('Error fetching initial properties:', error);
      }
    };

    fetchInitialProperties();
  }, [mapCenter, loading]);

  // Update filtered properties when filters change
  useEffect(() => {
    if (visibleProperties.length === 0) return;

    let filtered = filterProperties(
      visibleProperties,
      filters,
      priceRange,
      selectedAmenities,
      moveInDate
    );

    if (sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.monthly_rent - b.monthly_rent;
        } else {
          return b.monthly_rent - a.monthly_rent;
        }
      });
    }

    setFilteredProperties(filtered);
  }, [filters, priceRange, moveInDate, selectedAmenities, sortOrder, visibleProperties]);

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
      <div className="z-40 bg-background border-b shadow-sm flex-shrink-0">
        <div className="container mx-auto px-4 py-2">
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-6xl mx-auto">
            {/* Location Search */}
            <div className="w-[250px] relative">
              <MapPin className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Location"
                className="pl-9 h-10 hover:border-primary transition-colors"
                value={searchLocation.address}
                onChange={(e) => setSearchLocation({ ...searchLocation, address: e.target.value })}
              />
            </div>
            
            {/* Move in Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={`w-[170px] xl:w-[170px] lg:w-[170px] w-[40px] p-0 xl:p-2 lg:p-2 
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
              <PopoverContent className="">
                <div className="flex flex-col gap-4 p-2">
                  {Object.entries(AMENITIES_CONFIG.categories).map(([categoryKey, category]) => (
                    <div key={categoryKey} className="space-y-2">
                      <h3 className="font-medium text-sm text-muted-foreground">{category.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(category.items).map(([amenityKey, amenity]) => {
                          const AmenityIcon = amenity.icon;
                          const isSelected = selectedAmenities.includes(amenityKey);
                          return (
                            <Button
                              key={amenityKey}
                              variant="ghost"
                              className={`h-auto py-2 px-3 transition-all duration-200 ${
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
                              <div className="flex items-center gap-2">
                                <AmenityIcon className={`h-4 w-4 transition-colors duration-200 ${
                                  isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                                }`} />
                                <span className="text-sm whitespace-nowrap">{amenity.label}</span>
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

            {hasActiveFilters() && (
              <Button
                variant="outline"
                className="h-[36px] w-[36px] justify-center transition-all duration-200 hover:border-primary hover:bg-background bg-background"
                onClick={clearAllFilters}
              >
                <span className="text-lg text-muted-foreground">×</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map (always full width) */}
        <div className="absolute inset-0">
          <MapboxMap
            center={mapCenter || { lat: 43.6532, lng: -79.3832 }}
            zoom={mapZoom}
            properties={filteredProperties.map(transformPropertyData)}
            onMove={(center, zoom) => {
              setMapCenter(center);
              setMapZoom(zoom);
            }}
            isListVisible={isListVisible}
          />
        </div>

        {/* Property List Drawer */}
        <div className={`
          absolute top-0 left-0 h-full
          ${isListVisible ? 'lg:w-2/5 w-full translate-x-0' : 'lg:w-2/5 w-full -translate-x-full'}
          transition-transform duration-300 ease-in-out
          bg-background
          lg:border-r border-border
          flex flex-col
          z-[5]
        `}>
          {/* Toggle Button */}
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
                <PanelLeftClose className="z-10 h-4 w-4 mr-2" />
                Hide List
              </>
            ) : (
              <>
                <PanelLeftOpen className="z-10 h-4 w-4 mr-2" />
                Show List
              </>
            )}
          </Button>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-6 bg-secondary rounded animate-pulse"></div>
                  ))}
                </div>
              ) : filteredProperties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProperties.map((property) => (
                    <PropertyCard key={property.property_id} property={transformPropertyData(property)} />
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
  );
}
