/**
 * THE RAIL EXCHANGE™ — Verification Step 6: Review & Submit
 * 
 * Final review of all uploaded documents before submission.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  User,
  Shield,
  Award,
  Building2,
  FolderOpen,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileCheck,
  Edit,
} from 'lucide-react';

interface UploadedDoc {
  url: string;
  name: string;
  uploadedAt: string;
}

interface VerificationData {
  identity?: {
    fullName: string;
    document: UploadedDoc;
  };
  insurance?: {
    provider: string;
    expiry: string;
    document: UploadedDoc;
  };
  certifications?: UploadedDoc[];
  licenses?: UploadedDoc[];
  additional?: UploadedDoc[];
}

export default function VerifyReviewPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<VerificationData>({});

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/contractors/verification/documents');
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error('Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      loadData();
    } else if (sessionStatus !== 'loading') {
      setLoading(false);
    }
  }, [session, sessionStatus]);

  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/login?callbackUrl=/dashboard/contractor/verify/review');
    return null;
  }

  const handleSubmit = async () => {
    // Validate required documents
    if (!data.identity?.document) {
      setError('Identity document is required');
      return;
    }
    if (!data.insurance?.document) {
      setError('Insurance document is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/contractors/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Submission failed');
      }

      // Redirect to payment or success page
      router.push('/dashboard/contractor/verify/payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const hasIdentity = !!data.identity?.document;
  const hasInsurance = !!data.insurance?.document;
  const certCount = data.certifications?.length || 0;
  const licenseCount = data.licenses?.length || 0;
  const additionalCount = data.additional?.length || 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Step 6 of 6</span>
          <span className="text-sm text-slate-500">Review & Submit</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%' }} />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
          <FileCheck className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-navy-900 mb-2">Review & Submit</h1>
        <p className="text-slate-600">
          Review your documents before submitting for verification.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Document Summary */}
      <div className="space-y-4 mb-8">
        {/* Identity */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasIdentity ? 'bg-green-100' : 'bg-red-100'}`}>
                <User className={`w-5 h-5 ${hasIdentity ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <h3 className="font-medium text-navy-900">Identity</h3>
                {hasIdentity ? (
                  <p className="text-sm text-green-600">{data.identity?.fullName} • Document uploaded</p>
                ) : (
                  <p className="text-sm text-red-600">Required - Missing</p>
                )}
              </div>
            </div>
            <Link href="/dashboard/contractor/verify/identity" className="text-blue-600 hover:text-blue-800">
              <Edit className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Insurance */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasInsurance ? 'bg-green-100' : 'bg-red-100'}`}>
                <Shield className={`w-5 h-5 ${hasInsurance ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <h3 className="font-medium text-navy-900">Insurance</h3>
                {hasInsurance ? (
                  <p className="text-sm text-green-600">{data.insurance?.provider} • Expires {data.insurance?.expiry}</p>
                ) : (
                  <p className="text-sm text-red-600">Required - Missing</p>
                )}
              </div>
            </div>
            <Link href="/dashboard/contractor/verify/insurance" className="text-blue-600 hover:text-blue-800">
              <Edit className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium text-navy-900">Certifications</h3>
                <p className="text-sm text-slate-600">
                  {certCount > 0 ? `${certCount} document(s) uploaded` : 'Optional - None uploaded'}
                </p>
              </div>
            </div>
            <Link href="/dashboard/contractor/verify/certifications" className="text-blue-600 hover:text-blue-800">
              <Edit className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Licenses */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-navy-900">Licenses</h3>
                <p className="text-sm text-slate-600">
                  {licenseCount > 0 ? `${licenseCount} document(s) uploaded` : 'Optional - None uploaded'}
                </p>
              </div>
            </div>
            <Link href="/dashboard/contractor/verify/licenses" className="text-blue-600 hover:text-blue-800">
              <Edit className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Additional Documents */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-medium text-navy-900">Additional Documents</h3>
                <p className="text-sm text-slate-600">
                  {additionalCount > 0 ? `${additionalCount} document(s) uploaded` : 'Optional - None uploaded'}
                </p>
              </div>
            </div>
            <Link href="/dashboard/contractor/verify/docs" className="text-blue-600 hover:text-blue-800">
              <Edit className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Submission Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Your documents will be reviewed by AI and our team</li>
              <li>Typical review time is 1-2 business days</li>
              <li>After approval, complete payment ($149/year) to activate your badge</li>
              <li>Your verified badge will appear on your contractor profile</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/contractor/verify/docs"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
        <button
          onClick={handleSubmit}
          disabled={submitting || !hasIdentity || !hasInsurance}
          className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Submit for Verification
            </>
          )}
        </button>
      </div>
    </div>
  );
}
