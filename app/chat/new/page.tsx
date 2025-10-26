'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Info, ChevronLeft, Home, MapPin, DollarSign, Bed, Bath, ExternalLink, User, Smile, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function NewConversationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const propertyId = searchParams.get('property');
  const landlordId = searchParams.get('landlord');

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch property details for header display
  const [property, setProperty] = React.useState<any | null>(null);
  const [partner, setPartner] = React.useState<{ first_name: string; last_name: string; profile_picture?: string | null } | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/properties?id=${propertyId}`);
        if (res.ok) {
          const data = await res.json();
          setProperty(data);
          // Placeholder partner – show as "Landlord"
          setPartner({ first_name: 'Landlord', last_name: '', profile_picture: null });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [propertyId]);

  const isLandlord = false; // always tenant in start flow

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-full">Loading…</div>;
  }

  if (status !== 'authenticated') {
    router.push('/login');
    return null;
  }

  if (!propertyId || !landlordId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Card className="p-6 max-w-sm w-full">
          <h3 className="font-semibold mb-2">Missing information</h3>
          <p className="text-sm text-muted-foreground">Property or landlord information is missing.</p>
          <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const quickReplies: { icon: React.ComponentType<{ className?: string }>; text: string }[] = [
    {
      icon: Calendar,
      text: 'Is this property still available?',
    },
    {
      icon: Calendar,
      text: 'Can I schedule a viewing?',
    },
    {
      icon: Info,
      text: "What's the lease term for this property?",
    },
    {
      icon: Info,
      text: 'Are there any application fees or requirements?',
    },
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/conversations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: Number(propertyId),
          landlordId: Number(landlordId),
          content: input,
        }),
      });
      if (!res.ok) {
        console.error('Failed to start conversation');
        return;
      }
      const data = await res.json();
      const conversationId = data.conversation_id;
      router.replace(`/chat/${conversationId}?property=${propertyId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header (copied from chat) */}
      {property && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="md:hidden flex-shrink-0 p-1.5 rounded-full hover:bg-muted/50 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/30 flex-shrink-0 flex items-center justify-center overflow-hidden border border-border/50 shadow-sm">
              {partner?.profile_picture ? (
                <Image src={partner.profile_picture} alt="Partner" width={48} height={48} className="object-cover h-full w-full" />
              ) : (
                <User className="h-6 w-6 text-primary/70" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base truncate">{partner ? `${partner.first_name} ${partner.last_name}`.trim() || 'Landlord' : 'Landlord'}</h2>
                <Badge variant="outline" className="text-xs font-normal bg-muted/50 border-primary/20 text-primary">
                  {isLandlord ? 'Tenant' : 'Landlord'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">Online now</p>
            </div>
            <Link href={`/properties/${property.property_id}`} className="flex items-center gap-1.5 text-xs bg-primary/10 hover:bg-primary/15 text-primary font-medium px-3 py-1.5 rounded-full transition-all">
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Property</span>
            </Link>
          </div>
          {/* Property card */}
          <div className="mt-3 pt-3 border-t border-border/30">
            <Link href={`/properties/${property.property_id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-all">
              <div className="h-14 w-14 rounded-md bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden border border-border/50">
                {property.images && property.images.length > 0 ? (
                  <Image src={property.images[0]} alt={property.title} width={56} height={56} className="object-cover h-full w-full" />
                ) : (
                  <Home className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{property.title}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{property.address}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs font-medium">
                    <DollarSign className="h-3 w-3 text-primary/70" />
                    ${property.monthly_rent?.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5 text-xs"><Bed className="h-3 w-3 text-muted-foreground" />{property.bedrooms}</span>
                    <span className="flex items-center gap-0.5 text-xs"><Bath className="h-3 w-3 text-muted-foreground" />{property.bathrooms}</span>
                  </div>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-primary/70" />
            </Link>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 sm:pb-4">
        {/* Show quick reply buttons when no messages yet */}
        <div className="flex flex-col items-center justify-center h-full">
          <div className="flex flex-col gap-3 w-full max-w-sm">
            {quickReplies.map((qr, idx) => (
              <button key={idx} onClick={() => setInput(qr.text)} className="w-full bg-background hover:bg-muted/30 border border-border rounded-lg px-4 py-3 text-sm font-medium text-left flex items-center gap-3 transition-colors">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <qr.icon className="h-4 w-4 text-primary" />
                </div>
                <span>{qr.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message input */}
      <div className="bg-card/80 backdrop-blur-sm border-t border-border p-3 sticky bottom-0 flex-shrink-0">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full py-2 px-3 rounded-full bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
} 