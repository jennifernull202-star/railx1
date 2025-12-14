/**
 * THE RAIL EXCHANGE™ — Contractor Outbound Links
 * 
 * OPUS EXECUTION: Profile Pages - Outbound Click Tracking
 * 
 * Client component for tracking outbound clicks (website, LinkedIn, email, phone).
 * Uses fire-and-forget analytics tracking.
 */

'use client';

import { Globe, Linkedin, Mail, Phone, ExternalLink } from 'lucide-react';

interface ContractorOutboundLinksProps {
  contractorId: string;
  website?: string;
  linkedIn?: string;
  email?: string;
  phone?: string;
  className?: string;
}

export default function ContractorOutboundLinks({
  contractorId,
  website,
  linkedIn,
  email,
  phone,
  className = '',
}: ContractorOutboundLinksProps) {
  if (!website && !linkedIn && !email && !phone) return null;

  const trackOutboundClick = (type: 'website' | 'linkedin' | 'email' | 'phone') => {
    // Fire-and-forget analytics tracking
    fetch('/api/analytics/outbound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: 'contractor',
        targetId: contractorId,
        clickType: type,
      }),
    }).catch(() => {
      // Silently fail - analytics should not impact UX
    });
  };

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {website && (
        <a
          href={website.startsWith('http') ? website : `https://${website}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackOutboundClick('website')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rail-orange text-white font-medium rounded-lg hover:bg-rail-orange/90 transition-colors"
        >
          <Globe className="w-4 h-4" />
          Website
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
      
      {linkedIn && (
        <a
          href={linkedIn.startsWith('http') ? linkedIn : `https://linkedin.com/company/${linkedIn}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackOutboundClick('linkedin')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white font-medium rounded-lg hover:bg-[#0A66C2]/90 transition-colors"
        >
          <Linkedin className="w-4 h-4" />
          LinkedIn
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
      
      {email && (
        <a
          href={`mailto:${email}`}
          onClick={() => trackOutboundClick('email')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Email
        </a>
      )}
      
      {phone && (
        <a
          href={`tel:${phone}`}
          onClick={() => trackOutboundClick('phone')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          <Phone className="w-4 h-4" />
          Call
        </a>
      )}
    </div>
  );
}
