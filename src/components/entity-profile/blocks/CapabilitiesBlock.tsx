/**
 * THE RAIL EXCHANGE™ — Capabilities Block
 * 
 * Displays capabilities for contractor entities.
 * Bullet list of capabilities, hide if empty.
 * NO auth. NO enforcement. Pure display.
 */

import { Wrench } from 'lucide-react';
import { Entity, ENTITY_TYPES } from '@/types/entity';

export interface CapabilitiesBlockProps {
  entity: Entity | null;
}

export function CapabilitiesBlock({ entity }: CapabilitiesBlockProps) {
  // Only render for contractors
  if (!entity || entity.type !== ENTITY_TYPES.CONTRACTOR) {
    return null;
  }

  // Get capabilities from entity - currently in services or companyInfo.specializations
  // Pull from wherever data exists, NO mock data
  const capabilities: string[] = 
    entity.companyInfo?.specializations || 
    entity.services?.map(s => s.name) || 
    [];

  // Hide block if no capabilities
  if (capabilities.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Wrench className="h-5 w-5 text-gray-400" />
        Capabilities
      </h2>

      <ul className="space-y-2">
        {capabilities.map((capability, index) => (
          <li 
            key={index}
            className="flex items-start gap-2 text-gray-600"
          >
            <span className="mt-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
            <span className="text-sm">{capability}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
