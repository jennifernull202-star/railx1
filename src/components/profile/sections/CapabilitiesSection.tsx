/**
 * THE RAIL EXCHANGE™ — Capabilities Section
 * 
 * Displays contractor capabilities as bullet list.
 * Hides if empty. NO mock data.
 */

import { Wrench } from 'lucide-react';
import type { CapabilitiesSectionProps } from '../types';

export function CapabilitiesSection({ capabilities }: CapabilitiesSectionProps) {
  // Hide if no capabilities
  if (!capabilities || capabilities.length === 0) {
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

export default CapabilitiesSection;
