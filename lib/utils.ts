import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function parseDbJson<T>(jsonString: string | null): T | null {
  if (!jsonString) return null;
  
  try {
    // If it's already an object/array (could happen when pre-parsed by API)
    if (typeof jsonString !== 'string') {
      return jsonString as unknown as T;
    }
    
    // Handle the case where the value might already be a stringified JSON
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error parsing JSON from database:', error);
    return null;
  }
}

export function formatPropertyData(property: any) {
  if (!property) return null;
  
  console.log('Formatting property data, raw input:', property);
  
  // First ensure we have a proper property object with all fields
  const propertyData = {
    ...property,
    amenities: property.amenities || null,
    images: property.images || null,
    monthly_rent: Number(property.monthly_rent),
    bedrooms: Number(property.bedrooms),
    bathrooms: Number(property.bathrooms),
    square_footage: property.square_footage ? Number(property.square_footage) : null,
    latitude: Number(property.latitude),
    longitude: Number(property.longitude),
    landlord_id: Number(property.landlord_id),
    property_id: Number(property.property_id),
  };
  
  // Now parse the JSON fields
  try {
    // Handle amenities
    if (propertyData.amenities) {
      if (Array.isArray(propertyData.amenities)) {
        // Already an array, keep as is
      } else if (typeof propertyData.amenities === 'string') {
        propertyData.amenities = JSON.parse(propertyData.amenities);
      } else {
        propertyData.amenities = null;
      }
    }
    
    // Handle images
    if (propertyData.images) {
      if (Array.isArray(propertyData.images)) {
        // Already an array, keep as is
      } else if (typeof propertyData.images === 'string') {
        propertyData.images = JSON.parse(propertyData.images);
      } else {
        propertyData.images = null;
      }
    }
  } catch (error) {
    console.error('Error parsing JSON fields:', error);
    // If there's an error parsing, set to null
    propertyData.amenities = null;
    propertyData.images = null;
  }
  
  console.log('Formatted property data:', propertyData);
  
  return propertyData;
}
