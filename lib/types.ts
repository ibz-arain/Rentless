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

export interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  phone_number?: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  date_of_birth?: string;
  profile_picture?: string | null;
  bio?: string | null;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
  date_of_birth?: string;
  profile_picture?: string;
  bio?: string;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  phone_number?: string;
  date_of_birth?: string;
  profile_picture?: string;
  bio?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  is_active?: boolean;
  role?: string;
} 
export interface Conversation {
  conversation_id: number;
  user1_id: number;
  user2_id: number;
  last_message_at?: string | null;
}

export interface Message {
  message_id: number;
  conversation_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  sent_at?: string;
  is_read: boolean;
}
