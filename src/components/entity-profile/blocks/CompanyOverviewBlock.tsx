/**
 * THE RAIL EXCHANGE™ — Company Overview Block
 * 
 * Displays company information for company entities.
 * NO auth. NO enforcement. Pure display.
 */

import { Building2, Calendar, Users, Briefcase } from 'lucide-react';
import { Entity, ENTITY_TYPES } from '@/types/entity';
import { CompanyOverviewBlockProps } from '../types';

export function CompanyOverviewBlock({ entity }: CompanyOverviewBlockProps) {
  // Only render for companies
  if (!entity || entity.type !== ENTITY_TYPES.COMPANY) {
    return null;
  }

  // If no company info or entitlements don't allow, hide block (not error)
  const companyInfo = entity.companyInfo;
  if (!companyInfo || !entity.entitlements.canDisplayCompanyInfo) {
    return null;
  }

  // Check if there's any data to display
  const hasData = 
    companyInfo.industry ||
    companyInfo.founded ||
    companyInfo.size ||
    companyInfo.description ||
    (companyInfo.specializations && companyInfo.specializations.length > 0);

  if (!hasData) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-gray-400" />
        Company Overview
      </h2>

      {/* Company Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {companyInfo.industry && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Briefcase className="h-4 w-4" />
              Industry
            </div>
            <p className="font-medium text-gray-900">{companyInfo.industry}</p>
          </div>
        )}

        {companyInfo.founded && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Calendar className="h-4 w-4" />
              Founded
            </div>
            <p className="font-medium text-gray-900">{companyInfo.founded}</p>
          </div>
        )}

        {companyInfo.size && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Users className="h-4 w-4" />
              Company Size
            </div>
            <p className="font-medium text-gray-900">{companyInfo.size}</p>
          </div>
        )}
      </div>

      {/* Company Description */}
      {companyInfo.description && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">About</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{companyInfo.description}</p>
        </div>
      )}

      {/* Specializations */}
      {companyInfo.specializations && companyInfo.specializations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {companyInfo.specializations.map((spec, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyOverviewBlock;
