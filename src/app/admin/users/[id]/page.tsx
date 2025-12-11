/**
 * THE RAIL EXCHANGE™ — Admin User Detail Page
 * 
 * View and manage individual user details.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  Ban,
  Crown,
  Wrench,
  ShoppingBag,
  CreditCard,
  Package,
  Clock,
  Phone,
  AlertTriangle,
} from 'lucide-react';

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'contractor' | 'admin';
  isActive: boolean;
  isSeller?: boolean;
  isContractor?: boolean;
  isAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
  sellerTier?: string;
  sellerSubscriptionStatus?: string;
  sellerSubscriptionId?: string;
  subscriptionCurrentPeriodEnd?: string;
  listingsCount?: number;
  phone?: string;
  location?: string;
  company?: string;
  usedPromoCodes?: string[];
  paypalEmail?: string;
  paypalVerified?: boolean;
}

interface Listing {
  _id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin': return Shield;
    case 'seller': return Crown;
    case 'contractor': return Wrench;
    default: return ShoppingBag;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin': return 'bg-purple-100 text-purple-700';
    case 'seller': return 'bg-amber-100 text-amber-700';
    case 'contractor': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [user, setUser] = useState<UserDetail | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/users/${userId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('User not found');
            return;
          }
          throw new Error('Failed to fetch user');
        }
        const data = await res.json();
        setUser(data.user);
        setListings(data.listings || []);
      } catch (err) {
        setError('Failed to load user details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const toggleUserStatus = async () => {
    if (!user) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: user.isActive ? 'deactivate' : 'activate' 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to update user');
      
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error('Failed to update user status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const updateRole = async (newRole: string) => {
    if (!user) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateRole', role: newRole }),
      });
      
      if (!res.ok) throw new Error('Failed to update role');
      
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error('Failed to update role:', err);
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

  if (error || !user) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            {error || 'User not found'}
          </h2>
          <p className="text-red-600 mb-4">
            The user you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Users
        </Link>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-10 w-10 text-gray-500" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full capitalize ${getRoleColor(user.role)}`}>
                  <RoleIcon className="h-4 w-4" />
                  {user.role}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {user.isActive ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDate(user.createdAt)}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={toggleUserStatus}
                disabled={actionLoading}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                  user.isActive 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {user.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                {user.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Subscription Info */}
          {(user.isSeller || user.sellerTier) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Subscription
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tier</span>
                  <span className="font-medium capitalize">{user.sellerTier || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-medium capitalize ${
                    user.sellerSubscriptionStatus === 'active' ? 'text-green-600' :
                    user.sellerSubscriptionStatus === 'trialing' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {user.sellerSubscriptionStatus || 'No subscription'}
                  </span>
                </div>
                {user.subscriptionCurrentPeriodEnd && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Period End</span>
                    <span className="font-medium">{formatDate(user.subscriptionCurrentPeriodEnd)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PayPal Status */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#003087]" />
              PayPal Invoice
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`inline-flex items-center gap-1.5 font-medium ${user.paypalEmail ? 'text-green-600' : 'text-gray-400'}`}>
                  {user.paypalEmail ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Connected
                    </>
                  ) : (
                    'Not Connected'
                  )}
                </span>
              </div>
              {user.paypalEmail && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium">{user.paypalEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Promo Codes */}
          {user.usedPromoCodes && user.usedPromoCodes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                Promo Codes Used
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.usedPromoCodes.map((code) => (
                  <span key={code} className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Role Management */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Role Management
            </h3>
            <select
              value={user.role}
              onChange={(e) => updateRole(e.target.value)}
              disabled={actionLoading}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="contractor">Contractor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Account Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Account Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">User ID</span>
                <span className="font-mono text-xs">{user._id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="font-medium">{formatDate(user.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Listings */}
      {listings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              User Listings ({listings.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {listings.map((listing) => (
              <Link
                key={listing._id}
                href={`/admin/listings/${listing._id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{listing.title}</p>
                  <p className="text-sm text-gray-500">Created {formatDate(listing.createdAt)}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                  listing.status === 'active' ? 'bg-green-100 text-green-700' :
                  listing.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {listing.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
