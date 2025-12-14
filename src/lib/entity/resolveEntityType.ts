/**
 * THE RAIL EXCHANGE™ — Entity Type Resolution
 * 
 * Resolves entity type from various sources (URL path, user data, etc.)
 * NO auth logic. NO enforcement. Pure data transformation.
 */

import {
  EntityType,
  ENTITY_TYPES,
  isEntityType,
} from '@/types/entity';

/**
 * Resolve entity type from a URL path segment
 * 
 * @example
 * resolveEntityTypeFromPath('/sellers/abc123') // 'seller'
 * resolveEntityTypeFromPath('/contractors/xyz') // 'contractor'
 * resolveEntityTypeFromPath('/companies/acme') // 'company'
 */
export function resolveEntityTypeFromPath(path: string): EntityType | null {
  const normalized = path.toLowerCase();
  
  if (normalized.includes('/sellers/') || normalized.startsWith('sellers/')) {
    return ENTITY_TYPES.SELLER;
  }
  
  if (normalized.includes('/contractors/') || normalized.startsWith('contractors/')) {
    return ENTITY_TYPES.CONTRACTOR;
  }
  
  if (normalized.includes('/companies/') || normalized.startsWith('companies/')) {
    return ENTITY_TYPES.COMPANY;
  }
  
  return null;
}

/**
 * Resolve entity type from a string value
 * Safe parsing with fallback
 */
export function resolveEntityType(value: unknown): EntityType | null {
  if (!value) return null;
  
  const normalized = String(value).toLowerCase().trim();
  
  // Direct match
  if (isEntityType(normalized)) {
    return normalized;
  }
  
  // Alias matching
  const aliases: Record<string, EntityType> = {
    'seller': ENTITY_TYPES.SELLER,
    'sellers': ENTITY_TYPES.SELLER,
    'vendor': ENTITY_TYPES.SELLER,
    'contractor': ENTITY_TYPES.CONTRACTOR,
    'contractors': ENTITY_TYPES.CONTRACTOR,
    'service-provider': ENTITY_TYPES.CONTRACTOR,
    'company': ENTITY_TYPES.COMPANY,
    'companies': ENTITY_TYPES.COMPANY,
    'business': ENTITY_TYPES.COMPANY,
    'organization': ENTITY_TYPES.COMPANY,
  };
  
  return aliases[normalized] ?? null;
}

/**
 * Get the URL prefix for an entity type
 */
export function getEntityUrlPrefix(type: EntityType): string {
  switch (type) {
    case ENTITY_TYPES.SELLER:
      return 'sellers';
    case ENTITY_TYPES.CONTRACTOR:
      return 'contractors';
    case ENTITY_TYPES.COMPANY:
      return 'companies';
    default:
      return 'entities';
  }
}

/**
 * Build a public profile URL for an entity
 */
export function buildEntityProfileUrl(type: EntityType, id: string): string {
  const prefix = getEntityUrlPrefix(type);
  return `/${prefix}/${id}`;
}

/**
 * Get human-readable label for entity type
 */
export function getEntityTypeLabel(type: EntityType): string {
  switch (type) {
    case ENTITY_TYPES.SELLER:
      return 'Seller';
    case ENTITY_TYPES.CONTRACTOR:
      return 'Contractor';
    case ENTITY_TYPES.COMPANY:
      return 'Company';
    default:
      return 'Entity';
  }
}

/**
 * Get plural label for entity type
 */
export function getEntityTypePluralLabel(type: EntityType): string {
  switch (type) {
    case ENTITY_TYPES.SELLER:
      return 'Sellers';
    case ENTITY_TYPES.CONTRACTOR:
      return 'Contractors';
    case ENTITY_TYPES.COMPANY:
      return 'Companies';
    default:
      return 'Entities';
  }
}
