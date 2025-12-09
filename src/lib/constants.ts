/**
 * THE RAIL EXCHANGE™ — Service Categories Data
 * 
 * Centralized list of contractor service categories.
 */

export interface ServiceCategoryOption {
  id: string;
  label: string;
  description: string;
}

export const SERVICE_CATEGORIES: ServiceCategoryOption[] = [
  { id: 'track-construction', label: 'Track Construction', description: 'New track installation and construction' },
  { id: 'track-maintenance', label: 'Track Maintenance', description: 'Track repair, maintenance, and rehabilitation' },
  { id: 'signal-systems', label: 'Signal Systems', description: 'Signal installation, maintenance, and upgrades' },
  { id: 'electrical', label: 'Electrical', description: 'Electrical systems and infrastructure' },
  { id: 'bridge-structures', label: 'Bridge & Structures', description: 'Bridge construction, repair, and inspection' },
  { id: 'environmental', label: 'Environmental', description: 'Environmental compliance and remediation' },
  { id: 'surveying', label: 'Surveying', description: 'Rail surveying and mapping services' },
  { id: 'engineering', label: 'Engineering', description: 'Civil and rail engineering services' },
  { id: 'equipment-rental', label: 'Equipment Rental', description: 'Rail equipment and machinery rental' },
  { id: 'material-supply', label: 'Material Supply', description: 'Rail materials and supplies' },
  { id: 'demolition', label: 'Demolition', description: 'Track and structure demolition' },
  { id: 'welding', label: 'Welding', description: 'Rail welding and thermite welding' },
  { id: 'inspection', label: 'Inspection', description: 'Track and equipment inspection services' },
  { id: 'consulting', label: 'Consulting', description: 'Rail industry consulting and advisory' },
  { id: 'training', label: 'Training', description: 'Safety and technical training' },
  { id: 'emergency-response', label: 'Emergency Response', description: '24/7 emergency and derailment services' },
  { id: 'other', label: 'Other', description: 'Other specialized services' },
];

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 
  'West Virginia', 'Wisconsin', 'Wyoming'
];

export const US_REGIONS = [
  'Northeast',
  'Southeast', 
  'Midwest',
  'Southwest',
  'West Coast',
  'Pacific Northwest',
  'Mountain West',
  'Gulf Coast',
  'Great Plains',
  'Nationwide',
];

export const EMPLOYEE_COUNTS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-100', label: '51-100 employees' },
  { value: '101-500', label: '101-500 employees' },
  { value: '500+', label: '500+ employees' },
];

// Equipment types for listings
export const EQUIPMENT_TYPES = [
  { value: 'locomotives', label: 'Locomotives' },
  { value: 'freight-cars', label: 'Freight Cars' },
  { value: 'passenger-cars', label: 'Passenger Cars' },
  { value: 'maintenance-of-way', label: 'Maintenance of Way' },
  { value: 'track-materials', label: 'Track Materials' },
  { value: 'signals-communications', label: 'Signals & Communications' },
  { value: 'parts-components', label: 'Parts & Components' },
  { value: 'tools-equipment', label: 'Tools & Equipment' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'services', label: 'Services' },
];

// Condition options for listings
export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'rebuilt', label: 'Rebuilt' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'used-excellent', label: 'Used - Excellent' },
  { value: 'used-good', label: 'Used - Good' },
  { value: 'used-fair', label: 'Used - Fair' },
  { value: 'for-parts', label: 'For Parts' },
  { value: 'as-is', label: 'As-Is' },
];
