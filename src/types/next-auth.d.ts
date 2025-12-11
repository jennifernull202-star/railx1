/**
 * THE RAIL EXCHANGE™ — NextAuth Type Extensions
 * 
 * Extends NextAuth types to include custom session data.
 * Updated to support capability-based permission system.
 */

import { UserRole, SellerTierType, ContractorTierType } from '@/models/User';
import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole; // Legacy - kept for backwards compat
      email: string;
      name: string;
      image?: string;
      // Capability flags
      isSeller: boolean;
      isContractor: boolean;
      isAdmin: boolean;
      // Subscription info
      subscriptionTier?: SellerTierType;
      isVerifiedContractor?: boolean;
      contractorTier?: ContractorTierType;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: UserRole; // Legacy - kept for backwards compat
    email: string;
    name: string;
    image?: string;
    // Capability flags
    isSeller?: boolean;
    isContractor?: boolean;
    isAdmin?: boolean;
    subscriptionTier?: SellerTierType;
    isVerifiedContractor?: boolean;
    contractorTier?: ContractorTierType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole; // Legacy - kept for backwards compat
    email: string;
    name: string;
    image?: string;
    // Capability flags
    isSeller: boolean;
    isContractor: boolean;
    isAdmin: boolean;
    subscriptionTier?: SellerTierType;
    isVerifiedContractor?: boolean;
    contractorTier?: ContractorTierType;
  }
}
