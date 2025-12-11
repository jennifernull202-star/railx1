/**
 * THE RAIL EXCHANGE™ — PayPal Account Linking Page
 * 
 * IMPORTANT LEGAL DISCLAIMER:
 * - The Rail Exchange does NOT process any PayPal payments.
 * - PayPal is ONLY used as a user-provided contact detail.
 * - All PayPal interactions happen OFF-platform between users.
 * - No financial data is stored other than a plain email string.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  AlertCircle,
  Shield,
  ExternalLink,
} from 'lucide-react';

export default function PaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [paypalVerified, setPaypalVerified] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Fetch current PayPal status
  useEffect(() => {
    const fetchPayPalStatus = async () => {
      try {
        const res = await fetch('/api/user/paypal');
        if (res.ok) {
          const data = await res.json();
          setPaypalEmail(data.paypalEmail || '');
          setIsConnected(data.connected);
          setPaypalVerified(data.paypalVerified);
        }
      } catch (err) {
        console.error('Error fetching PayPal status:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchPayPalStatus();
    }
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch('/api/user/paypal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypalEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save PayPal email');
      }

      setIsConnected(true);
      setPaypalVerified(true);
      setSuccess('PayPal email saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove your PayPal email?')) return;
    
    setError('');
    setSuccess('');
    setRemoving(true);

    try {
      const res = await fetch('/api/user/paypal', {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove PayPal email');
      }

      setPaypalEmail('');
      setIsConnected(false);
      setPaypalVerified(false);
      setSuccess('PayPal email removed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setRemoving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rail-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-white border-b border-surface-border">
        <div className="container-rail py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-text-secondary hover:text-navy-900 text-sm"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-heading-lg font-bold text-navy-900 mt-4 flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-rail-orange" />
            Payment Settings
          </h1>
          <p className="text-body-md text-text-secondary mt-1">
            Manage your payment contact information
          </p>
        </div>
      </header>

      <main className="container-rail py-8">
        <div className="max-w-2xl mx-auto">
          {/* PayPal Connection Card */}
          <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden">
            {/* Status Header */}
            <div className={`p-6 border-b border-surface-border ${
              isConnected ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* PayPal Logo */}
                  <div className="w-12 h-12 bg-[#003087] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">PP</span>
                  </div>
                  <div>
                    <h2 className="text-heading-md font-bold text-navy-900">
                      PayPal Invoice Email
                    </h2>
                    <p className="text-body-sm text-text-secondary">
                      Share your PayPal address with buyers
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                      <XCircle className="w-4 h-4" />
                      Not Connected
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-6">
              {/* Legal Disclaimer */}
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Important Notice</p>
                    <p className="text-amber-700">
                      This PayPal email is provided directly by you for external invoicing purposes. 
                      <strong> The Rail Exchange does NOT process, handle, or guarantee any PayPal payments.</strong> All transactions occur directly between buyers and sellers outside of this platform.
                    </p>
                  </div>
                </div>
              </div>

              {/* Success/Error Messages */}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800">{success}</p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label 
                    htmlFor="paypalEmail" 
                    className="block text-sm font-medium text-navy-900 mb-2"
                  >
                    PayPal Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                    <input
                      type="email"
                      id="paypalEmail"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="your-paypal@email.com"
                      className="w-full pl-12 pr-4 py-3 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-rail-orange/50 focus:border-rail-orange"
                    />
                    {paypalVerified && paypalEmail && (
                      <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">
                    This email will be visible to buyers when they want to pay via PayPal invoice.
                  </p>
                </div>

                {/* Verified Badge Info */}
                {isConnected && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        PayPal Connected Badge
                      </p>
                      <p className="text-xs text-blue-700">
                        Your listings will show a &quot;PayPal Invoice Available&quot; option to buyers.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={saving || !paypalEmail}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-6 bg-rail-orange text-white font-semibold rounded-xl hover:bg-[#e55f15] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        {isConnected ? 'Update PayPal' : 'Save PayPal'}
                      </>
                    )}
                  </button>

                  {isConnected && (
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={removing}
                      className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white border border-red-300 text-red-600 font-semibold rounded-xl hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {removing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Remove PayPal
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {/* For Sellers */}
            <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
              <h3 className="text-heading-sm font-bold text-navy-900 mb-3">
                For Sellers
              </h3>
              <ul className="space-y-2 text-body-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  PayPal button appears on all your listings
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Buyers can request a PayPal invoice directly
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  No platform fees on external payments
                </li>
              </ul>
            </div>

            {/* For Contractors */}
            <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
              <h3 className="text-heading-sm font-bold text-navy-900 mb-3">
                For Contractors
              </h3>
              <ul className="space-y-2 text-body-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Share PayPal in service inquiries
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Clients can pay deposits via PayPal
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Professional payment option
                </li>
              </ul>
            </div>
          </div>

          {/* Help Link */}
          <div className="mt-8 text-center">
            <a
              href="https://www.paypal.com/invoice/create"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-body-sm text-rail-orange hover:text-rail-orange-dark"
            >
              Learn about PayPal invoicing
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
