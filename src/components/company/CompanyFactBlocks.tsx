/**
 * THE RAIL EXCHANGE™ — Company Fact Blocks
 * 
 * OPUS EXECUTION: Profile Pages (Company Facts)
 * 
 * Clickable chip-based fact blocks for company profiles:
 * - Company Type (Manufacturer, Supplier, Distributor, OEM)
 * - Product Categories (clickable → marketplace search)
 * - Markets Served (Freight Rail, Short Line, Industrial, Transit)
 * - Headquarters Location
 * - Years in Business (self-reported)
 * 
 * COMPLIANCE:
 * - All facts marked "Self-reported" where applicable
 * - Neutral styling (NO green checks, NO shields implying endorsement)
 * - Mandatory disclaimers on all sections
 */

'use client';

import Link from 'next/link';
import {
  Building2,
  Package,
  MapPin,
  Calendar,
  Train,
  Factory,
  Truck,
  Settings,
  ShieldCheck,
  Globe,
  Linkedin,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';

// ============================================================================
// COMPANY TYPE OPTIONS
// ============================================================================

export const COMPANY_TYPES = {
  manufacturer: { id: 'manufacturer', label: 'Manufacturer', icon: Factory },
  supplier: { id: 'supplier', label: 'Supplier', icon: Package },
  distributor: { id: 'distributor', label: 'Distributor', icon: Truck },
  oem: { id: 'oem', label: 'OEM', icon: Settings },
} as const;

export type CompanyType = keyof typeof COMPANY_TYPES;

// ============================================================================
// PRODUCT CATEGORY OPTIONS
// ============================================================================

export const PRODUCT_CATEGORIES = [
  { id: 'railcars', label: 'Railcars' },
  { id: 'components', label: 'Components' },
  { id: 'tools', label: 'Tools' },
  { id: 'materials', label: 'Materials' },
  { id: 'technology', label: 'Technology' },
  { id: 'safety-equipment', label: 'Safety Equipment' },
  { id: 'track-materials', label: 'Track Materials' },
  { id: 'locomotive-parts', label: 'Locomotive Parts' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'signaling', label: 'Signaling' },
] as const;

// ============================================================================
// MARKETS SERVED OPTIONS
// ============================================================================

export const MARKETS_SERVED = [
  { id: 'freight-rail', label: 'Freight Rail' },
  { id: 'short-line', label: 'Short Line' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'transit', label: 'Transit' },
  { id: 'class-i', label: 'Class I Railroad' },
  { id: 'regional', label: 'Regional Railroad' },
] as const;

// ============================================================================
// COMPANY TYPE CHIPS
// ============================================================================

interface CompanyTypeChipsProps {
  companyType?: CompanyType | string;
  className?: string;
}

export function CompanyTypeChips({ companyType, className = '' }: CompanyTypeChipsProps) {
  if (!companyType) return null;

  const config = COMPANY_TYPES[companyType as CompanyType];
  const Icon = config?.icon || Building2;
  const label = config?.label || companyType;

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-surface-border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-text-tertiary" />
        <h2 className="font-semibold text-navy-900">Company Type</h2>
      </div>
      
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      
      <p className="text-xs text-text-tertiary mt-3">(Self-reported)</p>
    </div>
  );
}

// ============================================================================
// PRODUCT CATEGORIES (Clickable → Marketplace Search)
// ============================================================================

interface ProductCategoriesProps {
  categories: string[];
  maxDisplay?: number;
  className?: string;
}

export function ProductCategories({ categories, maxDisplay = 10, className = '' }: ProductCategoriesProps) {
  if (!categories || categories.length === 0) return null;

  const displayedCategories = categories.slice(0, maxDisplay);
  const remainingCount = Math.max(0, categories.length - maxDisplay);

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-surface-border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-text-tertiary" />
        <h2 className="font-semibold text-navy-900">Product Categories</h2>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {displayedCategories.map((category) => {
          const config = PRODUCT_CATEGORIES.find(c => c.id === category || c.label === category);
          const label = config?.label || category;
          
          return (
            <Link
              key={category}
              href={`/marketplace?category=${encodeURIComponent(category)}`}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              {label}
            </Link>
          );
        })}
        {remainingCount > 0 && (
          <span className="px-3 py-1.5 bg-surface-secondary rounded-lg text-sm text-text-tertiary">
            +{remainingCount} more
          </span>
        )}
      </div>
      
      <p className="text-xs text-text-tertiary mt-3 italic">
        Click any category to browse products.
      </p>
    </div>
  );
}

// ============================================================================
// MARKETS SERVED
// ============================================================================

interface MarketsServedProps {
  markets: string[];
  className?: string;
}

export function MarketsServed({ markets, className = '' }: MarketsServedProps) {
  if (!markets || markets.length === 0) return null;

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-surface-border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Train className="w-5 h-5 text-text-tertiary" />
        <h2 className="font-semibold text-navy-900">Markets Served</h2>
        <span className="text-xs text-text-tertiary">(Self-reported)</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {markets.map((market) => {
          const config = MARKETS_SERVED.find(m => m.id === market || m.label === market);
          const label = config?.label || market;
          
          return (
            <span
              key={market}
              className="px-3 py-1.5 bg-surface-secondary rounded-lg text-sm text-navy-900"
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// DISTRIBUTION REGIONS
// ============================================================================

interface DistributionRegionsProps {
  regions: string[];
  maxDisplay?: number;
  className?: string;
}

export function DistributionRegions({ regions, maxDisplay = 8, className = '' }: DistributionRegionsProps) {
  if (!regions || regions.length === 0) return null;

  const displayedRegions = regions.slice(0, maxDisplay);
  const remainingCount = Math.max(0, regions.length - maxDisplay);
  const hasNationwide = regions.some(r => r.toLowerCase() === 'nationwide' || r.toLowerCase() === 'national');

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-surface-border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-text-tertiary" />
        <h2 className="font-semibold text-navy-900">Distribution Regions</h2>
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
            <span
              key={region}
              className="px-3 py-1.5 bg-surface-secondary rounded-lg text-sm text-navy-900"
            >
              {region}
            </span>
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
// COMPANY DETAILS BLOCK (HQ, Years, etc.)
// ============================================================================

interface CompanyDetailsProps {
  headquarters?: { city?: string; state?: string };
  yearFounded?: number;
  employeeCount?: string;
  className?: string;
}

export function CompanyDetails({ headquarters, yearFounded, employeeCount, className = '' }: CompanyDetailsProps) {
  const hasLocation = headquarters?.city || headquarters?.state;
  const hasYears = yearFounded && yearFounded > 0;
  
  if (!hasLocation && !hasYears && !employeeCount) return null;

  const yearsInBusiness = hasYears ? new Date().getFullYear() - yearFounded : null;

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-surface-border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-text-tertiary" />
        <h2 className="font-semibold text-navy-900">Company Details</h2>
      </div>
      
      <div className="space-y-3">
        {hasLocation && (
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-text-tertiary flex-shrink-0" />
            <div>
              <span className="text-navy-900">
                {headquarters?.city && headquarters?.state 
                  ? `${headquarters.city}, ${headquarters.state}`
                  : headquarters?.state || headquarters?.city}
              </span>
              <span className="text-xs text-text-tertiary ml-2">(Headquarters)</span>
            </div>
          </div>
        )}
        
        {hasYears && (
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-text-tertiary flex-shrink-0" />
            <div>
              <span className="text-navy-900">Est. {yearFounded}</span>
              {yearsInBusiness && yearsInBusiness > 0 && (
                <span className="text-text-tertiary ml-2">({yearsInBusiness} years)</span>
              )}
              <span className="text-xs text-text-tertiary ml-2">(Self-reported)</span>
            </div>
          </div>
        )}
        
        {employeeCount && (
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-text-tertiary flex-shrink-0" />
            <div>
              <span className="text-navy-900">{employeeCount} employees</span>
              <span className="text-xs text-text-tertiary ml-2">(Self-reported)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// VERIFICATION BLOCK (Company)
// ============================================================================

interface CompanyVerificationBlockProps {
  isVerified: boolean;
  isSponsored?: boolean;
  className?: string;
}

export function CompanyVerificationBlock({ isVerified, isSponsored, className = '' }: CompanyVerificationBlockProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-card border border-surface-border p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-text-tertiary" />
        <h2 className="font-semibold text-navy-900">Verification</h2>
      </div>
      
      <div className="space-y-3">
        {isVerified ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-medium">ID Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-medium">Not Verified</span>
          </div>
        )}
        
        {isSponsored && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
            <span className="font-medium">Sponsored</span>
          </div>
        )}
      </div>
      
      {/* MANDATORY DISCLOSURE */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-600">
          Verification reflects document submission and review only. It does not guarantee 
          performance, authority, compliance, or transaction outcomes. Verification is assisted 
          by automated (AI) analysis and human review.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// CONTACT LINKS (With Outbound Tracking)
// ============================================================================

interface ContactLinksProps {
  companyId: string;
  website?: string;
  linkedIn?: string;
  email?: string;
  phone?: string;
  onOutboundClick?: (type: 'website' | 'linkedin' | 'email' | 'phone') => void;
  className?: string;
}

export function ContactLinks({
  companyId,
  website,
  linkedIn,
  email,
  phone,
  onOutboundClick,
  className = '',
}: ContactLinksProps) {
  if (!website && !linkedIn && !email && !phone) return null;

  const handleClick = (type: 'website' | 'linkedin' | 'email' | 'phone') => {
    onOutboundClick?.(type);
    
    // Fire analytics (fire-and-forget)
    fetch('/api/analytics/outbound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: 'company',
        targetId: companyId,
        clickType: type,
      }),
    }).catch(() => {});
  };

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {website && (
        <a
          href={website.startsWith('http') ? website : `https://${website}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleClick('website')}
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
          onClick={() => handleClick('linkedin')}
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
          onClick={() => handleClick('email')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Email
        </a>
      )}
      
      {phone && (
        <a
          href={`tel:${phone}`}
          onClick={() => handleClick('phone')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          <Phone className="w-4 h-4" />
          Call
        </a>
      )}
    </div>
  );
}

// ============================================================================
// SELF-REPORTED DISCLAIMER (Reusable)
// ============================================================================

interface SelfReportedDisclaimerProps {
  className?: string;
}

export function SelfReportedDisclaimer({ className = '' }: SelfReportedDisclaimerProps) {
  return (
    <div className={`p-3 bg-amber-50 rounded-lg border border-amber-200 ${className}`}>
      <p className="text-xs text-amber-800">
        <strong>Note:</strong> Business information is provided by the company and is self-reported. 
        This information has not been independently verified by The Rail Exchange.
      </p>
    </div>
  );
}
