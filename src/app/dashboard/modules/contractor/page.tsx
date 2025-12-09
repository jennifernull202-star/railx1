/**
 * THE RAIL EXCHANGE™ — Contractor Dashboard Overview
 * 
 * Primary dashboard view for contractors. Shows profile, leads, and verification status.
 */

'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/cards';
import { VerificationTile } from '@/components/contractor';

interface ContractorProfile {
  _id: string;
  businessName: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired' | 'unverified';
  verifiedBadgePurchased: boolean;
  verifiedBadgeExpiresAt?: string;
  services: string[];
  profileViews: number;
  rating?: number;
  reviewCount?: number;
}

interface Lead {
  _id: string;
  clientName: string;
  projectType: string;
  location: string;
  budget?: string;
  status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
  createdAt: string;
}

export default function ContractorDashboard() {
  const { data: session } = useSession();
  const [profile, setProfile] = React.useState<ContractorProfile | null>(null);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, leadsRes] = await Promise.all([
          fetch('/api/contractors/me'),
          fetch('/api/contractors/leads'),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data.contractor);
        }

        if (leadsRes.ok) {
          const data = await leadsRes.json();
          setLeads(data.leads || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePurchaseVerification = () => {
    // Redirect to Stripe checkout for $24/month verification
    window.location.href = '/api/subscriptions/checkout?plan=contractor-verified';
  };

  const handleManageSubscription = () => {
    // Redirect to billing portal
    window.location.href = '/api/subscriptions/portal';
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-status-info text-white';
      case 'contacted':
        return 'bg-status-warning text-navy-900';
      case 'quoted':
        return 'bg-rail-orange text-white';
      case 'won':
        return 'bg-status-success text-white';
      case 'lost':
        return 'bg-text-tertiary text-white';
      default:
        return 'bg-surface-secondary text-navy-900';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface-secondary rounded animate-pulse" />
        <div className="h-32 bg-surface-secondary rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // If no profile, show setup prompt
  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Contractor Dashboard</h1>
          <p className="text-text-secondary">Complete your profile to start receiving leads.</p>
        </div>

        <Card className="border-rail-orange/30 bg-rail-orange/5">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-rail-orange/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-rail-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-navy-900 mb-2">Complete Your Contractor Profile</h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Set up your business profile to appear in contractor search results and receive project leads from potential clients.
            </p>
            <Link href="/dashboard/contractor/setup">
              <Button className="bg-rail-orange hover:bg-rail-orange-dark">
                Complete Setup
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const newLeads = leads.filter((l) => l.status === 'new').length;
  const activeLeads = leads.filter((l) => ['new', 'contacted', 'quoted'].includes(l.status)).length;
  const wonLeads = leads.filter((l) => l.status === 'won').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Welcome back, {profile.businessName}</h1>
        <p className="text-text-secondary">Manage your contractor profile and track leads.</p>
      </div>

      {/* Verification Status */}
      <VerificationTile
        verificationStatus={profile.verificationStatus}
        verifiedBadgePurchased={profile.verifiedBadgePurchased}
        verifiedBadgeExpiresAt={profile.verifiedBadgeExpiresAt}
        onPurchase={handlePurchaseVerification}
        onManage={handleManageSubscription}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="New Leads"
          value={newLeads}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          iconColor="blue"
          change={newLeads > 0 ? `${newLeads} waiting` : undefined}
          changeDirection="up"
        />
        <StatCard
          title="Active Leads"
          value={activeLeads}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconColor="orange"
        />
        <StatCard
          title="Profile Views"
          value={profile.profileViews || 0}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
          iconColor="green"
        />
        <StatCard
          title="Projects Won"
          value={wonLeads}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconColor="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Leads</CardTitle>
            <Link href="/dashboard/leads">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-text-tertiary mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-text-secondary mb-3">No leads yet</p>
                <p className="text-sm text-text-tertiary max-w-sm mx-auto">
                  Leads will appear here when clients request quotes or contact you through your profile.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.slice(0, 5).map((lead) => (
                  <div
                    key={lead._id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border-default hover:border-rail-orange/30 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-navy-900">{lead.clientName}</h4>
                        <Badge className={`border-0 text-xs ${getLeadStatusColor(lead.status)}`}>
                          {lead.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-secondary">{lead.projectType}</p>
                      <div className="flex items-center gap-3 text-xs text-text-tertiary mt-1">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {lead.location}
                        </span>
                        {lead.budget && (
                          <>
                            <span>•</span>
                            <span>{lead.budget}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Completion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Strength</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-navy-900">75% Complete</span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-surface-secondary">
                <div
                  style={{ width: '75%' }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-rail-orange"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-status-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-text-secondary">Business info</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-status-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-text-secondary">Services listed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-status-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-text-secondary">Service regions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-text-tertiary">Add equipment list</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-text-tertiary">Upload portfolio photos</span>
              </div>
            </div>

            <Link href="/dashboard/profile">
              <Button variant="outline" size="sm" className="w-full mt-4">
                Complete Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Rating & Reviews */}
      {profile.rating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-navy-900">{profile.rating.toFixed(1)}</div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(profile.rating || 0)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-text-secondary">
                  Based on {profile.reviewCount || 0} reviews
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
