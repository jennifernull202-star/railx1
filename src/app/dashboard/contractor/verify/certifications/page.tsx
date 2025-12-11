/**
 * THE RAIL EXCHANGE™ — Verification Step 3: Certifications
 * 
 * Certification uploads ONLY.
 * - FRA Safety Certification
 * - Roadway Worker Protection (RWP)
 * - Other industry certifications
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  X,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface UploadedDoc {
  url: string;
  name: string;
  uploadedAt: string;
  certType?: string;
}

export default function VerifyCertificationsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const [certifications, setCertifications] = useState<UploadedDoc[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/contractors/verification/documents');
        if (res.ok) {
          const data = await res.json();
          if (data.certifications) {
            setCertifications(data.certifications || []);
          }
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
    router.push('/auth/login?callbackUrl=/dashboard/contractor/verify/certifications');
    return null;
  }

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError('');

    try {
      const presignRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          folder: 'contractors',
          subfolder: 'verification/certifications',
          fileType: 'document',
        }),
      });

      const presignData = await presignRes.json();
      if (!presignData.success) {
        throw new Error(presignData.error || 'Failed to get upload URL');
      }

      await fetch(presignData.data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      setCertifications(prev => [...prev, {
        url: presignData.data.fileUrl,
        name: file.name,
        uploadedAt: new Date().toISOString(),
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeCertification = (index: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      await fetch('/api/contractors/verification/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'certifications',
          data: certifications,
        }),
      });

      router.push('/dashboard/contractor/verify/licenses');
    } catch (err) {
      setError('Failed to save. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Step 3 of 6</span>
          <span className="text-sm text-slate-500">Certifications</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: '50%' }} />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-2xl mb-4">
          <Award className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-navy-900 mb-2">Certifications</h1>
        <p className="text-slate-600">
          Upload your industry certifications (optional but recommended).
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-navy-900 mb-1.5">
            Safety & Industry Certifications
          </label>
          <p className="text-sm text-slate-500 mb-4">
            Examples: FRA Safety, Roadway Worker Protection (RWP), OSHA certifications
          </p>
        </div>

        {/* Uploaded Certifications */}
        {certifications.length > 0 && (
          <div className="space-y-2 mb-4">
            {certifications.map((cert, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium text-sm">{cert.name}</span>
                </div>
                <button
                  onClick={() => removeCertification(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area */}
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            ) : (
              <>
                <Plus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-sm text-slate-600">
                  Click to add a certification
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  PDF, JPG, PNG up to 10MB
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Certifications are optional but highly recommended. 
          They help build trust with potential clients and can improve your search ranking.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/contractor/verify/insurance"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
        <button
          onClick={handleContinue}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
