'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Image as ImageIcon, X, Plus, AlertCircle, Upload, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Item type for DnD
const ItemTypes = {
  IMAGE: 'image'
};

interface DragItem {
  index: number;
  id: string;
  type: string;
}

interface PropertyPhotosEditorProps {
  images: string[];
  onChange: (images: string[]) => void;
}

// Draggable image item component
const DraggableImage = ({ 
  url, 
  index, 
  moveImage, 
  removeImage, 
  handleImageError, 
  handleImageLoad, 
  imageErrors, 
  uploading 
}: { 
  url: string; 
  index: number; 
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  removeImage: (url: string) => void;
  handleImageError: (url: string) => void;
  handleImageLoad: (url: string) => void;
  imageErrors: Record<string, boolean>;
  uploading?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.IMAGE,
    item: { index, id: url, type: ItemTypes.IMAGE },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: ItemTypes.IMAGE,
    hover: (item: DragItem, monitor) => {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical and horizontal center
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      
      // Get mouse position
      const clientOffset = monitor.getClientOffset();
      
      if (!clientOffset) {
        return;
      }
      
      // Get position relative to the item
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      
      // Calculate distance from center points
      const distanceFromCenterY = Math.abs(hoverClientY - hoverMiddleY);
      const distanceFromCenterX = Math.abs(hoverClientX - hoverMiddleX);
      
      // Set a threshold to determine when to swap (30% of distance from center)
      const thresholdY = hoverBoundingRect.height * 0.3;
      const thresholdX = hoverBoundingRect.width * 0.3;
      
      // Only perform the move when we're close enough to the center
      // This creates a more predictable and smooth reordering
      if (distanceFromCenterX > thresholdX || distanceFromCenterY > thresholdY) {
        return;
      }
      
      // Time to actually perform the action
      moveImage(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      item.index = hoverIndex;
    },
  });
  
  // Apply drag and drop to the entire image container
  drag(drop(ref));
  
  return (
    <div 
      ref={ref}
      className={`relative group aspect-[4/3] bg-muted/30 border rounded-lg overflow-hidden shadow-sm transition-all duration-200 cursor-move ${
        isDragging ? 'opacity-50 border-primary scale-105 z-10 shadow-lg' : 'hover:shadow'
      }`}
    >
      {/* per-image loader */}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
          <Loader2 className="animate-spin h-6 w-6 text-primary" />
        </div>
      )}
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
          className="object-cover pointer-events-none"
          onError={() => handleImageError(url)}
          onLoad={() => handleImageLoad(url)}
        />
      )}
      <Button
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          removeImage(url);
        }}
      >
        <X className="h-4 w-4" />
      </Button>
      <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
        Image {index + 1}
      </div>
    </div>
  );
};

export function PropertyPhotosEditor({
  images,
  onChange
}: PropertyPhotosEditorProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  // Track uploading state per preview URL
  const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>({});
  // Keep a ref to latest images for async callbacks
  const imagesRef = useRef<string[]>(images);
  useEffect(() => { imagesRef.current = images; }, [images]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(files);
  };

  const processFiles = async (files: FileList) => {
    // Fetch signature and upload params
    let sigData;
    try {
      const res = await fetch('/api/cloudinary/signature');
      if (!res.ok) throw new Error('Failed to fetch upload signature');
      sigData = await res.json();
    } catch (err: any) {
      console.error('Error fetching signature:', err);
      toast({
        title: 'Upload Error',
        description: err.message || 'Could not get upload signature.',
        variant: 'destructive',
      });
      return;
    }
    const { cloudName, apiKey, signature, timestamp, folder } = sigData;

    // Validate files
    const validFiles: File[] = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not an image file.`,
          variant: 'destructive',
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the 10MB limit.`,
          variant: 'destructive',
        });
        return;
      }
      validFiles.push(file);
    });

    // Upload each file in parallel with preview placeholders
    validFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      // show preview immediately
      onChange([...imagesRef.current, previewUrl]);
      setUploadingMap(prev => ({ ...prev, [previewUrl]: true }));

      (async () => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('api_key', apiKey);
          formData.append('timestamp', timestamp.toString());
          formData.append('signature', signature);
          formData.append('folder', folder);

          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
            { method: 'POST', body: formData }
          );
          const data = await uploadRes.json();
          if (data.error) throw new Error(data.error.message || 'Upload failed');
          const secureUrl = data.secure_url;
          // replace preview with real URL
          const updatedImages = imagesRef.current.map(url => url === previewUrl ? secureUrl : url);
          onChange(updatedImages);
        } catch (err: any) {
          console.error('Error uploading to Cloudinary:', err);
          toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
        } finally {
          setUploadingMap(prev => {
            const { [previewUrl]: _, ...rest } = prev;
            return rest;
          });
          URL.revokeObjectURL(previewUrl);
        }
      })();
    });
  };

  const removeImage = useCallback((urlToRemove: string) => {
    onChange(images.filter(url => url !== urlToRemove));
    
    // Also remove from error tracking
    if (imageErrors[urlToRemove]) {
      const newErrors = { ...imageErrors };
      delete newErrors[urlToRemove];
      setImageErrors(newErrors);
    }
  }, [images, imageErrors, onChange]);

  const moveImage = useCallback((dragIndex: number, hoverIndex: number) => {
    const draggedImage = images[dragIndex];
    const newImages = [...images];
    newImages.splice(dragIndex, 1);
    newImages.splice(hoverIndex, 0, draggedImage);
    onChange(newImages);
  }, [images, onChange]);

  const handleImageError = useCallback((url: string) => {
    setImageErrors(prev => ({ ...prev, [url]: true }));
  }, []);

  const handleImageLoad = useCallback((url: string) => {
    if (imageErrors[url]) {
      const newErrors = { ...imageErrors };
      delete newErrors[url];
      setImageErrors(newErrors);
    }
  }, [imageErrors]);

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
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6 relative">
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        
        {/* Image preview grid - Added transition to grid items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Existing images */}
          {images.map((url, index) => (
            <DraggableImage
              key={`${url}_${index}`}
              url={url}
              index={index}
              moveImage={moveImage}
              removeImage={removeImage}
              handleImageError={handleImageError}
              handleImageLoad={handleImageLoad}
              imageErrors={imageErrors}
              uploading={!!uploadingMap[url]}
            />
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
        
        {images.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Tip:</span> Drag images to reorder them. The first image will be your listing's main photo.
          </p>
        )}
        
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
    </DndProvider>
  );
} 