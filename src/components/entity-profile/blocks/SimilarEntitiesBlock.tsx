/**
 * THE RAIL EXCHANGE™ — Similar Entities Block
 * 
 * Placeholder for similar entities discovery.
 * NO mock data. Pure placeholder state.
 */

import { Users } from 'lucide-react';
import type { Entity } from '@/types/entity';
import { ENTITY_TYPES } from '@/types/entity';

export interface SimilarEntitiesBlockProps {
  entity: Entity | null;
}

export function SimilarEntitiesBlock({ entity }: SimilarEntitiesBlockProps) {
  // Don't render if no entity
  if (!entity) {
    return null;
  }

  // Determine label based on entity type
  const typeLabels: Record<string, string> = {
    [ENTITY_TYPES.SELLER]: 'Similar Sellers',
    [ENTITY_TYPES.CONTRACTOR]: 'Similar Contractors',
    [ENTITY_TYPES.COMPANY]: 'Similar Companies',
  };

  const label = typeLabels[entity.type] || 'Similar Profiles';

  // Future: entity similarity algorithm
  // For now, always show placeholder - NO mock data

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-gray-400" />
        {label}
      </h2>

      {/* Placeholder State */}
      <div className="text-center py-6">
        <div className="flex justify-center gap-2 mb-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-10 h-10 bg-slate-100 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center"
            >
              <Users className="h-4 w-4 text-slate-300" />
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          {label.replace('Similar ', '')} may appear here
        </p>
      </div>
    </div>
  );
}
