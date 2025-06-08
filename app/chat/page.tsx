'use client';

import { useSession } from 'next-auth/react';
import { MessageCircle, Info, Heart, ArrowRight, Home, Calendar, DollarSign, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // No need to redirect, layout will handle this

  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Home className="h-12 w-12 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Property Inquiries</h1>
        <p className="text-muted-foreground mb-8">
          Connect with property owners and managers. Ask questions about listings and arrange viewings.
        </p>
        
        <div className="grid gap-4">
          <Card className="p-4 bg-card/50 border-primary/20 hover:border-primary/40 transition-colors">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-medium">Schedule Viewings</h3>
                <p className="text-sm text-muted-foreground">
                  Arrange property viewings directly with owners and get instant confirmations.
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-card/50 border-primary/20 hover:border-primary/40 transition-colors">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-medium">Discuss Pricing & Terms</h3>
                <p className="text-sm text-muted-foreground">
                  Negotiate rent, security deposits, lease terms, and move-in dates with landlords.
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-card/50 border-primary/20 hover:border-primary/40 transition-colors">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-medium">Get Property Details</h3>
                <p className="text-sm text-muted-foreground">
                  Ask questions about amenities, parking, utilities, nearby services and more.
                </p>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="mt-8">
          <Button 
            variant="default" 
            onClick={() => router.push('/properties')}
            className="flex items-center gap-2"
          >
            Browse Properties
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-8 text-xs text-muted-foreground">
          <p>Select a conversation from the sidebar to start inquiring about a property.</p>
        </div>
      </div>
    </div>
  );
} 