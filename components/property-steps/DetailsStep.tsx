'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Bed, Bath, DollarSign, Ruler, Info, CheckSquare, Coffee, Globe, Wifi, Car, Key, Tv, Utensils, Trees } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AMENITIES_CONFIG } from '@/lib/amenities';

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
  const handleAmenityToggle = (amenityId: string) => {
    if (amenities.includes(amenityId)) {
      setAmenities(amenities.filter(id => id !== amenityId));
    } else {
      setAmenities([...amenities, amenityId]);
    }
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
          <Label htmlFor="monthly_rent" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Monthly Rent (USD) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="monthly_rent"
            type="number"
            value={monthlyRent || ''}
            onChange={(e) => setMonthlyRent(parseFloat(e.target.value) || 0)}
            placeholder="1500"
            className={errors.monthlyRent ? "border-destructive" : ""}
          />
          {errors.monthlyRent && (
            <p className="text-sm text-destructive">{errors.monthlyRent}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="square_footage">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              Square Footage
            </div>
          </Label>
          <Input
            id="square_footage"
            type="number"
            value={squareFootage || ''}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              setSquareFootage(value);
            }}
            placeholder="800"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bedrooms" className="flex items-center gap-2">
            <Bed className="h-4 w-4 text-muted-foreground" />
            Bedrooms <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bedrooms"
            type="number"
            value={bedrooms || ''}
            onChange={(e) => setBedrooms(parseInt(e.target.value) || 0)}
            placeholder="2"
            className={errors.bedrooms ? "border-destructive" : ""}
          />
          {errors.bedrooms && (
            <p className="text-sm text-destructive">{errors.bedrooms}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bathrooms" className="flex items-center gap-2">
            <Bath className="h-4 w-4 text-muted-foreground" />
            Bathrooms <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bathrooms"
            type="number"
            step="0.5"
            value={bathrooms || ''}
            onChange={(e) => setBathrooms(parseFloat(e.target.value) || 0)}
            placeholder="1.5"
            className={errors.bathrooms ? "border-destructive" : ""}
          />
          {errors.bathrooms && (
            <p className="text-sm text-destructive">{errors.bathrooms}</p>
          )}
        </div>
      </div>
      
      <div className="pt-4">
        <h3 className="text-lg font-medium mb-4">Amenities & Features</h3>
        <p className="text-muted-foreground mb-6">
          Select the amenities and features available at your property.
        </p>
        
        <div className="space-y-6">
          {Object.entries(AMENITIES_CONFIG.categories).map(([categoryKey, category]) => (
            <div key={categoryKey} className="space-y-3">
              <h4 className="text-sm font-medium">{category.title}</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(category.items).map(([amenityKey, amenity]) => {
                  const AmenityIcon = amenity.icon;
                  const isSelected = amenities.includes(amenityKey);
                  
                  return (
                    <Button
                      key={amenityKey}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="h-auto py-2"
                      onClick={() => handleAmenityToggle(amenityKey)}
                    >
                      <div className="flex items-center gap-2">
                        <AmenityIcon className="h-4 w-4" />
                        <span>{amenity.label}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
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