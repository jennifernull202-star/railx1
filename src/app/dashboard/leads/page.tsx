/**
 * THE RAIL EXCHANGE™ — Contractor Leads Page
 * 
 * Shows leads/inquiries received by contractors.
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

export const metadata: Metadata = {
  title: 'Leads | The Rail Exchange',
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
  profile: { _id: string } | null;
  leads: Lead[];
}> {
  try {
    await connectDB();
    const userObjectId = new Types.ObjectId(userId);

    const profile = await ContractorProfile.findOne({ userId: userObjectId }).select('_id').lean();
    
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
      profile: profile as unknown as { _id: string },
      leads: leads as unknown as Lead[],
    };
  } catch {
    return { profile: null, leads: [] };
  }
}

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  if (!session.user.isContractor) {
    redirect('/dashboard');
  }

  const { profile, leads } = await getLeads(session.user.id);

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-xl font-bold text-navy-900 mb-2">Set Up Your Profile First</h2>
          <p className="text-slate-500 mb-6">
            Create your contractor profile to start receiving leads.
          </p>
          <Link href="/contractors/onboard" className="btn-primary">
            Create Your Profile
          </Link>
        </div>
      </div>
    );
  }

  const newLeads = leads.filter(l => l.status === 'new').length;
  const repliedLeads = leads.filter(l => l.status === 'replied').length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 mb-2">Leads</h1>
        <p className="text-slate-500">
          Inquiries from potential clients interested in your services.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <p className="text-2xl font-bold text-navy-900">{leads.length}</p>
          <p className="text-sm text-slate-500">Total Leads</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <p className="text-2xl font-bold text-blue-600">{newLeads}</p>
          <p className="text-sm text-slate-500">New</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <p className="text-2xl font-bold text-green-600">{repliedLeads}</p>
          <p className="text-sm text-slate-500">Replied</p>
        </div>
      </div>

      {/* Leads List */}
      {leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h2 className="text-xl font-bold text-navy-900 mb-2">No Leads Yet</h2>
          <p className="text-slate-500 mb-4">
            Once potential clients contact you through your profile, their inquiries will appear here.
          </p>
          <p className="text-sm text-slate-400">
            Tip: Complete your profile and get verified to receive more leads.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div 
              key={lead._id} 
              className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-md ${
                lead.status === 'new' ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      lead.status === 'new' 
                        ? 'bg-blue-100 text-blue-700' 
                        : lead.status === 'replied'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {lead.status}
                    </span>
                    <span className="text-sm text-slate-500">
                      {new Date(lead.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="font-medium text-navy-900">{lead.senderId?.name || 'Unknown'}</p>
                    <p className="text-sm text-slate-500">{lead.senderId?.email}</p>
                    {lead.senderId?.company && (
                      <p className="text-sm text-slate-500">{lead.senderId.company}</p>
                    )}
                  </div>
                  
                  <p className="text-slate-700">{lead.message}</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <a
                    href={`mailto:${lead.senderId?.email}`}
                    className="inline-flex items-center justify-center px-4 py-2 bg-rail-orange text-white text-sm font-medium rounded-lg hover:bg-rail-orange/90 transition-colors"
                  >
                    Reply
                  </a>
                  <button className="text-sm text-slate-500 hover:text-slate-700">
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
