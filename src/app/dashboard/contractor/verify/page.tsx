/**
 * THE RAIL EXCHANGE™ — Get Verified (Upsell Page)
 * 
 * This is the MARKETING page explaining why contractors should get verified.
 * NOT the document upload flow - that's at /dashboard/contractor/verify/start
 * 
 * Shows:
 * - Benefits of verification
 * - What's included
 * - Pricing ($149/year)
 * - Begin Verification CTA
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  BadgeCheck,
  TrendingUp,
  Star,
  Users,
  CheckCircle,
  ArrowRight,
  Loader2,
  Clock,
  XCircle,
  FileCheck,
} from 'lucide-react';

type VerificationStatus = 'none' | 'pending' | 'ai_approved' | 'approved' | 'verified' | 'rejected' | 'expired';

interface VerificationState {
  verificationStatus: VerificationStatus;
  hasContractorProfile: boolean;
}

export default function GetVerifiedPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verificationState, setVerificationState] = useState<VerificationState | null>(null);

  // Fetch current verification status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/contractors/verification/status');
        if (res.ok) {
          const data = await res.json();
          setVerificationState(data);
        }
      } catch (err) {
        console.error('Failed to fetch verification status:', err);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchStatus();
    } else if (sessionStatus !== 'loading') {
      setLoading(false);
    }
  }, [session, sessionStatus]);

  // Redirect if not authenticated
  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/login?callbackUrl=/dashboard/contractor/verify');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show status if already in verification process
  if (verificationState?.verificationStatus && verificationState.verificationStatus !== 'none') {
    return (
      <div className="max-w-3xl mx-auto">
        <VerificationStatusCard status={verificationState.verificationStatus} />
      </div>
    );
  }

  // Check if user has a contractor profile first
  if (!verificationState?.hasContractorProfile) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Create Your Profile First</h2>
          <p className="text-slate-500 mb-6">
            Before getting verified, you need to create your free contractor profile.
            This lets potential clients see your business info and services.
          </p>
          <Link
            href="/dashboard/contractor/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Create Contractor Profile
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-navy-900 mb-3">
          Get Verified as a Contractor
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Increase trust, visibility, and ranking by completing identity and insurance verification.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <BenefitCard
          icon={TrendingUp}
          title="Higher Ranking"
          description="Verified contractors appear higher in search results and directory listings."
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <BenefitCard
          icon={BadgeCheck}
          title="Trust Badge"
          description="Your profile displays a verified icon that builds instant credibility."
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <BenefitCard
          icon={Users}
          title="More Leads"
          description="Buyers prefer verified professionals. Get more inquiries and job requests."
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* What's Included */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 mb-10">
        <h2 className="text-xl font-bold text-navy-900 mb-6 text-center">
          What&apos;s Included in Verification
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <IncludedItem text="Identity Verification" />
          <IncludedItem text="Insurance Verification" />
          <IncludedItem text="Safety Certifications Review" />
          <IncludedItem text="Business Legitimacy Check" />
          <IncludedItem text="AI Fraud Detection" />
          <IncludedItem text="Human Admin Review" />
        </div>
      </div>

      {/* Pricing Box */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-center text-white mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-4">
          <Star className="w-4 h-4" />
          Most Popular
        </div>
        <h3 className="text-2xl font-bold mb-2">Verified Contractor Badge</h3>
        <div className="flex items-baseline justify-center gap-1 mb-6">
          <span className="text-5xl font-bold">$149</span>
          <span className="text-xl text-blue-200">/year</span>
        </div>
        <Link
          href="/dashboard/contractor/verify/start"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-bold text-lg"
        >
          Begin Verification
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-blue-200 text-sm mt-4">
          30-day money-back guarantee if not approved
        </p>
      </div>

      {/* FAQ / Process Steps */}
      <div className="bg-slate-50 rounded-xl p-8">
        <h2 className="text-xl font-bold text-navy-900 mb-6">How It Works</h2>
        <div className="space-y-4">
          <ProcessStep
            number={1}
            title="Submit Documents"
            description="Upload your identity, insurance certificate, and any safety certifications."
          />
          <ProcessStep
            number={2}
            title="AI Review"
            description="Our AI system checks documents for validity and flags any issues."
          />
          <ProcessStep
            number={3}
            title="Admin Approval"
            description="A human admin reviews your submission and approves your badge."
          />
          <ProcessStep
            number={4}
            title="Badge Activated"
            description="Your verified badge appears on your profile and in search results."
          />
        </div>
      </div>
    </div>
  );
}

// Components
function BenefitCard({
  icon: Icon,
  title,
  description,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
      <div className={`inline-flex items-center justify-center w-12 h-12 ${iconBg} rounded-xl mb-4`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-navy-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm">{description}</p>
    </div>
  );
}

function IncludedItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
      <span className="text-navy-900">{text}</span>
    </div>
  );
}

function ProcessStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-navy-900">{title}</h4>
        <p className="text-slate-500 text-sm">{description}</p>
      </div>
    </div>
  );
}

function VerificationStatusCard({ status }: { status: VerificationStatus }) {
  const statusConfig = {
    none: {
      icon: Shield,
      title: 'Not Verified',
      description: 'Start your verification journey to earn a trusted badge.',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      action: {
        text: 'Begin Verification',
        href: '/dashboard/contractor/verify/start',
      },
    },
    pending: {
      icon: Clock,
      title: 'Verification Pending',
      description: 'Your documents are being reviewed. This usually takes 1-2 business days.',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
    ai_approved: {
      icon: FileCheck,
      title: 'AI Review Complete',
      description: 'Your documents passed AI review! Complete payment to activate your badge.',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      action: {
        text: 'Complete Payment',
        href: '/dashboard/contractor/verify/payment',
      },
    },
    approved: {
      icon: CheckCircle,
      title: 'Approved - Awaiting Payment',
      description: 'Your verification is approved! Complete payment to activate your badge.',
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      action: {
        text: 'Complete Payment',
        href: '/dashboard/contractor/verify/payment',
      },
    },
    verified: {
      icon: BadgeCheck,
      title: 'Verified Contractor',
      description: 'Congratulations! Your verified badge is active and visible on your profile.',
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      action: {
        text: 'View Profile',
        href: '/dashboard/contractor/profile',
      },
    },
    rejected: {
      icon: XCircle,
      title: 'Verification Rejected',
      description: 'Unfortunately, your verification was not approved. Please review the feedback and try again.',
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      action: {
        text: 'Try Again',
        href: '/dashboard/contractor/verify/start',
      },
    },
    expired: {
      icon: Clock,
      title: 'Verification Expired',
      description: 'Your verified status has expired. Renew to maintain your badge.',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      action: {
        text: 'Renew Verification',
        href: '/dashboard/contractor/verify/start',
      },
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-8 text-center`}>
      <div className={`inline-flex items-center justify-center w-16 h-16 ${config.iconBg} rounded-2xl mb-4`}>
        <Icon className={`w-8 h-8 ${config.iconColor}`} />
      </div>
      <h2 className="text-xl font-bold text-navy-900 mb-2">{config.title}</h2>
      <p className="text-slate-600 mb-6">{config.description}</p>
      {'action' in config && config.action && (
        <Link
          href={config.action.href}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          {config.action.text}
          <ArrowRight className="w-5 h-5" />
        </Link>
      )}
    </div>
  );
}
