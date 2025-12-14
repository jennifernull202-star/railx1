/**
 * THE RAIL EXCHANGE™ — Profile Verification Block
 * 
 * Displays AI verification status and renewal information.
 * 
 * AI VERIFICATION STATES:
 * - NOT_VERIFIED: No verification started
 * - IN_PROGRESS: AI is reviewing submitted documents
 * - VERIFIED: AI has validated entity
 * - EXPIRED: Verification has lapsed, needs renewal
 * 
 * POST-VERIFICATION CTA (UI ONLY):
 * "Continue to activate visibility & promotion"
 * No Stripe, no pricing logic, placeholder route.
 */

import { Shield, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ProfileVerificationBlockProps } from './types';

export function ProfileVerificationBlock({ 
  verification,
}: ProfileVerificationBlockProps) {
  // No verification data = show not verified state
  if (!verification) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Verification Status</h3>
            <p className="text-sm text-slate-500">
              Not yet verified
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { status, renewalDate, expiresAt, certificationBadges } = verification;

  // Format renewal date for display
  const formattedRenewalDate = renewalDate || (expiresAt 
    ? new Date(expiresAt).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' })
    : null
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Status Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          status === 'verified' ? 'bg-emerald-100' :
          status === 'in_progress' ? 'bg-blue-100' :
          status === 'expired' ? 'bg-amber-100' :
          'bg-slate-100'
        }`}>
          {status === 'verified' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          {status === 'in_progress' && <Clock className="h-5 w-5 text-blue-600" />}
          {status === 'expired' && <AlertCircle className="h-5 w-5 text-amber-600" />}
          {status === 'not_verified' && <Shield className="h-5 w-5 text-slate-400" />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {status === 'verified' && 'Verified'}
            {status === 'in_progress' && 'Verification In Progress'}
            {status === 'expired' && 'Verification Expired'}
            {status === 'not_verified' && 'Not Verified'}
          </h3>
          <p className="text-sm text-slate-500">
            {status === 'verified' && 'AI-verified identity and credentials'}
            {status === 'in_progress' && 'AI is reviewing submitted documents'}
            {status === 'expired' && 'Verification needs renewal'}
            {status === 'not_verified' && 'Verification not started'}
          </p>
        </div>
      </div>

      {/* Renewal Date (for verified/expired) */}
      {formattedRenewalDate && (status === 'verified' || status === 'expired') && (
        <div className={`rounded-lg px-4 py-3 mb-4 ${
          status === 'verified' ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'
        }`}>
          <p className={`text-sm font-medium ${
            status === 'verified' ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {status === 'verified' ? 'Valid through' : 'Expired'} {formattedRenewalDate}
          </p>
        </div>
      )}

      {/* Certification Badges */}
      {certificationBadges && certificationBadges.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Certifications</p>
          <div className="flex flex-wrap gap-2">
            {certificationBadges.map((badge) => (
              <span
                key={badge.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Post-Verification CTA (UI ONLY - no pricing logic) */}
      {status === 'verified' && (
        <Link
          href="/dashboard/visibility"
          className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-rail-orange text-white rounded-lg hover:from-orange-600 hover:to-[#e55f15] transition-all group"
        >
          <span className="text-sm font-medium">
            Continue to activate visibility & promotion
          </span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Renewal CTA for expired */}
      {status === 'expired' && (
        <Link
          href="/dashboard/verification"
          className="flex items-center justify-between w-full px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors group"
        >
          <span className="text-sm font-medium">
            Renew verification
          </span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}

export default ProfileVerificationBlock;
