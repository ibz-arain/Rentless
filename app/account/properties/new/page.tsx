'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { CreatePropertyPayload } from '@/lib/types';
import { PropertyStepper, PropertyStep, STEPS_ORDER } from '@/components/PropertyStepper';
import { BasicInfoStep } from '@/components/property-steps/BasicInfoStep';
import { LocationStep } from '@/components/property-steps/LocationStep';
import { DetailsStep } from '@/components/property-steps/DetailsStep';
import { PhotosStep } from '@/components/property-steps/PhotosStep';
import { AvailabilityStep } from '@/components/property-steps/AvailabilityStep';
import { ReviewStep } from '@/components/property-steps/ReviewStep';
import { CompleteStep } from '@/components/property-steps/CompleteStep';

// Property validation schema
const propertySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title cannot exceed 150 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  address: z.string().min(5, "Address is required"),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).nullable().optional(),
  monthly_rent: z.number().min(1, "Rent must be greater than 0"),
  bedrooms: z.number().min(0, "Number of bedrooms cannot be negative"),
  bathrooms: z.number().min(0.5, "Number of bathrooms must be at least 0.5"),
  square_footage: z.number().optional(),
  available_from: z.date().optional(),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

export default function NewPropertyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  // Form state
  const [currentStep, setCurrentStep] = useState<PropertyStep>('basic');
  const [formData, setFormData] = useState<PropertyFormValues>({
    title: '',
    description: '',
    address: '',
    coordinates: null,
    monthly_rent: 0,
    bedrooms: 1,
    bathrooms: 1,
    square_footage: undefined,
    available_from: new Date(),
    images: [],
    amenities: [],
  });
  
  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPropertyId, setNewPropertyId] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/properties/new');
    }
  }, [status, router]);

  // Validate current step
  const validateStep = useCallback((step: PropertyStep): boolean => {
    // Clear previous errors
    setErrors({});
    
    try {
      switch (step) {
        case 'basic': {
          const { title, description } = formData;
          
          if (!title.trim() || title.length < 5) {
            setErrors({ title: 'Title must be at least 5 characters' });
            return false;
          }
          
          if (!description.trim() || description.length < 20) {
            setErrors({ description: 'Description must be at least 20 characters' });
            return false;
          }
          
          return true;
        }
        
        case 'location': {
          const { address, coordinates } = formData;
          
          if (!address.trim() || address.length < 5) {
            setErrors({ address: 'Address is required' });
            return false;
          }
          
          if (!coordinates) {
            setErrors({ address: 'Please select an address from the dropdown' });
            return false;
          }
          
          return true;
        }
        
        case 'details': {
          const { monthly_rent, bedrooms, bathrooms } = formData;
          
          if (!monthly_rent || monthly_rent <= 0) {
            setErrors({ monthlyRent: 'Monthly rent must be greater than 0' });
            return false;
          }
          
          if (bedrooms < 0) {
            setErrors({ bedrooms: 'Number of bedrooms cannot be negative' });
            return false;
          }
          
          if (!bathrooms || bathrooms < 0.5) {
            setErrors({ bathrooms: 'Number of bathrooms must be at least 0.5' });
            return false;
          }
          
          return true;
        }
        
        case 'photos': {
          return true; // Photos are optional
        }
        
        case 'availability': {
          const { available_from } = formData;
          
          if (!available_from) {
            setErrors({ availableFrom: 'Available date is required' });
            return false;
          }
          
          return true;
        }
        
        case 'review': {
          // All steps should have been validated already
          return true;
        }
        
        default:
          return true;
      }
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }, [formData]);

  // Calculate if current step is valid using memoization
  const isCurrentStepValid = useMemo(() => {
    if (currentStep === 'complete') return true;
    return validateStep(currentStep);
  }, [currentStep, validateStep]);

  // Handle form submission
  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to create a property.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert form data to API payload
      const propertyData: CreatePropertyPayload = {
        landlord_id: session.user.id,
        title: formData.title,
        description: formData.description,
        address: formData.address,
        monthly_rent: formData.monthly_rent,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        square_footage: formData.square_footage,
        available_from: formData.available_from ? formData.available_from.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        images: formData.images || [],
        amenities: formData.amenities || [],
        latitude: formData.coordinates?.lat || 0,
        longitude: formData.coordinates?.lng || 0,
      };

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create property');
      }

      const data = await response.json();
      
      toast({
        title: "Property created",
        description: "Your property has been successfully listed.",
      });

      // Set the new property ID for the completion step
      setNewPropertyId(data.property_id);
      
      // Go to completion step
      setCurrentStep('complete');
    } catch (error) {
      console.error('Error creating property:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create property",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, session, toast]);

  const setStepCallback = useCallback((step: PropertyStep) => {
    setCurrentStep(step);
  }, []);

  // Set form data helpers
  const setTitle = useCallback((value: string) => setFormData(prev => ({ ...prev, title: value })), []);
  const setDescription = useCallback((value: string) => setFormData(prev => ({ ...prev, description: value })), []);
  const setAddress = useCallback((value: string) => setFormData(prev => ({ ...prev, address: value })), []);
  const setCoordinates = useCallback((value: { lat: number; lng: number }) => setFormData(prev => ({ ...prev, coordinates: value })), []);
  const setMonthlyRent = useCallback((value: number) => setFormData(prev => ({ ...prev, monthly_rent: value })), []);
  const setBedrooms = useCallback((value: number) => setFormData(prev => ({ ...prev, bedrooms: value })), []);
  const setBathrooms = useCallback((value: number) => setFormData(prev => ({ ...prev, bathrooms: value })), []);
  const setSquareFootage = useCallback((value: number | undefined) => setFormData(prev => ({ ...prev, square_footage: value })), []);
  const setAvailableFrom = useCallback((value: Date | undefined) => setFormData(prev => ({ ...prev, available_from: value })), []);
  const setImages = useCallback((value: string[]) => setFormData(prev => ({ ...prev, images: value })), []);
  const setAmenities = useCallback((value: string[]) => setFormData(prev => ({ ...prev, amenities: value })), []);

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8"></div>
            <div className="h-[500px] bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate step content
  const getStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <BasicInfoStep
            title={formData.title}
            setTitle={setTitle}
            description={formData.description}
            setDescription={setDescription}
            errors={{
              title: errors.title,
              description: errors.description,
            }}
          />
        );
        
      case 'location':
        return (
          <LocationStep
            address={formData.address}
            setAddress={setAddress}
            coordinates={formData.coordinates || null}
            setCoordinates={setCoordinates}
            errors={{
              address: errors.address,
            }}
          />
        );
        
      case 'details':
        return (
          <DetailsStep
            monthlyRent={formData.monthly_rent}
            setMonthlyRent={setMonthlyRent}
            bedrooms={formData.bedrooms}
            setBedrooms={setBedrooms}
            bathrooms={formData.bathrooms}
            setBathrooms={setBathrooms}
            squareFootage={formData.square_footage}
            setSquareFootage={setSquareFootage}
            amenities={formData.amenities || []}
            setAmenities={setAmenities}
            errors={{
              monthlyRent: errors.monthlyRent,
              bedrooms: errors.bedrooms,
              bathrooms: errors.bathrooms,
            }}
          />
        );
        
      case 'photos':
        return (
          <PhotosStep
            images={formData.images || []}
            setImages={setImages}
            errors={{
              images: errors.images,
            }}
          />
        );
        
      case 'availability':
        return (
          <AvailabilityStep
            availableFrom={formData.available_from}
            setAvailableFrom={setAvailableFrom}
            errors={{
              availableFrom: errors.availableFrom,
            }}
          />
        );
        
      case 'review':
        return (
          <ReviewStep
            title={formData.title}
            description={formData.description}
            address={formData.address}
            coordinates={formData.coordinates || null}
            monthlyRent={formData.monthly_rent}
            bedrooms={formData.bedrooms}
            bathrooms={formData.bathrooms}
            squareFootage={formData.square_footage}
            amenities={formData.amenities || []}
            availableFrom={formData.available_from}
            images={formData.images || []}
          />
        );
        
      case 'complete':
        return (
          <CompleteStep
            propertyId={newPropertyId || 0}
            title={formData.title}
            address={formData.address}
            image={formData.images && formData.images.length > 0 ? formData.images[0] : undefined}
          />
        );
        
      default:
        return null;
    }
  };

  // Memoize the step content for performance
  const stepContent = useMemo(() => getStepContent(), [
    currentStep, 
    formData, 
    errors, 
    newPropertyId,
    setTitle, 
    setDescription, 
    setAddress, 
    setCoordinates, 
    setMonthlyRent, 
    setBedrooms, 
    setBathrooms, 
    setSquareFootage, 
    setImages, 
    setAmenities, 
    setAvailableFrom
  ]);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/account/properties" className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Add New Property</h1>
        </div>
        
        <PropertyStepper
          currentStep={currentStep}
          setCurrentStep={setStepCallback}
          isValid={isCurrentStepValid}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        >
          {stepContent}
        </PropertyStepper>
      </div>
    </div>
  );
} 