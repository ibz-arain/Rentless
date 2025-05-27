'use client';

import React from 'react';
import { CheckCircle2, Home, MapPin, Bed, Bath, DollarSign, Ruler, Calendar, Image as ImageIcon, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

interface ReviewStepProps {
  title: string;
  description: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number | undefined;
  amenities: string[];
  availableFrom: Date | undefined;
  images: string[];
}

// Mapping of amenity IDs to display names
const AMENITIES_DISPLAY: Record<string, string> = {
  'parking': 'Parking',
  'aircon': 'Air Conditioning',
  'furnished': 'Furnished',
  'pets': 'Pet Friendly',
  'washer': 'Washer/Dryer',
  'balcony': 'Balcony',
  'gym': 'Gym',
  'pool': 'Pool',
  'security': 'Security System',
  'wifi': 'High-Speed Internet',
  'dishwasher': 'Dishwasher',
  'elevator': 'Elevator',
};

export function ReviewStep({
  title,
  description,
  address,
  coordinates,
  monthlyRent,
  bedrooms,
  bathrooms,
  squareFootage,
  amenities,
  availableFrom,
  images
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium text-primary">
        <CheckCircle2 className="h-5 w-5" />
        <h3>Review Your Property</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Please review all the information below before creating your property listing.
      </p>
      
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-primary/5 px-4 py-3 border-b flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Basic Information</h4>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <h5 className="font-medium">{title}</h5>
              <p className="text-sm text-muted-foreground mt-1">
                {description.length > 200 
                  ? `${description.substring(0, 200)}...`
                  : description}
              </p>
              {description.length > 200 && (
                <button
                  type="button"
                  className="text-xs text-primary mt-1"
                  onClick={() => alert(description)}
                >
                  Show full description
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Location */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-primary/5 px-4 py-3 border-b flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Location</h4>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-sm">{address}</p>
            {coordinates && (
              <p className="text-xs text-muted-foreground">
                Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>
        
        {/* Property Details */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-primary/5 px-4 py-3 border-b flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Property Details</h4>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatCurrency(monthlyRent)}/month</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <span>
                  {bedrooms === 0 ? 'Studio' : `${bedrooms} bed${bedrooms !== 1 ? 's' : ''}`}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <span>{bathrooms} bath{bathrooms !== 1 ? 's' : ''}</span>
              </div>
              
              {squareFootage && (
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span>{squareFootage} sqft</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Available from: {availableFrom 
                    ? availableFrom.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Not specified'}
                </span>
              </div>
            </div>
            
            {amenities.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Amenities:</h5>
                <div className="flex flex-wrap gap-2">
                  {amenities.map(amenity => (
                    <span
                      key={amenity}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                    >
                      {AMENITIES_DISPLAY[amenity] || amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Photos */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-primary/5 px-4 py-3 border-b flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Photos ({images.length})</h4>
          </div>
          <div className="p-4">
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground">No photos added</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((url, index) => (
                  <div key={index} className="aspect-[4/3] relative bg-muted rounded-md overflow-hidden">
                    <Image
                      src={url}
                      alt={`Property image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 