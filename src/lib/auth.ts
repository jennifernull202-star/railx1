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
            role: user.role,
            image: user.image || undefined,
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
        token.role = user.role;
        token.image = user.image;
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.name = session.name || token.name;
        token.image = session.image || token.image;
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.image = token.image;
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
