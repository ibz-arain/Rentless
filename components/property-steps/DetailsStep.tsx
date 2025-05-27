'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Bed, Bath, DollarSign, Ruler, Info, CheckSquare, Coffee, Globe, Wifi, Car, Key, Tv, Utensils, Trees } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DetailsStepProps {
  monthlyRent: number;
  setMonthlyRent: (value: number) => void;
  bedrooms: number;
  setBedrooms: (value: number) => void;
  bathrooms: number;
  setBathrooms: (value: number) => void;
  squareFootage: number | undefined;
  setSquareFootage: (value: number | undefined) => void;
  amenities: string[];
  setAmenities: (value: string[]) => void;
  errors: {
    monthlyRent?: string;
    bedrooms?: string;
    bathrooms?: string;
  };
}

// Amenities configuration with categories and icons
const AMENITIES_CONFIG = {
  categories: {
    basic: {
      title: 'Basic Features',
      items: {
        parking: { label: 'Parking', icon: Car },
        aircon: { label: 'Air Conditioning', icon: Globe },
        furnished: { label: 'Furnished', icon: Tv },
        pets: { label: 'Pet Friendly', icon: Trees },
      }
    },
    kitchen: {
      title: 'Kitchen & Laundry',
      items: {
        washer: { label: 'Washer', icon: Tv },
        dryer: { label: 'Dryer', icon: Tv },
        dishwasher: { label: 'Dishwasher', icon: Utensils },
      }
    },
    outdoors: {
      title: 'Outdoor & Building',
      items: {
        balcony: { label: 'Balcony', icon: Trees },
        elevator: { label: 'Elevator', icon: Key },
        security: { label: 'Security', icon: Key },
      }
    },
    amenities: {
      title: 'Additional Amenities',
      items: {
        wifi: { label: 'High-Speed Internet', icon: Wifi },
        gym: { label: 'Gym', icon: Coffee },
        pool: { label: 'Pool', icon: Coffee },
      }
    }
  }
};

export function DetailsStep({
  monthlyRent,
  setMonthlyRent,
  bedrooms,
  setBedrooms,
  bathrooms,
  setBathrooms,
  squareFootage,
  setSquareFootage,
  amenities,
  setAmenities,
  errors
}: DetailsStepProps) {
  // Handle amenity toggle
  const toggleAmenity = (amenityId: string) => {
    setAmenities(
      amenities.includes(amenityId)
        ? amenities.filter(id => id !== amenityId)
        : [...amenities, amenityId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium text-primary">
        <Info className="h-5 w-5" />
        <h3>Property Details</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Provide specific details about your property to help renters understand what you're offering.
      </p>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="monthly_rent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Monthly Rent (USD) <span className="text-destructive">*</span>
          </label>
          <Input
            id="monthly_rent"
            type="number"
            min="0"
            step="50"
            value={monthlyRent || ''}
            onChange={(e) => setMonthlyRent(Number(e.target.value))}
            placeholder="e.g. 1500"
            className={errors.monthlyRent ? 'border-destructive' : ''}
          />
          {errors.monthlyRent && (
            <p className="text-sm font-medium text-destructive">{errors.monthlyRent}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="bedrooms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-muted-foreground" />
              Bedrooms <span className="text-destructive">*</span>
            </label>
            <Input
              id="bedrooms"
              type="number"
              min="0"
              value={bedrooms || ''}
              onChange={(e) => setBedrooms(Number(e.target.value))}
              placeholder="e.g. 2"
              className={errors.bedrooms ? 'border-destructive' : ''}
            />
            {errors.bedrooms && (
              <p className="text-sm font-medium text-destructive">{errors.bedrooms}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter 0 for studio apartments
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="bathrooms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-muted-foreground" />
              Bathrooms <span className="text-destructive">*</span>
            </label>
            <Input
              id="bathrooms"
              type="number"
              min="0.5"
              step="0.5"
              value={bathrooms || ''}
              onChange={(e) => setBathrooms(Number(e.target.value))}
              placeholder="e.g. 1.5"
              className={errors.bathrooms ? 'border-destructive' : ''}
            />
            {errors.bathrooms && (
              <p className="text-sm font-medium text-destructive">{errors.bathrooms}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="square_footage" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              Square Footage
            </label>
            <Input
              id="square_footage"
              type="number"
              min="0"
              value={squareFootage || ''}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : undefined;
                setSquareFootage(value);
              }}
              placeholder="e.g. 800"
            />
            <p className="text-xs text-muted-foreground">
              Optional, but recommended
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium leading-none">
              Amenities
            </label>
          </div>
          
          <p className="text-xs text-muted-foreground mb-3">
            Select all amenities that apply to your property
          </p>
          
          <div className="space-y-5">
            {Object.entries(AMENITIES_CONFIG.categories).map(([categoryKey, category]) => (
              <div key={categoryKey} className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">{category.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(category.items).map(([amenityKey, amenity]) => {
                    const AmenityIcon = amenity.icon;
                    const isSelected = amenities.includes(amenityKey);
                    
                    return (
                      <Button
                        key={amenityKey}
                        type="button"
                        variant="outline"
                        className={`h-auto py-2 px-3 transition-all duration-200 ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' 
                            : 'hover:bg-secondary'
                        }`}
                        onClick={() => toggleAmenity(amenityKey)}
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
        </div>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4 mt-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-full text-primary">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Highlight Your Amenities</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Properties with 4+ amenities receive 60% more interest. Be sure to select all that apply!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 