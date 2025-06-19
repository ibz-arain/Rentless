'use client';

import { useSession } from 'next-auth/react';
import { MessageCircle, Info, Heart, ArrowRight, Home, Calendar, DollarSign, HelpCircle, Search, MapPin, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="h-12 w-12 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Property Inquiries</h1>
        <p className="text-muted-foreground mb-8">
          Connect with property owners to ask questions and arrange viewings for your potential new home.
        </p>
        
        <Card className="p-4 mt-8 bg-muted/30 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-medium">Chat Tips</h3>
              <p className="text-sm text-muted-foreground">
                Be specific in your questions, respond promptly, and keep all communication within the platform for your safety.
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-xs text-muted-foreground">
          <p>Select a conversation from the sidebar or browse properties to start a new conversation.</p>
        </div>
        
        <div className="mt-8 flex justify-center items-center">
          <Button 
            variant="default" 
            onClick={() => router.push('/properties')}
            className="flex items-center gap-2"
          >
            Browse Properties
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        

      </div>
    </div>
  );
} 