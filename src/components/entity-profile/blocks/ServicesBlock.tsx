/**
 * THE RAIL EXCHANGE™ — Services Block
 * 
 * Displays services for contractor entities.
 * NO auth. NO enforcement. Pure display.
 */

import { Wrench, MapPin } from 'lucide-react';
import { Entity, ENTITY_TYPES } from '@/types/entity';
import { ServicesBlockProps } from '../types';

export function ServicesBlock({ entity, maxItems = 8 }: ServicesBlockProps) {
  // Only render for contractors
  if (!entity || entity.type !== ENTITY_TYPES.CONTRACTOR) {
    return null;
  }

  // If no services or entitlements don't allow, hide block (not error)
  const services = entity.services || [];
  if (services.length === 0 || !entity.entitlements.canDisplayServices) {
    return null;
  }

  const displayedServices = services.slice(0, maxItems);
  const hasMore = services.length > maxItems;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-gray-400" />
          Services Offered
        </h2>
        <span className="text-sm text-gray-500">{services.length} service{services.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {displayedServices.map((service) => (
          <div
            key={service.id}
            className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{service.name}</h3>
                <span className="text-sm text-gray-500">{service.category}</span>
              </div>
            </div>

            {service.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {service.description}
              </p>
            )}

            {service.serviceArea && service.serviceArea.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span>{service.serviceArea.slice(0, 3).join(', ')}</span>
                {service.serviceArea.length > 3 && (
                  <span>+{service.serviceArea.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* View More */}
      {hasMore && (
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-500">
            +{services.length - maxItems} more services
          </span>
        </div>
      )}
    </div>
  );
}

export default ServicesBlock;
