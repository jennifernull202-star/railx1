/**
 * THE RAIL EXCHANGE™ — Contractor Business Profile Page
 * 
 * Allows contractors to view and edit their business profile.
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import { Types } from 'mongoose';

export const metadata: Metadata = {
  title: 'Business Profile | The Rail Exchange',
  description: 'Manage your contractor business profile on The Rail Exchange.',
};

interface ContractorProfileData {
  _id: string;
  companyName: string;
  slug: string;
  description: string;
  services: string[];
  serviceAreas: string[];
  certifications: string[];
  yearsInBusiness: number;
  employeeCount: string;
  verificationStatus: string;
  featuredProject?: {
    title: string;
    description: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  viewCount: number;
  leadCount: number;
}

async function getProfile(userId: string): Promise<ContractorProfileData | null> {
  try {
    await connectDB();
    const profile = await ContractorProfile.findOne({ userId: new Types.ObjectId(userId) }).lean();
    return profile as unknown as ContractorProfileData;
  } catch {
    return null;
  }
}

export default async function ContractorProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  if (session.user.role !== 'contractor') {
    redirect('/dashboard');
  }

  const profile = await getProfile(session.user.id);

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="text-xl font-bold text-navy-900 mb-2">No Profile Found</h2>
          <p className="text-slate-500 mb-6">
            You haven&apos;t created your contractor profile yet.
          </p>
          <Link href="/contractors/onboard" className="btn-primary">
            Create Your Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 mb-2">Business Profile</h1>
          <p className="text-slate-500">
            Manage how your business appears to potential clients.
          </p>
        </div>
        <Link
          href={`/contractors/${profile.slug}`}
          className="text-sm font-medium text-rail-orange hover:underline"
          target="_blank"
        >
          View Public Profile →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <p className="text-2xl font-bold text-navy-900">{profile.viewCount || 0}</p>
          <p className="text-sm text-slate-500">Profile Views</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <p className="text-2xl font-bold text-navy-900">{profile.leadCount || 0}</p>
          <p className="text-sm text-slate-500">Leads Received</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <p className={`text-lg font-semibold capitalize ${
            profile.verificationStatus === 'verified' ? 'text-green-600' : 
            profile.verificationStatus === 'pending' ? 'text-yellow-600' : 'text-slate-500'
          }`}>
            {profile.verificationStatus}
          </p>
          <p className="text-sm text-slate-500">Status</p>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-900">Company Information</h2>
            <button className="text-sm text-rail-orange font-medium hover:underline">
              Edit
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-slate-500">Company Name</dt>
              <dd className="font-medium text-navy-900">{profile.companyName}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Years in Business</dt>
              <dd className="font-medium text-navy-900">{profile.yearsInBusiness || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Company Size</dt>
              <dd className="font-medium text-navy-900">{profile.employeeCount || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Website</dt>
              <dd className="font-medium text-navy-900">
                {profile.contactInfo?.website ? (
                  <a href={profile.contactInfo.website} target="_blank" className="text-rail-orange hover:underline">
                    {profile.contactInfo.website}
                  </a>
                ) : 'Not set'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">About</h3>
          <p className="text-slate-700">{profile.description || 'No description added yet.'}</p>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Services</h3>
          <div className="flex flex-wrap gap-2">
            {profile.services?.length > 0 ? (
              profile.services.map((service, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                  {service}
                </span>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No services listed</p>
            )}
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Service Areas</h3>
          <div className="flex flex-wrap gap-2">
            {profile.serviceAreas?.length > 0 ? (
              profile.serviceAreas.map((area, i) => (
                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                  {area}
                </span>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No service areas listed</p>
            )}
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Certifications</h3>
          <div className="flex flex-wrap gap-2">
            {profile.certifications?.length > 0 ? (
              profile.certifications.map((cert, i) => (
                <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full">
                  {cert}
                </span>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No certifications listed</p>
            )}
          </div>
        </div>
      </div>

      {/* Verification CTA */}
      {profile.verificationStatus !== 'verified' && (
        <div className="mt-6 bg-gradient-to-r from-rail-orange/10 to-amber-50 rounded-xl border border-rail-orange/20 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-rail-orange/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-rail-orange" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-navy-900 mb-1">Get Verified</h3>
              <p className="text-sm text-slate-600 mb-3">
                Verified contractors get a trust badge, priority in search results, and more leads.
              </p>
              <button className="text-sm font-semibold text-rail-orange hover:underline">
                Apply for Verification →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
