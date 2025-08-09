'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';
import { Property as PropertyType } from '@/lib/types';
import { transformPropertyData, PropertyCard } from '@/components/properties';
import { handleApiResponse } from '@/lib/utils';

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/favorites');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchFavorites();
    }
  }, [session?.user?.id]);

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/favorites');
      const data = await handleApiResponse(res);
      if (data) {
        setFavorites(data);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load saved properties. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto">
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
                  <p className="text-red-600/70 mb-4">We couldn't load your saved properties at this time. Please try again later.</p>
                  <Button onClick={fetchFavorites} className="mt-2 bg-red-500 hover:bg-red-600">
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link href="/account" className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-2xl font-bold">Saved Properties</h1>
              <Badge variant="outline" className="ml-2">
                {favorites.length} {favorites.length === 1 ? 'property' : 'properties'}
              </Badge>
            </div>
          </div>
          {favorites.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/5">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-medium mb-2">No Saved Properties</h2>
                <p className="text-muted-foreground mb-8 text-center max-w-md">
                  You haven't saved any properties yet. Browse listings and save the ones you like.
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
              {favorites.map((property) => (
                <div
                  key={property.property_id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/properties/${property.property_id}`)}
                >
                  <PropertyCard
                    property={transformPropertyData(property)}
                    initialIsLiked={true}
                    onFavoriteToggle={(id, liked) => {
                      if (!liked) {
                        setFavorites(prev => prev.filter(p => p.property_id !== id));
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 