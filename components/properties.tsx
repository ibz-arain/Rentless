'use client'

import React, { useEffect, useState, memo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Bed, Bath, CalendarDays, Square, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency, parseDbJson, handleApiResponse } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Property as PropertyType } from '@/lib/types'
import { useSession } from 'next-auth/react'
import { useRef } from 'react'

// Define the property type with camelCase for the component
export interface PropertyProps {
  propertyId: number;
  landlordId: number;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  images: string[] | null;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number | null;
  amenities: string[] | null;
  availableFrom: string;
  createdAt?: string;
}

// Helper function to convert snake_case API data to camelCase for the component
export function transformPropertyData(property: PropertyType): PropertyProps {
  // Ensure images is an array of strings, not a JSON string
  let imageArray: string[] | null = null;
  if (property.images) {
    if (typeof property.images === 'string') {
      try {
        imageArray = JSON.parse(property.images as string);
      } catch (e) {
        console.error('Failed to parse images JSON', e);
        imageArray = null;
      }
    } else if (Array.isArray(property.images)) {
      imageArray = property.images;
    }
  }

  // Do the same for amenities
  let amenitiesArray: string[] | null = null;
  if (property.amenities) {
    if (typeof property.amenities === 'string') {
      try {
        amenitiesArray = JSON.parse(property.amenities as string);
      } catch (e) {
        console.error('Failed to parse amenities JSON', e);
        amenitiesArray = null;
      }
    } else if (Array.isArray(property.amenities)) {
      amenitiesArray = property.amenities;
    }
  }

  return {
    propertyId: property.property_id,
    landlordId: property.landlord_id,
    title: property.title,
    description: property.description,
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    images: imageArray,
    monthlyRent: property.monthly_rent,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFootage: property.square_footage,
    amenities: amenitiesArray,
    availableFrom: property.available_from,
    createdAt: property.created_at
  };
}

interface PropertyCardProps {
  property: PropertyProps;
  isMobile?: boolean;
  isMapPopup?: boolean;
  onFavoriteToggle?: (propertyId: number, liked: boolean) => void;
  initialIsLiked?: boolean;
}

// Helper function to check for valid image URLs
function isValidImageUrl(url: string) {
  return (
    typeof url === 'string' &&
    (url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('/'))
  );
}

// Skeleton loader for properties
const PropertyCardSkeleton = () => {
  return (
    <Card className="overflow-hidden h-full">
      <div className="aspect-[4/3] bg-gray-200 animate-pulse"></div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
        <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-4 bg-gray-100 rounded w-16 animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded w-16 animate-pulse"></div>
        </div>
      </div>
    </Card>
  );
};

export const PropertyCard = memo(({ property, isMobile = false, isMapPopup = false, onFavoriteToggle, initialIsLiked = false }: PropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayImage, setDisplayImage] = useState<string | null>(null)
  const [nextDisplayImage, setNextDisplayImage] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [imageError, setImageError] = useState(false)

  // Format the date to a readable format
  const availableDate = new Date(property.availableFrom).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // Display studio instead of 0 bedrooms
  const bedroomText = property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} ${property.bedrooms === 1 ? 'bed' : 'beds'}`;

  useEffect(() => {
    if (property.images && property.images.length > 0) {
      const validImage = Array.isArray(property.images)
        ? property.images.find(isValidImageUrl) || null
        : isValidImageUrl(property.images) ? property.images : null;
      setDisplayImage(validImage)
      setImageError(false)
    }
  }, [property.images])



  // Memoize image handlers
  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!property.images || property.images.length === 0 || isTransitioning) return;
    setIsTransitioning(true);
    const nextIndex = currentImageIndex === property.images.length - 1 ? 0 : currentImageIndex + 1;
    const nextValidImage = Array.isArray(property.images)
      ? property.images[nextIndex]
      : isValidImageUrl(property.images) ? property.images : null;
    setNextDisplayImage(nextValidImage);
    setCurrentImageIndex(nextIndex);
    setTimeout(() => {
      setDisplayImage(nextValidImage);
      setNextDisplayImage(null);
      setIsTransitioning(false);
    }, 300);
  }, [currentImageIndex, isTransitioning, property.images]);

  const handlePreviousImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!property.images || property.images.length === 0 || isTransitioning) return;
    setIsTransitioning(true);
    const prevIndex = currentImageIndex === 0 ? property.images.length - 1 : currentImageIndex - 1;
    const prevValidImage = Array.isArray(property.images)
      ? property.images[prevIndex]
      : isValidImageUrl(property.images) ? property.images : null;
    setNextDisplayImage(prevValidImage);
    setCurrentImageIndex(prevIndex);
    setTimeout(() => {
      setDisplayImage(prevValidImage);
      setNextDisplayImage(null);
      setIsTransitioning(false);
    }, 300);
  }, [currentImageIndex, isTransitioning, property.images]);
  
  const handleLikeClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isLiked) {
        const response = await fetch(`/api/favorites?property_id=${property.propertyId}`, { method: 'DELETE' });
        await handleApiResponse(response);
        setIsLiked(false);
        onFavoriteToggle?.(property.propertyId, false);
      } else {
        const response = await fetch(`/api/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ property_id: property.propertyId }),
        });
        await handleApiResponse(response);
        setIsLiked(true);
        onFavoriteToggle?.(property.propertyId, true);
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  }, [isLiked, property.propertyId, onFavoriteToggle]);

  useEffect(() => {
    setIsLiked(initialIsLiked)
  }, [initialIsLiked])

  const handleImageError = useCallback(() => {
    console.error('Image failed to load:', displayImage);
    setImageError(true)
  }, [displayImage])

  return (
    <Link href={`/properties/${property.propertyId}`} prefetch={false}>
      <Card className={`overflow-hidden group h-full @container ${isMobile ? 'text-sm' : ''} ${isMapPopup ? 'text-xs' : ''}`}>
        <div className="relative">
          <div className={`aspect-[4/3] bg-gray-200 relative overflow-hidden ${isMobile ? 'aspect-[3/2]' : ''} ${isMapPopup ? 'aspect-[2/1]' : ''}`}>
            {/* Display the actual image if available */}
            {displayImage && !imageError ? (
              <Image 
                src={displayImage}
                alt={property.title}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={handleImageError}
                priority={currentImageIndex === 0}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <p className={`text-gray-400 font-medium ${isMobile ? 'text-sm' : ''} ${isMapPopup ? 'text-xs' : ''}`}>{property.title}</p>
                  <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'} ${isMapPopup ? 'text-[10px]' : ''}`}>
                    {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} BR`} · {property.bathrooms} Bath
                  </p>
                </div>
              </div>
            )}
            
            {/* Show transition image when changing images */}
            {nextDisplayImage && !imageError && (
              <div className="absolute inset-0 transition-opacity opacity-0 animate-fadeIn">
                <Image 
                  src={nextDisplayImage}
                  alt={property.title}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
            
            {/* Heart button for saving/liking properties */}
            <Button
              variant="outline"
              size="icon"
              className={`absolute top-2 right-2 z-10 bg-background/80 hover:bg-background shadow-md rounded-full transition-transform hover:scale-110 hover:shadow-lg ${
                isMapPopup ? 'h-5 w-5' : isMobile ? 'h-6 w-6' : 'h-8 w-8'
              }`}
              onClick={handleLikeClick}
            >
              <Heart 
                className={`transition-colors ${
                  isMapPopup ? 'h-2.5 w-2.5' : isMobile ? 'h-3 w-3' : 'h-4 w-4'
                } ${
                  isLiked 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-500 hover:text-red-400'
                } hover:drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]`} 
              />
            </Button>
            
            {property.images && property.images.length > 1 && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="icon"
                  className={`absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background hover:scale-110 transition-all hover:shadow-md ${
                    isMapPopup ? 'h-5 w-5' : isMobile ? 'h-6 w-6' : 'h-8 w-8'
                  }`}
                  onClick={handlePreviousImage}
                >
                  <ChevronLeft className={`group-hover:text-foreground transition-colors ${
                    isMapPopup ? 'h-2.5 w-2.5' : isMobile ? 'h-3 w-3' : 'h-4 w-4'
                  }`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background hover:scale-110 transition-all hover:shadow-md ${
                    isMapPopup ? 'h-5 w-5' : isMobile ? 'h-6 w-6' : 'h-8 w-8'
                  }`}
                  onClick={handleNextImage}
                >
                  <ChevronRight className={`group-hover:text-foreground transition-colors ${
                    isMapPopup ? 'h-2.5 w-2.5' : isMobile ? 'h-3 w-3' : 'h-4 w-4'
                  }`} />
                </Button>
                
                {/* Mini image counter */}
                <div className={`absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full ${
                  isMapPopup ? 'text-[8px] px-1.5 py-0.5' : isMobile ? 'text-[10px]' : 'text-xs'
                }`}>
                  {currentImageIndex + 1} / {property.images.length}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className={`p-4 ${isMobile ? 'p-2' : ''} ${isMapPopup ? 'p-1.5' : ''}`}>
          {/* Price at the top of content */}
          <div className="flex justify-between items-center mb-2">
            <p className={`font-bold text-foreground ${isMapPopup ? 'text-sm' : isMobile ? 'text-base' : 'text-xl'}`}>
              {formatCurrency(property.monthlyRent)}
              <span className={`font-normal text-gray-500 ${isMapPopup ? 'text-[10px]' : isMobile ? 'text-xs' : 'text-sm'}`}>
                <span className="@[300px]:inline hidden">/month</span>
                <span className="@[300px]:hidden inline">/mo</span>
              </span>
            </p>
            <div className={`flex items-center text-muted-foreground ${isMapPopup ? 'text-[10px]' : isMobile ? 'text-xs' : 'text-sm'}`}>
              <CalendarDays className={`mr-1 ${isMapPopup ? 'h-2.5 w-2.5' : isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              {!isMapPopup && <span className="@[320px]:inline hidden">Available&nbsp;</span>}
               {availableDate}
            </div>
          </div>

          <h3 className={`font-bold mb-1 truncate ${isMapPopup ? 'text-sm' : isMobile ? 'text-base' : 'text-lg'}`}>{property.title}</h3>
          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className={`mr-1 flex-shrink-0 ${isMapPopup ? 'h-2.5 w-2.5' : isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            <p className={`truncate ${isMapPopup ? 'text-[10px]' : isMobile ? 'text-xs' : 'text-sm'}`}>{property.address}</p>
          </div>
          
          <div className={`flex gap-4 text-sm border-t border-gray-100 pt-3 ${isMobile ? 'pt-2 gap-2' : ''} ${isMapPopup ? 'pt-1.5 gap-1.5' : ''}`}>
            <div className="flex items-center text-muted-foreground">
              <Bed className={`mr-1 ${isMapPopup ? 'h-2.5 w-2.5' : isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              <span className={`${isMapPopup ? 'text-[10px]' : isMobile ? 'text-xs' : ''}`}>
                {property.bedrooms === 0 ? 'Studio' : property.bedrooms}
              </span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Bath className={`mr-1 ${isMapPopup ? 'h-2.5 w-2.5' : isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              <span className={`${isMapPopup ? 'text-[10px]' : isMobile ? 'text-xs' : ''}`}>
                {property.bathrooms}
              </span>
            </div>
            {property.squareFootage && (
              <div className="flex items-center text-muted-foreground">
                <Square className={`mr-1 ${isMapPopup ? 'h-2.5 w-2.5' : isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                <span className={`${isMapPopup ? 'text-[10px]' : isMobile ? 'text-xs' : ''}`}>
                  {property.squareFootage}ft²
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
});

PropertyCard.displayName = 'PropertyCard';

interface PropertiesComponentProps {
  /**
   * When true, the component shows a "featured" selection –
   * the first 6 properties (ordered by the earliest property_id)
   * that are currently available (their availableFrom date is in the past).
   */
  featured?: boolean;

  /**
   * Render the cards in a single horizontal row with horizontal scrolling on small screens.
   */
  rowOnly?: boolean;
}

export default function Properties({ featured = false, rowOnly = false }: PropertiesComponentProps) {
  const { data: session, status } = useSession()
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set<number>())
  const [properties, setProperties] = useState<PropertyProps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slidesPerView, setSlidesPerView] = useState(3)
  
  // Calculate number of slides based on screen size
  useEffect(() => {
    const calculateSlidesPerView = () => {
      if (window.innerWidth < 640) return 1
      if (window.innerWidth < 1024) return 2
      if (window.innerWidth < 1280) return 3
      return 4
    }
    
    setSlidesPerView(calculateSlidesPerView())
    
    const handleResize = () => {
      setSlidesPerView(calculateSlidesPerView())
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Total number of slides
  const totalSlides = Math.ceil(properties.length / slidesPerView)
  
  // Handle next/prev
  const goToNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides)
  }
  
  const goToPrevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides)
  }
  
  // Get current visible properties
  const getVisibleProperties = () => {
    const startIdx = currentSlide * slidesPerView
    return properties.slice(startIdx, startIdx + slidesPerView)
  }

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchFavorites = async () => {
        try {
          const res = await fetch('/api/favorites')
          const data = await handleApiResponse(res)
          if (data) {
            const ids = new Set<number>(data.map((p: any) => p.property_id as number))
            setFavoriteIds(ids)
          }
        } catch (err) {
          console.error('Error fetching favorites:', err)
        }
      }
      fetchFavorites()
    }
  }, [status])

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true)
        const url = featured ? '/api/properties?type=featured' : '/api/properties'
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Failed to fetch properties')
        }
        
        const data = await response.json()
        
        // Transform the API data to the component format
        const transformedData = data.map(transformPropertyData)

        setProperties(transformedData)
      } catch (err) {
        console.error('Error fetching properties:', err)
        setError('Error loading properties')
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [featured])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <PropertyCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (error) return <div>{error}</div>

  if (properties.length === 0) {
    return <div className="text-center py-10">No properties found</div>
  }

  return (
    rowOnly ? (
      <div className="relative px-10">
        {/* Slideshow container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
          {getVisibleProperties().map((property) => (
            <PropertyCard
              key={property.propertyId}
              property={property}
              initialIsLiked={favoriteIds.has(property.propertyId)}
              onFavoriteToggle={(id, liked) => {
                setFavoriteIds(prev => {
                  const newSet = new Set(prev)
                  if (liked) newSet.add(id)
                  else newSet.delete(id)
                  return newSet
                })
              }}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        {properties.length > slidesPerView && (
          <>
            <button
              type="button"
              aria-label="Previous"
              onClick={goToPrevSlide}
              className="flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 bg-background shadow-md rounded-full h-10 w-10 hover:bg-primary/10 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={goToNextSlide}
              className="flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 bg-background shadow-md rounded-full h-10 w-10 hover:bg-primary/10 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        
        {/* Pagination dots */}
        {totalSlides > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentSlide === idx ? 'bg-primary' : 'bg-primary/20'
                }`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {properties.map((property) => (
          <PropertyCard
            key={property.propertyId}
            property={property}
            initialIsLiked={favoriteIds.has(property.propertyId)}
            onFavoriteToggle={(id, liked) => {
              setFavoriteIds(prev => {
                const newSet = new Set(prev)
                if (liked) newSet.add(id)
                else newSet.delete(id)
                return newSet
              })
            }}
          />
        ))}
      </div>
    )
  )
} 