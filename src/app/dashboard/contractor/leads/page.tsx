/**
 * THE RAIL EXCHANGE™ — Contractor Leads Page
 * 
 * Shows leads/inquiries received by contractors.
 * All users can access - no isContractor gating.
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import Inquiry from '@/models/Inquiry';
import { Types } from 'mongoose';
import {
  MessageSquare,
  User,
  Mail,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Service Leads | The Rail Exchange',
  description: 'View and manage leads for your contractor business.',
};

interface Lead {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    company?: string;
  };
  message: string;
  status: string;
  createdAt: Date;
}

async function getLeads(userId: string): Promise<{
  profile: { _id: string; companyName: string } | null;
  leads: Lead[];
}> {
  try {
    await connectDB();
    const userObjectId = new Types.ObjectId(userId);

    const profile = await ContractorProfile.findOne({ userId: userObjectId }).select('_id companyName').lean();
    
    if (!profile) {
      return { profile: null, leads: [] };
    }

    const leads = await Inquiry.find({ 
      contractorProfileId: profile._id 
    })
      .populate('senderId', 'name email company')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return {
      profile: profile as unknown as { _id: string; companyName: string },
      leads: leads as unknown as Lead[],
    };
  } catch {
    return { profile: null, leads: [] };
  }
}

export default async function ContractorLeadsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const { profile, leads } = await getLeads(session.user.id);

  // No profile yet - show setup prompt
  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Set Up Your Profile First</h2>
          <p className="text-slate-500 mb-6">
            Create your contractor profile to start receiving leads from potential clients.
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

  const newLeads = leads.filter(l => l.status === 'new').length;
  const repliedLeads = leads.filter(l => l.status === 'replied').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Service Leads</h1>
        <p className="text-slate-500">Inquiries from potential clients for {profile.companyName}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{leads.length}</p>
              <p className="text-xs text-slate-500">Total Leads</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{newLeads}</p>
              <p className="text-xs text-slate-500">New Leads</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{repliedLeads}</p>
              <p className="text-xs text-slate-500">Replied</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-navy-900">Recent Leads</h2>
        </div>
        {leads.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <div key={lead._id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-navy-900">
                          {lead.senderId?.name || 'Unknown'}
                        </h3>
                        {lead.status === 'new' && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      {lead.senderId?.company && (
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          {lead.senderId.company}
                        </div>
                      )}
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {lead.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.senderId?.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/messages?inquiry=${lead._id}`}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Reply
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-2">No leads yet</p>
            <p className="text-sm text-slate-400">
              Leads will appear here when potential clients contact you through your profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
