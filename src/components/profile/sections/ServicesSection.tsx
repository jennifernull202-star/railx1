/**
 * THE RAIL EXCHANGE™ — Services Section
 * 
 * Displays contractor services on profile.
 * Uses marketplace empty state pattern if no services.
 * NO mock data.
 */

import { Wrench } from 'lucide-react';
import type { ServicesSectionProps } from '../types';

export function ServicesSection({ services, maxItems = 8 }: ServicesSectionProps) {
  const displayedServices = services?.slice(0, maxItems) || [];
  const hasServices = displayedServices.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-gray-400" />
          Services Offered
        </h2>
        {hasServices && (
          <span className="text-sm text-gray-500">
            {services?.length} service{(services?.length || 0) !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {hasServices ? (
        <div className="space-y-3">
          {displayedServices.map((service) => (
            <div
              key={service.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{service.name}</h3>
                  <span className="text-xs text-gray-500">{service.category}</span>
                </div>
              </div>
              {service.description && (
                <p className="text-sm text-gray-600 mt-2">{service.description}</p>
              )}
              {service.serviceArea && service.serviceArea.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {service.serviceArea.map((area, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Empty State - Marketplace Pattern */
        <div className="text-center py-10">
          <svg className="w-14 h-14 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-[18px] font-bold text-navy-900 mb-2">No Services Listed</h3>
          <p className="text-[14px] text-slate-500 max-w-xs mx-auto leading-relaxed">
            This contractor hasn&apos;t added any services yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default ServicesSection;
