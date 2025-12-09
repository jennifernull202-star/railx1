/**
 * Simple contractor registration - bypasses complex form
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SimpleContractorRegister() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    businessName: '',
    businessDescription: '',
    businessPhone: '',
    businessEmail: '',
    city: '',
    state: '',
    zipCode: '',
  });

  if (status === 'loading') {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-8 text-center">
        <p>Please <Link href="/auth/login" className="text-blue-600 underline">log in</Link> first.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/contractors/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          businessDescription: form.businessDescription,
          businessPhone: form.businessPhone,
          businessEmail: form.businessEmail || session?.user?.email,
          address: {
            street: '',
            city: form.city,
            state: form.state,
            zipCode: form.zipCode,
            country: 'USA',
          },
          services: ['track-maintenance'],
          regionsServed: ['Nationwide'],
          yearsInBusiness: 1,
          isPublished: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setSuccess('Profile created! Redirecting...');
      setTimeout(() => {
        router.push(`/contractors/${data.profile._id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Quick Contractor Registration</h1>
        <p className="text-gray-600 mb-6">Logged in as: {session?.user?.email}</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Business Name *</label>
            <input
              type="text"
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="Your Company Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              required
              value={form.businessDescription}
              onChange={(e) => setForm({ ...form, businessDescription: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="What does your company do?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone *</label>
            <input
              type="tel"
              required
              value={form.businessPhone}
              onChange={(e) => setForm({ ...form, businessPhone: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="555-123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Business Email</label>
            <input
              type="email"
              value={form.businessEmail}
              onChange={(e) => setForm({ ...form, businessEmail: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder={session?.user?.email || 'business@example.com'}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State *</label>
              <input
                type="text"
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ZIP *</label>
              <input
                type="text"
                required
                value={form.zipCode}
                onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 text-white py-3 rounded font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Register as Contractor'}
          </button>
        </form>
      </div>
    </div>
  );
}
