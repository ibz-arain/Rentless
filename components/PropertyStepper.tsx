'use client';

import React, { useState } from 'react';
import { 
  Home, 
  MapPin, 
  DollarSign, 
  Info, 
  Calendar, 
  Image as ImageIcon,
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

// Define step types
export type PropertyStep = 'basic' | 'location' | 'details' | 'photos' | 'availability' | 'review' | 'complete';

interface StepInfo {
  title: string;
  icon: React.ReactNode;
  description: string;
}

interface PropertyStepperProps {
  children: React.ReactNode;
  currentStep: PropertyStep;
  setCurrentStep: (step: PropertyStep) => void;
  isValid: boolean;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
}

export const STEPS_INFO: Record<PropertyStep, StepInfo> = {
  basic: {
    title: 'Basic Information',
    icon: <Home className="h-5 w-5" />,
    description: 'Add the basic details about your property'
  },
  location: {
    title: 'Location',
    icon: <MapPin className="h-5 w-5" />,
    description: 'Where is your property located?'
  },
  details: {
    title: 'Property Details',
    icon: <Info className="h-5 w-5" />,
    description: 'Specify property features and amenities'
  },
  photos: {
    title: 'Photos',
    icon: <ImageIcon className="h-5 w-5" />,
    description: 'Add photos of your property'
  },
  availability: {
    title: 'Availability',
    icon: <Calendar className="h-5 w-5" />,
    description: 'When is your property available?'
  },
  review: {
    title: 'Review',
    icon: <CheckCircle2 className="h-5 w-5" />,
    description: 'Review your property listing'
  },
  complete: {
    title: 'Complete',
    icon: <CheckCircle2 className="h-5 w-5" />,
    description: 'Your property has been listed'
  }
};

// All steps in order
export const STEPS_ORDER: PropertyStep[] = ['basic', 'location', 'details', 'photos', 'availability', 'review', 'complete'];

export function PropertyStepper({ 
  children, 
  currentStep, 
  setCurrentStep,
  isValid,
  isSubmitting,
  onSubmit
}: PropertyStepperProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Get current step index
  const currentStepIndex = STEPS_ORDER.indexOf(currentStep);
  
  // Calculate progress percentage
  const progress = Math.round((currentStepIndex / (STEPS_ORDER.length - 2)) * 100);
  
  const handleNext = async () => {
    if (currentStep === 'review') {
      await onSubmit();
    } else {
      const nextStep = STEPS_ORDER[currentStepIndex + 1];
      setCurrentStep(nextStep);
    }
  };
  
  const handleBack = () => {
    if (currentStepIndex > 0) {
      const prevStep = STEPS_ORDER[currentStepIndex - 1];
      setCurrentStep(prevStep);
    }
  };
  
  const handleGoToProperties = () => {
    router.push('/account/properties');
  };

  return (
    <Card className="border shadow-sm">
      {/* Progress tracker */}
      {currentStep !== 'complete' && (
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {STEPS_ORDER.length - 1}
            </div>
            <div className="text-sm font-medium">
              {STEPS_INFO[currentStep].title}
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2.5 mb-6">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Step indicators */}
          <div className="grid grid-cols-6 gap-2 mb-6">
            {STEPS_ORDER.slice(0, -1).map((step, index) => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                    ${index < currentStepIndex 
                      ? 'bg-primary text-primary-foreground' 
                      : index === currentStepIndex 
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' 
                        : 'bg-muted text-muted-foreground'}
                  `}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={`
                  text-xs mt-1 text-center hidden md:block
                  ${index === currentStepIndex ? 'text-primary font-medium' : 'text-muted-foreground'}
                `}>
                  {STEPS_INFO[step].title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Current step content */}
      <CardContent className={`${currentStep === 'complete' ? 'pt-6' : ''}`}>
        {children}
      </CardContent>
      
      {/* Navigation buttons */}
      {currentStep !== 'complete' ? (
        <CardFooter className="flex justify-between border-t p-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button
            type="button"
            onClick={handleNext}
            disabled={!isValid || isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {currentStep === 'review' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              <>
                {currentStep === 'review' ? 'Create Property' : 'Next'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      ) : (
        <CardFooter className="flex justify-center border-t p-6">
          <Button
            onClick={handleGoToProperties}
            className="min-w-40"
          >
            View My Properties
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 