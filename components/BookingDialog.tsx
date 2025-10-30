'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfToday, addDays } from 'date-fns';
import { CalendarIcon, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: number;
  monthlyRent: number;
  availableFrom?: string;
  onBookingSuccess?: () => void;
}

export function BookingDialog({ open, onOpenChange, propertyId, monthlyRent, availableFrom, onBookingSuccess }: BookingDialogProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [noEndDate, setNoEndDate] = useState(false);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();

  // Calculate cost when dates change
  useEffect(() => {
    if (startDate && noEndDate) {
      // Monthly rate for indefinite stays
      setTotalCost(monthlyRent);
    } else if (startDate && endDate && startDate < endDate) {
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailyRate = monthlyRent / 30;
      const calculatedCost = dailyRate * daysDiff;
      setTotalCost(Math.round(calculatedCost * 100) / 100);
    } else {
      setTotalCost(0);
    }
  }, [startDate, endDate, monthlyRent, noEndDate]);


  const handleSubmit = async () => {
    if (!startDate) {
      toast({
        title: 'Please select date',
        description: 'Please select a move-in date for your booking.',
        variant: 'destructive',
      });
      return;
    }

    if (!noEndDate && !endDate) {
      toast({
        title: 'Please select dates',
        description: 'Please select a move-out date or check "No end date".',
        variant: 'destructive',
      });
      return;
    }

    if (!session) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to make a booking.',
        variant: 'destructive',
      });
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: noEndDate ? null : (endDate ? format(endDate, 'yyyy-MM-dd') : null),
          total_cost: totalCost,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create booking');
      }

      const data = await response.json();
      
      toast({
        title: 'Booking request sent!',
        description: 'Your booking request has been sent to the landlord.',
      });

      onOpenChange(false);
      setStartDate(undefined);
      setEndDate(undefined);
      setNoEndDate(false);
      setTotalCost(0);
      
      // Notify parent to refresh booking status
      if (onBookingSuccess) {
        onBookingSuccess();
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Minimum date is today or available_from
  const minDate = availableFrom 
    ? (new Date(availableFrom) > startOfToday() ? new Date(availableFrom) : startOfToday())
    : startOfToday();

  const isDateDisabled = (date: Date) => {
    return date < minDate;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request to Book</DialogTitle>
          <DialogDescription>
            Select your move-in and move-out dates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Start Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Move-in Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={isDateDisabled}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Move-out Date</label>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="no-end-date" 
                  checked={noEndDate}
                  onCheckedChange={(checked) => {
                    setNoEndDate(checked as boolean);
                    if (checked) {
                      setEndDate(undefined);
                    }
                  }}
                />
                <label
                  htmlFor="no-end-date"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  No end date
                </label>
              </div>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                  disabled={noEndDate}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (!date || !startDate || date > startDate) {
                      setEndDate(date);
                      setNoEndDate(false);
                    }
                  }}
                  disabled={(date) => {
                    if (date < minDate) return true;
                    if (startDate && date <= startDate) return true;
                    return false;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!startDate || (!noEndDate && !endDate) || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

