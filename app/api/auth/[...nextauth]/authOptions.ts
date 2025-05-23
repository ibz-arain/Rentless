import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { User as DbUser } from '@/lib/types';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const userResult = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [credentials.email]
          );

          if (userResult.rows.length === 0) {
            return null;
          }

          const dbUser = userResult.rows[0] as unknown as DbUser;
          const passwordMatch = await bcrypt.compare(credentials.password, dbUser.password_hash);

          if (!passwordMatch) {
            return null;
          }
          
          const { password_hash, ...userFromDb } = dbUser;
          const nextAuthUser: NextAuthUser = {
            user_id: dbUser.user_id,
            first_name: dbUser.first_name,
            last_name: dbUser.last_name,
            email: dbUser.email, 
            phone_number: dbUser.phone_number,
            email_verified: dbUser.email_verified,
            phone_verified: dbUser.phone_verified,
            date_of_birth: dbUser.date_of_birth,
            profile_picture: dbUser.profile_picture,
            bio: dbUser.bio,
            is_active: dbUser.is_active,
            role: dbUser.role, 
            created_at: dbUser.created_at,
            updated_at: dbUser.updated_at,
            id: dbUser.user_id, 
          };
          
          return nextAuthUser;
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const augmentedUser = user as NextAuthUser;
        token.id = augmentedUser.id;
        token.email = augmentedUser.email!;
        token.role = augmentedUser.role;
        token.first_name = augmentedUser.first_name;
        token.last_name = augmentedUser.last_name;
        token.profile_picture = augmentedUser.profile_picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as number;
        session.user.email = token.email as string; 
        session.user.role = token.role as string;
        session.user.first_name = token.first_name as string;
        session.user.last_name = token.last_name as string;
        session.user.profile_picture = token.profile_picture as string | null | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}; 