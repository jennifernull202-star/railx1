/**
 * THE RAIL EXCHANGE™ — NextAuth Configuration
 * 
 * Provides authentication using credentials (email/password).
 * Uses JWT sessions with role-based access control.
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/db';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'you@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide both email and password');
        }

        try {
          await connectDB();

          // Find user with password field included
          const user = await User.findByEmail(credentials.email);

          if (!user) {
            throw new Error('No account found with this email');
          }

          if (!user.isActive) {
            throw new Error('Your account has been deactivated');
          }

          // Verify password
          const isPasswordValid = await user.comparePassword(credentials.password);

          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          // Update last login
          user.lastLogin = new Date();
          await user.save();

          // Return user data for session
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role, // Legacy - kept for backwards compat
            image: user.image || undefined,
            // Capability flags
            isSeller: user.isSeller ?? true, // Default true for all users
            isContractor: user.isContractor ?? false,
            isAdmin: user.isAdmin ?? (user.role === 'admin'), // Fallback for migration
            // Subscription info
            subscriptionTier: user.sellerTier !== 'buyer' ? user.sellerTier : undefined,
            isVerifiedContractor: user.contractorTier === 'verified',
            contractorTier: user.contractorTier,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/login',
    newUser: '/auth/register',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role; // Legacy - kept for backwards compat
        token.image = user.image;
        // Capability flags
        token.isSeller = user.isSeller ?? true;
        token.isContractor = user.isContractor ?? false;
        token.isAdmin = user.isAdmin ?? false;
        token.subscriptionTier = user.subscriptionTier;
        token.isVerifiedContractor = user.isVerifiedContractor;
        token.contractorTier = user.contractorTier;
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.name = session.name || token.name;
        token.image = session.image || token.image;
        if (session.subscriptionTier !== undefined) {
          token.subscriptionTier = session.subscriptionTier;
        }
        if (session.isVerifiedContractor !== undefined) {
          token.isVerifiedContractor = session.isVerifiedContractor;
        }
        if (session.isContractor !== undefined) {
          token.isContractor = session.isContractor;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role; // Legacy - kept for backwards compat
        session.user.image = token.image;
        // Capability flags
        session.user.isSeller = token.isSeller ?? true;
        session.user.isContractor = token.isContractor ?? false;
        session.user.isAdmin = token.isAdmin ?? false;
        session.user.subscriptionTier = token.subscriptionTier;
        session.user.isVerifiedContractor = token.isVerifiedContractor;
        session.user.contractorTier = token.contractorTier;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after login
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },

  events: {
    async signIn({ user }) {
      console.log(`✅ User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`🔌 User signed out: ${token.email}`);
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
