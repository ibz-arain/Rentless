'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';
import { PropertyProps, PropertyCard, transformPropertyData } from '@/components/properties';
import type { Property } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/favorites');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchFavorites(session.user.id);
    }
  }, [session?.user?.id]);

  const fetchFavorites = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/favorites?userId=${userId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch favorites');
      }
      const data = await res.json();
      setProperties(data);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load your saved properties. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-8 w-48" />
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

  if (error) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Link href="/account" className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-2xl font-bold">Saved Properties</h1>
            </div>
            <Card className="border-red-100 bg-red-50/30 mb-6">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <Heart className="h-6 w-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-red-700">{error}</h3>
                  <p className="text-red-600/70 mb-4">We couldn't load your saved properties. Please try again later.</p>
                  <Button onClick={() => session?.user?.id && fetchFavorites(session.user.id)} className="mt-2 bg-red-500 hover:bg-red-600 cursor-pointer">
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
          <div className="flex items-center gap-3 mb-8">
            <Link href="/account" className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold">Saved Properties</h1>
          </div>
          {properties.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/5">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-medium mb-2">No Saved Properties</h2>
                <p className="text-muted-foreground mb-8 text-center max-w-md">
                  You haven't saved any properties yet. Browse listings and click the heart icon to save them.
                </p>
                <Button asChild size="lg" className="cursor-pointer">
                  <Link href="/properties" className="flex items-center">
                    Browse Properties
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => {
                const transformed = transformPropertyData(property);
                return (
                  <div key={property.property_id} className="cursor-pointer" onClick={() => router.push(`/properties/${property.property_id}`)}>
                    <PropertyCard property={transformed} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
