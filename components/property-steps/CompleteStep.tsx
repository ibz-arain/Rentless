'use client';

import React from 'react';
import { CheckCircle2, Share2, Edit, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface CompleteStepProps {
  propertyId: number;
  title: string;
  address: string;
  image?: string;
}

export function CompleteStep({
  propertyId,
  title,
  address,
  image
}: CompleteStepProps) {
  return (
    <div className="py-6 space-y-8 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Property Listed Successfully!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your property has been successfully created and is now live on our platform.
          Potential renters can now view and inquire about your listing.
        </p>
      </div>
      
      {/* Property Card Preview */}
      <div className="max-w-md mx-auto">
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <div className="aspect-[16/9] relative bg-muted">
            {image ? (
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                <Image
                  src="/rentless.png"
                  alt="RentLess"
                  width={120}
                  height={40}
                  className="opacity-30"
                />
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="font-medium mb-1 truncate">{title}</h3>
            <p className="text-sm text-muted-foreground truncate">{address}</p>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
        <Button variant="outline" className="flex-1 gap-2" asChild>
          <Link href={`/properties/${propertyId}`}>
            <Eye className="h-4 w-4" />
            View Listing
          </Link>
        </Button>
        
        <Button variant="outline" className="flex-1 gap-2" asChild>
          <Link href={`/account/properties/${propertyId}/edit`}>
            <Edit className="h-4 w-4" />
            Edit Listing
          </Link>
        </Button>
        
        <Button variant="outline" className="flex-1 gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
      
      <div className="bg-muted/30 p-4 rounded-lg max-w-md mx-auto mt-6">
        <h4 className="font-medium mb-2">Next Steps</h4>
        <ul className="text-sm text-muted-foreground text-left space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
            <span>Keep your listing up to date with accurate information</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
            <span>Respond quickly to inquiries from potential renters</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
            <span>Consider adding more high-quality photos to attract more interest</span>
          </li>
        </ul>
      </div>
    </div>
  );
} 