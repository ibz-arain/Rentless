'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Trash2, Loader2, MapPin, Calendar as CalendarIcon, Home, BedDouble, Bath, Ruler, CheckCircle, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { z } from 'zod';
import { PropertyPhotosEditor } from '@/components/PropertyPhotosEditor';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LocationInput } from '@/components/LocationInput';
import { AMENITIES_CONFIG } from '@/lib/amenities';

// Property schema
const propertySchema = z.object({
  property_id: z.number(),
  landlord_id: z.number(),
  title: z.string().min(5, "Title must be at least 5 characters").max(150, "Title cannot exceed 150 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  address: z.string().min(5, "Address is required"),
  latitude: z.number(),
  longitude: z.number(),
  monthly_rent: z.number().min(1, "Rent must be greater than 0"),
  bedrooms: z.number().min(0, "Number of bedrooms cannot be negative"),
  bathrooms: z.number().min(0.5, "Number of bathrooms must be at least 0.5"),
  square_footage: z.number().optional().nullable(),
  available_from: z.string(),
  images: z.array(z.string()).optional().nullable(),
  amenities: z.array(z.string()).optional().nullable(),
});

type Property = z.infer<typeof propertySchema>;

// Wrapper to get id safely with React.use
function SafeParamsWrapper({ children, params }: { children: (id: string) => React.ReactNode, params: any }) {
  const resolvedParams = React.use(params) as { id: string };
  return <>{children(resolvedParams.id)}</>;
}

export default function PropertyEditPage({ params }: { params: any }) {
  // Unwrap params with React.use
  const { id } = React.use(params) as { id: string };

  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableFrom, setAvailableFrom] = useState<Date | undefined>(undefined);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch property data
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/properties');
      return;
    }

    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/properties?id=${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch property');
        }
        
        const data = await response.json();
        
        if (!data) {
          toast({
            title: "Property not found",
            description: "The property you're looking for doesn't exist.",
            variant: "destructive",
          });
          router.push('/account/properties');
          return;
        }
        
        // Check if the user owns this property
        if (data.landlord_id !== session?.user?.id) {
          toast({
            title: "Unauthorized",
            description: "You don't have permission to edit this property.",
            variant: "destructive",
          });
          router.push('/account/properties');
          return;
        }
        
        // Set available date
        if (data.available_from) {
          setAvailableFrom(new Date(data.available_from));
        }
        
        setProperty(data);
      } catch (error) {
        console.error('Error fetching property:', error);
        toast({
          title: "Error",
          description: "Failed to load property details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchProperty();
    }
  }, [id, router, session?.user?.id, status, toast]);

  // Handle form field changes
  const handleChange = (field: keyof Property, value: any) => {
    if (!property) return;
    
    setProperty({
      ...property,
      [field]: value
    });
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  // Set coordinates using functional update to merge with latest state
  const handleSetCoordinates = useCallback((coords: { lat: number; lng: number }) => {
    setProperty(prev => prev ? ({
      ...prev,
      latitude: coords.lat,
      longitude: coords.lng
    }) : null);
  }, []);

  // Toggle amenity selection
  const toggleAmenity = (amenityId: string) => {
    if (!property) return;
    
    const currentAmenities = property.amenities || [];
    const updatedAmenities = currentAmenities.includes(amenityId)
      ? currentAmenities.filter(id => id !== amenityId)
      : [...currentAmenities, amenityId];
    
    setProperty({
      ...property,
      amenities: updatedAmenities
    });
  };

  // Validate the form
  const validateForm = (): boolean => {
    try {
      propertySchema.parse(property);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        
        error.errors.forEach(err => {
          const field = err.path[0] as string;
          newErrors[field] = err.message;
        });
        
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Handle save/update
  const handleSave = async () => {
    if (!property) return;
    
    // Convert date to string format for API
    if (availableFrom) {
      property.available_from = availableFrom.toISOString().split('T')[0];
    }
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted errors before saving.",
        variant: "destructive",
      });
      
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      return;
    }
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/properties?id=${property.property_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(property)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update property');
      }
      
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
      
      toast({
        title: "Success",
        description: "Property has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating property:', error);
      toast({
        title: "Error",
        description: "Failed to update property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!property) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/properties?id=${property.property_id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete property');
      }
      
      toast({
        title: "Success",
        description: "Property has been deleted successfully.",
      });
      
      // Redirect back to properties list
      router.push('/account/properties');
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: "Error",
        description: "Failed to delete property. Please try again.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  // Handle images update
  const handleImagesChange = (newImages: string[]) => {
    if (!property) return;
    
    setProperty({
      ...property,
      images: newImages
    });
  };

  if (loading) {
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

  if (!property) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <p className="mb-6">The property you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/account/properties">
            <Button>Back to Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Link href="/account/properties" className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold">Edit Property</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/properties/${id}`)}
            >
              View Listing
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your property
                    listing and remove all data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete} 
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        {/* Basic Information Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
            <CardDescription>
              The main details about your property
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Property Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                value={property.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. Modern 2-Bedroom Apartment in Downtown"
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm font-medium text-destructive">{errors.title}</p>
              )}
              <p className="text-xs text-muted-foreground">
                A catchy title helps your property stand out. Include key features like "2-bedroom" or "downtown."
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Property Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="description"
                value={property.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe your property in detail..."
                className={`min-h-[150px] ${errors.description ? 'border-destructive' : ''}`}
              />
              {errors.description && (
                <p className="text-sm font-medium text-destructive">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Detailed descriptions attract serious renters. Mention unique features, nearby amenities, and any recent renovations.
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Property Address <span className="text-destructive">*</span>
              </label>
              <LocationInput 
                address={property.address}
                setAddress={(value) => handleChange('address', value)}
                setCoordinates={handleSetCoordinates}
                error={errors.address}
              />
              {errors.address && (
                <p className="text-sm font-medium text-destructive">{errors.address}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Select your address from the dropdown to ensure accurate map placement and location services.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Property Details Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" />
              Property Details
            </CardTitle>
            <CardDescription>
              Specific details about your property
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label htmlFor="monthly_rent" className="text-sm font-medium flex items-center gap-1">
                  Monthly Rent (USD) <span className="text-destructive">*</span>
                </label>
                <Input
                  id="monthly_rent"
                  type="number"
                  min="0"
                  step="50"
                  value={property.monthly_rent}
                  onChange={(e) => handleChange('monthly_rent', Number(e.target.value))}
                  placeholder="e.g. 1500"
                  className={errors.monthly_rent ? 'border-destructive' : ''}
                />
                {errors.monthly_rent && (
                  <p className="text-sm font-medium text-destructive">{errors.monthly_rent}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="bedrooms" className="text-sm font-medium flex items-center gap-1">
                  <BedDouble className="h-4 w-4" /> Bedrooms <span className="text-destructive">*</span>
                </label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={property.bedrooms}
                  onChange={(e) => handleChange('bedrooms', Number(e.target.value))}
                  placeholder="e.g. 2"
                  className={errors.bedrooms ? 'border-destructive' : ''}
                />
                {errors.bedrooms && (
                  <p className="text-sm font-medium text-destructive">{errors.bedrooms}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="bathrooms" className="text-sm font-medium flex items-center gap-1">
                  <Bath className="h-4 w-4" /> Bathrooms <span className="text-destructive">*</span>
                </label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={property.bathrooms}
                  onChange={(e) => handleChange('bathrooms', Number(e.target.value))}
                  placeholder="e.g. 1.5"
                  className={errors.bathrooms ? 'border-destructive' : ''}
                />
                {errors.bathrooms && (
                  <p className="text-sm font-medium text-destructive">{errors.bathrooms}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="square_footage" className="text-sm font-medium flex items-center gap-1">
                  <Ruler className="h-4 w-4" /> Square Footage
                </label>
                <Input
                  id="square_footage"
                  type="number"
                  min="0"
                  value={property.square_footage || ''}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    handleChange('square_footage', value);
                  }}
                  placeholder="e.g. 800"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" /> Available From <span className="text-destructive">*</span>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !availableFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {availableFrom ? format(availableFrom, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={availableFrom}
                    onSelect={setAvailableFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.available_from && (
                <p className="text-sm font-medium text-destructive">{errors.available_from}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Setting an accurate availability date helps match you with renters on your timeline.
              </p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Listing Tip</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Properties with complete and accurate details receive up to 50% more inquiries. Be as precise as possible with your property specifications.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Amenities Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Amenities
            </CardTitle>
            <CardDescription>
              Select all amenities that apply to your property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(AMENITIES_CONFIG.categories).map(([categoryKey, category]) => (
                <div key={categoryKey} className="space-y-3">
                  <h3 className="text-sm font-medium">{category.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(category.items).map(([amenityKey, amenity]) => {
                      const isSelected = property.amenities?.includes(amenityKey) || false;
                      const AmenityIcon = amenity.icon;
                      
                      return (
                        <Button
                          key={amenityKey}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          className="h-auto py-2 px-3"
                          onClick={() => toggleAmenity(amenityKey)}
                        >
                          <div className="flex items-center gap-2">
                            <AmenityIcon className="h-4 w-4" />
                            <span className="text-sm whitespace-nowrap">{amenity.label}</span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Amenities Matter</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Properties with 6+ amenities get 35% more interest. Don't forget to highlight special features that make your property stand out.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Photos Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Property Photos
            </CardTitle>
            <CardDescription>
              Add or update photos of your property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PropertyPhotosEditor 
              images={property.images || []} 
              onChange={handleImagesChange} 
            />
            
            <div className="bg-muted/50 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Quality Photos Matter</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Listings with high-quality photos receive up to 70% more views. Include at least 5 photos showing different rooms and features.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="min-w-[150px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 