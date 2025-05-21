import React from 'react';
import { Card } from '@/components/ui/card';

export default function PropertyDetailsSkeleton() {
  return (
    <div className="min-h-screen flex flex-col animate-pulse">
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <div className="h-10 w-2/3 bg-gray-200 rounded mb-2" />
          <div className="h-6 w-1/3 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-4" />
            <Card className="p-6 mb-4">
              <div className="h-6 w-1/4 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </Card>
            <Card className="p-6 mb-4">
              <div className="h-6 w-1/4 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-full bg-gray-200 rounded" />
            </Card>
            <Card className="p-6 mb-4">
              <div className="h-6 w-1/4 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="p-6 mb-4">
              <div className="h-8 w-1/2 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
            </Card>
            <Card className="p-6 mb-4">
              <div className="h-6 w-1/3 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 