'use client'

import React, { useEffect, useState, memo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Bed, Bath, CalendarDays, Square, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency, parseDbJson } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Property as PropertyType } from '@/lib/types'

// Define the property type with camelCase for the component
interface PropertyProps {
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
function transformPropertyData(property: PropertyType): PropertyProps {
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

export const PropertyCard = memo(({ property }: PropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayImage, setDisplayImage] = useState<string | null>(null)
  const [nextDisplayImage, setNextDisplayImage] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
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
      setDisplayImage(property.images[0])
      setImageError(false)
    }
  }, [property.images])

  // For debugging
  useEffect(() => {
    console.log('Property images:', property.images);
    console.log('Display image:', displayImage);
  }, [property.images, displayImage]);

  // Memoize image handlers
  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!property.images || property.images.length === 0 || isTransitioning) return;
    setIsTransitioning(true);
    const nextIndex = currentImageIndex === property.images.length - 1 ? 0 : currentImageIndex + 1;
    setNextDisplayImage(property.images[nextIndex]);
    setCurrentImageIndex(nextIndex);
    setTimeout(() => {
      setDisplayImage(property.images![nextIndex]);
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
    setNextDisplayImage(property.images[prevIndex]);
    setCurrentImageIndex(prevIndex);
    setTimeout(() => {
      setDisplayImage(property.images![prevIndex]);
      setNextDisplayImage(null);
      setIsTransitioning(false);
    }, 300);
  }, [currentImageIndex, isTransitioning, property.images]);
  
  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    // Future functionality will go here
  }, [isLiked]);

  const handleImageError = useCallback(() => {
    console.error('Image failed to load:', displayImage);
    setImageError(true)
  }, [displayImage])

  return (
    <Link href={`/properties/${property.propertyId}`}>
      <Card className="hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden group h-full">
        <div className="relative">
          <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
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
                  <p className="text-gray-400 font-medium">{property.title}</p>
                  <p className="text-sm text-gray-400">
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
              className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white shadow-md rounded-full h-8 w-8 transition-transform hover:scale-110 hover:shadow-lg"
              onClick={handleLikeClick}
            >
              <Heart 
                className={`h-4 w-4 transition-colors ${
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white h-8 w-8 hover:scale-110 transition-all hover:shadow-md"
                  onClick={handlePreviousImage}
                >
                  <ChevronLeft className="h-4 w-4 group-hover:text-primary transition-colors" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white h-8 w-8 hover:scale-110 transition-all hover:shadow-md"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-4 w-4 group-hover:text-primary transition-colors" />
                </Button>
                
                {/* Mini image counter */}
                <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                  {currentImageIndex + 1} / {property.images.length}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4">
          {/* Price at the top of content */}
          <div className="flex justify-between items-center mb-2">
            <p className="text-xl font-bold text-primary">
              {formatCurrency(property.monthlyRent)}
              <span className="text-sm font-normal text-gray-500">/month</span>
            </p>
            <div className="flex items-center text-sm text-primary">
              <CalendarDays className="h-4 w-4 mr-1" />
              <span>Available {availableDate}</span>
            </div>
          </div>

          <h3 className="font-bold text-lg mb-1 truncate">{property.title}</h3>
          <div className="flex items-center text-gray-500 mb-3">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <p className="text-sm truncate">{property.address}</p>
          </div>
          
          <div className="flex gap-4 text-sm border-t border-gray-100 pt-3">
            <div className="flex items-center text-gray-600">
              <Bed className="h-4 w-4 mr-1" />
              <span>{bedroomText}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Bath className="h-4 w-4 mr-1" />
              <span>{property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}</span>
            </div>
            {property.squareFootage && (
              <div className="flex items-center text-gray-600">
                <Square className="h-4 w-4 mr-1" />
                <span>{property.squareFootage} ft²</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
});

PropertyCard.displayName = 'PropertyCard';

export default function Properties() {
  const [properties, setProperties] = useState<PropertyProps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/properties')
        
        if (!response.ok) {
          throw new Error('Failed to fetch properties')
        }
        
        const data = await response.json()
        console.log('API response data:', data);
        
        // Transform the API data to the component format
        const transformedData = data.map(transformPropertyData)
        console.log('Transformed data:', transformedData);
        
        setProperties(transformedData)
      } catch (err) {
        console.error('Error fetching properties:', err)
        setError('Error loading properties')
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {properties.map((property) => (
        <PropertyCard key={property.propertyId} property={property} />
      ))}
    </div>
  )
} 