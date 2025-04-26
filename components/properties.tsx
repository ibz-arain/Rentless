'use client'

import React, { useEffect, useState, memo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Bed, Bath, CalendarDays, Square, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Define the property type with camelCase to match existing code
interface Property {
  propertyId: number;
  landlordId: number;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  images: string[];
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number;
  amenities: Record<string, number>;
  availableFrom: string;
  createdAt: string;
}

// Mock data based on the database schema, with camelCase property names
const mockProperties: Property[] = [
  {
    propertyId: 1,
    landlordId: 101,
    title: 'Modern Downtown Apartment',
    description: 'Spacious apartment in the heart of downtown with stunning city views. Recently renovated with high-end finishes.',
    address: '123 Main Street, Downtown',
    latitude: 37.7749,
    longitude: -122.4194,
    monthlyRent: 2200,
    bedrooms: 2,
    bathrooms: 1.5,
    squareFootage: 950,
    amenities: {
      'Air Conditioning': 1,
      'In-unit Laundry': 1,
      'Dishwasher': 1,
      'Gym': 1,
      'Parking': 1
    },
    availableFrom: '2024-08-01',
    createdAt: '2024-07-01',
    images: ['/property1-1.jpg', '/property1-2.jpg', '/property1-3.jpg']
  },
  {
    propertyId: 2,
    landlordId: 102,
    title: 'Cozy Studio Near University',
    description: 'Perfect for students, this studio apartment is just a 5-minute walk from campus. Includes all utilities!',
    address: '456 College Ave, University District',
    latitude: 37.7249,
    longitude: -122.4094,
    monthlyRent: 1500,
    bedrooms: 0,
    bathrooms: 1,
    squareFootage: 450,
    amenities: {
      'Furnished': 1,
      'Utilities Included': 1,
      'High-speed Internet': 1,
      'Security System': 1
    },
    availableFrom: '2024-07-15',
    createdAt: '2024-06-15',
    images: ['/property2-1.jpg', '/property2-2.jpg']
  },
  {
    propertyId: 3,
    landlordId: 103,
    title: 'Luxury 3BR Townhouse',
    description: 'Beautiful townhouse with modern amenities in a quiet neighborhood. Features a private backyard and garage.',
    address: '789 Oak Drive, Pleasant Valley',
    latitude: 37.7849,
    longitude: -122.4294,
    monthlyRent: 3500,
    bedrooms: 3,
    bathrooms: 2.5,
    squareFootage: 1800,
    amenities: {
      'Central Heating': 1,
      'Fireplace': 1,
      'Garage': 1,
      'Backyard': 1,
      'Smart Home Features': 1
    },
    availableFrom: '2024-08-15',
    createdAt: '2024-06-20',
    images: ['/property3-1.jpg', '/property3-2.jpg', '/property3-3.jpg', '/property3-4.jpg']
  },
  {
    propertyId: 4,
    landlordId: 104,
    title: 'Renovated 1BR with City View',
    description: 'Recently renovated one-bedroom apartment with stunning views of the skyline. Modern kitchen and bathroom.',
    address: '101 Highland Ave, Midtown',
    latitude: 37.7649,
    longitude: -122.4394,
    monthlyRent: 1950,
    bedrooms: 1,
    bathrooms: 1,
    squareFootage: 700,
    amenities: {
      'Stainless Steel Appliances': 1,
      'Granite Countertops': 1,
      'Hardwood Floors': 1,
      'Large Windows': 1
    },
    availableFrom: '2024-07-01',
    createdAt: '2024-06-10',
    images: ['/property4-1.jpg', '/property4-2.jpg']
  }
];

interface PropertyCardProps {
  property: Property;
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

  // Format the date to a readable format
  const availableDate = new Date(property.availableFrom).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // Display studio instead of 0 bedrooms
  const bedroomText = property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} ${property.bedrooms === 1 ? 'bed' : 'beds'}`;

  useEffect(() => {
    if (property.images?.length > 0) {
      setDisplayImage(property.images[0])
    }
  }, [property.images])

  // Memoize image handlers
  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!property.images?.length || isTransitioning) return;
    setIsTransitioning(true);
    const nextIndex = currentImageIndex === property.images.length - 1 ? 0 : currentImageIndex + 1;
    setNextDisplayImage(property.images[nextIndex]);
    setCurrentImageIndex(nextIndex);
    setTimeout(() => {
      setDisplayImage(property.images[nextIndex]);
      setNextDisplayImage(null);
      setIsTransitioning(false);
    }, 300);
  }, [currentImageIndex, isTransitioning, property.images]);

  const handlePreviousImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!property.images?.length || isTransitioning) return;
    setIsTransitioning(true);
    const prevIndex = currentImageIndex === 0 ? property.images.length - 1 : currentImageIndex - 1;
    setNextDisplayImage(property.images[prevIndex]);
    setCurrentImageIndex(prevIndex);
    setTimeout(() => {
      setDisplayImage(property.images[prevIndex]);
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

  return (
    <Link href={`/properties/${property.propertyId}`}>
      <Card className="hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden group h-full">
        <div className="relative">
          <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
            {/* For demo purposes, instead of trying to load potentially missing images */}
            <div 
              className="absolute inset-0 flex items-center justify-center bg-gray-100"
            >
              <div className="text-center p-4">
                <p className="text-gray-400 font-medium">{property.title}</p>
                <p className="text-sm text-gray-400">
                  {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} BR`} · {property.bathrooms} Bath
                </p>
              </div>
            </div>
            
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
            
            {property.images?.length > 1 && (
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
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API fetch with our mock data
    const fetchProperties = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        setProperties(mockProperties)
      } catch (err) {
        setError('Error loading properties')
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, []) // Empty dependency array means this effect runs once on mount

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {properties.map((property) => (
        <PropertyCard key={property.propertyId} property={property} />
      ))}
    </div>
  )
} 