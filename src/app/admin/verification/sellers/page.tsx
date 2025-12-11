/**
 * THE RAIL EXCHANGE™ — Admin Seller Verification Queue
 * 
 * /admin/verification/sellers
 * 
 * Admin page to:
 * - View all pending seller verifications
 * - Review uploaded documents (via secure presigned URLs)
 * - View AI verification flags and confidence scores
 * - Approve or reject verifications
 * - Revoke/reinstate badges
 * - Trigger re-verification
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  Loader2,
  FileText,
  User,
  Search,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface VerificationUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  sellerTier: string;
  isVerifiedSeller: boolean;
  verifiedSellerStatus: string;
}

interface VerificationDocument {
  type: string;
  fileName: string;
  uploadedAt: string;
  s3Key: string;
}

interface AIVerification {
  status: string;
  confidence: number;
  flags: string[];
  extractedData: Record<string, string>;
  nameMatchScore?: number;
  dateValidation?: {
    isExpired: boolean;
    expirationDate?: string;
  };
  tamperingDetection?: {
    score: number;
    indicators: string[];
  };
  duplicateCheck?: {
    isDuplicate: boolean;
    matchingUserId?: string;
  };
  fraudSignals?: string[];
  processedAt?: string;
}

interface AdminReview {
  status: string;
  reviewedBy?: { _id: string; name: string; email: string };
  reviewedAt?: string;
  notes?: string;
  rejectionReason?: string;
}

interface Verification {
  _id: string;
  userId: VerificationUser;
  status: string;
  documents: VerificationDocument[];
  aiVerification: AIVerification;
  adminReview: AdminReview;
  subscriptionStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSellerVerificationsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending-admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewingDocument, setViewingDocument] = useState<{ url: string; fileName: string } | null>(null);

  // Check admin access
  useEffect(() => {
    if (sessionStatus === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/dashboard');
    }
  }, [session, sessionStatus, router]);

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/verification/sellers?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setVerifications(data.verifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchVerifications();
    }
  }, [session, fetchVerifications]);

  const viewDocument = async (verificationId: string, documentType: string) => {
    try {
      const res = await fetch(
        `/api/admin/verification/sellers/${verificationId}/document?type=${documentType}`
      );
      if (res.ok) {
        const data = await res.json();
        setViewingDocument({ url: data.viewUrl, fileName: data.fileName });
      }
    } catch (err) {
      console.error('Failed to get document URL:', err);
    }
  };

  const handleAction = async (action: 'approve' | 'reject' | 'revoke' | 'reinstate') => {
    if (!selectedVerification) return;

    if (action === 'reject' && !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/admin/verification/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: selectedVerification._id,
          action,
          notes: adminNotes,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      setSuccess(`Verification ${action}d successfully`);
      
      // If approved, show checkout URL
      if (action === 'approve' && data.checkoutUrl) {
        setSuccess(`Approved! Payment link sent to user.`);
      }

      // Refresh list
      await fetchVerifications();
      setSelectedVerification(null);
      setAdminNotes('');
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'draft': { color: 'bg-slate-100 text-slate-600', label: 'Draft' },
      'pending-ai': { color: 'bg-blue-100 text-blue-700', label: 'AI Review' },
      'pending-admin': { color: 'bg-amber-100 text-amber-700', label: 'Admin Review' },
      'active': { color: 'bg-emerald-100 text-emerald-700', label: 'Active' },
      'revoked': { color: 'bg-red-100 text-red-700', label: 'Revoked' },
      'expired': { color: 'bg-slate-100 text-slate-600', label: 'Expired' },
    };
    const config = statusConfig[status] || { color: 'bg-slate-100 text-slate-600', label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getAIStatusBadge = (aiStatus: string, confidence: number) => {
    const colors = {
      passed: 'text-emerald-600',
      flagged: 'text-amber-600',
      failed: 'text-red-600',
      pending: 'text-slate-400',
    };
    return (
      <div className="flex items-center gap-2">
        <span className={`font-medium ${colors[aiStatus as keyof typeof colors] || colors.pending}`}>
          {aiStatus.charAt(0).toUpperCase() + aiStatus.slice(1)}
        </span>
        <span className="text-xs text-slate-500">({confidence}%)</span>
      </div>
    );
  };

  const filteredVerifications = verifications.filter(v => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.userId?.name?.toLowerCase().includes(query) ||
      v.userId?.email?.toLowerCase().includes(query)
    );
  });

  if (sessionStatus === 'loading' || (sessionStatus === 'authenticated' && session?.user?.role !== 'admin')) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-2">
            Seller Verification Queue
          </h1>
          <p className="text-slate-500">
            Review and approve seller verification applications
          </p>
        </div>
        <button
          onClick={fetchVerifications}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-700">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="pending-admin">Pending Review</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Verifications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No verifications found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">AI Review</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Flags</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Documents</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Submitted</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVerifications.map((v) => (
                <tr key={v._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-navy-900 text-sm">{v.userId?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{v.userId?.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getAIStatusBadge(v.aiVerification.status, v.aiVerification.confidence)}
                  </td>
                  <td className="px-4 py-3">
                    {v.aiVerification.flags.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-amber-600">{v.aiVerification.flags.length}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-emerald-600">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(v.status)}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{v.documents.length} files</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-500">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedVerification(v);
                        setAdminNotes('');
                        setRejectionReason('');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedVerification(null)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-navy-900">Review Verification</h2>
                  <p className="text-sm text-slate-500">{selectedVerification.userId?.name}</p>
                </div>
                <button
                  onClick={() => setSelectedVerification(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">User Info</p>
                    <p className="font-medium text-navy-900">{selectedVerification.userId?.name}</p>
                    <p className="text-sm text-slate-600">{selectedVerification.userId?.email}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Role: {selectedVerification.userId?.role} | Tier: {selectedVerification.userId?.sellerTier}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Current Status</p>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(selectedVerification.status)}
                      {selectedVerification.userId?.isVerifiedSeller && (
                        <span className="flex items-center gap-1 text-blue-600 text-sm">
                          <Shield className="w-4 h-4" />
                          Badge Active
                        </span>
                      )}
                    </div>
                    {selectedVerification.subscriptionStatus && (
                      <p className="text-sm text-slate-500">
                        Subscription: {selectedVerification.subscriptionStatus}
                      </p>
                    )}
                  </div>
                </div>

                {/* AI Verification Results */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-navy-900">AI Verification Results</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Status:</span>
                      {getAIStatusBadge(
                        selectedVerification.aiVerification.status,
                        selectedVerification.aiVerification.confidence
                      )}
                    </div>
                    
                    {selectedVerification.aiVerification.nameMatchScore !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Name Match Score:</span>
                        <span className={`font-medium ${
                          selectedVerification.aiVerification.nameMatchScore >= 80 
                            ? 'text-emerald-600' 
                            : 'text-amber-600'
                        }`}>
                          {selectedVerification.aiVerification.nameMatchScore}%
                        </span>
                      </div>
                    )}

                    {selectedVerification.aiVerification.tamperingDetection && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Tampering Score:</span>
                        <span className={`font-medium ${
                          selectedVerification.aiVerification.tamperingDetection.score >= 80 
                            ? 'text-emerald-600' 
                            : 'text-red-600'
                        }`}>
                          {selectedVerification.aiVerification.tamperingDetection.score}%
                          {selectedVerification.aiVerification.tamperingDetection.score < 80 && ' (SUSPICIOUS)'}
                        </span>
                      </div>
                    )}

                    {/* Flags */}
                    {selectedVerification.aiVerification.flags.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <p className="text-sm font-medium text-amber-800 mb-2">⚠️ AI Flags:</p>
                        <ul className="text-sm text-amber-700 space-y-1">
                          {selectedVerification.aiVerification.flags.map((flag, i) => (
                            <li key={i}>• {flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Fraud Signals */}
                    {selectedVerification.aiVerification.fraudSignals && selectedVerification.aiVerification.fraudSignals.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-2">🚨 Fraud Signals:</p>
                        <ul className="text-sm text-red-700 space-y-1">
                          {selectedVerification.aiVerification.fraudSignals.map((signal, i) => (
                            <li key={i}>• {signal}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Extracted Data */}
                    {Object.keys(selectedVerification.aiVerification.extractedData).length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Extracted Data:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(selectedVerification.aiVerification.extractedData).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-navy-900">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-navy-900">Uploaded Documents</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {selectedVerification.documents.map((doc) => (
                      <div key={doc.type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-sm text-navy-900 capitalize">
                              {doc.type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-slate-500">{doc.fileName}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => viewDocument(selectedVerification._id, doc.type)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    Admin Notes (Internal)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any internal notes about this verification..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Rejection Reason */}
                {selectedVerification.status === 'pending-admin' && (
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                      Rejection Reason (Required if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why the verification is being rejected..."
                      rows={2}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                  {selectedVerification.status === 'pending-admin' && (
                    <>
                      <button
                        onClick={() => handleAction('approve')}
                        disabled={processing}
                        className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction('reject')}
                        disabled={processing || !rejectionReason.trim()}
                        className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                        Reject
                      </button>
                    </>
                  )}
                  
                  {selectedVerification.status === 'active' && (
                    <button
                      onClick={() => handleAction('revoke')}
                      disabled={processing}
                      className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      Revoke Badge
                    </button>
                  )}

                  {(selectedVerification.status === 'revoked' || selectedVerification.status === 'expired') && (
                    <button
                      onClick={() => handleAction('reinstate')}
                      disabled={processing}
                      className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-5 h-5" />
                      )}
                      Reinstate (Requires New Payment)
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedVerification(null)}
                    className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black/70" onClick={() => setViewingDocument(null)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <p className="font-medium text-navy-900">{viewingDocument.fileName}</p>
                <div className="flex items-center gap-2">
                  <a
                    href={viewingDocument.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </a>
                  <button
                    onClick={() => setViewingDocument(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <XCircle className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-center bg-slate-100 min-h-[60vh]">
                {viewingDocument.fileName.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={viewingDocument.url}
                    className="w-full h-[70vh]"
                    title="Document Preview"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element -- 
                     Presigned S3 URLs for secure document viewing require native img.
                     Next/Image cannot be used with dynamic external presigned URLs. */
                  <img
                    src={viewingDocument.url}
                    alt="Document"
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
