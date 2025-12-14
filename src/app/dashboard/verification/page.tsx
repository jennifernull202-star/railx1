/**
 * THE RAIL EXCHANGE™ — Verification Hub
 * 
 * /dashboard/verification
 * 
 * Central verification selection page showing all verification options
 * based on user role with clear pricing and AI disclosure.
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ VERIFICATION OPTIONS BY ROLE                                        │
 * │                                                                      │
 * │ Buyer      → Buyer Verification — $1 lifetime                       │
 * │ Seller     → Seller Verification — $29/year                         │
 * │ Contractor → Professional Verification — $2,500/year                │
 * │ Company    → Professional Verification — $2,500/year                │
 * │                                                                      │
 * │ AI DISCLOSURE: All verification is AI-assisted with human review.   │
 * │ Verification does NOT guarantee performance, compliance, or trust.  │
 * └─────────────────────────────────────────────────────────────────────┘
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import connectDB from '@/lib/db';
import User from '@/models/User';
import {
  Shield,
  ShoppingCart,
  Store,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  Clock,
  CreditCard,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verification | Dashboard | The Rail Exchange',
  description: 'Choose your verification level on The Rail Exchange.',
};

interface VerificationOption {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  priceNote: string;
  features: string[];
  notIncluded: string[];
  href: string;
  icon: React.ElementType;
  recommended?: boolean;
}

const VERIFICATION_OPTIONS: Record<string, VerificationOption> = {
  buyer: {
    id: 'buyer',
    title: 'Buyer Verification',
    subtitle: 'For buyers contacting sellers',
    price: '$1',
    priceNote: 'One-time payment • Lifetime access',
    features: [
      'Verify you are a real person',
      'Contact sellers directly',
      'Submit inquiries on listings',
      'Save searches and favorites',
    ],
    notIncluded: [
      'Does NOT verify purchasing authority',
      'Does NOT guarantee transactions',
      'Does NOT imply endorsement',
    ],
    href: '/dashboard/verification/buyer',
    icon: ShoppingCart,
  },
  seller: {
    id: 'seller',
    title: 'Seller Verification',
    subtitle: 'For individuals selling equipment',
    price: '$29',
    priceNote: 'Per year • Renews annually',
    features: [
      'AI-assisted identity verification',
      'Create and publish listings',
      'Receive buyer inquiries',
      'Public seller profile',
      '"Verified Seller" badge',
    ],
    notIncluded: [
      'Does NOT verify business credentials',
      'Does NOT guarantee product quality',
      'Does NOT imply platform endorsement',
    ],
    href: '/dashboard/verification/seller',
    icon: Store,
  },
  professional: {
    id: 'professional',
    title: 'Professional Verification',
    subtitle: 'For contractors and companies',
    price: '$2,500',
    priceNote: 'Per year • All-in plan',
    features: [
      'AI-assisted business verification',
      'Full analytics suite included',
      'Contractor directory listing',
      'Map visibility',
      'Lead intelligence',
      'Unlimited listings',
      '"Verified Professional" badge',
    ],
    notIncluded: [
      'Does NOT verify regulatory compliance',
      'Does NOT guarantee work quality',
      'Does NOT imply platform endorsement',
    ],
    href: '/dashboard/verification/contractor',
    icon: Building2,
    recommended: true,
  },
};

async function getUserVerificationStatus(userId: string) {
  await connectDB();
  const user = await User.findById(userId).select(
    'role isVerifiedBuyer isVerifiedSeller verifiedSellerStatus verifiedSellerExpiresAt ' +
    'isContractor contractorVerificationStatus contractorTier pendingProfessionalUpgrade'
  ).lean();
  
  return user;
}

export default async function VerificationHubPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const user = await getUserVerificationStatus(session.user.id);
  if (!user) {
    redirect('/auth/login');
  }

  // Determine which options to show based on role and current status
  const userRole = user.role || 'buyer';
  const isVerifiedBuyer = user.isVerifiedBuyer === true;
  const isVerifiedSeller = user.isVerifiedSeller === true || user.verifiedSellerStatus === 'active';
  const isVerifiedContractor = user.contractorVerificationStatus === 'active';
  const isContractor = user.isContractor === true;

  // Calculate days remaining for seller verification
  const sellerDaysRemaining = user.verifiedSellerExpiresAt 
    ? Math.max(0, Math.ceil((new Date(user.verifiedSellerExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Determine relevant options
  const relevantOptions: VerificationOption[] = [];
  
  // Always show buyer verification if not verified
  if (!isVerifiedBuyer) {
    relevantOptions.push(VERIFICATION_OPTIONS.buyer);
  }
  
  // Show seller verification if user is a seller and not verified
  if ((userRole === 'seller' || userRole === 'buyer') && !isVerifiedSeller && !isVerifiedContractor) {
    relevantOptions.push(VERIFICATION_OPTIONS.seller);
  }
  
  // Show professional verification if user is contractor/company
  if ((userRole === 'contractor' || isContractor) && !isVerifiedContractor) {
    relevantOptions.push(VERIFICATION_OPTIONS.professional);
  }

  // If user has all verifications for their role, show success state
  const hasAllRequiredVerifications = 
    (userRole === 'buyer' && isVerifiedBuyer) ||
    (userRole === 'seller' && isVerifiedSeller) ||
    (userRole === 'contractor' && isVerifiedContractor);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 mb-2">Verification</h1>
        <p className="text-slate-500">
          Choose your verification level to unlock platform features
        </p>
      </div>

      {/* AI Disclosure Banner - MANDATORY */}
      <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 mb-1">About Verification</p>
            <p className="text-amber-700">
              Verification is assisted by automated (AI) analysis and human review. 
              Verification confirms document submission only and does not guarantee 
              performance, authority, compliance, or transaction outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* Current Status Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Your Verification Status</h2>
        
        <div className="space-y-4">
          {/* Buyer Status */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isVerifiedBuyer ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                <ShoppingCart className={`w-5 h-5 ${isVerifiedBuyer ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="font-medium text-navy-900">Buyer Verification</p>
                <p className="text-xs text-slate-500">Contact sellers and submit inquiries</p>
              </div>
            </div>
            {isVerifiedBuyer ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Verified
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                <Clock className="w-4 h-4" />
                Not Verified
              </span>
            )}
          </div>

          {/* Seller Status */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isVerifiedSeller ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                <Store className={`w-5 h-5 ${isVerifiedSeller ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="font-medium text-navy-900">Seller Verification</p>
                <p className="text-xs text-slate-500">Create listings and receive inquiries</p>
              </div>
            </div>
            {isVerifiedSeller ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Active
                </span>
                {sellerDaysRemaining !== null && sellerDaysRemaining <= 60 && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    sellerDaysRemaining <= 7 ? 'bg-red-100 text-red-700' :
                    sellerDaysRemaining <= 30 ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {sellerDaysRemaining} days left
                  </span>
                )}
              </div>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                <Clock className="w-4 h-4" />
                Not Verified
              </span>
            )}
          </div>

          {/* Professional Status */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isVerifiedContractor ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                <Building2 className={`w-5 h-5 ${isVerifiedContractor ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="font-medium text-navy-900">Professional Verification</p>
                <p className="text-xs text-slate-500">Full platform access for contractors/companies</p>
              </div>
            </div>
            {isVerifiedContractor ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                <Clock className="w-4 h-4" />
                Not Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Verification Options */}
      {relevantOptions.length > 0 ? (
        <>
          <h2 className="text-lg font-semibold text-navy-900 mb-4">Available Verification Options</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {relevantOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div 
                  key={option.id}
                  className={`bg-white rounded-2xl border-2 p-6 relative ${
                    option.recommended 
                      ? 'border-rail-orange shadow-lg' 
                      : 'border-slate-200'
                  }`}
                >
                  {option.recommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-rail-orange text-white text-xs font-semibold rounded-full">
                      Recommended
                    </span>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${
                      option.recommended ? 'bg-rail-orange/10' : 'bg-slate-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        option.recommended ? 'text-rail-orange' : 'text-slate-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-900">{option.title}</h3>
                      <p className="text-xs text-slate-500">{option.subtitle}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-navy-900">{option.price}</span>
                    <p className="text-xs text-slate-500 mt-1">{option.priceNote}</p>
                  </div>
                  
                  <ul className="space-y-2 mb-4">
                    {option.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="border-t border-slate-100 pt-4 mb-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Does NOT include:</p>
                    <ul className="space-y-1">
                      {option.notIncluded.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Link
                    href={option.href}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors ${
                      option.recommended
                        ? 'bg-rail-orange hover:bg-rail-orange-dark text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-navy-900'
                    }`}
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      ) : hasAllRequiredVerifications ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-emerald-800 mb-2">You&apos;re All Set!</h2>
          <p className="text-emerald-700 mb-4">
            You have completed verification for your account type.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : null}

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-navy-900 mb-6">Verification Comparison</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-500">Feature</th>
                <th className="text-center py-3 px-4 font-medium text-slate-500">Buyer<br/><span className="text-xs font-normal">$1 lifetime</span></th>
                <th className="text-center py-3 px-4 font-medium text-slate-500">Seller<br/><span className="text-xs font-normal">$29/year</span></th>
                <th className="text-center py-3 px-4 font-medium text-rail-orange">Professional<br/><span className="text-xs font-normal">$2,500/year</span></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-slate-600">Browse marketplace</td>
                <td className="py-3 px-4 text-center">Free</td>
                <td className="py-3 px-4 text-center">Free</td>
                <td className="py-3 px-4 text-center">Free</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-slate-600">Contact sellers</td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-slate-600">Create listings</td>
                <td className="py-3 px-4 text-center">—</td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-slate-600">Verified badge</td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-slate-600">Analytics access</td>
                <td className="py-3 px-4 text-center">—</td>
                <td className="py-3 px-4 text-center text-xs text-slate-400">Add-on ($49/yr)</td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-slate-600">Directory listing</td>
                <td className="py-3 px-4 text-center">—</td>
                <td className="py-3 px-4 text-center">—</td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-slate-600">Map visibility</td>
                <td className="py-3 px-4 text-center">—</td>
                <td className="py-3 px-4 text-center">—</td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-600">Lead intelligence</td>
                <td className="py-3 px-4 text-center">—</td>
                <td className="py-3 px-4 text-center">—</td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Footer */}
      <div className="mt-8 p-4 bg-slate-50 rounded-xl">
        <p className="text-xs text-slate-500 text-center">
          <strong>Important:</strong> Verification confirms document submission and identity only. 
          The Rail Exchange does not participate in transactions, verify regulatory compliance, 
          or guarantee performance, quality, or outcomes. All certifications displayed are self-reported 
          by users and have not been independently verified.
        </p>
      </div>
    </div>
  );
}
