/**
 * THE RAIL EXCHANGE™ — Similar Entities Section
 * 
 * Placeholder for similar entities discovery.
 * NO mock data. Pure placeholder state.
 */

import { Users } from 'lucide-react';
import type { SimilarEntitiesSectionProps } from '../types';

export function SimilarEntitiesSection({ entityType }: SimilarEntitiesSectionProps) {
  // Determine label based on entity type
  const typeLabels: Record<string, string> = {
    seller: 'Similar Sellers',
    contractor: 'Similar Contractors',
    company: 'Similar Companies',
  };

  const label = typeLabels[entityType] || 'Similar Profiles';
  const singularLabel = label.replace('Similar ', '');

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
          {singularLabel} may appear here
        </p>
      </div>
    </div>
  );
}

export default SimilarEntitiesSection;
