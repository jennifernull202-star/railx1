/**
 * THE RAIL EXCHANGE™ — Admin Add-Ons Management
 * 
 * View and manage add-on purchases.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import AddOnPurchase from '@/models/AddOnPurchase';
import { ADD_ON_METADATA } from '@/config/pricing';

export default async function AdminAddOnsPage() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return null; // STABILIZATION: Never throw
  }

  if (!session?.user || !session.user.isAdmin) {
    return null; // STABILIZATION: No redirect from RSC
  }

  await connectDB();

  const addOns = await AddOnPurchase.find()
    .populate('userId', 'name email')
    .populate('listingId', 'title')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const totalRevenue = addOns.reduce((sum, addon) => sum + (addon.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-display-sm font-bold text-navy-900">Add-On Purchases</h1>
          <p className="text-body-md text-text-secondary mt-1">
            Manage add-on purchases and view revenue
          </p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4">
          <p className="text-body-sm text-text-secondary">Total Revenue</p>
          <p className="text-heading-lg font-bold text-green-600">
            ${(totalRevenue / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-secondary">
            <tr>
              <th className="px-6 py-4 text-left text-body-sm font-semibold text-text-secondary">
                Type
              </th>
              <th className="px-6 py-4 text-left text-body-sm font-semibold text-text-secondary">
                User
              </th>
              <th className="px-6 py-4 text-left text-body-sm font-semibold text-text-secondary">
                Listing
              </th>
              <th className="px-6 py-4 text-left text-body-sm font-semibold text-text-secondary">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-body-sm font-semibold text-text-secondary">
                Status
              </th>
              <th className="px-6 py-4 text-left text-body-sm font-semibold text-text-secondary">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {addOns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                  No add-on purchases yet
                </td>
              </tr>
            ) : (
              addOns.map((addon: Record<string, unknown>) => {
                const metadata = ADD_ON_METADATA[addon.type as keyof typeof ADD_ON_METADATA];
                const user = addon.userId as { name?: string; email?: string } | null;
                const listing = addon.listingId as { title?: string } | null;
                
                return (
                  <tr key={String(addon._id)} className="hover:bg-surface-secondary/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>{metadata?.icon || '📦'}</span>
                        <span className="font-medium">{metadata?.name || String(addon.type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-sm">
                      {user?.name || user?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-body-sm text-text-secondary">
                      {listing?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-body-sm font-medium">
                      ${((addon.amount as number) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          addon.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : addon.status === 'expired'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {String(addon.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-text-secondary">
                      {new Date(addon.createdAt as string).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
