/**
 * THE RAIL EXCHANGE™ — ISO Request Constants
 * 
 * Shared constants for ISO (In Search Of) requests.
 * This file can be safely imported in both client and server components.
 */

export type ISOCategory = 
  | 'locomotives'
  | 'railcars'
  | 'freight-cars'
  | 'passenger-cars'
  | 'track-materials'
  | 'maintenance-of-way'
  | 'signals-communications'
  | 'parts-components'
  | 'tools-equipment'
  | 'contractors'
  | 'services'
  | 'other';

export type ISOStatus = 'active' | 'fulfilled' | 'closed' | 'deleted';

export const ISO_CATEGORIES: ISOCategory[] = [
  'locomotives',
  'railcars',
  'freight-cars',
  'passenger-cars',
  'track-materials',
  'maintenance-of-way',
  'signals-communications',
  'parts-components',
  'tools-equipment',
  'contractors',
  'services',
  'other',
];

export const ISO_CATEGORY_LABELS: Record<ISOCategory, string> = {
  'locomotives': 'Locomotives',
  'railcars': 'Railcars',
  'freight-cars': 'Freight Cars',
  'passenger-cars': 'Passenger Cars',
  'track-materials': 'Track Materials',
  'maintenance-of-way': 'Maintenance of Way',
  'signals-communications': 'Signals & Communications',
  'parts-components': 'Parts & Components',
  'tools-equipment': 'Tools & Equipment',
  'contractors': 'Contractors',
  'services': 'Services',
  'other': 'Other',
};

export const ISO_STATUS_VALUES: ISOStatus[] = ['active', 'fulfilled', 'closed', 'deleted'];
