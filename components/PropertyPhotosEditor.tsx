'use client';

import React, { useState, useRef } from 'react';
import { Image as ImageIcon, X, Plus, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface PropertyPhotosEditorProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function PropertyPhotosEditor({
  images,
  onChange
}: PropertyPhotosEditorProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(files);
  };

  const processFiles = (files: FileList) => {
    setIsUploading(true);
    const validFiles: File[] = [];
    
    // Validate files before processing
    Array.from(files).forEach(file => {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        });
        return;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit.`,
          variant: "destructive",
        });
        return;
      }
      
      validFiles.push(file);
    });

    // Process valid files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl && !images.includes(dataUrl)) {
          onChange([...images, dataUrl]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setIsUploading(false);
  };

  const removeImage = (urlToRemove: string) => {
    onChange(images.filter(url => url !== urlToRemove));
    
    // Also remove from error tracking
    if (imageErrors[urlToRemove]) {
      const newErrors = { ...imageErrors };
      delete newErrors[urlToRemove];
      setImageErrors(newErrors);
    }
  };

  const handleImageError = (url: string) => {
    setImageErrors(prev => ({ ...prev, [url]: true }));
  };

  const handleImageLoad = (url: string) => {
    if (imageErrors[url]) {
      const newErrors = { ...imageErrors };
      delete newErrors[url];
      setImageErrors(newErrors);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Image preview grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Existing images */}
        {images.map((url, index) => (
          <div 
            key={index} 
            className="relative group aspect-[4/3] bg-muted/30 border rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow"
          >
            {imageErrors[url] ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-xs text-center text-muted-foreground">
                  Error loading image
                </p>
              </div>
            ) : (
              <Image
                src={url}
                alt={`Property image ${index + 1}`}
                fill
                className="object-cover"
                onError={() => handleImageError(url)}
                onLoad={() => handleImageLoad(url)}
              />
            )}
            <Button
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeImage(url)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
              Image {index + 1}
            </div>
          </div>
        ))}
        
        {/* Upload area - Add image card */}
        <Card 
          className={`aspect-[4/3] flex items-center justify-center cursor-pointer border border-dashed ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'hover:border-primary/50 hover:bg-muted/30'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileUpload}
        >
          <CardContent className="flex flex-col items-center justify-center p-4 text-center h-full w-full">
            <Plus className={`h-8 w-8 mb-2 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-sm font-medium">{images.length > 0 ? 'Add more images' : 'Add images'}</p>
            {images.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Drag & drop or click to browse
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {images.length === 0 && (
        <div className="bg-muted/50 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Quality Photos Matter</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Listings with high-quality photos receive up to 70% more views. Aim for 4+ images showing different rooms and features.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 