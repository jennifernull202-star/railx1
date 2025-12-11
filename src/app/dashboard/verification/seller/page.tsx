/**
 * THE RAIL EXCHANGE™ — Seller Verification Dashboard
 * 
 * /dashboard/verification/seller
 * 
 * Allows sellers to:
 * - Upload verification documents (driver's license, business license, EIN, insurance)
 * - Submit for AI verification
 * - View verification status and progress
 * - Complete subscription payment after admin approval
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
} from 'lucide-react';

interface VerificationDocument {
  type: string;
  fileName: string;
  uploadedAt: string;
}

interface VerificationData {
  status: string;
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
}

interface UserStatus {
  isVerifiedSeller: boolean;
  verifiedSellerStatus: string;
  verifiedSellerExpiresAt?: string;
}

const DOCUMENT_TYPES = [
  { id: 'drivers_license', label: "Driver's License", required: true, description: 'Valid government-issued photo ID' },
  { id: 'business_license', label: 'Business License', required: false, description: 'State or local business license (if applicable)' },
  { id: 'ein_document', label: 'EIN Document (IRS Letter)', required: false, description: 'IRS confirmation letter with your EIN' },
  { id: 'insurance_certificate', label: 'Insurance Certificate', required: false, description: 'Business liability insurance (optional)' },
];

export default function SellerVerificationPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchVerificationStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/verification/seller/upload');
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
      setSuccess('Payment successful! Your Verified Seller badge is now active.');
      // Refresh data
      fetchVerificationStatus();
    }
    if (searchParams.get('canceled') === 'true') {
      setError('Payment was canceled. Complete payment to activate your badge.');
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
      // Get presigned upload URL
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

      // Upload file to S3
      const uploadRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file');
      }

      // Refresh verification status
      await fetchVerificationStatus();
      setSuccess(`${DOCUMENT_TYPES.find(d => d.id === documentType)?.label} uploaded successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmitForVerification = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/verification/seller/submit', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setSuccess('Documents submitted for verification! We will review them shortly.');
      await fetchVerificationStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    if (!userStatus) return null;

    const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
      'none': { icon: Shield, color: 'text-slate-400', label: 'Not Verified' },
      'pending-ai': { icon: Clock, color: 'text-blue-500', label: 'Pending AI Review' },
      'pending-admin': { icon: Clock, color: 'text-amber-500', label: 'Pending Admin Review' },
      'active': { icon: CheckCircle2, color: 'text-emerald-500', label: 'Verified Seller — Active' },
      'revoked': { icon: XCircle, color: 'text-red-500', label: 'Badge Revoked' },
      'expired': { icon: AlertTriangle, color: 'text-amber-500', label: 'Badge Expired' },
    };

    const config = statusConfig[userStatus.verifiedSellerStatus] || statusConfig['none'];
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 ${config.color}`}>
        <Icon className="w-5 h-5" />
        <span className="font-semibold">{config.label}</span>
      </div>
    );
  };

  const getDocumentStatus = (typeId: string) => {
    if (!verification) return null;
    return verification.documents.find(d => d.type === typeId);
  };

  const canSubmit = () => {
    if (!verification) return false;
    const hasDriversLicense = verification.documents.some(d => d.type === 'drivers_license');
    const hasBusinessDoc = verification.documents.some(d => 
      d.type === 'business_license' || d.type === 'ein_document'
    );
    return hasDriversLicense && hasBusinessDoc && 
      ['draft', 'none', undefined].includes(verification.status) &&
      userStatus?.verifiedSellerStatus !== 'pending-ai' &&
      userStatus?.verifiedSellerStatus !== 'pending-admin';
  };

  const canResubmit = () => {
    return verification?.adminReview?.status === 'rejected' ||
      userStatus?.verifiedSellerStatus === 'expired' ||
      userStatus?.verifiedSellerStatus === 'revoked';
  };

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
          Verified Seller Program
        </h1>
        <p className="text-slate-500">
          Get a verified badge to increase trust and visibility with buyers
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
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Status Overview</h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {getStatusDisplay()}
            {userStatus?.verifiedSellerExpiresAt && userStatus.verifiedSellerStatus === 'active' && (
              <p className="text-sm text-slate-500 mt-1">
                Renews: {new Date(userStatus.verifiedSellerExpiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
          
          {userStatus?.isVerifiedSeller && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Badge Active</span>
            </div>
          )}
        </div>

        {/* Verification Progress */}
        {verification && verification.status !== 'draft' && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-navy-900 mb-4">Verification Progress</h3>
            <div className="flex items-center gap-2">
              {/* AI Review */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                verification.aiVerification.status === 'pending' 
                  ? 'bg-slate-100 text-slate-600' 
                  : verification.aiVerification.status === 'passed'
                  ? 'bg-emerald-100 text-emerald-700'
                  : verification.aiVerification.status === 'flagged'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {verification.aiVerification.status === 'pending' ? (
                  <Clock className="w-3 h-3" />
                ) : verification.aiVerification.status === 'passed' ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                AI Review
              </div>
              <span className="text-slate-300">→</span>
              
              {/* Admin Review */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                verification.adminReview.status === 'pending' 
                  ? 'bg-slate-100 text-slate-600' 
                  : verification.adminReview.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {verification.adminReview.status === 'pending' ? (
                  <Clock className="w-3 h-3" />
                ) : verification.adminReview.status === 'approved' ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                Admin Review
              </div>
              <span className="text-slate-300">→</span>
              
              {/* Subscription */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                verification.subscriptionStatus === 'active' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                <CreditCard className="w-3 h-3" />
                Subscription
              </div>
            </div>

            {/* AI Flags */}
            {verification.aiVerification.flags.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm font-medium text-amber-800 mb-2">AI Review Flags:</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  {verification.aiVerification.flags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rejection Reason */}
            {verification.adminReview.rejectionReason && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-700">{verification.adminReview.rejectionReason}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Badge Display */}
      {userStatus?.isVerifiedSeller && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Verified Seller Badge Active</h2>
              <p className="text-blue-100">Your badge is visible across the platform</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-200">Started:</span>
              <span className="ml-2 font-medium">
                {verification?.status === 'active' ? new Date().toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-blue-200">Renews:</span>
              <span className="ml-2 font-medium">
                {userStatus.verifiedSellerExpiresAt 
                  ? new Date(userStatus.verifiedSellerExpiresAt).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Section */}
      {!userStatus?.isVerifiedSeller && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-2">Upload Documents</h2>
            <p className="text-sm text-slate-500 mb-6">
              Upload the required documents below. All documents are stored securely and only accessible by admins.
            </p>

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

            {/* Submit Button */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              {canSubmit() && (
                <button
                  onClick={handleSubmitForVerification}
                  disabled={submitting}
                  className="w-full py-3 bg-rail-orange text-white font-semibold rounded-xl hover:bg-[#e55f15] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                  Submit for Verification
                </button>
              )}
              
              {canResubmit() && (
                <button
                  onClick={handleSubmitForVerification}
                  disabled={submitting}
                  className="w-full py-3 bg-navy-900 text-white font-semibold rounded-xl hover:bg-navy-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5" />
                  )}
                  Resubmit for Verification
                </button>
              )}

              {!canSubmit() && !canResubmit() && verification && (
                <div className="text-center py-3 text-slate-500">
                  {userStatus?.verifiedSellerStatus === 'pending-ai' && (
                    <p>AI verification in progress...</p>
                  )}
                  {userStatus?.verifiedSellerStatus === 'pending-admin' && (
                    <p>Awaiting admin review...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">Subscription Pricing</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-xl">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold text-navy-900">$9.99</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-sm text-slate-600">Billed monthly. Cancel anytime.</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold text-navy-900">$99</span>
                  <span className="text-slate-500">/year</span>
                </div>
                <p className="text-sm text-slate-600">Save $20/year with annual billing.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Benefits Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Verified Seller Benefits</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: 'Trust Badge', desc: 'Blue verified badge on all your listings' },
            { title: 'Priority Display', desc: 'Higher visibility in search results' },
            { title: 'Buyer Confidence', desc: 'Buyers prefer verified sellers' },
            { title: 'Professional Image', desc: 'Show you mean business' },
          ].map((benefit, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-navy-900">{benefit.title}</p>
                <p className="text-sm text-slate-500">{benefit.desc}</p>
              </div>
            </div>
          ))}
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
