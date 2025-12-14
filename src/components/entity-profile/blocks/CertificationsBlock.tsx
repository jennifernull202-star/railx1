/**
 * THE RAIL EXCHANGE™ — Certifications Block
 * 
 * Displays industry certifications (FRA, AAR, OSHA).
 * Static label list from entity data.
 * NO mock data. Hide if empty.
 */

import { Award } from 'lucide-react';
import { Entity } from '@/types/entity';

export interface CertificationsBlockProps {
  entity: Entity | null;
}

// Known rail industry certifications
// COMPLIANCE: All certification labels are SELF-REPORTED claims, not platform verified
// Use neutral styling (slate/gray) - NO green/approval colors per enterprise audit
const CERTIFICATION_INFO: Record<string, { label: string; color: string; bgColor: string }> = {
  FRA: {
    label: 'FRA Compliant',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50 border-slate-200',
  },
  AAR: {
    label: 'AAR Certified',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50 border-slate-200',
  },
  OSHA: {
    label: 'OSHA Compliant',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50 border-slate-200',
  },
  DOT: {
    label: 'DOT Registered',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50 border-slate-200',
  },
  ISO9001: {
    label: 'ISO 9001',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50 border-slate-200',
  },
};

export function CertificationsBlock({ entity }: CertificationsBlockProps) {
  // Don't render if no entity
  if (!entity) {
    return null;
  }

  // Pull certifications from entity data
  // Future: entity.certifications array
  // For now, look in companyInfo.specializations for certification keywords
  const rawCertifications: string[] = [];
  
  // Scan specializations for known certifications
  const specializations = entity.companyInfo?.specializations || [];
  specializations.forEach(spec => {
    const upper = spec.toUpperCase();
    if (upper.includes('FRA')) rawCertifications.push('FRA');
    if (upper.includes('AAR')) rawCertifications.push('AAR');
    if (upper.includes('OSHA')) rawCertifications.push('OSHA');
    if (upper.includes('DOT')) rawCertifications.push('DOT');
    if (upper.includes('ISO') || upper.includes('9001')) rawCertifications.push('ISO9001');
  });

  // Deduplicate
  const certifications = Array.from(new Set(rawCertifications));

  // Hide block if no certifications
  if (certifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Award className="h-5 w-5 text-gray-400" />
        Certifications
        <span className="text-xs font-normal text-gray-500">(Self-reported)</span>
      </h2>

      <div className="flex flex-wrap gap-2">
        {certifications.map((cert) => {
          const info = CERTIFICATION_INFO[cert] || {
            label: cert,
            color: 'text-gray-700',
            bgColor: 'bg-gray-50 border-gray-200',
          };

          return (
            <span
              key={cert}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 
                border rounded-lg text-xs font-medium
                ${info.bgColor} ${info.color}
              `}
              title="Self-reported by entity. Not verified by The Rail Exchange."
            >
              {/* COMPLIANCE: Removed checkmark icon - no approval iconography for self-reported claims */}
              {info.label}
            </span>
          );
        })}
      </div>

      {/* COMPLIANCE: Persistent regulatory disclaimer */}
      <p className="text-xs text-gray-500 mt-4 italic">
        Certifications and compliance claims are self-reported by the seller or contractor and are not independently verified by The Rail Exchange.
      </p>
    </div>
  );
}
