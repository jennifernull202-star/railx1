/**
 * THE RAIL EXCHANGE™ — Upgrade / Cart Page
 * 
 * Cart-based checkout flow for sellers to upgrade their subscription
 * and add optional add-ons to their listings.
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  SELLER_TIER_CONFIG,
  ADD_ON_METADATA,
  ADD_ON_PRICING,
  SELLER_TIERS,
  ADD_ON_TYPES,
  formatPrice,
  formatAddOnDuration,
} from '@/config/pricing';
import {
  Check,
  X,
  ShoppingCart,
  Trash2,
  Crown,
  Star,
  TrendingUp,
  Sparkles,
  FileText,
  ArrowRight,
  ChevronDown,
  Loader2,
  Zap,
  ArrowLeft,
  Package,
  Tag,
  Gift,
} from 'lucide-react';
import PromoCodeInput, { PromoDiscount } from '@/components/PromoCodeInput';

interface CartItem {
  id: string;
  type: 'subscription' | 'addon';
  name: string;
  price: number;
  period?: 'monthly' | 'yearly';
  tier?: string;
  addonType?: string;
  listingId?: string;
  listingTitle?: string;
  quantity?: number;
}

interface Listing {
  _id: string;
  title: string;
  status: string;
}

const addonIcons: Record<string, typeof Star> = {
  [ADD_ON_TYPES.FEATURED]: Star,
  [ADD_ON_TYPES.PREMIUM]: TrendingUp,
  [ADD_ON_TYPES.ELITE]: Crown,
  [ADD_ON_TYPES.AI_ENHANCEMENT]: Sparkles,
  [ADD_ON_TYPES.SPEC_SHEET]: FileText,
};

function UpgradePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [selectedListingForAddon, setSelectedListingForAddon] = useState<string>('');
  const [showAddonsSection, setShowAddonsSection] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoDiscount | null>(null);
  const [promoCode, setPromoCode] = useState<string>('');
  
  // Get promo code from URL (e.g., /dashboard/upgrade?promo=RAILXFREE)
  const initialPromoCode = searchParams.get('promo') || '';

  // Fetch user's listings for add-ons
  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/listings?mine=true&limit=100');
        if (res.ok) {
          const data = await res.json();
          setListings(data.listings || []);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoadingListings(false);
      }
    }
    if (session) {
      fetchListings();
    }
  }, [session]);

  // Get current user's subscription tier
  const currentTier = (session?.user as any)?.sellerTier || 'basic';

  const sellerTiers = [
    SELLER_TIER_CONFIG[SELLER_TIERS.BASIC],
    SELLER_TIER_CONFIG[SELLER_TIERS.PLUS],
    SELLER_TIER_CONFIG[SELLER_TIERS.PRO],
  ];

  const addons = [
    { type: ADD_ON_TYPES.FEATURED, ...ADD_ON_METADATA[ADD_ON_TYPES.FEATURED], price: ADD_ON_PRICING[ADD_ON_TYPES.FEATURED] },
    { type: ADD_ON_TYPES.PREMIUM, ...ADD_ON_METADATA[ADD_ON_TYPES.PREMIUM], price: ADD_ON_PRICING[ADD_ON_TYPES.PREMIUM] },
    { type: ADD_ON_TYPES.ELITE, ...ADD_ON_METADATA[ADD_ON_TYPES.ELITE], price: ADD_ON_PRICING[ADD_ON_TYPES.ELITE] },
    { type: ADD_ON_TYPES.AI_ENHANCEMENT, ...ADD_ON_METADATA[ADD_ON_TYPES.AI_ENHANCEMENT], price: ADD_ON_PRICING[ADD_ON_TYPES.AI_ENHANCEMENT] },
    { type: ADD_ON_TYPES.SPEC_SHEET, ...ADD_ON_METADATA[ADD_ON_TYPES.SPEC_SHEET], price: ADD_ON_PRICING[ADD_ON_TYPES.SPEC_SHEET] },
  ];

  const getPrice = (tier: { priceMonthly: number; priceYearly?: number }) => {
    if (billingPeriod === 'yearly' && tier.priceYearly) {
      return tier.priceYearly / 12;
    }
    return tier.priceMonthly;
  };

  const getTotalPrice = (tier: { priceMonthly: number; priceYearly?: number }) => {
    if (billingPeriod === 'yearly' && tier.priceYearly) {
      return tier.priceYearly;
    }
    return tier.priceMonthly;
  };

  const getSavings = (tier: { priceMonthly: number; priceYearly?: number }) => {
    if (!tier.priceYearly || tier.priceMonthly === 0) return 0;
    const yearlyTotal = tier.priceYearly;
    const monthlyTotal = tier.priceMonthly * 12;
    return monthlyTotal - yearlyTotal;
  };

  // Add plan to cart
  function selectPlan(tierId: string) {
    const tier = sellerTiers.find(t => t.id === tierId);
    if (!tier) return;

    // Remove any existing subscription from cart
    const cartWithoutSub = cart.filter(item => item.type !== 'subscription');
    
    setSelectedPlan(tierId);
    
    if (tier.priceMonthly === 0) {
      // Free tier - just set selected, don't add to cart
      setCart(cartWithoutSub);
      return;
    }

    const price = billingPeriod === 'yearly' && tier.priceYearly ? tier.priceYearly : tier.priceMonthly;
    
    setCart([
      ...cartWithoutSub,
      {
        id: `sub-${tierId}-${billingPeriod}`,
        type: 'subscription',
        name: `${tier.name} Plan (${billingPeriod === 'yearly' ? 'Annual' : 'Monthly'})`,
        price,
        period: billingPeriod,
        tier: tierId,
      },
    ]);
  }

  // Add addon to cart
  function addAddonToCart(addonType: string, listingId: string, listingTitle: string) {
    const addon = addons.find(a => a.type === addonType);
    if (!addon) return;

    // Check if this exact addon for this listing is already in cart
    const exists = cart.some(
      item => item.type === 'addon' && item.addonType === addonType && item.listingId === listingId
    );
    
    if (exists) return;

    setCart([
      ...cart,
      {
        id: `addon-${addonType}-${listingId}`,
        type: 'addon',
        name: addon.name,
        price: addon.price,
        addonType,
        listingId,
        listingTitle,
      },
    ]);
  }

  // Remove item from cart
  function removeFromCart(itemId: string) {
    if (itemId.startsWith('sub-')) {
      setSelectedPlan(null);
    }
    setCart(cart.filter(item => item.id !== itemId));
  }

  // Calculate totals with promo discount
  const subscriptionTotal = cart.filter(i => i.type === 'subscription').reduce((sum, i) => sum + i.price, 0);
  const addonsTotal = cart.filter(i => i.type === 'addon').reduce((sum, i) => sum + i.price, 0);
  const hasSubscription = cart.some(i => i.type === 'subscription');
  
  // Apply promo discount to subscription (promos only apply to subscriptions)
  const promoDiscount = appliedPromo && hasSubscription && appliedPromo.percentOff === 100
    ? subscriptionTotal // Full discount for first month
    : appliedPromo?.percentOff && hasSubscription
    ? subscriptionTotal * (appliedPromo.percentOff / 100)
    : 0;
  
  const cartTotal = subscriptionTotal + addonsTotal - promoDiscount;
  const cartTotalAfterFirstMonth = subscriptionTotal + addonsTotal; // For display
  
  // Handle promo code application
  function handlePromoApplied(code: string, discount: PromoDiscount | null) {
    setPromoCode(code);
    setAppliedPromo(discount);
  }

  // Checkout handler
  async function handleCheckout() {
    if (cart.length === 0) return;
    
    setIsCheckingOut(true);
    
    try {
      // If only subscription, use existing checkout
      if (cart.length === 1 && hasSubscription) {
        const sub = cart[0];
        const response = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: sub.tier,
            type: 'seller',
            billingPeriod: sub.period,
            promoCode: promoCode || undefined, // Pass promo code to checkout
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (data.url) window.location.href = data.url;
        return;
      }

      // For cart with multiple items or just add-ons, use the cart checkout endpoint
      const response = await fetch('/api/checkout/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            type: item.type,
            tier: item.tier,
            period: item.period,
            addonType: item.addonType,
            listingId: item.listingId,
          })),
          promoCode: promoCode || undefined, // Pass promo code to cart checkout
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
      
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Checkout failed');
    } finally {
      setIsCheckingOut(false);
    }
  }

  if (status === 'loading') {
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
              Upgrade Your Account
            </h1>
            <p className="text-slate-600">
              Select a plan and optional add-ons for your listings
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Billing Period Toggle */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-navy-900">Billing Period</h2>
                  <p className="text-sm text-slate-600">Save 17% with annual billing</p>
                </div>
                <div className="inline-flex items-center gap-2 p-1 bg-slate-100 rounded-full">
                  <button
                    onClick={() => {
                      setBillingPeriod('monthly');
                      // Update cart if subscription exists
                      if (selectedPlan) selectPlan(selectedPlan);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      billingPeriod === 'monthly'
                        ? 'bg-white text-navy-900 shadow-sm'
                        : 'text-slate-600 hover:text-navy-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => {
                      setBillingPeriod('yearly');
                      if (selectedPlan) selectPlan(selectedPlan);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      billingPeriod === 'yearly'
                        ? 'bg-white text-navy-900 shadow-sm'
                        : 'text-slate-600 hover:text-navy-900'
                    }`}
                  >
                    Yearly
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      -17%
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Select Plan */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rail-orange/10 rounded-lg">
                  <Package className="w-5 h-5 text-rail-orange" />
                </div>
                <div>
                  <h2 className="font-semibold text-navy-900">1. Select Your Plan</h2>
                  <p className="text-sm text-slate-600">
                    Current plan: <span className="font-medium capitalize">{currentTier}</span>
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {sellerTiers.map((tier) => {
                  const monthlyPrice = getPrice(tier);
                  const savings = getSavings(tier);
                  const isSelected = selectedPlan === tier.id;
                  const isCurrent = currentTier === tier.id;
                  
                  return (
                    <button
                      key={tier.id}
                      onClick={() => selectPlan(tier.id)}
                      disabled={isCurrent}
                      className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-rail-orange bg-rail-orange/5'
                          : isCurrent
                          ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {tier.isPopular && !isCurrent && (
                        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-rail-orange text-white text-xs font-semibold rounded-full">
                          Popular
                        </span>
                      )}
                      {isCurrent && (
                        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-slate-500 text-white text-xs font-semibold rounded-full">
                          Current
                        </span>
                      )}
                      
                      <div className="flex items-center justify-between mb-2 mt-1">
                        <h3 className="font-semibold text-navy-900">{tier.name}</h3>
                        {isSelected && (
                          <div className="w-5 h-5 bg-rail-orange rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-2xl font-bold text-navy-900">
                          {formatPrice(monthlyPrice)}
                        </span>
                        {monthlyPrice > 0 && (
                          <span className="text-slate-500 text-sm">/mo</span>
                        )}
                      </div>
                      
                      {billingPeriod === 'yearly' && savings > 0 && (
                        <div className="text-xs text-green-600 font-medium mb-2">
                          Save {formatPrice(savings)}/year
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-500 mb-3">
                        {tier.listingLimit === -1 
                          ? 'Unlimited listings' 
                          : `${tier.listingLimit} active listings`}
                      </p>
                      
                      <ul className="space-y-1">
                        {tier.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                            <Check className="w-3 h-3 text-green-500" />
                            <span className="truncate">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add-ons Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <button
                onClick={() => setShowAddonsSection(!showAddonsSection)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="font-semibold text-navy-900">2. Add Listing Boosts (Optional)</h2>
                    <p className="text-sm text-slate-600">
                      Enhance visibility for individual listings
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${
                    showAddonsSection ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showAddonsSection && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  {/* Always show all 5 add-ons */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {addons.map((addon) => {
                      const Icon = addonIcons[addon.type] || Star;
                      const selectedListing = listings.find(l => l._id === selectedListingForAddon);
                      const isInCart = cart.some(
                        item => item.addonType === addon.type && item.listingId === selectedListingForAddon
                      );
                      const canAddToCart = selectedListingForAddon && selectedListing && !isInCart;
                      
                      return (
                        <button
                          key={addon.type}
                          onClick={() => {
                            if (canAddToCart) {
                              addAddonToCart(addon.type, selectedListingForAddon, selectedListing.title);
                            }
                          }}
                          disabled={!canAddToCart}
                          className={`text-left p-4 rounded-xl border transition-all ${
                            isInCart
                              ? 'border-green-300 bg-green-50'
                              : canAddToCart
                              ? 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
                              : 'border-slate-200 bg-slate-50/50 opacity-75'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${isInCart ? 'bg-green-100' : 'bg-purple-100'}`}>
                              <Icon className={`w-4 h-4 ${isInCart ? 'text-green-600' : 'text-purple-600'}`} />
                            </div>
                            <span className="font-semibold text-navy-900">{addon.name}</span>
                          </div>
                          <p className="text-xs text-slate-600 mb-2">{addon.shortDescription}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-navy-900">{formatPrice(addon.price)}</span>
                            <span className="text-xs text-slate-500">{formatAddOnDuration(addon.type)}</span>
                          </div>
                          {isInCart && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                              <Check className="w-3 h-3" />
                              Added to cart
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Listing selector or CTA based on whether user has listings */}
                  {loadingListings ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400 mr-2" />
                      <span className="text-sm text-slate-500">Loading your listings...</span>
                    </div>
                  ) : listings.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800 mb-3">
                        <strong>Note:</strong> Create a listing first to apply add-ons.
                      </p>
                      <Link
                        href="/listings/create"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-rail-orange text-white rounded-lg font-medium hover:bg-[#e55f15] transition-colors text-sm"
                      >
                        Create Your First Listing
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select a listing to apply add-ons:
                      </label>
                      <select
                        value={selectedListingForAddon}
                        onChange={(e) => setSelectedListingForAddon(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange bg-white"
                      >
                        <option value="">Choose a listing...</option>
                        {listings.map((listing) => (
                          <option key={listing._id} value={listing._id}>
                            {listing.title}
                          </option>
                        ))}
                      </select>
                      {!selectedListingForAddon && (
                        <p className="text-xs text-slate-500 mt-2">
                          Select a listing above to enable add-on purchases
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-navy-900" />
                  <h2 className="font-semibold text-navy-900">Your Cart</h2>
                  {cart.length > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-rail-orange/10 text-rail-orange text-xs font-semibold rounded-full">
                      {cart.length}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Your cart is empty</p>
                    <p className="text-slate-400 text-xs mt-1">Select a plan to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          item.type === 'subscription' ? 'bg-rail-orange/10' : 'bg-purple-100'
                        }`}>
                          {item.type === 'subscription' ? (
                            <Package className="w-4 h-4 text-rail-orange" />
                          ) : (
                            <Star className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-navy-900 text-sm">{item.name}</p>
                          {item.type === 'addon' && item.listingTitle && (
                            <p className="text-xs text-slate-500 truncate">
                              for: {item.listingTitle}
                            </p>
                          )}
                          {item.type === 'subscription' && item.period === 'yearly' && (
                            <p className="text-xs text-green-600">Billed annually</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-navy-900 text-sm">
                            {formatPrice(item.price)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <>
                  {/* PROMO CODE INPUT - Always visible for Seller Pro */}
                  {hasSubscription && cart.some(i => i.tier === 'pro') && (
                    <div className="px-6 py-4 border-t border-slate-100">
                      <PromoCodeInput
                        onPromoApplied={handlePromoApplied}
                        targetTier="pro"
                        initialCode={initialPromoCode}
                        disabled={isCheckingOut}
                      />
                    </div>
                  )}

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                    {hasSubscription && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Subscription</span>
                        <span className={`font-medium ${promoDiscount > 0 ? 'text-slate-400 line-through' : 'text-navy-900'}`}>
                          {formatPrice(subscriptionTotal)}
                          {cart.find(i => i.type === 'subscription')?.period === 'monthly' && '/mo'}
                        </span>
                      </div>
                    )}
                    
                    {/* Promo Discount Display */}
                    {promoDiscount > 0 && appliedPromo && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-green-600 flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          Promo: {appliedPromo.code}
                        </span>
                        <span className="font-medium text-green-600">
                          -{formatPrice(promoDiscount)}
                        </span>
                      </div>
                    )}
                    
                    {/* First Month Free indicator */}
                    {appliedPromo?.percentOff === 100 && hasSubscription && (
                      <div className="flex justify-between text-sm mb-2 bg-green-50 -mx-6 px-6 py-2">
                        <span className="text-green-700 font-medium">Month 1 Total</span>
                        <span className="font-bold text-green-700">$0.00</span>
                      </div>
                    )}
                    
                    {addonsTotal > 0 && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Add-ons (one-time)</span>
                        <span className="font-medium text-navy-900">{formatPrice(addonsTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                      <span className="text-navy-900">Total Due Today</span>
                      <span className="text-navy-900">{formatPrice(cartTotal)}</span>
                    </div>
                    
                    {/* After first month info */}
                    {appliedPromo?.percentOff === 100 && hasSubscription && (
                      <div className="text-xs text-slate-500 mt-2">
                        After month 1: {formatPrice(cartTotalAfterFirstMonth)}/mo
                      </div>
                    )}
                  </div>

                  <div className="p-6 pt-0">
                    <button
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                      className="w-full py-3 px-4 bg-rail-orange text-white rounded-xl font-semibold hover:bg-[#e55f15] transition-all shadow-lg shadow-rail-orange/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCheckingOut ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Proceed to Checkout
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <p className="text-xs text-slate-500 text-center mt-3">
                      Secure checkout powered by Stripe
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for the upgrade page
function UpgradePageLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-rail-orange" />
        <p className="text-slate-500">Loading upgrade options...</p>
      </div>
    </div>
  );
}

// Export with Suspense wrapper for useSearchParams
export default function UpgradePage() {
  return (
    <Suspense fallback={<UpgradePageLoading />}>
      <UpgradePageContent />
    </Suspense>
  );
}
