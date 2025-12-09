/**
 * THE RAIL EXCHANGE™ — My Inquiries Page
 * 
 * Shows inquiries the user has sent and received.
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Inquiry from '@/models/Inquiry';
import { Types } from 'mongoose';

export const metadata: Metadata = {
  title: 'My Inquiries | The Rail Exchange',
  description: 'View and manage your inquiries on The Rail Exchange.',
};

interface InquiryWithDetails {
  _id: string;
  listingId: {
    _id: string;
    title: string;
    slug: string;
  };
  senderId: {
    _id: string;
    name: string;
    email: string;
  };
  message: string;
  status: string;
  createdAt: Date;
}

async function getInquiries(userId: string): Promise<{
  sent: InquiryWithDetails[];
  received: InquiryWithDetails[];
}> {
  try {
    await connectDB();
    const userObjectId = new Types.ObjectId(userId);

    const [sent, received] = await Promise.all([
      Inquiry.find({ senderId: userObjectId })
        .populate('listingId', 'title slug')
        .populate('senderId', 'name email')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Inquiry.find({ recipientId: userObjectId })
        .populate('listingId', 'title slug')
        .populate('senderId', 'name email')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    return {
      sent: sent as unknown as InquiryWithDetails[],
      received: received as unknown as InquiryWithDetails[],
    };
  } catch {
    return { sent: [], received: [] };
  }
}

export default async function InquiriesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const { sent, received } = await getInquiries(session.user.id);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 mb-2">My Inquiries</h1>
        <p className="text-slate-500">
          View messages you&apos;ve sent and received about listings.
        </p>
      </div>

      {/* Received Inquiries */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">
          Received ({received.length})
        </h2>
        
        {received.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-slate-500 mb-4">No inquiries received yet</p>
            <Link href="/listings/create" className="text-rail-orange font-medium hover:underline">
              Create a listing to start receiving inquiries
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {received.map((inquiry) => (
              <div key={inquiry._id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        inquiry.status === 'new' 
                          ? 'bg-blue-100 text-blue-700' 
                          : inquiry.status === 'replied'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {inquiry.status}
                      </span>
                      <span className="text-sm text-slate-500">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-1">
                      From: <span className="font-medium text-navy-900">{inquiry.senderId?.name || 'Unknown'}</span>
                    </p>
                    {inquiry.listingId && (
                      <p className="text-sm text-slate-500 mb-2">
                        Re: <Link href={`/listings/${inquiry.listingId.slug}`} className="text-rail-orange hover:underline">
                          {inquiry.listingId.title}
                        </Link>
                      </p>
                    )}
                    <p className="text-slate-700 line-clamp-2">{inquiry.message}</p>
                  </div>
                  <Link
                    href={`/dashboard/messages/${inquiry._id}`}
                    className="text-sm font-medium text-rail-orange hover:underline whitespace-nowrap"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent Inquiries */}
      <div>
        <h2 className="text-lg font-semibold text-navy-900 mb-4">
          Sent ({sent.length})
        </h2>
        
        {sent.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-500 mb-4">You haven&apos;t sent any inquiries yet</p>
            <Link href="/listings" className="text-rail-orange font-medium hover:underline">
              Browse listings to contact sellers
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sent.map((inquiry) => (
              <div key={inquiry._id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        inquiry.status === 'new' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : inquiry.status === 'replied'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {inquiry.status === 'new' ? 'awaiting reply' : inquiry.status}
                      </span>
                      <span className="text-sm text-slate-500">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {inquiry.listingId && (
                      <p className="text-sm text-slate-500 mb-2">
                        Re: <Link href={`/listings/${inquiry.listingId.slug}`} className="text-rail-orange hover:underline">
                          {inquiry.listingId.title}
                        </Link>
                      </p>
                    )}
                    <p className="text-slate-700 line-clamp-2">{inquiry.message}</p>
                  </div>
                  <Link
                    href={`/dashboard/messages/${inquiry._id}`}
                    className="text-sm font-medium text-rail-orange hover:underline whitespace-nowrap"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
