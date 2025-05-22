"use client"
import React, { useEffect, useState, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Bed, Bath, Maximize, Building2, Calendar, Mail, Phone,
  Car, Wifi, Tv, Waves, Trees, Lock, 
  UtensilsCrossed, Shirt, Fan, Dumbbell,
  ArrowLeft, Snowflake, Flame, Warehouse,
  Sofa, DoorClosed, Footprints, 
  Trash2, Lightbulb, Wind, Camera, Dog,
  Utensils, Baby, Gamepad2, Coffee,
  ShowerHead, Blinds, Armchair,
  ChevronLeft, ChevronRight,
  Share, Heart, MapPin, DollarSign, Clock, X
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { AMENITIES_CONFIG } from '@/lib/amenities'
import PropertyDetailsSkeleton from '@/components/PropertyDetailsSkeleton'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import MapboxMap from '@/components/MapboxMap'
import 'mapbox-gl/dist/mapbox-gl.css'
import { transformPropertyData } from '@/components/properties'

const styles = {
  hoverButton: "transition-all duration-300 hover:scale-105 active:scale-95",
  hoverAmenity: "transition-all duration-200 hover:bg-primary/5 rounded-lg cursor-default",
  imageHover: "transition-all duration-500 hover:opacity-90 cursor-pointer",
  fadeTransition: "transition-opacity duration-300 ease-in-out",
}

const AMENITY_GROUPS = {
  essentials: {
    title: "Essentials",
    items: ["wifi", "kitchen", "washer", "dryer", "ac", "heating", "tv"]
  },
  features: {
    title: "Features",
    items: ["workspace", "free_parking", "indoor_fireplace"]
  },
  recreation: {
    title: "Recreation",
    items: ["bbq", "pool", "gym", "waterfront"]
  },
  safety: {
    title: "Safety",
    items: ["smoke_alarm", "carbon_monoxide_alarm"]
  },
  bedroom: {
    title: "Bedroom & Laundry",
    items: ["king_bed"]
  }
};

function hasAmenity(propertyAmenities: any, amenityKey: string) {
  return propertyAmenities && (
    propertyAmenities[amenityKey] === true || 
    propertyAmenities[amenityKey] === 1 ||
    propertyAmenities[amenityKey] === "yes"
  )
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
  amenities: {
    wifi?: number | boolean;
    kitchen?: number | boolean;
    washer?: number | boolean;
    dryer?: number | boolean;
    ac?: number | boolean;
    heating?: number | boolean;
    iron?: number | boolean;
    hair_dryer?: number | boolean;
    tv?: number | boolean;
    workspace?: number | boolean;
    hot_tub?: number | boolean;
    pool?: number | boolean;
    bbq?: number | boolean;
    breakfast?: number | boolean;
    indoor_fireplace?: number | boolean;
    free_parking?: number | boolean;
    ev_charger?: number | boolean;
    smoking_allowed?: number | boolean;
    crib?: number | boolean;
    king_bed?: number | boolean;
    gym?: number | boolean;
    ski_in_out?: number | boolean;
    waterfront?: number | boolean;
    smoke_alarm?: number | boolean;
    carbon_monoxide_alarm?: number | boolean;
    [key: string]: number | boolean | undefined;
  } | null;
  available_from: string;
  created_at?: string;
  images: string[] | null;
}

interface PageProps {
  params: Promise<{ id: string }>
}

// Helper function to convert amenities object to array
function convertAmenitiesObjectToArray(amenities: Property['amenities']): string[] | null {
  if (!amenities) return null;
  return Object.entries(amenities)
    .filter(([_, value]) => Boolean(value))
    .map(([key]) => key);
}

export default function PropertyPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [displayImage, setDisplayImage] = useState<string | null>(null)
  const [isFullscreenGallery, setIsFullscreenGallery] = useState(false)
  const [liked, setLiked] = useState(false)
  
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(
          `/api/properties?id=${resolvedParams.id}`,
          { next: { revalidate: 60 } }
        )
        if (!response.ok) {
          throw new Error('Failed to fetch property')
        }
        const data = await response.json()
        
        if (!data) {
          setError('Property not found')
          return
        }

        // Parse images and amenities
        let parsedAmenities = data.amenities;
        try {
          if (typeof data.amenities === 'string') {
            parsedAmenities = JSON.parse(data.amenities);
            console.log('Parsed amenities:', parsedAmenities);
          }
        } catch (e) {
          console.error('Error parsing amenities:', e);
          parsedAmenities = null;
        }

        const processedData = {
          ...data,
          images: Array.isArray(data.images) ? data.images : 
                 typeof data.images === 'string' ? JSON.parse(data.images) : 
                 null,
          amenities: parsedAmenities
        };
        
        console.log('Processed property data:', processedData);
        
        setProperty(processedData)
        // Set initial display image
        if (processedData.images && processedData.images.length > 0) {
          setDisplayImage(processedData.images[0])
          setCurrentImageIndex(0)
        }
      } catch (err) {
        console.error('Error fetching property:', err)
        setError('Error loading property')
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [resolvedParams.id])


  const nextImage = () => {
    if (!property?.images?.length) return
    const nextIndex = currentImageIndex === (property.images?.length ?? 0) - 1 ? 0 : currentImageIndex + 1
    setDisplayImage(property.images[nextIndex])
    setCurrentImageIndex(nextIndex)
  }

  const previousImageClick = () => {
    if (!property?.images?.length) return
    const prevIndex = currentImageIndex === 0 ? (property.images.length - 1) : currentImageIndex - 1
    setDisplayImage(property.images[prevIndex])
    setCurrentImageIndex(prevIndex)
  }

  const toggleFullscreenGallery = () => {
    setIsFullscreenGallery(!isFullscreenGallery)
  }

  const toggleLike = () => {
    setLiked(!liked)
  }

  if (loading) return <PropertyDetailsSkeleton />
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-red-50 p-6 rounded-lg max-w-md">
        <h2 className="text-2xl font-semibold text-red-700 mb-2">Something went wrong</h2>
        <p className="text-red-600">{error}</p>
        <Button className="mt-4" onClick={() => router.push('/properties')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to properties
        </Button>
      </div>
    </div>
  )
  if (!property) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-amber-50 p-6 rounded-lg max-w-md">
        <h2 className="text-2xl font-semibold text-amber-700 mb-2">Property not found</h2>
        <p className="text-amber-600">The property you're looking for doesn't exist or has been removed.</p>
        <Button className="mt-4" onClick={() => router.push('/properties')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to properties
        </Button>
      </div>
    </div>
  )

  return (
    <div className="h-fullflex flex-col">
      <Header />

      {/* Fullscreen Gallery Modal */}
      {isFullscreenGallery && property.images && Array.isArray(property.images) && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
          <div className="relative w-full max-w-5xl bg-card rounded-xl border shadow-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/40">
              <h3 className="text-lg font-semibold text-foreground">Photo Gallery</h3>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground font-medium">
                  {currentImageIndex + 1} of {property.images.length}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-background"
                  onClick={toggleFullscreenGallery}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Main Image */}
            <div className="relative flex-1 flex items-center justify-center bg-muted/40 overflow-hidden">
              <img 
                src={displayImage || ''} 
                alt="Property"
                className="max-h-[calc(90vh-160px)] max-w-full object-contain"
              />
              
              {/* Navigation */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg hover:bg-background"
                onClick={previousImageClick}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg hover:bg-background"
                onClick={nextImage}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Thumbnail Strip */}
            <div className="border-t bg-muted/40 p-4">
              <div className="flex gap-2 overflow-x-auto max-w-full scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent px-2 py-1">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDisplayImage(property.images![index]);
                      setCurrentImageIndex(index);
                    }}
                    className={`
                      relative flex-shrink-0 
                      h-16 w-16
                      rounded-lg overflow-hidden
                      transition-all duration-200
                      focus:outline-none
                      ${currentImageIndex === index 
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                        : 'opacity-70 hover:opacity-100'
                      }
                      hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background
                    `}
                  >
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${image})`,
                      }}
                    />
                    {currentImageIndex === index && (
                      <div className="absolute inset-0 bg-primary/10" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <MapPin className="h-4 w-4" /> 
              <span>{property.address.split(',')[0]}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{property.title}</h1>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              size="sm" 
              className={`flex items-center gap-1 transition-colors
                ${liked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'}`}
              onClick={toggleLike}
            >
              <Heart className={`h-4 w-4 transition-all duration-300 ${liked ? 'fill-red-500 drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]' : ''}`} />
              {liked ? 'Saved' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Share className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-8 space-y-6">
            {/* Property Images */}
            <div className="relative overflow-hidden rounded-2xl shadow-md bg-secondary">
              <div className="aspect-[4/3] md:aspect-[16/9] relative">
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${displayImage})` }}
                  onClick={toggleFullscreenGallery}
                />
              </div>
              
              {property.images && Array.isArray(property.images) && property.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background shadow-md"
                    onClick={previousImageClick}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background shadow-md"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <div className="absolute bottom-4 right-4 bg-background/80 text-foreground px-3 py-1 rounded-full text-xs font-medium">
                    {currentImageIndex + 1} / {property.images.length}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnail gallery */}
            {property.images && Array.isArray(property.images) && property.images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-4 pt-1 px-2 -mx-2 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDisplayImage(property.images![index]);
                      setCurrentImageIndex(index);
                    }}
                    className={`
                      relative flex-shrink-0 
                      h-20 w-20
                      rounded-lg overflow-hidden
                      transition-all duration-200
                      focus:outline-none
                      ${currentImageIndex === index 
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                        : 'opacity-60 hover:opacity-100'
                      }
                    `}
                  >
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${image})`,
                      }}
                    />
                    {currentImageIndex === index && (
                      <div className="absolute inset-0 bg-primary/10" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Mobile Price Card - shown only on mobile */}
            <div className="block lg:hidden">
              <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    ${property.monthly_rent?.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground mt-4 mb-6">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    Available from {property.available_from && !isNaN(new Date(property.available_from).getTime())
                      ? format(new Date(property.available_from), 'MMMM d, yyyy')
                      : 'Soon'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Request Tour
                  </Button>
                  <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5">
                    Contact Landlord
                  </Button>
                </div>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Contact</h3>
                  <div className="space-y-4">
                    <a 
                      href="mailto:agent@example.com" 
                      className="flex items-center gap-3 text-primary hover:underline hover:opacity-80 transition-opacity"
                    >
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      agent@example.com
                    </a>
                    <a 
                      href="tel:+1234567890" 
                      className="flex items-center gap-3 text-primary hover:underline hover:opacity-80 transition-opacity"
                    >
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      (123) 456-7890
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Property Features */}
            <div className="bg-card rounded-xl shadow-sm p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border border-border">
              <div className="flex flex-col items-center md:items-start">
                <div className="flex items-center gap-2 mb-1">
                  <Bed className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">{property.bedrooms}</span>
                </div>
                <p className="text-sm text-muted-foreground">Bedrooms</p>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <div className="flex items-center gap-2 mb-1">
                  <Bath className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">{property.bathrooms}</span>
                </div>
                <p className="text-sm text-muted-foreground">Bathrooms</p>
              </div>
              {property.square_footage && (
                <div className="flex flex-col items-center md:items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <Maximize className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">{property.square_footage}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Sq. Ft.</p>
                </div>
              )}
              <div className="flex flex-col items-center md:items-start">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">
                    {property.available_from && !isNaN(new Date(property.available_from).getTime())
                      ? format(new Date(property.available_from), 'MMM d')
                      : 'Soon'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Available From</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4 text-foreground">About this property</h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            {property?.amenities && typeof property.amenities === 'object' && (
              <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
                <h2 className="text-xl font-semibold mb-6 text-foreground">Amenities & Features</h2>
                <div className="space-y-6">
                  {Object.entries(AMENITY_GROUPS).map(([groupKey, group]) => {
                    const hasAmenities = group.items.some(item => property.amenities?.[item]);
                    
                    if (!hasAmenities) return null;

                    return (
                      <div key={groupKey} className="space-y-3">
                        <h3 className="text-base font-medium text-foreground">{group.title}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4">
                          {group.items.map(key => {
                            if (!property.amenities?.[key]) return null;

                            let icon = null;
                            let label = '';

                            switch(key) {
                              case 'wifi':
                                icon = <Wifi className="h-4 w-4" />;
                                label = 'WiFi';
                                break;
                              case 'kitchen':
                                icon = <UtensilsCrossed className="h-4 w-4" />;
                                label = 'Kitchen';
                                break;
                              case 'washer':
                                icon = <Shirt className="h-4 w-4" />;
                                label = 'Washer';
                                break;
                              case 'dryer':
                                icon = <Wind className="h-4 w-4" />;
                                label = 'Dryer';
                                break;
                              case 'ac':
                                icon = <Snowflake className="h-4 w-4" />;
                                label = 'AC';
                                break;
                              case 'heating':
                                icon = <Flame className="h-4 w-4" />;
                                label = 'Heating';
                                break;
                              case 'tv':
                                icon = <Tv className="h-4 w-4" />;
                                label = 'TV';
                                break;
                              case 'workspace':
                                icon = <Warehouse className="h-4 w-4" />;
                                label = 'Workspace';
                                break;
                              case 'bbq':
                                icon = <Utensils className="h-4 w-4" />;
                                label = 'BBQ';
                                break;
                              case 'indoor_fireplace':
                                icon = <Flame className="h-4 w-4" />;
                                label = 'Fireplace';
                                break;
                              case 'free_parking':
                                icon = <Car className="h-4 w-4" />;
                                label = 'Parking';
                                break;
                              case 'king_bed':
                                icon = <Bed className="h-4 w-4" />;
                                label = 'King Bed';
                                break;
                              case 'smoke_alarm':
                                icon = <Camera className="h-4 w-4" />;
                                label = 'Smoke Alarm';
                                break;
                              case 'carbon_monoxide_alarm':
                                icon = <Camera className="h-4 w-4" />;
                                label = 'CO Alarm';
                                break;
                              default:
                                return null;
                            }

                            if (!icon || !label) return null;

                            return (
                              <div 
                                key={key} 
                                className={`
                                  ${styles.hoverAmenity}
                                  flex items-center gap-2
                                  py-1 px-2
                                  group
                                `}
                              >
                                <div className="bg-primary/10 p-1.5 rounded-full flex-shrink-0 text-primary transition-transform duration-200 group-hover:scale-110">
                                  {icon}
                                </div>
                                <span className="text-muted-foreground text-sm group-hover:text-primary transition-colors duration-200">
                                  {label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Map placeholder */}
            <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Location</h2>
              <div className="aspect-video bg-secondary rounded-lg overflow-hidden relative">
                <MapboxMap
                  center={{ lat: property.latitude, lng: property.longitude }}
                  zoom={15}
                  properties={[{
                    propertyId: property.property_id,
                    landlordId: property.landlord_id,
                    title: property.title,
                    description: property.description,
                    address: property.address,
                    latitude: property.latitude,
                    longitude: property.longitude,
                    monthlyRent: property.monthly_rent,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    squareFootage: property.square_footage,
                    amenities: convertAmenitiesObjectToArray(property.amenities),
                    availableFrom: property.available_from,
                    createdAt: property.created_at,
                    images: property.images
                  }]}
                />
              </div>
              <p className="mt-4 text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {property.address}
              </p>
            </div>
          </div>

          {/* Sidebar - Desktop Price Card */}
          <div className="hidden lg:block lg:col-span-4 space-y-6">
            <div className="sticky top-24">
              {/* Price Card */}
              <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    ${property.monthly_rent?.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground mt-4 mb-6">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    Available from {property.available_from && !isNaN(new Date(property.available_from).getTime())
                      ? format(new Date(property.available_from), 'MMMM d, yyyy')
                      : 'Soon'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Request Tour
                  </Button>
                  <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5">
                    Contact Landlord
                  </Button>
                </div>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Contact</h3>
                  <div className="space-y-4">
                    <a 
                      href="mailto:agent@example.com" 
                      className="flex items-center gap-3 text-primary hover:underline hover:opacity-80 transition-opacity"
                    >
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      agent@example.com
                    </a>
                    <a 
                      href="tel:+1234567890" 
                      className="flex items-center gap-3 text-primary hover:underline hover:opacity-80 transition-opacity"
                    >
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      (123) 456-7890
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Similar Properties - placeholder */}
        <div className="my-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Similar Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
                <div className="aspect-[4/3] bg-secondary"></div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground">Similar Property {i}</h3>
                  <p className="text-muted-foreground text-sm">Sample location</p>
                  <p className="font-bold mt-2 text-foreground">${(property.monthly_rent * 0.9).toFixed(0)}/month</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  )
} 