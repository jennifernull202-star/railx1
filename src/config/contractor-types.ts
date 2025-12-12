/**
 * THE RAIL EXCHANGE™ — Contractor Types Configuration
 * 
 * SINGLE SOURCE OF TRUTH for contractor classification in the rail industry.
 * 
 * PURPOSE:
 * - Structured contractor type selection during registration
 * - Marketplace matching between equipment and contractors
 * - Search filtering and map placement
 * - Future monetization (category sponsorships, limited slots)
 * 
 * RULES:
 * - Contractor types are STRUCTURAL DATA, not marketing copy
 * - Multi-discipline contractors are supported
 * - Free-text is controlled and secondary
 * - All marketplace matching uses these types + payment status
 */

// ============================================================================
// PRIMARY CONTRACTOR TYPES
// ============================================================================
// These are the main contractor classifications for the rail industry.
// Contractors MUST select at least one during registration.

export const CONTRACTOR_TYPES = {
  TRACK_CONSTRUCTION: 'track-construction',
  RAILCAR_REPAIR: 'railcar-repair',
  LOCOMOTIVE_SERVICE: 'locomotive-service',
  MOW: 'mow', // Maintenance of Way
  SIGNAL_COMMUNICATIONS: 'signal-communications',
  ELECTRICAL_POWER: 'electrical-power',
  ENVIRONMENTAL: 'environmental',
  HAZMAT_SPILL: 'hazmat-spill',
  EMERGENCY_RESPONSE: 'emergency-response',
  RERAIL_DERAILMENT: 'rerail-derailment',
  INSPECTION_COMPLIANCE: 'inspection-compliance',
  TRANSPORT_LOGISTICS: 'transport-logistics',
  SCRAP_DECOMMISSION: 'scrap-decommission',
  ENGINEERING_CONSULTING: 'engineering-consulting',
  OTHER: 'other',
} as const;

export type ContractorType = typeof CONTRACTOR_TYPES[keyof typeof CONTRACTOR_TYPES];

// ============================================================================
// CONTRACTOR TYPE METADATA
// ============================================================================
// Display labels, descriptions, icons for each contractor type

export interface ContractorTypeConfig {
  id: ContractorType;
  label: string;
  shortLabel: string;
  description: string;
  icon: string; // Lucide icon name
  subServices: SubServiceConfig[];
  // Equipment categories this contractor type is relevant for
  relevantEquipmentCategories: string[];
  // Is this a high-risk/emergency service (premium placement potential)
  isHighRisk: boolean;
  // Sort order for display
  sortOrder: number;
}

export interface SubServiceConfig {
  id: string;
  label: string;
  description?: string;
}

export const CONTRACTOR_TYPE_CONFIG: Record<ContractorType, ContractorTypeConfig> = {
  [CONTRACTOR_TYPES.TRACK_CONSTRUCTION]: {
    id: CONTRACTOR_TYPES.TRACK_CONSTRUCTION,
    label: 'Track Construction & Maintenance',
    shortLabel: 'Track',
    description: 'New track construction, repair, and ongoing maintenance services',
    icon: 'railroad',
    subServices: [
      { id: 'tie-replacement', label: 'Tie Replacement' },
      { id: 'surfacing', label: 'Surfacing & Ballast' },
      { id: 'welding', label: 'Rail Welding (Field/Thermite)' },
      { id: 'rail-replacement', label: 'Rail Replacement' },
      { id: 'switch-installation', label: 'Switch & Turnout Installation' },
      { id: 'grinding', label: 'Rail Grinding & Profiling' },
      { id: 'geometry-correction', label: 'Track Geometry Correction' },
      { id: 'crossing-repair', label: 'Grade Crossing Repair' },
    ],
    relevantEquipmentCategories: ['track-materials', 'mow-equipment', 'tools'],
    isHighRisk: false,
    sortOrder: 1,
  },

  [CONTRACTOR_TYPES.RAILCAR_REPAIR]: {
    id: CONTRACTOR_TYPES.RAILCAR_REPAIR,
    label: 'Railcar Repair (Shop or Mobile)',
    shortLabel: 'Railcar Repair',
    description: 'Freight and passenger railcar repair, maintenance, and qualification services',
    icon: 'train-front',
    subServices: [
      { id: 'mobile-repair', label: 'Mobile Repair Services' },
      { id: 'tank-car-qualification', label: 'Tank Car Qualification' },
      { id: 'valve-service', label: 'Valve Service & Repair' },
      { id: 'running-repair', label: 'Running Repair' },
      { id: 'wheel-truck', label: 'Wheel & Truck Repair' },
      { id: 'air-brake', label: 'Air Brake Service' },
      { id: 'coupler-draft', label: 'Coupler & Draft Gear' },
      { id: 'lining-coating', label: 'Interior Lining & Coating' },
      { id: 'structural-repair', label: 'Structural Repair' },
    ],
    relevantEquipmentCategories: ['railcars', 'tank-cars', 'freight-cars', 'passenger-cars'],
    isHighRisk: false,
    sortOrder: 2,
  },

  [CONTRACTOR_TYPES.LOCOMOTIVE_SERVICE]: {
    id: CONTRACTOR_TYPES.LOCOMOTIVE_SERVICE,
    label: 'Locomotive Service & Repair',
    shortLabel: 'Locomotive',
    description: 'Locomotive maintenance, repair, overhaul, and modernization',
    icon: 'train',
    subServices: [
      { id: 'engine-overhaul', label: 'Engine Overhaul' },
      { id: 'traction-motor', label: 'Traction Motor Service' },
      { id: 'electrical-systems', label: 'Electrical Systems' },
      { id: 'air-compressor', label: 'Air Compressor Service' },
      { id: 'fuel-injection', label: 'Fuel Injection Service' },
      { id: 'cooling-systems', label: 'Cooling Systems' },
      { id: 'cab-interior', label: 'Cab & Interior Refurbishment' },
      { id: 'emissions-upgrade', label: 'Emissions Upgrade' },
      { id: 'pts-installation', label: 'PTC Installation & Service' },
    ],
    relevantEquipmentCategories: ['locomotives', 'engines', 'parts'],
    isHighRisk: false,
    sortOrder: 3,
  },

  [CONTRACTOR_TYPES.MOW]: {
    id: CONTRACTOR_TYPES.MOW,
    label: 'Maintenance of Way (MOW)',
    shortLabel: 'MOW',
    description: 'Right-of-way maintenance, vegetation management, and infrastructure upkeep',
    icon: 'hard-hat',
    subServices: [
      { id: 'vegetation-mgmt', label: 'Vegetation Management' },
      { id: 'brush-cutting', label: 'Brush Cutting & Clearing' },
      { id: 'drainage', label: 'Drainage & Culvert Work' },
      { id: 'fencing', label: 'Fencing & Boundaries' },
      { id: 'bridge-inspection', label: 'Bridge & Structure Inspection' },
      { id: 'tunnel-maintenance', label: 'Tunnel Maintenance' },
      { id: 'snow-removal', label: 'Snow & Ice Removal' },
    ],
    relevantEquipmentCategories: ['mow-equipment', 'track-materials', 'tools'],
    isHighRisk: false,
    sortOrder: 4,
  },

  [CONTRACTOR_TYPES.SIGNAL_COMMUNICATIONS]: {
    id: CONTRACTOR_TYPES.SIGNAL_COMMUNICATIONS,
    label: 'Signal & Communications',
    shortLabel: 'Signal',
    description: 'Signal systems, crossing protection, and communication infrastructure',
    icon: 'radio-tower',
    subServices: [
      { id: 'signal-installation', label: 'Signal Installation' },
      { id: 'signal-maintenance', label: 'Signal Maintenance' },
      { id: 'crossing-protection', label: 'Crossing Protection Systems' },
      { id: 'ptc', label: 'PTC Systems' },
      { id: 'radio-comm', label: 'Radio Communications' },
      { id: 'fiber-optic', label: 'Fiber Optic Installation' },
      { id: 'defect-detectors', label: 'Defect Detectors' },
    ],
    relevantEquipmentCategories: ['signal-equipment', 'electronics', 'communications'],
    isHighRisk: false,
    sortOrder: 5,
  },

  [CONTRACTOR_TYPES.ELECTRICAL_POWER]: {
    id: CONTRACTOR_TYPES.ELECTRICAL_POWER,
    label: 'Electrical & Power Systems',
    shortLabel: 'Electrical',
    description: 'Electrical systems, catenary, substations, and power distribution',
    icon: 'zap',
    subServices: [
      { id: 'catenary', label: 'Catenary Installation & Repair' },
      { id: 'substation', label: 'Substation Work' },
      { id: 'third-rail', label: 'Third Rail Systems' },
      { id: 'power-distribution', label: 'Power Distribution' },
      { id: 'grounding', label: 'Grounding & Bonding' },
      { id: 'lighting', label: 'Yard & Facility Lighting' },
    ],
    relevantEquipmentCategories: ['electrical', 'power-equipment', 'signal-equipment'],
    isHighRisk: false,
    sortOrder: 6,
  },

  [CONTRACTOR_TYPES.ENVIRONMENTAL]: {
    id: CONTRACTOR_TYPES.ENVIRONMENTAL,
    label: 'Environmental Services',
    shortLabel: 'Environmental',
    description: 'Environmental compliance, remediation, and waste management',
    icon: 'leaf',
    subServices: [
      { id: 'soil-remediation', label: 'Soil Remediation' },
      { id: 'groundwater', label: 'Groundwater Treatment' },
      { id: 'waste-transport', label: 'Waste Transport & Disposal' },
      { id: 'asbestos', label: 'Asbestos Abatement' },
      { id: 'lead-paint', label: 'Lead Paint Removal' },
      { id: 'tank-cleaning', label: 'Tank Car Cleaning' },
      { id: 'environmental-assessment', label: 'Environmental Assessment' },
    ],
    relevantEquipmentCategories: ['tank-cars', 'hazmat', 'all'],
    isHighRisk: true,
    sortOrder: 7,
  },

  [CONTRACTOR_TYPES.HAZMAT_SPILL]: {
    id: CONTRACTOR_TYPES.HAZMAT_SPILL,
    label: 'Hazmat & Spill Response',
    shortLabel: 'Hazmat',
    description: 'Hazardous materials handling, spill response, and cleanup',
    icon: 'alert-triangle',
    subServices: [
      { id: 'spill-cleanup', label: 'Spill Cleanup' },
      { id: 'hazmat-transfer', label: 'Hazmat Product Transfer' },
      { id: 'confined-space', label: 'Confined Space Entry' },
      { id: 'vapor-control', label: 'Vapor Control' },
      { id: 'decon', label: 'Decontamination Services' },
      { id: 'emergency-containment', label: 'Emergency Containment' },
    ],
    relevantEquipmentCategories: ['tank-cars', 'hazmat', 'all'],
    isHighRisk: true,
    sortOrder: 8,
  },

  [CONTRACTOR_TYPES.EMERGENCY_RESPONSE]: {
    id: CONTRACTOR_TYPES.EMERGENCY_RESPONSE,
    label: 'Emergency Response',
    shortLabel: 'Emergency',
    description: '24/7 emergency response services for rail incidents',
    icon: 'siren',
    subServices: [
      { id: '24-7-response', label: '24/7 Emergency Response' },
      { id: 'incident-command', label: 'Incident Command Support' },
      { id: 'firefighting', label: 'Rail Firefighting' },
      { id: 'rescue', label: 'Technical Rescue' },
      { id: 'medical', label: 'Medical Response' },
    ],
    relevantEquipmentCategories: ['all'],
    isHighRisk: true,
    sortOrder: 9,
  },

  [CONTRACTOR_TYPES.RERAIL_DERAILMENT]: {
    id: CONTRACTOR_TYPES.RERAIL_DERAILMENT,
    label: 'Re-Rail & Derailment Response',
    shortLabel: 'Re-Rail',
    description: 'Derailment response, re-railing, and wreck clearing services',
    icon: 'construction',
    subServices: [
      { id: 'rerailing', label: 'Re-Railing Services' },
      { id: 'wreck-clearing', label: 'Wreck Clearing' },
      { id: 'heavy-lift', label: 'Heavy Lift & Rigging' },
      { id: 'track-restoration', label: 'Emergency Track Restoration' },
      { id: 'equipment-recovery', label: 'Equipment Recovery' },
    ],
    relevantEquipmentCategories: ['all', 'locomotives', 'railcars'],
    isHighRisk: true,
    sortOrder: 10,
  },

  [CONTRACTOR_TYPES.INSPECTION_COMPLIANCE]: {
    id: CONTRACTOR_TYPES.INSPECTION_COMPLIANCE,
    label: 'Inspection & Compliance (FRA/AAR)',
    shortLabel: 'Inspection',
    description: 'Regulatory inspections, compliance audits, and certification services',
    icon: 'clipboard-check',
    subServices: [
      { id: 'fra-inspection', label: 'FRA Inspections' },
      { id: 'aar-qualification', label: 'AAR Qualification' },
      { id: 'tank-car-inspection', label: 'Tank Car Inspection' },
      { id: 'ndt', label: 'Non-Destructive Testing' },
      { id: 'bridge-inspection', label: 'Bridge Inspection' },
      { id: 'track-inspection', label: 'Track Inspection' },
      { id: 'safety-audit', label: 'Safety Audits' },
      { id: 'certification', label: 'Certification Services' },
    ],
    relevantEquipmentCategories: ['all', 'railcars', 'tank-cars', 'locomotives'],
    isHighRisk: false,
    sortOrder: 11,
  },

  [CONTRACTOR_TYPES.TRANSPORT_LOGISTICS]: {
    id: CONTRACTOR_TYPES.TRANSPORT_LOGISTICS,
    label: 'Transport, Heavy Haul & Logistics',
    shortLabel: 'Transport',
    description: 'Equipment transport, heavy haul, and logistics services',
    icon: 'truck',
    subServices: [
      { id: 'heavy-haul', label: 'Heavy Haul Transport' },
      { id: 'rail-to-road', label: 'Rail-to-Road Transfer' },
      { id: 'oversized', label: 'Oversized Load Transport' },
      { id: 'equipment-moving', label: 'Equipment Relocation' },
      { id: 'logistics', label: 'Logistics Coordination' },
      { id: 'storage', label: 'Storage & Staging' },
    ],
    relevantEquipmentCategories: ['all', 'locomotives', 'railcars', 'mow-equipment'],
    isHighRisk: false,
    sortOrder: 12,
  },

  [CONTRACTOR_TYPES.SCRAP_DECOMMISSION]: {
    id: CONTRACTOR_TYPES.SCRAP_DECOMMISSION,
    label: 'Scrap & Decommissioning',
    shortLabel: 'Scrap',
    description: 'Equipment scrapping, decommissioning, and recycling services',
    icon: 'recycle',
    subServices: [
      { id: 'rail-scrapping', label: 'Rail Scrapping' },
      { id: 'car-scrapping', label: 'Railcar Scrapping' },
      { id: 'locomotive-scrapping', label: 'Locomotive Scrapping' },
      { id: 'material-recycling', label: 'Material Recycling' },
      { id: 'decommissioning', label: 'Facility Decommissioning' },
      { id: 'asset-recovery', label: 'Asset & Parts Recovery' },
    ],
    relevantEquipmentCategories: ['all', 'railcars', 'locomotives', 'track-materials'],
    isHighRisk: false,
    sortOrder: 13,
  },

  [CONTRACTOR_TYPES.ENGINEERING_CONSULTING]: {
    id: CONTRACTOR_TYPES.ENGINEERING_CONSULTING,
    label: 'Engineering & Consulting',
    shortLabel: 'Engineering',
    description: 'Engineering design, project management, and consulting services',
    icon: 'drafting-compass',
    subServices: [
      { id: 'track-design', label: 'Track Design' },
      { id: 'signal-design', label: 'Signal System Design' },
      { id: 'project-mgmt', label: 'Project Management' },
      { id: 'feasibility', label: 'Feasibility Studies' },
      { id: 'permitting', label: 'Permitting & Regulatory' },
      { id: 'surveying', label: 'Surveying & Mapping' },
      { id: 'structural-eng', label: 'Structural Engineering' },
    ],
    relevantEquipmentCategories: ['all'],
    isHighRisk: false,
    sortOrder: 14,
  },

  [CONTRACTOR_TYPES.OTHER]: {
    id: CONTRACTOR_TYPES.OTHER,
    label: 'Other (Please Specify)',
    shortLabel: 'Other',
    description: 'Other specialized rail services not listed above',
    icon: 'more-horizontal',
    subServices: [],
    relevantEquipmentCategories: [],
    isHighRisk: false,
    sortOrder: 99,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all contractor types for display (excluding hidden/internal types)
 */
export function getContractorTypesForDisplay(): ContractorTypeConfig[] {
  return Object.values(CONTRACTOR_TYPE_CONFIG)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get contractor type config by ID
 */
export function getContractorTypeConfig(typeId: ContractorType): ContractorTypeConfig | undefined {
  return CONTRACTOR_TYPE_CONFIG[typeId];
}

/**
 * Get sub-services for a contractor type
 */
export function getSubServicesForType(typeId: ContractorType): SubServiceConfig[] {
  return CONTRACTOR_TYPE_CONFIG[typeId]?.subServices || [];
}

/**
 * Get contractor types relevant to an equipment category
 */
export function getContractorTypesForEquipment(equipmentCategory: string): ContractorTypeConfig[] {
  return Object.values(CONTRACTOR_TYPE_CONFIG)
    .filter(config => 
      config.relevantEquipmentCategories.includes(equipmentCategory) ||
      config.relevantEquipmentCategories.includes('all')
    )
    .sort((a, b) => {
      // High-risk services first (emergency, hazmat, etc.)
      if (a.isHighRisk !== b.isHighRisk) {
        return a.isHighRisk ? -1 : 1;
      }
      return a.sortOrder - b.sortOrder;
    });
}

/**
 * Get high-risk contractor types (for premium placement)
 */
export function getHighRiskContractorTypes(): ContractorTypeConfig[] {
  return Object.values(CONTRACTOR_TYPE_CONFIG)
    .filter(config => config.isHighRisk)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Validate contractor type selection
 * Rules:
 * - At least one type must be selected
 * - "Other" cannot be the only selection
 * - If "Other" is selected, otherDescription is required
 */
export function validateContractorTypes(
  types: ContractorType[],
  otherDescription?: string
): { valid: boolean; error?: string } {
  if (!types || types.length === 0) {
    return { valid: false, error: 'At least one contractor type must be selected' };
  }

  const hasOnlyOther = types.length === 1 && types[0] === CONTRACTOR_TYPES.OTHER;
  if (hasOnlyOther) {
    return { valid: false, error: 'Cannot select only "Other". Please select at least one primary contractor type.' };
  }

  const hasOther = types.includes(CONTRACTOR_TYPES.OTHER);
  if (hasOther && (!otherDescription || otherDescription.trim().length === 0)) {
    return { valid: false, error: 'Please provide a description for "Other" services' };
  }

  if (hasOther && otherDescription && otherDescription.length > 150) {
    return { valid: false, error: 'Other description must be 150 characters or less' };
  }

  return { valid: true };
}

/**
 * Get display labels for contractor types
 */
export function getContractorTypeLabels(types: ContractorType[]): string[] {
  return types
    .map(typeId => CONTRACTOR_TYPE_CONFIG[typeId]?.label || typeId)
    .filter(Boolean);
}

/**
 * Get short labels for contractor types (for badges, compact display)
 */
export function getContractorTypeShortLabels(types: ContractorType[]): string[] {
  return types
    .map(typeId => CONTRACTOR_TYPE_CONFIG[typeId]?.shortLabel || typeId)
    .filter(Boolean);
}

// ============================================================================
// EQUIPMENT CATEGORY TO CONTRACTOR TYPE MAPPING
// ============================================================================
// Maps equipment listing categories to relevant contractor types

export const EQUIPMENT_TO_CONTRACTOR_MAPPING: Record<string, ContractorType[]> = {
  'locomotives': [
    CONTRACTOR_TYPES.LOCOMOTIVE_SERVICE,
    CONTRACTOR_TYPES.TRANSPORT_LOGISTICS,
    CONTRACTOR_TYPES.INSPECTION_COMPLIANCE,
    CONTRACTOR_TYPES.SCRAP_DECOMMISSION,
  ],
  'railcars': [
    CONTRACTOR_TYPES.RAILCAR_REPAIR,
    CONTRACTOR_TYPES.TRANSPORT_LOGISTICS,
    CONTRACTOR_TYPES.INSPECTION_COMPLIANCE,
    CONTRACTOR_TYPES.SCRAP_DECOMMISSION,
  ],
  'tank-cars': [
    CONTRACTOR_TYPES.RAILCAR_REPAIR,
    CONTRACTOR_TYPES.HAZMAT_SPILL,
    CONTRACTOR_TYPES.ENVIRONMENTAL,
    CONTRACTOR_TYPES.INSPECTION_COMPLIANCE,
    CONTRACTOR_TYPES.TRANSPORT_LOGISTICS,
  ],
  'freight-cars': [
    CONTRACTOR_TYPES.RAILCAR_REPAIR,
    CONTRACTOR_TYPES.TRANSPORT_LOGISTICS,
    CONTRACTOR_TYPES.INSPECTION_COMPLIANCE,
  ],
  'passenger-cars': [
    CONTRACTOR_TYPES.RAILCAR_REPAIR,
    CONTRACTOR_TYPES.INSPECTION_COMPLIANCE,
    CONTRACTOR_TYPES.TRANSPORT_LOGISTICS,
  ],
  'track-materials': [
    CONTRACTOR_TYPES.TRACK_CONSTRUCTION,
    CONTRACTOR_TYPES.MOW,
    CONTRACTOR_TYPES.TRANSPORT_LOGISTICS,
    CONTRACTOR_TYPES.SCRAP_DECOMMISSION,
  ],
  'mow-equipment': [
    CONTRACTOR_TYPES.MOW,
    CONTRACTOR_TYPES.TRACK_CONSTRUCTION,
    CONTRACTOR_TYPES.TRANSPORT_LOGISTICS,
  ],
  'signal-equipment': [
    CONTRACTOR_TYPES.SIGNAL_COMMUNICATIONS,
    CONTRACTOR_TYPES.ELECTRICAL_POWER,
    CONTRACTOR_TYPES.INSPECTION_COMPLIANCE,
  ],
  'parts': [
    CONTRACTOR_TYPES.RAILCAR_REPAIR,
    CONTRACTOR_TYPES.LOCOMOTIVE_SERVICE,
    CONTRACTOR_TYPES.TRANSPORT_LOGISTICS,
  ],
  'tools': [
    CONTRACTOR_TYPES.TRACK_CONSTRUCTION,
    CONTRACTOR_TYPES.MOW,
  ],
  'default': [
    CONTRACTOR_TYPES.INSPECTION_COMPLIANCE,
    CONTRACTOR_TYPES.TRANSPORT_LOGISTICS,
    CONTRACTOR_TYPES.RERAIL_DERAILMENT,
    CONTRACTOR_TYPES.EMERGENCY_RESPONSE,
  ],
};

/**
 * Get relevant contractor types for an equipment category
 */
export function getRelevantContractorTypes(equipmentCategory: string): ContractorType[] {
  return EQUIPMENT_TO_CONTRACTOR_MAPPING[equipmentCategory] || 
         EQUIPMENT_TO_CONTRACTOR_MAPPING['default'];
}
