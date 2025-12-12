/**
 * THE RAIL EXCHANGE™ — Contractor Type Selector Component
 * 
 * Multi-select component for structured contractor type selection.
 * Used during registration and profile editing.
 * 
 * RULES:
 * - At least one type must be selected
 * - "Other" cannot be the only selection
 * - If "Other" is selected, description is required (max 150 chars)
 * - Sub-services are optional but encouraged
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Check, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
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
  CONTRACTOR_TYPES,
  CONTRACTOR_TYPE_CONFIG,
  getContractorTypesForDisplay,
  validateContractorTypes,
  type ContractorType,
  type SubServiceConfig,
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

interface ContractorTypeSelectorProps {
  selectedTypes: ContractorType[];
  selectedSubServices: Record<string, string[]>;
  otherDescription?: string;
  onChange: (
    types: ContractorType[],
    subServices: Record<string, string[]>,
    otherDescription?: string
  ) => void;
  error?: string;
  disabled?: boolean;
}

export function ContractorTypeSelector({
  selectedTypes,
  selectedSubServices,
  otherDescription = '',
  onChange,
  error,
  disabled = false,
}: ContractorTypeSelectorProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [localOtherDescription, setLocalOtherDescription] = useState(otherDescription);
  const [validationError, setValidationError] = useState<string | null>(null);

  const contractorTypes = getContractorTypesForDisplay();

  // Update local state when props change
  useEffect(() => {
    setLocalOtherDescription(otherDescription);
  }, [otherDescription]);

  // Validate on selection change
  useEffect(() => {
    const result = validateContractorTypes(selectedTypes, localOtherDescription);
    setValidationError(result.valid ? null : result.error || null);
  }, [selectedTypes, localOtherDescription]);

  const toggleType = (typeId: ContractorType) => {
    if (disabled) return;

    const newTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(t => t !== typeId)
      : [...selectedTypes, typeId];

    // If removing a type, also remove its sub-services
    const newSubServices = { ...selectedSubServices };
    if (!newTypes.includes(typeId)) {
      delete newSubServices[typeId];
    }

    // If removing "other", clear the description
    const newOtherDesc = newTypes.includes(CONTRACTOR_TYPES.OTHER) ? localOtherDescription : '';

    onChange(newTypes, newSubServices, newOtherDesc);
  };

  const toggleSubService = (typeId: ContractorType, subServiceId: string) => {
    if (disabled) return;

    const currentSubs = selectedSubServices[typeId] || [];
    const newSubs = currentSubs.includes(subServiceId)
      ? currentSubs.filter(s => s !== subServiceId)
      : [...currentSubs, subServiceId];

    const newSubServices = {
      ...selectedSubServices,
      [typeId]: newSubs,
    };

    onChange(selectedTypes, newSubServices, localOtherDescription);
  };

  const toggleExpanded = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
    }
    setExpandedTypes(newExpanded);
  };

  const handleOtherDescriptionChange = (value: string) => {
    // Limit to 150 characters
    const trimmed = value.slice(0, 150);
    setLocalOtherDescription(trimmed);
    onChange(selectedTypes, selectedSubServices, trimmed);
  };

  const displayError = error || validationError;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Contractor Types
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Select all service types that apply to your business. At least one is required.
          </p>
        </div>
        <div className="text-sm text-text-tertiary">
          {selectedTypes.length} selected
        </div>
      </div>

      {/* Error display */}
      {displayError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {displayError}
        </div>
      )}

      {/* Type list */}
      <div className="space-y-2">
        {contractorTypes.map((typeConfig) => {
          const isSelected = selectedTypes.includes(typeConfig.id);
          const isExpanded = expandedTypes.has(typeConfig.id);
          const hasSubServices = typeConfig.subServices.length > 0;
          const selectedSubCount = (selectedSubServices[typeConfig.id] || []).length;
          const IconComponent = TYPE_ICONS[typeConfig.id] || Wrench;

          return (
            <div
              key={typeConfig.id}
              className={`border rounded-xl overflow-hidden transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-surface-border bg-surface-secondary hover:border-surface-border/80'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Type header */}
              <div
                className={`flex items-center gap-3 p-4 ${
                  disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={() => !disabled && toggleType(typeConfig.id)}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'border-text-tertiary'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>

                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-primary/20' : 'bg-surface-tertiary'
                  }`}
                >
                  <IconComponent
                    className={`w-5 h-5 ${
                      isSelected ? 'text-primary' : 'text-text-tertiary'
                    }`}
                  />
                </div>

                {/* Label and description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        isSelected ? 'text-primary' : 'text-text-primary'
                      }`}
                    >
                      {typeConfig.label}
                    </span>
                    {typeConfig.isHighRisk && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400">
                        High Priority
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-1">
                    {typeConfig.description}
                  </p>
                </div>

                {/* Sub-services indicator */}
                {isSelected && hasSubServices && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(typeConfig.id);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {selectedSubCount > 0 && (
                      <span className="text-primary font-medium">
                        {selectedSubCount} sub-service{selectedSubCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Sub-services panel */}
              {isSelected && hasSubServices && isExpanded && (
                <div className="px-4 pb-4 pt-0">
                  <div className="border-t border-surface-border pt-4">
                    <p className="text-sm text-text-secondary mb-3">
                      Select specific services you offer (optional):
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {typeConfig.subServices.map((subService: SubServiceConfig) => {
                        const isSubSelected = (
                          selectedSubServices[typeConfig.id] || []
                        ).includes(subService.id);

                        return (
                          <button
                            key={subService.id}
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              toggleSubService(typeConfig.id, subService.id)
                            }
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isSubSelected
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-surface-tertiary text-text-secondary hover:bg-surface-tertiary/80 border border-transparent'
                            } ${disabled ? 'cursor-not-allowed' : ''}`}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSubSelected
                                  ? 'bg-primary border-primary'
                                  : 'border-text-tertiary'
                              }`}
                            >
                              {isSubSelected && (
                                <Check className="w-2.5 h-2.5 text-white" />
                              )}
                            </div>
                            <span className="truncate">{subService.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* "Other" description input */}
              {typeConfig.id === CONTRACTOR_TYPES.OTHER && isSelected && (
                <div className="px-4 pb-4 pt-0">
                  <div className="border-t border-surface-border pt-4">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Please describe your other services{' '}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={localOtherDescription}
                      onChange={(e) => handleOtherDescriptionChange(e.target.value)}
                      placeholder="e.g., Specialized tank car valve refurbishment"
                      disabled={disabled}
                      className={`w-full px-4 py-2 bg-surface-tertiary border border-surface-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        disabled ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                      maxLength={150}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-text-tertiary">
                        Required when &ldquo;Other&rdquo; is selected
                      </span>
                      <span
                        className={`text-xs ${
                          localOtherDescription.length > 140
                            ? 'text-amber-400'
                            : 'text-text-tertiary'
                        }`}
                      >
                        {localOtherDescription.length}/150
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {selectedTypes.length > 0 && (
        <div className="p-4 bg-surface-secondary border border-surface-border rounded-xl">
          <h4 className="text-sm font-medium text-text-primary mb-2">
            Selected Services Summary
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedTypes.map((typeId) => {
              const config = CONTRACTOR_TYPE_CONFIG[typeId];
              return (
                <span
                  key={typeId}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                >
                  {config?.shortLabel || typeId}
                  <button
                    type="button"
                    onClick={() => toggleType(typeId)}
                    className="ml-1 hover:text-primary/70"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ContractorTypeSelector;
