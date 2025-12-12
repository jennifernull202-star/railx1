/**
 * THE RAIL EXCHANGE™ — Contractor Type Display Component
 * 
 * Displays contractor types prominently on profiles and cards.
 * Shows primary types, sub-services, and service areas.
 */

'use client';

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

interface OtherTypeInfo {
  description?: string;
  primaryFocus?: string;
}

interface ContractorTypeDisplayProps {
  contractorTypes: ContractorType[];
  subServices?: Record<string, string[]>;
  otherTypeInfo?: OtherTypeInfo;
  variant?: 'full' | 'compact' | 'badges' | 'inline';
  showSubServices?: boolean;
  maxTypes?: number;
  className?: string;
}

export function ContractorTypeDisplay({
  contractorTypes,
  subServices = {},
  otherTypeInfo,
  variant = 'full',
  showSubServices = true,
  maxTypes,
  className = '',
}: ContractorTypeDisplayProps) {
  if (!contractorTypes || contractorTypes.length === 0) {
    return null;
  }

  const displayTypes = maxTypes ? contractorTypes.slice(0, maxTypes) : contractorTypes;
  const remainingCount = maxTypes ? Math.max(0, contractorTypes.length - maxTypes) : 0;

  // Badges variant - compact pill badges
  if (variant === 'badges') {
    return (
      <div className={`flex flex-wrap gap-1.5 ${className}`}>
        {displayTypes.map((typeId) => {
          const config = CONTRACTOR_TYPE_CONFIG[typeId];
          const IconComponent = TYPE_ICONS[typeId] || Wrench;
          const isHighRisk = config?.isHighRisk;
          
          return (
            <span
              key={typeId}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isHighRisk
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}
            >
              <IconComponent className="w-3 h-3" />
              {config?.shortLabel || typeId}
            </span>
          );
        })}
        {remainingCount > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-surface-tertiary text-text-secondary">
            +{remainingCount} more
          </span>
        )}
      </div>
    );
  }

  // Inline variant - comma-separated list
  if (variant === 'inline') {
    const labels = displayTypes.map((typeId) => {
      const config = CONTRACTOR_TYPE_CONFIG[typeId];
      return config?.shortLabel || typeId;
    });
    
    return (
      <span className={`text-sm text-text-secondary ${className}`}>
        {labels.join(', ')}
        {remainingCount > 0 && ` +${remainingCount} more`}
      </span>
    );
  }

  // Compact variant - smaller cards
  if (variant === 'compact') {
    return (
      <div className={`space-y-2 ${className}`}>
        {displayTypes.map((typeId) => {
          const config = CONTRACTOR_TYPE_CONFIG[typeId];
          const IconComponent = TYPE_ICONS[typeId] || Wrench;
          const isHighRisk = config?.isHighRisk;
          const typeSubServices = subServices[typeId] || [];
          
          return (
            <div
              key={typeId}
              className={`flex items-center gap-2 p-2 rounded-lg ${
                isHighRisk ? 'bg-amber-500/10' : 'bg-surface-secondary'
              }`}
            >
              <IconComponent
                className={`w-4 h-4 flex-shrink-0 ${
                  isHighRisk ? 'text-amber-400' : 'text-primary'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary truncate">
                    {config?.shortLabel || typeId}
                  </span>
                  {isHighRisk && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/20 text-amber-400">
                      Priority
                    </span>
                  )}
                </div>
                {showSubServices && typeSubServices.length > 0 && (
                  <p className="text-xs text-text-tertiary truncate">
                    {typeSubServices.length} sub-service{typeSubServices.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <p className="text-xs text-text-tertiary pl-2">
            +{remainingCount} more service{remainingCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    );
  }

  // Full variant - detailed display
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
        Services Offered
      </h3>
      <div className="space-y-3">
        {displayTypes.map((typeId) => {
          const config = CONTRACTOR_TYPE_CONFIG[typeId];
          const IconComponent = TYPE_ICONS[typeId] || Wrench;
          const isHighRisk = config?.isHighRisk;
          const typeSubServices = subServices[typeId] || [];
          
          return (
            <div
              key={typeId}
              className={`p-4 rounded-xl border ${
                isHighRisk
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-surface-secondary border-surface-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isHighRisk ? 'bg-amber-500/20' : 'bg-primary/10'
                  }`}
                >
                  <IconComponent
                    className={`w-5 h-5 ${
                      isHighRisk ? 'text-amber-400' : 'text-primary'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-medium text-text-primary">
                      {config?.label || typeId}
                    </h4>
                    {isHighRisk && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        High Priority
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    {config?.description}
                  </p>
                  {showSubServices && typeSubServices.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {typeSubServices.map((subId) => {
                        const subConfig = config?.subServices.find(s => s.id === subId);
                        return (
                          <span
                            key={subId}
                            className="px-2 py-1 text-xs rounded-md bg-surface-tertiary text-text-secondary"
                          >
                            {subConfig?.label || subId}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <p className="text-sm text-text-tertiary">
            +{remainingCount} additional service{remainingCount !== 1 ? 's' : ''}
          </p>
        )}
        
        {/* Show "Other" type description if present */}
        {contractorTypes.includes('other' as ContractorType) && otherTypeInfo?.description && (
          <div className="p-4 rounded-xl bg-surface-secondary border border-surface-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                <MoreHorizontal className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-medium text-text-primary">
                  Other Specialized Services
                </h4>
                <p className="text-sm text-text-secondary mt-1">
                  {otherTypeInfo.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContractorTypeDisplay;
