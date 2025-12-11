/**
 * THE RAIL EXCHANGE™ — Contractor Profile Page
 * 
 * View and edit contractor business profile.
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
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Edit, 
  Eye,
  Star,
  Shield,
  Users,
  Calendar
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contractor Profile | The Rail Exchange',
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
  isPublished: boolean;
  createdAt: Date;
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

  const profile = await getProfile(session.user.id);

  // No profile yet - show setup prompt
  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Create Your Contractor Profile</h2>
          <p className="text-slate-500 mb-6">
            Set up your contractor profile to showcase your services and receive leads from potential clients.
          </p>
          <Link 
            href="/dashboard/contractor/setup" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Edit className="w-5 h-5" />
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
          <h1 className="text-2xl font-bold text-navy-900">Contractor Profile</h1>
          <p className="text-slate-500">Manage your contractor business profile</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/contractors/${profile.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            <Eye className="w-4 h-4" />
            View Public Profile
          </Link>
          <Link
            href="/dashboard/contractor/setup"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{profile.viewCount || 0}</p>
              <p className="text-xs text-slate-500">Profile Views</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{profile.leadCount || 0}</p>
              <p className="text-xs text-slate-500">Leads Received</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{profile.services?.length || 0}</p>
              <p className="text-xs text-slate-500">Services</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${isVerified ? 'bg-green-100' : 'bg-slate-100'} rounded-lg flex items-center justify-center`}>
              <Shield className={`w-5 h-5 ${isVerified ? 'text-green-600' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className={`text-sm font-bold ${isVerified ? 'text-green-600' : 'text-slate-500'}`}>
                {isVerified ? 'Verified' : 'Not Verified'}
              </p>
              <p className="text-xs text-slate-500">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                {profile.companyName}
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    <Shield className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </h2>
              <p className="text-slate-500 mt-1">{profile.description}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              profile.isPublished 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {profile.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-navy-900">Contact Information</h3>
            {profile.contactInfo?.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4" />
                <span>{profile.contactInfo.phone}</span>
              </div>
            )}
            {profile.contactInfo?.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4" />
                <span>{profile.contactInfo.email}</span>
              </div>
            )}
            {profile.contactInfo?.website && (
              <div className="flex items-center gap-2 text-slate-600">
                <Globe className="w-4 h-4" />
                <span>{profile.contactInfo.website}</span>
              </div>
            )}
          </div>

          {/* Company Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-navy-900">Company Details</h3>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>{profile.yearsInBusiness} years in business</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="w-4 h-4" />
              <span>{profile.employeeCount} employees</span>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-3">
            <h3 className="font-semibold text-navy-900">Services Offered</h3>
            <div className="flex flex-wrap gap-2">
              {profile.services?.map((service) => (
                <span 
                  key={service}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Service Areas */}
          <div className="space-y-3">
            <h3 className="font-semibold text-navy-900">Service Areas</h3>
            <div className="flex flex-wrap gap-2">
              {profile.serviceAreas?.map((area) => (
                <span 
                  key={area}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                >
                  <MapPin className="w-3 h-3" />
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Get Verified CTA */}
      {!isVerified && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-navy-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Get the Verified Contractor Badge
              </h3>
              <p className="text-slate-600 text-sm mt-1">
                Stand out from the competition and build trust with potential clients.
              </p>
            </div>
            <Link
              href="/dashboard/verification/contractor"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
            >
              Get Verified
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
