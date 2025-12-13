'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ContractorProfile {
  _id: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  services: string[];
  regionsServed: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
  website?: string;
  insuranceVerified?: boolean;
  // S-14.4: Flag visibility fields
  isFlagged?: boolean;
}

export default function AdminContractorsPage() {
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchContractors = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/admin/contractors?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch contractors');
      const data = await res.json();
      setContractors(data.contractors || []);
    } catch {
      setError('Failed to load contractors');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  const handleVerify = async (contractorId: string) => {
    try {
      const res = await fetch(`/api/admin/contractors/${contractorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });
      if (!res.ok) throw new Error('Failed to verify contractor');
      fetchContractors();
    } catch {
      setError('Failed to verify contractor');
    }
  };

  const handleReject = async (contractorId: string, reason: string) => {
    try {
      const res = await fetch(`/api/admin/contractors/${contractorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      });
      if (!res.ok) throw new Error('Failed to reject contractor');
      fetchContractors();
    } catch {
      setError('Failed to reject contractor');
    }
  };

  const handleSuspend = async (contractorId: string) => {
    try {
      const res = await fetch(`/api/admin/contractors/${contractorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend' }),
      });
      if (!res.ok) throw new Error('Failed to suspend contractor');
      fetchContractors();
    } catch {
      setError('Failed to suspend contractor');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A1A]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#0A1A2F]">Contractor Management</h1>
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'verified' | 'rejected')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A1A] focus:border-transparent"
          >
            <option value="all">All Contractors</option>
            <option value="pending">Pending Verification</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            type="text"
            placeholder="Search contractors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A1A] focus:border-transparent w-64"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">Total Contractors</p>
          <p className="text-2xl font-bold text-[#0A1A2F]">{contractors.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-gray-500 text-sm">Pending Verification</p>
          <p className="text-2xl font-bold text-yellow-600">
            {contractors.filter((c) => c.verificationStatus === 'pending').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">Verified</p>
          <p className="text-2xl font-bold text-green-600">
            {contractors.filter((c) => c.verificationStatus === 'verified').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-gray-500 text-sm">Rejected</p>
          <p className="text-2xl font-bold text-red-600">
            {contractors.filter((c) => c.verificationStatus === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Contractors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Specializations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Flags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contractors.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No contractors found
                </td>
              </tr>
            ) : (
              contractors.map((contractor) => (
                <tr key={contractor._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-[#0A1A2F]">{contractor.businessName}</div>
                      {contractor.website && (
                        <a
                          href={contractor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#FF6A1A] hover:underline"
                        >
                          {contractor.website}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{contractor.userId?.name}</div>
                      <div className="text-sm text-gray-500">{contractor.businessEmail}</div>
                      <div className="text-sm text-gray-500">{contractor.businessPhone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {contractor.services.slice(0, 3).map((service: string) => (
                        <span
                          key={service}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {service}
                        </span>
                      ))}
                      {contractor.services.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{contractor.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(contractor.verificationStatus)}
                      {contractor.insuranceVerified && (
                        <span className="text-xs text-green-600">✓ Insurance Verified</span>
                      )}
                    </div>
                  </td>
                  {/* S-14.4: Admin-only flag visibility */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {contractor.isFlagged ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                        Flagged
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contractor.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/contractors/${contractor._id}`}
                        className="text-[#FF6A1A] hover:text-[#e55a0a]"
                      >
                        View
                      </Link>
                      {contractor.verificationStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleVerify(contractor._id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) handleReject(contractor._id, reason);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {contractor.verificationStatus === 'verified' && (
                        <button
                          onClick={() => handleSuspend(contractor._id)}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
