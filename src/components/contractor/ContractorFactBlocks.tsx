/**
 * THE RAIL EXCHANGE™ — Clickable Contractor Facts
 * 
 * Public profile fact blocks that are:
 * - Clickable (link to filtered search results)
 * - Scannable (chips/badges format)
 * - Compliant (self-reported disclaimers)
 * 
 * Used on contractor public profile pages.
 */

'use client';

import Link from 'next/link';
import {
  Train,
  Wrench,
  HardHat,
  RadioTower,
  Zap,
  Leaf,
  AlertTriangle,
  Siren,
  Construction,
  ClipboardCheck,
  Truck,
  Recycle,
  Compass,
  MoreHorizontal,
  MapPin,
  Clock,
  FileCheck,
  Shield,
} from 'lucide-react';
import {
  CONTRACTOR_TYPE_CONFIG,
  type ContractorType,
} from '@/config/contractor-types';

// Icon mapping for contractor types
const TYPE_ICONS: Record<string, React.ElementType> = {
  'track-construction': HardHat,
  'railcar-repair': Train,
  'locomotive-service': Train,
  'mow': HardHat,
  'signal-communications': RadioTower,
  'electrical-power': Zap,
  'environmental': Leaf,
  'hazmat-spill': AlertTriangle,
  'emergency-response': Siren,
  'rerail-derailment': Construction,
  'inspection-compliance': ClipboardCheck,
  'transport-logistics': Truck,
  'scrap-decommission': Recycle,
  'engineering-consulting': Compass,
  'other': MoreHorizontal,
};

// ============================================================================
// CONTRACTOR TYPE CHIPS (Clickable → Search Filter)
// ============================================================================

interface ContractorTypeChipsProps {
  contractorTypes: ContractorType[];
  className?: string;
}

export function ContractorTypeChips({ contractorTypes, className = '' }: ContractorTypeChipsProps) {
  if (!contractorTypes || contractorTypes.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-surface-border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <HardHat className="w-5 h-5 text-text-tertiary" />
        <h2 className="font-semibold text-navy-900">Contractor Type</h2>
        <span className="text-xs text-text-tertiary">(Self-reported)</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {contractorTypes.map((typeId) => {
          const config = CONTRACTOR_TYPE_CONFIG[typeId];
          const IconComponent = TYPE_ICONS[typeId] || Wrench;
          const isHighRisk = config?.isHighRisk;
          
          return (
            <Link
              key={typeId}
              href={`/contractors?type=${encodeURIComponent(typeId)}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                isHighRisk
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {config?.shortLabel || typeId}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// SERVICES OFFERED (Clickable → Search Filter)
// ============================================================================

interface ServicesOfferedProps {
  contractorTypes: ContractorType[];
  subServices?: Record<string, string[]>;
  className?: string;
}

export function ServicesOffered({ contractorTypes, subServices = {}, className = '' }: ServicesOfferedProps) {
  if (!contractorTypes || contractorTypes.length === 0) {
    return null;
  }

  // Collect all sub-services
  const allSubServices: { typeId: string; subId: string; label: string }[] = [];
  
  contractorTypes.forEach((typeId) => {
    const typeSubServices = subServices[typeId] || [];
    const config = CONTRACTOR_TYPE_CONFIG[typeId];
    
    typeSubServices.forEach((subId) => {
      const subConfig = config?.subServices.find(s => s.id === subId);
      if (subConfig) {
        allSubServices.push({
          typeId,
          subId,
          label: subConfig.label,
        });
      }
    });
  });

  if (allSubServices.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-surface-border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="w-5 h-5 text-text-tertiary" />
        <h2 className="font-semibold text-navy-900">Services Offered</h2>
      </div>
      
      <ul className="space-y-2">
        {allSubServices.map(({ typeId, subId, label }) => (
          <li key={`${typeId}-${subId}`}>
            <Link
              href={`/contractors?type=${encodeURIComponent(typeId)}&service=${encodeURIComponent(subId)}`}
              className="flex items-center gap-2 text-sm text-navy-900 hover:text-rail-orange transition-colors group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rail-orange group-hover:scale-125 transition-transform" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
      
      <p className="text-xs text-text-tertiary mt-4 italic">
        Click any service to find similar contractors.
      </p>
    </div>
  );
}

// ============================================================================
// SERVICE LOCATIONS (Clickable regions)
// ============================================================================

interface ServiceLocationsProps {
  regions: string[];
  maxDisplay?: number;
  className?: string;
}

export function ServiceLocations({ regions, maxDisplay = 8, className = '' }: ServiceLocationsProps) {
  if (!regions || regions.length === 0) {
    return null;
  }

  const displayedRegions = regions.slice(0, maxDisplay);
  const remainingCount = Math.max(0, regions.length - maxDisplay);
  const hasNationwide = regions.some(r => r.toLowerCase() === 'nationwide' || r.toLowerCase() === 'national');

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-surface-border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-text-tertiary" />
        <h2 className="font-semibold text-navy-900">Service Locations</h2>
        <span className="text-xs text-text-tertiary">(Self-reported)</span>
      </div>
      
      {hasNationwide && (
        <div className="mb-3 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
          🇺🇸 Nationwide Coverage
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {displayedRegions
          .filter(r => r.toLowerCase() !== 'nationwide' && r.toLowerCase() !== 'national')
          .map((region) => (
            <Link
              key={region}
              href={`/contractors?region=${encodeURIComponent(region)}`}
              className="px-3 py-1.5 bg-surface-secondary rounded-lg text-sm text-navy-900 hover:bg-surface-tertiary transition-colors"
            >
              {region}
            </Link>
          ))}
        {remainingCount > 0 && (
          <span className="px-3 py-1.5 bg-surface-secondary rounded-lg text-sm text-text-tertiary">
            +{remainingCount} more
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// AVAILABILITY (Optional self-reported)
// ============================================================================

interface AvailabilityProps {
  availability?: {
    is24x7?: boolean;
    emergencyResponse?: boolean;
    scheduledOnly?: boolean;
    customNote?: string;
  };
  className?: string;
}

export function Availability({ availability, className = '' }: AvailabilityProps) {
  if (!availability) {
    return null;
  }

  const { is24x7, emergencyResponse, scheduledOnly, customNote } = availability;
  
  // Only show if at least one is set
  if (!is24x7 && !emergencyResponse && !scheduledOnly && !customNote) {
    return null;
  }

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-surface-border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-text-tertiary" />
        <h2 className="font-semibold text-navy-900">Availability</h2>
        <span className="text-xs text-text-tertiary">(Self-reported)</span>
      </div>
      
      <div className="space-y-2">
        {is24x7 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
            <Clock className="w-4 h-4" />
            24/7 Available
          </div>
        )}
        {emergencyResponse && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-200">
            <Siren className="w-4 h-4" />
            Emergency Response
          </div>
        )}
        {scheduledOnly && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
            <Clock className="w-4 h-4" />
            Scheduled Only
          </div>
        )}
        {customNote && (
          <p className="text-sm text-text-secondary mt-2">{customNote}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CREDENTIALS & CERTIFICATIONS (Self-reported with mandatory disclaimer)
// ============================================================================

interface CredentialsProps {
  certifications?: {
    fra?: { certified?: boolean; certificationNumber?: string; expiresAt?: Date };
    aar?: { certified?: boolean; certificationNumber?: string; expiresAt?: Date };
    osha?: { tenHour?: boolean; thirtyHour?: boolean; certificationDate?: Date };
    drugFreeWorkplace?: boolean;
    dotCompliant?: boolean;
  };
  className?: string;
}

export function Credentials({ certifications, className = '' }: CredentialsProps) {
  if (!certifications) {
    return null;
  }

  // Build list of credentials
  const credentials: { id: string; label: string; note?: string }[] = [];
  
  if (certifications.fra?.certified) {
    credentials.push({ id: 'fra', label: 'FRA', note: certifications.fra.certificationNumber });
  }
  if (certifications.aar?.certified) {
    credentials.push({ id: 'aar', label: 'AAR', note: certifications.aar.certificationNumber });
  }
  if (certifications.osha?.tenHour) {
    credentials.push({ id: 'osha-10', label: 'OSHA 10-Hour' });
  }
  if (certifications.osha?.thirtyHour) {
    credentials.push({ id: 'osha-30', label: 'OSHA 30-Hour' });
  }
  if (certifications.drugFreeWorkplace) {
    credentials.push({ id: 'drug-free', label: 'Drug-Free Workplace' });
  }
  if (certifications.dotCompliant) {
    credentials.push({ id: 'dot', label: 'DOT Compliant' });
  }

  if (credentials.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-surface-border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <FileCheck className="w-5 h-5 text-text-tertiary" />
        <h2 className="font-semibold text-navy-900">Credentials & Certifications</h2>
      </div>
      
      <div className="space-y-2 mb-4">
        {credentials.map(({ id, label, note }) => (
          <div
            key={id}
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm text-navy-900 border border-slate-200"
          >
            {/* Neutral styling — NO green checks */}
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="font-medium">{label}</span>
            {note && <span className="text-text-tertiary">#{note}</span>}
            <span className="ml-auto text-xs text-text-tertiary">(Self-reported)</span>
          </div>
        ))}
      </div>
      
      {/* MANDATORY DISCLAIMER */}
      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-xs text-amber-800">
          <strong>Important:</strong> Certifications are self-reported and not verified or endorsed by 
          The Rail Exchange or any regulatory authority. Always request documentation directly from the contractor.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// VERIFICATION BLOCK (Public-safe display)
// ============================================================================

interface VerificationBlockProps {
  verificationStatus: 'none' | 'pending' | 'ai_approved' | 'approved' | 'verified' | 'rejected' | 'expired';
  verifiedBadgeExpiresAt?: Date | string;
  className?: string;
}

export function VerificationBlock({
  verificationStatus,
  verifiedBadgeExpiresAt,
  className = '',
}: VerificationBlockProps) {
  const isVerified = verificationStatus === 'verified' || verificationStatus === 'approved' || verificationStatus === 'ai_approved';
  const isPending = verificationStatus === 'pending';
  const isExpired = verificationStatus === 'expired';

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-surface-border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-text-tertiary" />
        <h2 className="font-semibold text-navy-900">Verification Status</h2>
      </div>
      
      {isVerified ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            <Shield className="w-5 h-5" />
            <span className="font-medium">ID Verified</span>
          </div>
          
          {verifiedBadgeExpiresAt && (
            <p className="text-xs text-text-tertiary">
              Valid through {new Date(verifiedBadgeExpiresAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      ) : isPending ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
          <Clock className="w-5 h-5" />
          <span className="font-medium">Verification Pending</span>
        </div>
      ) : isExpired ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <Shield className="w-5 h-5" />
          <span className="font-medium">Verification Expired</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200">
          <Shield className="w-5 h-5" />
          <span className="font-medium">Not Verified</span>
        </div>
      )}
      
      {/* MANDATORY AI DISCLOSURE */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-600">
          Verification reflects document review only and does not guarantee performance, quality, or outcomes. 
          Verification is assisted by automated (AI) analysis and human review.
        </p>
      </div>
    </div>
  );
}

// Named exports only - components are imported individually
