/**
 * THE RAIL EXCHANGE™ — NextAuth Configuration
 * 
 * Provides authentication using credentials (email/password).
 * Uses JWT sessions with role-based access control.
 * 
 * SECURITY CONTROLS:
 * - 24-hour session max age (enterprise requirement)
 * - 4-hour idle timeout (enterprise requirement)
 * - Failed login attempt logging (audit compliance)
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/db';
import User from '@/models/User';
import LoginAttemptLog from '@/models/LoginAttemptLog';

// Helper to log failed login attempts (fire-and-forget, don't block auth flow)
async function logFailedAttempt(
  email: string,
  reason: 'invalid_credentials' | 'account_not_found' | 'account_inactive',
  userId?: string
) {
  try {
    await LoginAttemptLog.logAttempt({
      userId,
      email,
      ipAddress: 'server', // IP captured at API layer if needed
      reason,
      success: false,
    });
  } catch (err) {
    console.error('Failed to log login attempt:', err);
  }
}

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
        // SEV-1 DEBUG: Entry point logging
        console.log('[AUTH DEBUG] authorize() called with email:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH DEBUG] Missing email or password');
          throw new Error('Please provide both email and password');
        }

        try {
          await connectDB();
          console.log('[AUTH DEBUG] DB connected');

          // Find user with password field included
          const user = await User.findByEmail(credentials.email);
          console.log('[AUTH DEBUG] User lookup result:', user ? `Found user ${user._id} role=${user.role} isAdmin=${user.isAdmin}` : 'NOT FOUND');

          if (!user) {
            // SECURITY: Log failed attempt - account not found
            await logFailedAttempt(credentials.email, 'account_not_found');
            console.log('[AUTH DEBUG] Throwing: No account found');
            throw new Error('No account found with this email');
          }

          if (!user.isActive) {
            // SECURITY: Log failed attempt - account inactive
            await logFailedAttempt(credentials.email, 'account_inactive', user._id.toString());
            console.log('[AUTH DEBUG] Throwing: Account inactive');
            throw new Error('Your account has been deactivated');
          }

          // Verify password
          const isPasswordValid = await user.comparePassword(credentials.password);
          console.log('[AUTH DEBUG] Password valid:', isPasswordValid);

          if (!isPasswordValid) {
            // SECURITY: Log failed attempt - invalid credentials
            await logFailedAttempt(credentials.email, 'invalid_credentials', user._id.toString());
            console.log('[AUTH DEBUG] Throwing: Invalid password');
            throw new Error('Invalid password');
          }

          // Update last login
          user.lastLogin = new Date();
          await user.save();

          // Return user data for session
          const returnUser = {
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
          console.log('[AUTH DEBUG] Returning user object:', JSON.stringify({ id: returnUser.id, email: returnUser.email, role: returnUser.role, isAdmin: returnUser.isAdmin }));
          return returnUser;
        } catch (error) {
          console.error('[AUTH DEBUG] Auth error caught:', error);
          throw error;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (enterprise security requirement)
  },

  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours (enterprise security requirement)
  },

  pages: {
    signIn: '/auth/login',
    newUser: '/auth/register',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // SEV-1 DEBUG: JWT callback logging
      console.log('[AUTH DEBUG] jwt() callback - trigger:', trigger, 'hasUser:', !!user);
      
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
        // SECURITY: Track last activity for idle timeout (4 hours)
        token.lastActivity = Date.now();
        console.log('[AUTH DEBUG] jwt() - token populated from user:', JSON.stringify({ id: token.id, role: token.role, isAdmin: token.isAdmin }));
      }

      // SECURITY: Idle timeout check (4 hours = 14400000ms)
      // If idle for too long, mark token as expired to force re-auth
      const IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000;
      if (token.lastActivity && Date.now() - (token.lastActivity as number) > IDLE_TIMEOUT_MS) {
        // Mark token as expired - session callback will handle logout
        token.expired = true;
      } else {
        // Update last activity on each request
        token.lastActivity = Date.now();
      }

      // Handle session updates
      // SECURITY: Only allow updating non-privileged fields
      // subscriptionTier, isVerifiedContractor, isContractor CANNOT be modified
      // by client-side session.update() - these must come from DB/webhook only
      if (trigger === 'update' && session) {
        // ALLOWED: Profile fields only
        token.name = session.name || token.name;
        token.image = session.image || token.image;
        
        // SECURITY: REMOVED - No client-controlled privilege mutation
        // subscriptionTier, isVerifiedContractor, isContractor are READ-ONLY from JWT
        // All access checks must verify against database state
        // DO NOT UNCOMMENT:
        // - session.subscriptionTier
        // - session.isVerifiedContractor
        // - session.isContractor
      }

      return token;
    },

    async session({ session, token }) {
      // SEV-1 DEBUG: Session callback logging
      console.log('[AUTH DEBUG] session() callback - token.id:', token.id, 'token.isAdmin:', token.isAdmin, 'token.expired:', token.expired);
      
      // SECURITY: Check for idle timeout expiration
      if (token.expired) {
        // Return an empty session to force re-authentication
        // The client-side will detect this and redirect to login
        console.log('[AUTH DEBUG] session() - token expired, returning empty session');
        return { ...session, user: undefined, expires: new Date(0).toISOString() };
      }

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
        console.log('[AUTH DEBUG] session() - session.user populated:', JSON.stringify({ id: session.user.id, role: session.user.role, isAdmin: session.user.isAdmin }));
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
