/**
 * THE RAIL EXCHANGE™ — Admin Contractor Verification Review
 * 
 * Admin page to review and approve/reject contractor verifications.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  Loader2,
  FileText,
  Building2,
  AlertTriangle,
  Search,
} from 'lucide-react';

interface PendingProfile {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  address: {
    city: string;
    state: string;
  };
  verificationDocuments: {
    businessLicense?: string;
    insuranceCertificate?: string;
    workPhotos?: string[];
    submittedAt?: string;
  };
  verificationResult?: {
    status: string;
    confidence: number;
    notes: string;
    reviewedBy: string;
  };
  createdAt: string;
}

export default function AdminVerificationsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PendingProfile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState('');

  // Check admin role
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, sessionStatus, router]);

  // Fetch pending verifications
  useEffect(() => {
    async function fetchPending() {
      try {
        const res = await fetch('/api/admin/contractors/verify');
        if (res.ok) {
          const data = await res.json();
          setProfiles(data.profiles || []);
        }
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.role === 'admin') {
      fetchPending();
    }
  }, [session]);

  // Handle approve/reject
  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedProfile) return;
    
    setProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/admin/contractors/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfile._id,
          action,
          notes: adminNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      // Remove from list
      setProfiles(prev => prev.filter(p => p._id !== selectedProfile._id));
      setSelectedProfile(null);
      setAdminNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Contractor Verifications
        </h1>
        <p className="text-text-secondary">
          Review and approve contractor verification requests.
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-secondary rounded-xl p-4 border border-border-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{profiles.length}</p>
              <p className="text-sm text-text-secondary">Pending Review</p>
            </div>
          </div>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-surface-secondary rounded-2xl p-12 text-center">
          <Shield className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            No Pending Verifications
          </h2>
          <p className="text-text-secondary">
            All contractor verifications have been reviewed.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1 space-y-3">
            {profiles.map((profile) => (
              <button
                key={profile._id}
                onClick={() => {
                  setSelectedProfile(profile);
                  setAdminNotes('');
                  setError('');
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedProfile?._id === profile._id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface-secondary border-border-primary hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-surface-tertiary rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-text-tertiary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {profile.businessName}
                    </p>
                    <p className="text-sm text-text-secondary truncate">
                      {profile.userId?.name || profile.businessEmail}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {profile.verificationResult?.status === 'needs_review' ? (
                        <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">
                          AI: Needs Review
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                          New Submission
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            {selectedProfile ? (
              <div className="bg-surface-secondary rounded-2xl border border-border-primary overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border-primary">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-text-primary">
                        {selectedProfile.businessName}
                      </h2>
                      <p className="text-text-secondary">
                        {selectedProfile.userId?.name} • {selectedProfile.businessEmail}
                      </p>
                    </div>
                    <Link
                      href={`/contractors/${selectedProfile._id}`}
                      target="_blank"
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      View Profile
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* AI Result */}
                {selectedProfile.verificationResult && (
                  <div className={`p-4 ${
                    selectedProfile.verificationResult.status === 'needs_review'
                      ? 'bg-amber-500/10'
                      : selectedProfile.verificationResult.status === 'approved'
                      ? 'bg-green-500/10'
                      : 'bg-red-500/10'
                  }`}>
                    <div className="flex items-start gap-3">
                      {selectedProfile.verificationResult.status === 'needs_review' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      ) : selectedProfile.verificationResult.status === 'approved' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-text-primary">
                          AI Review: {selectedProfile.verificationResult.status.replace('_', ' ')}
                          {selectedProfile.verificationResult.confidence > 0 && (
                            <span className="ml-2 text-sm text-text-secondary">
                              ({selectedProfile.verificationResult.confidence}% confidence)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-text-secondary mt-1">
                          {selectedProfile.verificationResult.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div className="p-6">
                  <h3 className="font-semibold text-text-primary mb-4">Submitted Documents</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Business License */}
                    <div className="bg-surface-primary rounded-xl border border-border-primary overflow-hidden">
                      <div className="p-3 border-b border-border-primary flex items-center gap-2">
                        <FileText className="w-4 h-4 text-text-secondary" />
                        <span className="text-sm font-medium text-text-primary">Business License</span>
                      </div>
                      {selectedProfile.verificationDocuments?.businessLicense ? (
                        <a
                          href={selectedProfile.verificationDocuments.businessLicense}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-[4/3] relative group"
                        >
                          <Image
                            src={selectedProfile.verificationDocuments.businessLicense}
                            alt="Business License"
                            fill
                            className="object-contain bg-white"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                        </a>
                      ) : (
                        <div className="aspect-[4/3] flex items-center justify-center bg-surface-tertiary">
                          <p className="text-sm text-text-tertiary">Not uploaded</p>
                        </div>
                      )}
                    </div>

                    {/* Insurance */}
                    <div className="bg-surface-primary rounded-xl border border-border-primary overflow-hidden">
                      <div className="p-3 border-b border-border-primary flex items-center gap-2">
                        <FileText className="w-4 h-4 text-text-secondary" />
                        <span className="text-sm font-medium text-text-primary">Insurance Certificate</span>
                      </div>
                      {selectedProfile.verificationDocuments?.insuranceCertificate ? (
                        <a
                          href={selectedProfile.verificationDocuments.insuranceCertificate}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-[4/3] relative group"
                        >
                          <Image
                            src={selectedProfile.verificationDocuments.insuranceCertificate}
                            alt="Insurance Certificate"
                            fill
                            className="object-contain bg-white"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                        </a>
                      ) : (
                        <div className="aspect-[4/3] flex items-center justify-center bg-surface-tertiary">
                          <p className="text-sm text-text-tertiary">Not uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Work Photos */}
                  {selectedProfile.verificationDocuments?.workPhotos && 
                   selectedProfile.verificationDocuments.workPhotos.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-text-primary mb-3">Work Photos</h4>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {selectedProfile.verificationDocuments.workPhotos.map((photo, idx) => (
                          <a
                            key={idx}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 relative group"
                          >
                            <Image
                              src={photo}
                              alt={`Work photo ${idx + 1}`}
                              fill
                              className="object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Notes & Actions */}
                <div className="p-6 border-t border-border-primary bg-surface-primary">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about your decision (optional for approval, recommended for rejection)"
                    rows={3}
                    className="w-full px-4 py-3 bg-surface-secondary border border-border-primary rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
                  />

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction('approve')}
                      disabled={processing}
                      className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleAction('reject')}
                      disabled={processing}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-secondary rounded-2xl p-12 text-center border border-border-primary">
                <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary">
                  Select a verification request to review
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
