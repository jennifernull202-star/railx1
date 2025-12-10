/**
 * THE RAIL EXCHANGE™ — My Add-Ons Page
 * 
 * Dashboard page to view purchased add-ons and assign them to listings.
 * 
 * WORKFLOW (PART 6):
 * 1. User purchases add-on (Featured/Premium/Elite)
 * 2. After Stripe checkout, user is redirected here
 * 3. User selects which listing receives the placement
 * 4. System activates add-on flags on selected listing
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Star,
  TrendingUp,
  Crown,
  Sparkles,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  Clock,
  ChevronRight,
  Package,
} from 'lucide-react';
import { ADD_ON_TYPES, VISIBILITY_ADDONS } from '@/config/pricing';

interface AddOnPurchase {
  _id: string;
  type: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  listingId?: string;
  listingTitle?: string;
  amount: number;
  startedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface Listing {
  _id: string;
  title: string;
  status: string;
  primaryImageUrl?: string;
  media?: { url: string; isPrimary?: boolean }[];
  premiumAddOns?: {
    featured?: { active: boolean };
    premium?: { active: boolean };
    elite?: { active: boolean };
  };
}

const ADD_ON_ICONS: Record<string, typeof Star> = {
  featured: Star,
  premium: TrendingUp,
  elite: Crown,
  ai_enhancement: Sparkles,
  spec_sheet: FileText,
};

const ADD_ON_NAMES: Record<string, string> = {
  featured: 'Featured Listing',
  premium: 'Premium Placement',
  elite: 'Elite Placement',
  ai_enhancement: 'AI Enhancement',
  spec_sheet: 'Spec Sheet Generator',
};

const ADD_ON_COLORS: Record<string, string> = {
  featured: 'bg-amber-500',
  premium: 'bg-blue-500',
  elite: 'bg-purple-500',
  ai_enhancement: 'bg-green-500',
  spec_sheet: 'bg-slate-500',
};

export default function MyAddOnsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [purchases, setPurchases] = useState<AddOnPurchase[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<string>('');
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check for success message from checkout redirect
  const checkoutSuccess = searchParams.get('addon') === 'success';
  const addonType = searchParams.get('type');

  useEffect(() => {
    if (checkoutSuccess && addonType) {
      setSuccess(`Your ${ADD_ON_NAMES[addonType] || addonType} has been purchased! Select a listing below to activate it.`);
    }
  }, [checkoutSuccess, addonType]);

  // Fetch purchases and listings
  useEffect(() => {
    async function fetchData() {
      if (!session?.user) return;
      
      try {
        setLoading(true);
        
        // Fetch purchases
        const purchasesRes = await fetch('/api/addons/purchases');
        if (purchasesRes.ok) {
          const data = await purchasesRes.json();
          setPurchases(data.purchases || []);
        }
        
        // Fetch user's active listings (excluding drafts/archived)
        const listingsRes = await fetch('/api/listings?mine=true&status=active&limit=100');
        if (listingsRes.ok) {
          const data = await listingsRes.json();
          setListings(data.data?.listings || data.listings || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [session]);

  // Assign add-on to listing
  async function assignToListing(purchaseId: string, listingId: string) {
    setAssigning(purchaseId);
    setError('');
    
    try {
      const res = await fetch('/api/addons/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId, listingId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign add-on');
      }
      
      // Update local state
      setPurchases(prev => prev.map(p => 
        p._id === purchaseId 
          ? { ...p, listingId, listingTitle: listings.find(l => l._id === listingId)?.title }
          : p
      ));
      
      // Refresh listings to show updated badges
      const listingsRes = await fetch('/api/listings?mine=true&status=active&limit=100');
      if (listingsRes.ok) {
        const listData = await listingsRes.json();
        setListings(listData.data?.listings || listData.listings || []);
      }
      
      setShowSelectModal(false);
      setActivePurchaseId(null);
      setSelectedListing('');
      setSuccess('Add-on assigned successfully! Badge is now active on your listing.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to assign add-on');
    } finally {
      setAssigning(null);
    }
  }

  function openSelectModal(purchaseId: string) {
    setActivePurchaseId(purchaseId);
    setSelectedListing('');
    setShowSelectModal(true);
  }

  // Filter unassigned purchases (visibility add-ons without listing)
  const unassignedPurchases = purchases.filter(
    p => p.status === 'active' && 
         !p.listingId && 
         VISIBILITY_ADDONS.includes(p.type as typeof VISIBILITY_ADDONS[number])
  );

  // #5 fix: Helper function to calculate urgency for unassigned add-ons
  // Add-ons should be assigned within 7 days of purchase
  function getUrgencyInfo(purchaseDate: string) {
    const ASSIGNMENT_DEADLINE_DAYS = 7;
    const purchasedAt = new Date(purchaseDate);
    const deadline = new Date(purchasedAt.getTime() + ASSIGNMENT_DEADLINE_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();
    const remainingMs = deadline.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    
    if (remainingDays <= 0) {
      return { 
        text: 'Assignment overdue!', 
        urgent: true, 
        color: 'text-red-600',
        bgColor: 'bg-red-100'
      };
    } else if (remainingDays <= 2) {
      return { 
        text: `${remainingDays} day${remainingDays > 1 ? 's' : ''} left to assign`, 
        urgent: true,
        color: 'text-red-600',
        bgColor: 'bg-red-100'
      };
    } else if (remainingDays <= 4) {
      return { 
        text: `${remainingDays} days left to assign`, 
        urgent: true,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100'
      };
    } else {
      return { 
        text: `${remainingDays} days to assign`, 
        urgent: false,
        color: 'text-slate-500',
        bgColor: 'bg-slate-100'
      };
    }
  }

  // Filter assigned/active purchases
  const assignedPurchases = purchases.filter(
    p => p.status === 'active' && p.listingId
  );

  // Get available listings (not already having the same add-on type)
  function getAvailableListings(addonType: string) {
    return listings.filter(listing => {
      if (listing.status !== 'active') return false;
      
      // Check if listing already has this add-on
      const addons = listing.premiumAddOns;
      if (addonType === ADD_ON_TYPES.FEATURED && addons?.featured?.active) return false;
      if (addonType === ADD_ON_TYPES.PREMIUM && addons?.premium?.active) return false;
      if (addonType === ADD_ON_TYPES.ELITE && addons?.elite?.active) return false;
      
      return true;
    });
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rail-orange" />
      </div>
    );
  }

  if (!session) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container-rail py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-navy-900">
              My Add-Ons
            </h1>
            <p className="text-slate-600">
              Manage your listing placements and enhancements
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800">{success}</p>
              <button 
                onClick={() => setSuccess('')}
                className="text-sm text-green-600 hover:text-green-800 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800">{error}</p>
              <button 
                onClick={() => setError('')}
                className="text-sm text-red-600 hover:text-red-800 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Unassigned Add-Ons */}
        {unassignedPurchases.length > 0 && (
          <div className="mb-8">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold text-amber-900">
                    {unassignedPurchases.length} Add-On{unassignedPurchases.length > 1 ? 's' : ''} Ready to Assign
                  </h2>
                  <p className="text-sm text-amber-700 mt-1">
                    Select which listing should receive each placement add-on.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {unassignedPurchases.map((purchase) => {
                  const Icon = ADD_ON_ICONS[purchase.type] || Package;
                  const name = ADD_ON_NAMES[purchase.type] || purchase.type;
                  const color = ADD_ON_COLORS[purchase.type] || 'bg-slate-500';
                  const urgency = getUrgencyInfo(purchase.createdAt);
                  
                  return (
                    <div 
                      key={purchase._id}
                      className="bg-white rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 ${color} rounded-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-navy-900">{name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-sm text-slate-500">
                              Purchased {new Date(purchase.createdAt).toLocaleDateString()}
                            </p>
                            {/* #5 fix: Urgency countdown indicator */}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${urgency.bgColor} ${urgency.color} font-medium flex items-center gap-1`}>
                              <Clock className="w-3 h-3" />
                              {urgency.text}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => openSelectModal(purchase._id)}
                        className={`text-sm py-2 ${urgency.urgent ? 'btn-primary animate-pulse' : 'btn-primary'}`}
                      >
                        Select Listing
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Active Add-Ons on Listings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="font-semibold text-navy-900">Active Placements</h2>
            <p className="text-sm text-slate-600 mt-1">
              Your listings with active add-ons
            </p>
          </div>

          {assignedPurchases.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No active placements yet</p>
              <Link href="/dashboard/upgrade" className="text-rail-orange hover:underline text-sm mt-2 inline-block">
                Purchase add-ons →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {assignedPurchases.map((purchase) => {
                const Icon = ADD_ON_ICONS[purchase.type] || Package;
                const name = ADD_ON_NAMES[purchase.type] || purchase.type;
                const color = ADD_ON_COLORS[purchase.type] || 'bg-slate-500';
                const expiresAt = purchase.expiresAt ? new Date(purchase.expiresAt) : null;
                const isExpiringSoon = expiresAt && (expiresAt.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;
                
                return (
                  <div key={purchase._id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 ${color} rounded-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-navy-900">{name}</p>
                        <p className="text-sm text-slate-600">{purchase.listingTitle || 'Unknown listing'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {expiresAt && (
                        <div className={`flex items-center gap-1 text-sm ${isExpiringSoon ? 'text-amber-600' : 'text-slate-500'}`}>
                          <Clock className="w-4 h-4" />
                          <span>Expires {expiresAt.toLocaleDateString()}</span>
                        </div>
                      )}
                      {purchase.listingId && (
                        <Link 
                          href={`/dashboard/listings/${purchase.listingId}/edit`}
                          className="text-rail-orange hover:text-rail-orange/80 text-sm flex items-center gap-1"
                        >
                          View Listing <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Purchase More */}
        <div className="mt-8 text-center">
          <Link 
            href="/dashboard/upgrade"
            className="btn-outline inline-flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            Purchase More Add-Ons
          </Link>
        </div>
      </div>

      {/* Listing Selection Modal */}
      {showSelectModal && activePurchaseId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-navy-900">Select a Listing</h3>
              <p className="text-sm text-slate-600 mt-1">
                Choose which listing should receive this placement add-on.
              </p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {(() => {
                const purchase = purchases.find(p => p._id === activePurchaseId);
                const available = purchase ? getAvailableListings(purchase.type) : [];
                
                if (available.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600">No eligible listings available</p>
                      <p className="text-sm text-slate-500 mt-1">
                        All your active listings already have this add-on, or you have no active listings.
                      </p>
                      <Link href="/listings/create" className="text-rail-orange hover:underline text-sm mt-4 inline-block">
                        Create a new listing →
                      </Link>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-2">
                    {available.map((listing) => {
                      const imageUrl = listing.primaryImageUrl || listing.media?.[0]?.url;
                      
                      return (
                        <button
                          key={listing._id}
                          onClick={() => setSelectedListing(listing._id)}
                          className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-all ${
                            selectedListing === listing._id
                              ? 'border-rail-orange bg-rail-orange/5'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={listing.title}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-navy-900 truncate">{listing.title}</p>
                            <p className="text-sm text-slate-500 capitalize">{listing.status}</p>
                          </div>
                          {selectedListing === listing._id && (
                            <Check className="w-5 h-5 text-rail-orange flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowSelectModal(false);
                  setActivePurchaseId(null);
                  setSelectedListing('');
                }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activePurchaseId && selectedListing) {
                    assignToListing(activePurchaseId, selectedListing);
                  }
                }}
                disabled={!selectedListing || assigning === activePurchaseId}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning === activePurchaseId ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Assign Add-On'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
