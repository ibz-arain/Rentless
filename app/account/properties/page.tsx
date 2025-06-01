'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Home, 
  SortAsc, 
  SortDesc
} from 'lucide-react';
import { Property as PropertyType } from '@/lib/types';
import { transformPropertyData, PropertyCard } from '@/components/properties';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";

export default function PropertiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/properties');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProperties(session.user.id);
    }
  }, [session?.user?.id]);

  const fetchProperties = async (userId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/properties?landlordId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load your properties. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter properties based on search query
  const filteredProperties = properties.filter(property => 
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort properties based on selected sort option
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.monthly_rent - b.monthly_rent;
      case 'price-desc':
        return b.monthly_rent - a.monthly_rent;
      case 'newest':
      default:
        // Sort by created_at date, assuming newer items have larger property_id
        return b.property_id - a.property_id;
    }
  });

  // Loading skeleton for properties page
  if (status === 'loading' || loading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-8 w-48" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
              <Skeleton className="h-10 w-full md:w-64" />
              <Skeleton className="h-10 w-full md:w-72" />
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[400px]">
                  <Skeleton className="h-full w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Link 
                href="/account" 
                className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-2xl font-bold">My Properties</h1>
            </div>
            
            <Card className="border-red-100 bg-red-50/30 mb-6">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <Home className="h-6 w-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-red-700">{error}</h3>
                  <p className="text-red-600/70 mb-4">We couldn't load your properties at this time. Please try again later.</p>
                  <Button 
                    onClick={() => session?.user?.id && fetchProperties(session.user.id)}
                    className="mt-2 bg-red-500 hover:bg-red-600 cursor-pointer"
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Link 
                href="/account" 
                className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-2xl font-bold">My Properties</h1>
              <Badge variant="outline" className="ml-2">
                {properties.length} {properties.length === 1 ? 'listing' : 'listings'}
              </Badge>
            </div>
            <Button asChild size="lg" className="shadow-sm bg-primary hover:bg-primary/90 cursor-pointer">
              <Link href="/account/properties/new" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Add New Property
              </Link>
            </Button>
          </div>

          {/* Empty state */}
          {properties.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/5">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Home className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-medium mb-2">No Properties Listed</h2>
                <p className="text-muted-foreground mb-8 text-center max-w-md">
                  You haven't added any property listings yet. Create your first property listing to start renting it out.
                </p>
                <Button asChild size="lg" className="cursor-pointer">
                  <Link href="/account/properties/new" className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Property
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
                <>
                  {/* Property grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedProperties.map((property) => {
                      const transformedProperty = transformPropertyData(property);
                      
                      return (
                        <div key={property.property_id} className="cursor-pointer" onClick={() => router.push(`/account/properties/${property.property_id}`)}>
                          <PropertyCard property={transformedProperty} />
                        </div>
                      );
                    })}
                  </div>
                </>
              )
            </>
          )}
        </div>
      </div>
    </div>
  );
} 