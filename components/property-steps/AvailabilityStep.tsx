'use client';

import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface AvailabilityStepProps {
  availableFrom: Date | undefined;
  setAvailableFrom: (date: Date | undefined) => void;
  errors: {
    availableFrom?: string;
  };
}

export function AvailabilityStep({
  availableFrom,
  setAvailableFrom,
  errors
}: AvailabilityStepProps) {
  const today = new Date();
  
  // Disable dates in the past
  const isDateDisabled = (date: Date) => {
    return date < new Date(today.setHours(0, 0, 0, 0));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium text-primary">
        <CalendarDays className="h-5 w-5" />
        <h3>Availability</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Let potential renters know when your property will be available for move-in.
      </p>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            Available From <span className="text-destructive">*</span>
          </label>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${
                  !availableFrom ? 'text-muted-foreground' : ''
                } ${errors.availableFrom ? 'border-destructive' : ''}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {availableFrom ? format(availableFrom, 'PPP') : 'Select a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={availableFrom}
                onSelect={setAvailableFrom}
                disabled={isDateDisabled}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {errors.availableFrom && (
            <p className="text-sm font-medium text-destructive">{errors.availableFrom}</p>
          )}
          
          <p className="text-xs text-muted-foreground">
            This is the date when renters can move into your property
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-primary/5 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Immediate Availability</h4>
            <p className="text-sm text-muted-foreground">
              Properties that are available immediately or within the next 30 days tend to receive 45% more inquiries.
            </p>
          </div>
          
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Future Planning</h4>
            <p className="text-sm text-muted-foreground">
              If your property won't be available for some time, you can still list it to gauge interest and secure potential renters in advance.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4 mt-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-full text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Accurate Dates Matter</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Be sure to keep your availability date updated. Properties with accurate availability information are 50% more likely to be rented quickly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 