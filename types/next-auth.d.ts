import NextAuth, { DefaultSession, User as NextAuthUser } from 'next-auth';
import { JWT as NextAuthJWT } from 'next-auth/jwt';

// My custom user properties from lib/types.ts
interface MyUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string; // Overlaps with NextAuthUser, ensure consistency
  phone_number?: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  date_of_birth?: string | null; // Changed from Date to string to match db and payload
  profile_picture?: string | null;
  bio?: string | null;
  is_active: boolean;
  role: string;
  created_at: string; // Changed from Date to string
  updated_at?: string | null; // Changed from Date to string
}

declare module 'next-auth' {
  interface User extends MyUser {
    id: number; // NextAuth expects id, mapping from user_id
  }

  interface Session {
    user: {
      id: number;
      role: string;
      // Add other custom properties from MyUser that you want in the session
      first_name: string;
      last_name: string;
      email: string; // Explicitly add email here, making it required on session.user
      profile_picture?: string | null; // Add profile picture to session
    } & Omit<DefaultSession['user'], 'email'>; // Merge with DefaultSession.user, but Omit its email to avoid conflict
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends NextAuthJWT {
    id: number;
    role: string;
    // Add other custom properties from MyUser that you want in the JWT
    first_name: string;
    last_name: string;
    email: string; // email is required in the JWT
    profile_picture?: string | null; // Add profile picture to JWT
  }
} 