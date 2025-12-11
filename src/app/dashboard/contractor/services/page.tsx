/**
 * THE RAIL EXCHANGE™ — Contractor Services Page
 * 
 * Manage contractor services.
 * All users can access - no isContractor gating.
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import { Types } from 'mongoose';
import { 
  Wrench, 
  Plus, 
  Edit,
  Eye,
  Star,
  Shield,
  Settings
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Services | The Rail Exchange',
  description: 'Manage your contractor services on The Rail Exchange.',
};

interface ContractorProfileData {
  _id: string;
  companyName: string;
  slug: string;
  services: string[];
  serviceAreas: string[];
  verificationStatus: string;
  isPublished: boolean;
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

export default async function ContractorServicesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const profile = await getProfile(session.user.id);

  // No profile yet - show setup prompt
  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Wrench className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Set Up Your Services</h2>
          <p className="text-slate-500 mb-6">
            Create your contractor profile to list your services and start receiving leads.
          </p>
          <Link 
            href="/dashboard/contractor/setup" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Profile
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = profile.verificationStatus === 'verified';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">My Services</h1>
          <p className="text-slate-500">Manage the services you offer to clients</p>
        </div>
        <Link
          href="/dashboard/contractor/setup"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Settings className="w-4 h-4" />
          Edit Services
        </Link>
      </div>

      {/* Profile Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-navy-900">{profile.companyName}</h3>
              <p className="text-sm text-slate-500">
                {profile.services?.length || 0} services • {profile.serviceAreas?.length || 0} service areas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                <Shield className="w-3 h-3" />
                Verified
              </span>
            )}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              profile.isPublished 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {profile.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-navy-900">Services Offered</h2>
        </div>
        {profile.services && profile.services.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {profile.services.map((service, index) => (
              <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-navy-900">{service}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-slate-500 mb-4">No services added yet</p>
            <Link 
              href="/dashboard/contractor/setup" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Services
            </Link>
          </div>
        )}
      </div>

      {/* Service Areas */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-navy-900">Service Areas</h2>
        </div>
        {profile.serviceAreas && profile.serviceAreas.length > 0 ? (
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {profile.serviceAreas.map((area, index) => (
                <span 
                  key={index}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-slate-500 mb-4">No service areas defined</p>
            <Link 
              href="/dashboard/contractor/setup" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Service Areas
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href={`/contractors/${profile.slug}`}
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-900">View Public Profile</h3>
            <p className="text-sm text-slate-500">See how clients see your profile</p>
          </div>
        </Link>
        <Link
          href="/dashboard/contractor/leads"
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Star className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-900">View Leads</h3>
            <p className="text-sm text-slate-500">Check your service leads</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
