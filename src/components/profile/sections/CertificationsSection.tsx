/**
 * THE RAIL EXCHANGE™ — Certifications Section
 * 
 * Displays certification badges (FRA, AAR, OSHA, etc.).
 * Hides if empty. NO mock data.
 */

import { Award, CheckCircle2 } from 'lucide-react';
import type { CertificationsSectionProps } from '../types';

// Known rail industry certifications styling
const CERTIFICATION_STYLES: Record<string, { color: string; bgColor: string }> = {
  FRA: { color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  AAR: { color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  OSHA: { color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  DOT: { color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
  ISO9001: { color: 'text-slate-700', bgColor: 'bg-slate-50 border-slate-200' },
};

export function CertificationsSection({ certifications }: CertificationsSectionProps) {
  // Hide if no certifications
  if (!certifications || certifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Award className="h-5 w-5 text-gray-400" />
        Certifications
      </h2>

      <div className="flex flex-wrap gap-2">
        {certifications.map((cert) => {
          const style = CERTIFICATION_STYLES[cert.name] || {
            color: 'text-gray-700',
            bgColor: 'bg-gray-50 border-gray-200',
          };

          return (
            <span
              key={cert.id}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 
                border rounded-lg text-xs font-medium
                ${style.bgColor} ${style.color}
              `}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {cert.label}
              {cert.expiresAt && (
                <span className="text-[10px] opacity-70 ml-1">
                  (until {new Date(cert.expiresAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default CertificationsSection;
