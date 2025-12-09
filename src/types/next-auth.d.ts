/**
 * THE RAIL EXCHANGE™ — NextAuth Type Extensions
 * 
 * Extends NextAuth types to include custom session data.
 */

import { UserRole } from '@/models/User';
import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      email: string;
      name: string;
      image?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: UserRole;
    email: string;
    name: string;
    image?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    email: string;
    name: string;
    image?: string;
  }
}
