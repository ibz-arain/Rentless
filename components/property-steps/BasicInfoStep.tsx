'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Building, Home } from 'lucide-react';

interface BasicInfoStepProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  errors: {
    title?: string;
    description?: string;
  };
}

export function BasicInfoStep({ 
  title, 
  setTitle, 
  description, 
  setDescription, 
  errors 
}: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium text-primary">
        <Building className="h-5 w-5" />
        <h3>Basic Property Information</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Start by giving your property a catchy title and detailed description to attract potential renters.
      </p>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Property Title <span className="text-destructive">*</span>
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Modern 2-Bedroom Apartment in Downtown"
            className={errors.title ? 'border-destructive' : ''}
          />
          {errors.title && (
            <p className="text-sm font-medium text-destructive">{errors.title}</p>
          )}
          <p className="text-xs text-muted-foreground">
            A clear, descriptive title helps your property stand out (5-150 characters)
          </p>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Property Description <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your property in detail..."
            className={`min-h-[150px] ${errors.description ? 'border-destructive' : ''}`}
          />
          {errors.description && (
            <p className="text-sm font-medium text-destructive">{errors.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Include important details like unique features, nearby amenities, and what makes your property special (min 20 characters)
          </p>
        </div>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4 mt-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-full text-primary">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Pro Tip</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Properties with detailed descriptions and accurate information get up to 40% more inquiries. 
              Be specific about what makes your property special!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 