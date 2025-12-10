/**
 * THE RAIL EXCHANGE™ — Contractor Verification Page
 * 
 * Multi-step verification application form with document uploads.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Shield, 
  Upload, 
  FileCheck, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  BadgeCheck,
  Star,
  TrendingUp,
  CreditCard
} from 'lucide-react';

type VerificationStatus = 'none' | 'pending' | 'ai_approved' | 'approved' | 'verified' | 'rejected' | 'expired';

interface VerificationState {
  verificationStatus: VerificationStatus;
  verificationDocuments?: {
    businessLicense?: string;
    insuranceCertificate?: string;
    workPhotos?: string[];
    submittedAt?: string;
  };
  verificationResult?: {
    status: string;
    notes: string;
    reviewedAt: string;
  };
}

export default function ContractorVerifyPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verificationState, setVerificationState] = useState<VerificationState | null>(null);
  const [error, setError] = useState('');

  // Document uploads
  const [businessLicense, setBusinessLicense] = useState('');
  const [insuranceCertificate, setInsuranceCertificate] = useState('');
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Fetch current verification status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/contractors/verify');
        if (res.ok) {
          const data = await res.json();
          setVerificationState(data);
          
          // Pre-fill if documents exist
          if (data.verificationDocuments) {
            setBusinessLicense(data.verificationDocuments.businessLicense || '');
            setInsuranceCertificate(data.verificationDocuments.insuranceCertificate || '');
            setWorkPhotos(data.verificationDocuments.workPhotos || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch verification status:', err);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchStatus();
    }
  }, [session]);

  // Redirect if not authenticated
  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/login?callbackUrl=/dashboard/contractor/verify');
    return null;
  }

  // Upload document handler
  // SECURE: Documents stored in /contractors/<userId>/verification/
  const handleDocumentUpload = async (file: File, type: 'license' | 'insurance' | 'photo') => {
    setUploadingDoc(type);
    setError('');

    try {
      // Get presigned URL - SECURE PATH for verification documents
      const presignRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          folder: 'contractors',
          subfolder: 'verification', // SECURE: /contractors/<userId>/verification/
          fileType: 'document',
        }),
      });

      const presignData = await presignRes.json();
      if (!presignData.success) {
        throw new Error(presignData.error || 'Failed to get upload URL');
      }

      // Upload to S3
      await fetch(presignData.data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      const fileUrl = presignData.data.fileUrl;

      if (type === 'license') {
        setBusinessLicense(fileUrl);
      } else if (type === 'insurance') {
        setInsuranceCertificate(fileUrl);
      } else {
        setWorkPhotos(prev => [...prev, fileUrl]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingDoc(null);
    }
  };

  // Submit verification
  const handleSubmit = async () => {
    if (!businessLicense || !insuranceCertificate) {
      setError('Please upload both required documents');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/contractors/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessLicense,
          insuranceCertificate,
          workPhotos,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification submission failed');
      }

      // Refresh state
      setVerificationState({
        verificationStatus: data.verificationStatus,
        verificationResult: data.result,
      });

      // Redirect based on result
      if (data.verificationStatus === 'ai_approved') {
        router.push('/dashboard/contractor/verify/payment');
      } else {
        setStep(4); // Show result step
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already verified
  if (verificationState?.verificationStatus === 'verified') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 text-center border border-green-500/20">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <BadgeCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            You&apos;re a Verified Contractor!
          </h1>
          <p className="text-text-secondary mb-6">
            Your Verified badge is active and visible to all buyers.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/dashboard/contractor" className="btn-primary">
              Go to Dashboard
            </Link>
            <Link href="/dashboard/billing" className="btn-secondary">
              Manage Subscription
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Awaiting payment (ai_approved or approved)
  if (verificationState?.verificationStatus === 'ai_approved' || verificationState?.verificationStatus === 'approved') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-primary/10 to-orange-500/10 rounded-2xl p-8 text-center border border-primary/20">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Verification Approved! 🎉
          </h1>
          <p className="text-text-secondary mb-6">
            Your documents have been verified. Complete payment to activate your Verified badge.
          </p>
          
          <div className="bg-surface-secondary rounded-xl p-6 mb-6 text-left">
            <h3 className="font-semibold text-text-primary mb-4">Verified Contractor Benefits:</h3>
            <ul className="space-y-3">
              {[
                'Verified badge on your profile',
                'Priority placement in search results',
                'Increased trust from buyers',
                'Featured in contractor directory',
                'Analytics dashboard access',
              ].map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-3 text-text-secondary">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface-primary border border-border-primary rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Monthly subscription</p>
                <p className="text-2xl font-bold text-text-primary">$100<span className="text-sm font-normal text-text-secondary">/mo</span></p>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-secondary">or save with yearly</p>
                <p className="text-lg font-semibold text-green-500">$1,200/year</p>
              </div>
            </div>
          </div>

          <Link 
            href="/dashboard/contractor/verify/payment"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Complete Payment
          </Link>
        </div>
      </div>
    );
  }

  // Pending review
  if (verificationState?.verificationStatus === 'pending') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-surface-secondary rounded-2xl p-8 text-center border border-border-primary">
          <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Verification Under Review
          </h1>
          <p className="text-text-secondary mb-6">
            Your documents are being reviewed by our team. We&apos;ll notify you within 24-48 hours.
          </p>
          <Link href="/dashboard/contractor" className="btn-secondary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Rejected - allow resubmission
  if (verificationState?.verificationStatus === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-500/5 rounded-2xl p-8 border border-red-500/20">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary mb-1">
                Verification Not Approved
              </h1>
              <p className="text-text-secondary">
                {verificationState.verificationResult?.notes || 'Your documents could not be verified.'}
              </p>
            </div>
          </div>
          
          <div className="bg-surface-secondary rounded-xl p-4 mb-6">
            <h3 className="font-medium text-text-primary mb-2">Common reasons for rejection:</h3>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Document images are unclear or unreadable</li>
              <li>• Business name doesn&apos;t match your profile</li>
              <li>• Documents are expired</li>
              <li>• Missing required information</li>
            </ul>
          </div>

          <button
            onClick={() => {
              setVerificationState({ verificationStatus: 'none' });
              setStep(1);
            }}
            className="btn-primary w-full"
          >
            Resubmit Documents
          </button>
        </div>
      </div>
    );
  }

  // Application form (none status)
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Get Verified
        </h1>
        <p className="text-text-secondary">
          Complete verification to earn your Verified Contractor badge and stand out to buyers.
        </p>
      </div>

      {/* Benefits Banner */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6 mb-8 border border-green-500/20">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-green-500" />
          <h3 className="font-semibold text-text-primary">Verified Contractor Benefits</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <BadgeCheck className="w-4 h-4 text-green-500" />
            Verified badge
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Priority search ranking
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Star className="w-4 h-4 text-green-500" />
            Featured placement
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: 'Documents' },
          { num: 2, label: 'Portfolio' },
          { num: 3, label: 'Review' },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s.num 
                  ? 'bg-primary text-white' 
                  : 'bg-surface-secondary text-text-tertiary'
              }`}>
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-xs mt-1 ${step >= s.num ? 'text-text-primary' : 'text-text-tertiary'}`}>
                {s.label}
              </span>
            </div>
            {idx < 2 && (
              <div className={`w-20 sm:w-32 h-0.5 mx-2 ${
                step > s.num ? 'bg-primary' : 'bg-surface-tertiary'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Step 1: Required Documents */}
      {step === 1 && (
        <div className="bg-surface-secondary rounded-2xl p-6 border border-border-primary">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Required Documents
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            Upload clear images or PDFs of your business documents. These will be verified using AI.
          </p>

          <div className="space-y-6">
            {/* Business License */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Business License <span className="text-red-500">*</span>
              </label>
              {businessLicense ? (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <FileCheck className="w-6 h-6 text-green-500" />
                  <span className="text-sm text-text-primary flex-1">Business license uploaded</span>
                  <button
                    onClick={() => setBusinessLicense('')}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border-primary rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  {uploadingDoc === 'license' ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 text-text-tertiary mb-2" />
                  )}
                  <span className="text-sm text-text-secondary">
                    {uploadingDoc === 'license' ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </span>
                  <span className="text-xs text-text-tertiary mt-1">
                    PNG, JPG, or PDF up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    disabled={uploadingDoc === 'license'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDocumentUpload(file, 'license');
                    }}
                  />
                </label>
              )}
            </div>

            {/* Insurance Certificate */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Insurance Certificate <span className="text-red-500">*</span>
              </label>
              {insuranceCertificate ? (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <FileCheck className="w-6 h-6 text-green-500" />
                  <span className="text-sm text-text-primary flex-1">Insurance certificate uploaded</span>
                  <button
                    onClick={() => setInsuranceCertificate('')}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border-primary rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  {uploadingDoc === 'insurance' ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 text-text-tertiary mb-2" />
                  )}
                  <span className="text-sm text-text-secondary">
                    {uploadingDoc === 'insurance' ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </span>
                  <span className="text-xs text-text-tertiary mt-1">
                    PNG, JPG, or PDF up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    disabled={uploadingDoc === 'insurance'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDocumentUpload(file, 'insurance');
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={() => setStep(2)}
              disabled={!businessLicense || !insuranceCertificate}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Work Photos (Optional) */}
      {step === 2 && (
        <div className="bg-surface-secondary rounded-2xl p-6 border border-border-primary">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Work Photos <span className="text-text-tertiary font-normal">(Optional)</span>
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            Add photos of your completed projects to strengthen your verification.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {workPhotos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                <Image
                  src={photo}
                  alt={`Work photo ${idx + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setWorkPhotos(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XCircle className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
            
            {workPhotos.length < 6 && (
              <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border-primary rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                {uploadingDoc === 'photo' ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-text-tertiary mb-1" />
                    <span className="text-xs text-text-tertiary">Add photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingDoc === 'photo'}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDocumentUpload(file, 'photo');
                  }}
                />
              </label>
            )}
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="btn-primary flex items-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="bg-surface-secondary rounded-2xl p-6 border border-border-primary">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Review & Submit
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            Please review your documents before submitting for verification.
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-surface-primary rounded-xl border border-border-primary">
              <FileCheck className="w-6 h-6 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Business License</p>
                <p className="text-xs text-text-secondary">Document uploaded</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>

            <div className="flex items-center gap-3 p-4 bg-surface-primary rounded-xl border border-border-primary">
              <FileCheck className="w-6 h-6 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Insurance Certificate</p>
                <p className="text-xs text-text-secondary">Document uploaded</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>

            {workPhotos.length > 0 && (
              <div className="flex items-center gap-3 p-4 bg-surface-primary rounded-xl border border-border-primary">
                <FileCheck className="w-6 h-6 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">Work Photos</p>
                  <p className="text-xs text-text-secondary">{workPhotos.length} photo{workPhotos.length > 1 ? 's' : ''} uploaded</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-400 mb-1">AI-Powered Verification</p>
                <p className="text-text-secondary">
                  Your documents will be reviewed by our AI system. Most verifications complete within 1-5 minutes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(2)}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Submit for Verification
                  <Shield className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
