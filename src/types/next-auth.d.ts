/**
 * THE RAIL EXCHANGE™ — NextAuth Type Extensions
 * 
 * Extends NextAuth types to include custom session data.
 */

import { UserRole, SellerTierType, ContractorTierType } from '@/models/User';
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
      // Subscription info
      subscriptionTier?: SellerTierType;
      isVerifiedContractor?: boolean;
      contractorTier?: ContractorTierType;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: UserRole;
    email: string;
    name: string;
    image?: string;
    subscriptionTier?: SellerTierType;
    isVerifiedContractor?: boolean;
    contractorTier?: ContractorTierType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    email: string;
    name: string;
    image?: string;
    subscriptionTier?: SellerTierType;
    isVerifiedContractor?: boolean;
    contractorTier?: ContractorTierType;
  }
}
