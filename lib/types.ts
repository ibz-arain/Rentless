export interface Property {
  property_id: number;
  landlord_id: number;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  monthly_rent: number;
  bedrooms: number;
  bathrooms: number;
  square_footage?: number | null;
  amenities?: string[] | null;
  available_from: string;
  created_at?: string;
  images?: string[] | null;
}

export interface CreatePropertyPayload {
  landlord_id: number;
  title: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  monthly_rent: number;
  bedrooms: number;
  bathrooms: number;
  square_footage?: number;
  amenities?: string[];
  available_from: string;
  images?: string[];
}

export interface UpdatePropertyPayload {
  landlord_id?: number;
  title?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  monthly_rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  amenities?: string[];
  available_from?: string;
  images?: string[];
} 