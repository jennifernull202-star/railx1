/**
 * THE RAIL EXCHANGE™ — Seller Verification Dashboard
 * 
 * /dashboard/verification/seller
 * 
 * Two-tier seller verification system:
 * - Standard ($29): 24-hour AI verification
 * - Priority ($49): Instant AI verification + 3-day ranking boost
 * 
 * Verification is REQUIRED to create listings.
 * Expires after 1 year - requires renewal.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  FileText,
  AlertTriangle,
  Loader2,
  CreditCard,
  Info,
  RefreshCw,
  Zap,
  Crown,
  Calendar,
  TrendingUp,
} from 'lucide-react';

interface VerificationDocument {
  type: string;
  fileName: string;
  uploadedAt: string;
}

interface VerificationData {
  status: string;
  verificationTier: 'standard' | 'priority' | null;
  documents: VerificationDocument[];
  aiVerification: {
    status: string;
    confidence: number;
    flags: string[];
  };
  adminReview: {
    status: string;
    rejectionReason?: string;
  };
  subscriptionStatus?: string;
  approvedAt?: string;
  expiresAt?: string;
}

interface UserStatus {
  isVerifiedSeller: boolean;
  verifiedSellerStatus: string;
  verifiedSellerTier: 'standard' | 'priority' | null;
  verifiedSellerExpiresAt?: string;
  verifiedSellerApprovedAt?: string;
}

const DOCUMENT_TYPES = [
  { id: 'drivers_license', label: "Driver's License", required: true, description: 'Valid government-issued photo ID' },
  { id: 'business_license', label: 'Business License', required: false, description: 'State or local business license (if applicable)' },
  { id: 'ein_document', label: 'EIN Document (IRS Letter)', required: false, description: 'IRS confirmation letter with your EIN' },
  { id: 'insurance_certificate', label: 'Insurance Certificate', required: false, description: 'Business liability insurance (optional)' },
];

const VERIFICATION_TIERS = {
  standard: {
    id: 'standard',
    name: 'Standard Verification',
    price: 29,
    features: [
      'AI-assisted identity review',
      'AI-assisted document review',
      'AI-assisted authenticity check',
      'Verified Seller badge',
      '24-hour approval SLA',
      'Valid for 1 year',
    ],
    slaText: '24-hour approval',
    icon: Shield,
    color: 'blue',
    popular: false,
  },
  priority: {
    id: 'priority',
    name: 'Priority Verification',
    price: 49,
    features: [
      'Expedited AI-assisted review',
      'AI-assisted identity, document, and authenticity checks',
      'Priority Verified Seller badge',
      '3-day ranking boost for first listing',
      'Priority review queue',
      'Valid for 1 year',
    ],
    slaText: 'Instant approval',
    icon: Zap,
    color: 'amber',
    popular: true,
  },
};

export default function SellerVerificationPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTier, setSelectedTier] = useState<'standard' | 'priority'>('priority');

  const fetchVerificationStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/verification/seller/status');
      if (res.ok) {
        const data = await res.json();
        setVerification(data.verification);
        setUserStatus(data.userStatus);
      }
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for success/cancel from Stripe checkout
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccess('Payment successful! Your Seller Verification is now active. You can create listings!');
      fetchVerificationStatus();
    }
    if (searchParams.get('canceled') === 'true') {
      setError('Payment was canceled. Complete payment to activate your verification.');
    }
  }, [searchParams, fetchVerificationStatus]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (sessionStatus === 'authenticated') {
      fetchVerificationStatus();
    }
  }, [sessionStatus, router, fetchVerificationStatus]);

  const handleFileUpload = async (documentType: string, file: File) => {
    setUploading(documentType);
    setError('');

    try {
      const res = await fetch('/api/verification/seller/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file');
      }

      await fetchVerificationStatus();
      setSuccess(`${DOCUMENT_TYPES.find(d => d.id === documentType)?.label} uploaded successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleCheckout = async (tier: 'standard' | 'priority') => {
    setCheckingOut(tier);
    setError('');

    try {
      const res = await fetch('/api/verification/seller/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setCheckingOut(null);
    }
  };

  const getStatusDisplay = () => {
    if (!userStatus) return null;

    const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string; bgColor: string }> = {
      'none': { icon: Shield, color: 'text-slate-400', label: 'Not Verified', bgColor: 'bg-slate-50' },
      'pending-ai': { icon: Clock, color: 'text-blue-500', label: 'Pending AI Review', bgColor: 'bg-blue-50' },
      'pending-admin': { icon: Clock, color: 'text-amber-500', label: 'Pending Admin Review', bgColor: 'bg-amber-50' },
      'pending-payment': { icon: CreditCard, color: 'text-purple-500', label: 'Pending Payment', bgColor: 'bg-purple-50' },
      'active': { icon: CheckCircle2, color: 'text-emerald-500', label: 'Verified Seller — Active', bgColor: 'bg-emerald-50' },
      'revoked': { icon: XCircle, color: 'text-red-500', label: 'Verification Revoked', bgColor: 'bg-red-50' },
      'expired': { icon: AlertTriangle, color: 'text-amber-500', label: 'Verification Expired', bgColor: 'bg-amber-50' },
    };

    const config = statusConfig[userStatus.verifiedSellerStatus] || statusConfig['none'];
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${config.bgColor}`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
        <span className={`font-semibold ${config.color}`}>{config.label}</span>
        {userStatus.verifiedSellerTier && (
          <span className="ml-2 px-2 py-0.5 bg-white rounded text-xs font-medium capitalize">
            {userStatus.verifiedSellerTier} Tier
          </span>
        )}
      </div>
    );
  };

  const getDocumentStatus = (typeId: string) => {
    if (!verification) return null;
    return verification.documents.find(d => d.type === typeId);
  };

  const hasRequiredDocuments = () => {
    if (!verification) return false;
    const hasDriversLicense = verification.documents.some(d => d.type === 'drivers_license');
    const hasBusinessDoc = verification.documents.some(d => 
      d.type === 'business_license' || d.type === 'ein_document'
    );
    return hasDriversLicense && hasBusinessDoc;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!userStatus?.verifiedSellerExpiresAt) return null;
    const expiresAt = new Date(userStatus.verifiedSellerExpiresAt);
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isExpired = userStatus?.verifiedSellerStatus === 'expired';
  const isActive = userStatus?.verifiedSellerStatus === 'active' && userStatus?.isVerifiedSeller;
  const needsRenewal = isExpired || (getDaysRemaining() !== null && getDaysRemaining()! <= 30);

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 mb-2">
          Seller Verification
        </h1>
        <p className="text-slate-500">
          Verification is required to create listings on The Rail Exchange
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Status Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Verification Status</h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>{getStatusDisplay()}</div>
          
          {isActive && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-4 h-4" />
                <span>Good Until: <strong className="text-navy-900">{formatDate(userStatus?.verifiedSellerExpiresAt)}</strong></span>
              </div>
              {getDaysRemaining() !== null && getDaysRemaining()! <= 60 && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  getDaysRemaining()! <= 7 ? 'bg-red-100 text-red-700' :
                  getDaysRemaining()! <= 30 ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {getDaysRemaining()} days remaining
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Badge Display */}
      {isActive && !needsRenewal && (
        <div className={`rounded-2xl p-6 mb-6 text-white ${
          userStatus?.verifiedSellerTier === 'priority' 
            ? 'bg-gradient-to-r from-amber-500 to-orange-600' 
            : 'bg-gradient-to-r from-blue-600 to-blue-700'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              {userStatus?.verifiedSellerTier === 'priority' ? (
                <Crown className="w-10 h-10 text-white" />
              ) : (
                <Shield className="w-10 h-10 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {userStatus?.verifiedSellerTier === 'priority' ? 'Priority Verified Seller' : 'Verified Seller'}
              </h2>
              <p className="text-white/80">Your badge is visible across the platform</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/70">Approved:</span>
              <span className="ml-2 font-medium">{formatDate(userStatus?.verifiedSellerApprovedAt)}</span>
            </div>
            <div>
              <span className="text-white/70">Expires:</span>
              <span className="ml-2 font-medium">{formatDate(userStatus?.verifiedSellerExpiresAt)}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <a 
              href="/listings/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-navy-900 font-semibold rounded-lg hover:bg-white/90 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Create a Listing
            </a>
          </div>
        </div>
      )}

      {/* Renewal Warning / Expired State */}
      {needsRenewal && (
        <div className={`rounded-2xl p-6 mb-6 border-2 ${
          isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isExpired ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${isExpired ? 'text-red-600' : 'text-amber-600'}`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${isExpired ? 'text-red-800' : 'text-amber-800'}`}>
                {isExpired ? 'Your Verification Has Expired' : 'Verification Expiring Soon'}
              </h3>
              <p className={`mt-1 ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
                {isExpired 
                  ? 'You cannot create or edit listings until you renew your verification.'
                  : `Your verification expires on ${formatDate(userStatus?.verifiedSellerExpiresAt)}. Renew now to keep your listings active.`
                }
              </p>
              <button
                onClick={() => setSelectedTier(userStatus?.verifiedSellerTier || 'standard')}
                className={`mt-4 px-4 py-2 font-semibold rounded-lg transition-colors ${
                  isExpired 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Renew Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tier Selection - Show for new users or renewals */}
      {(!isActive || needsRenewal) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-2">
            {needsRenewal ? 'Renew Your Verification' : 'Choose Your Verification Tier'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Select a verification tier to start selling on The Rail Exchange
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {Object.values(VERIFICATION_TIERS).map((tier) => {
              const Icon = tier.icon;
              const isSelected = selectedTier === tier.id;
              
              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id as 'standard' | 'priority')}
                  className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? tier.id === 'priority'
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                        : 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                      RECOMMENDED
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tier.id === 'priority' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        tier.id === 'priority' ? 'text-amber-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-900">{tier.name}</h3>
                      <p className="text-sm text-slate-500">{tier.slaText}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-navy-900">${tier.price}</span>
                    <span className="text-slate-500 ml-1">one-time</span>
                  </div>
                  
                  <ul className="space-y-2 mb-4">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          tier.id === 'priority' ? 'text-amber-500' : 'text-blue-500'
                        }`} />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className={`w-5 h-5 rounded-full border-2 absolute top-5 right-5 flex items-center justify-center ${
                    isSelected 
                      ? tier.id === 'priority' 
                        ? 'border-amber-500 bg-amber-500' 
                        : 'border-blue-500 bg-blue-500'
                      : 'border-slate-300'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout Button */}
          <div className="mt-6">
            {hasRequiredDocuments() ? (
              <button
                onClick={() => handleCheckout(selectedTier)}
                disabled={checkingOut !== null}
                className={`w-full py-3 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  selectedTier === 'priority'
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {checkingOut ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
                {needsRenewal ? 'Renew Verification' : 'Continue to Payment'} — ${VERIFICATION_TIERS[selectedTier].price}
              </button>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <p className="text-slate-600">
                  Please upload the required documents below before proceeding to payment.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Upload Section */}
      {(!isActive || needsRenewal) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-2">Upload Documents</h2>
          <p className="text-sm text-slate-500 mb-4">
            Upload the required documents below. All documents are stored securely and only accessible by admins.
          </p>

          {/* Document Requirements Summary */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">What You&apos;ll Need</h3>
                <ul className="text-sm text-blue-700 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">1.</span>
                    <span><strong>Photo ID (Required):</strong> Driver&apos;s license, passport, or state ID</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">2.</span>
                    <span><strong>Business Document (Required):</strong> Upload ONE of the following:</span>
                  </li>
                </ul>
                <ul className="text-sm text-blue-600 ml-6 mt-1 space-y-0.5">
                  <li>• Business License (state or local)</li>
                  <li>• EIN Letter from IRS (CP 575 or 147C)</li>
                  <li>• LLC/Inc formation documents</li>
                </ul>
                <p className="text-xs text-blue-600 mt-3 italic">
                  Individual sellers without a business: Use EIN application receipt or sole proprietor docs
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {DOCUMENT_TYPES.map((docType) => {
              const uploaded = getDocumentStatus(docType.id);
              const isUploading = uploading === docType.id;

              return (
                <div 
                  key={docType.id}
                  className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        uploaded ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}>
                        {uploaded ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-navy-900">
                          {docType.label}
                          {docType.required && !docType.id.includes('business') && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                          {docType.id === 'business_license' && (
                            <span className="text-slate-500 text-sm ml-1">(or EIN required)</span>
                          )}
                        </p>
                        <p className="text-sm text-slate-500">{docType.description}</p>
                        {uploaded && (
                          <p className="text-xs text-emerald-600 mt-1">
                            ✓ {uploaded.fileName} uploaded
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isUploading 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : uploaded
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-navy-900 text-white hover:bg-navy-800'
                    }`}>
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {uploaded ? 'Replace' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType.id, file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Benefits Section - Why Verification Matters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-navy-900 mb-2">Why Verification Matters</h2>
        <p className="text-sm text-slate-500 mb-6">
          Document review helps buyers identify sellers who have submitted business documentation.
        </p>
        
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {[
            { 
              title: 'Required to List', 
              desc: 'Document submission is mandatory to create and publish equipment listings on the marketplace.',
              icon: Shield,
              color: 'blue'
            },
            { 
              title: 'Verification Badge', 
              desc: 'Your profile and listings display a verification badge after document review.',
              icon: CheckCircle2,
              color: 'green'
            },
            { 
              title: 'Higher Search Ranking', 
              desc: 'Document-reviewed sellers appear higher in search results, getting more buyer visibility.',
              icon: TrendingUp,
              color: 'amber'
            },
            { 
              title: 'Buyer Recognition', 
              desc: 'Many buyers filter for document-reviewed sellers when browsing listings.',
              icon: Crown,
              color: 'purple'
            },
          ].map((benefit, i) => {
            const Icon = benefit.icon;
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600',
              green: 'bg-emerald-100 text-emerald-600',
              amber: 'bg-amber-100 text-amber-600',
              purple: 'bg-purple-100 text-purple-600',
            };
            return (
              <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[benefit.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-navy-900">{benefit.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{benefit.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verification Coverage */}
        <div className="border-t border-slate-200 pt-5">
          <h3 className="font-semibold text-navy-900 mb-3">One Payment, Full Year Coverage</h3>
          <p className="text-sm text-slate-500 mb-3">
            Unlike subscription services, your verification is a one-time payment that covers you for a full year.
            No recurring charges, no surprise fees.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              365 days of verification
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Unlimited listings
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Renewal reminder at 30 days
            </span>
          </div>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-500">
            <p className="font-medium text-slate-600 mb-1">Important Disclaimer</p>
            <p>
              Verified Seller indicates identity and business documentation were submitted and reviewed.
              The Rail Exchange does not guarantee transactions, payments, item condition, or outcomes.
              All transactions occur directly between buyers and sellers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
