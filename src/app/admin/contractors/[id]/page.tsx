/**
 * THE RAIL EXCHANGE™ — Admin Contractor Detail Page
 * 
 * View and manage individual contractor profiles.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Phone,
  Globe,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Wrench,
  AlertTriangle,
  FileCheck,
  Ban,
} from 'lucide-react';

interface ContractorDetail {
  _id: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  services: string[];
  regionsServed: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
  website?: string;
  insuranceVerified?: boolean;
  description?: string;
  certifications?: string[];
  yearsExperience?: number;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'verified': return 'bg-green-100 text-green-700';
    case 'rejected': return 'bg-red-100 text-red-700';
    case 'pending': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'verified': return CheckCircle;
    case 'rejected': return XCircle;
    case 'pending': return Clock;
    default: return Clock;
  }
};

export default function AdminContractorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractorId = params.id as string;
  
  const [contractor, setContractor] = useState<ContractorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    const fetchContractor = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/contractors/${contractorId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Contractor not found');
            return;
          }
          throw new Error('Failed to fetch contractor');
        }
        const data = await res.json();
        setContractor(data.contractor);
      } catch (err) {
        setError('Failed to load contractor details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (contractorId) {
      fetchContractor();
    }
  }, [contractorId]);

  const handleVerify = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/contractors/${contractorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });
      if (!res.ok) throw new Error('Failed to verify');
      const data = await res.json();
      setContractor(data.contractor);
    } catch (err) {
      console.error('Failed to verify:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/contractors/${contractorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectReason }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      const data = await res.json();
      setContractor(data.contractor);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      console.error('Failed to reject:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/contractors/${contractorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend' }),
      });
      if (!res.ok) throw new Error('Failed to suspend');
      const data = await res.json();
      setContractor(data.contractor);
    } catch (err) {
      console.error('Failed to suspend:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !contractor) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            {error || 'Contractor not found'}
          </h2>
          <Link
            href="/admin/contractors"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contractors
          </Link>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(contractor.verificationStatus);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link
          href="/admin/contractors"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Contractors
        </Link>
      </div>

      {/* Contractor Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Wrench className="h-10 w-10 text-blue-600" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{contractor.businessName}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full capitalize ${getStatusColor(contractor.verificationStatus)}`}>
                  <StatusIcon className="h-4 w-4" />
                  {contractor.verificationStatus}
                </span>
                {contractor.insuranceVerified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
                    <Shield className="h-4 w-4" />
                    Insurance Verified
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {contractor.businessEmail}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  {contractor.businessPhone}
                </span>
                {contractor.website && (
                  <a 
                    href={contractor.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-purple-600 hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {contractor.verificationStatus === 'pending' && (
                <>
                  <button
                    onClick={handleVerify}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Verify
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </>
              )}
              {contractor.verificationStatus === 'verified' && (
                <button
                  onClick={handleSuspend}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  <Ban className="h-4 w-4" />
                  Suspend
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Services */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-purple-600" />
              Services Offered
            </h3>
            <div className="flex flex-wrap gap-2">
              {contractor.services.map((service) => (
                <span key={service} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Regions Served
            </h3>
            <div className="flex flex-wrap gap-2">
              {contractor.regionsServed.map((region) => (
                <span key={region} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                  {region}
                </span>
              ))}
            </div>
          </div>

          {/* Owner Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Owner Account
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <Link 
                  href={`/admin/users/${contractor.userId._id}`}
                  className="font-medium text-purple-600 hover:underline"
                >
                  {contractor.userId.name}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{contractor.userId.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium ${contractor.userId.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {contractor.userId.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Timeline
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">{formatDate(contractor.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="font-medium">{formatDate(contractor.updatedAt)}</span>
              </div>
              {contractor.yearsExperience && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Experience</span>
                  <span className="font-medium">{contractor.yearsExperience} years</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {contractor.description && (
            <div className="space-y-3 md:col-span-2">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-purple-600" />
                Business Description
              </h3>
              <p className="text-sm text-gray-600">{contractor.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Reject Contractor</h3>
            <p className="text-sm text-gray-600">
              Please provide a reason for rejecting this contractor application.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Reject Contractor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
