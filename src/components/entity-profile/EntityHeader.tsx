/**
 * THE RAIL EXCHANGE™ — Entity Header
 * 
 * Displays the entity header with name, tagline, and badges.
 * NO auth. NO enforcement. Pure display.
 */

import Image from 'next/image';
import { Building2, User, Wrench } from 'lucide-react';
import { Entity, ENTITY_TYPES } from '@/types/entity';
import { getEntityTypeLabel } from '@/lib/entity/resolveEntityType';
import { EntityVerificationBadge } from './EntityVerificationBadge';
import { EntityVisibilityBadge } from './EntityVisibilityBadge';
import { EntityHeaderProps } from './types';

export function EntityHeader({ entity, showBadges = true }: EntityHeaderProps) {
  if (!entity) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <p>Entity not found</p>
        </div>
      </div>
    );
  }

  const getTypeIcon = () => {
    switch (entity.type) {
      case ENTITY_TYPES.SELLER:
        return User;
      case ENTITY_TYPES.CONTRACTOR:
        return Wrench;
      case ENTITY_TYPES.COMPANY:
        return Building2;
      default:
        return Building2;
    }
  };

  const TypeIcon = getTypeIcon();
  const typeLabel = getEntityTypeLabel(entity.type);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Banner */}
      {entity.bannerUrl ? (
        <div className="h-32 sm:h-48 relative bg-gradient-to-r from-navy-600 to-navy-800">
          <Image
            src={entity.bannerUrl}
            alt={`${entity.name} banner`}
            fill
            className="object-cover"
            priority
          />
        </div>
      ) : (
        <div className="h-32 sm:h-48 bg-gradient-to-r from-navy-600 to-navy-800" />
      )}

      {/* Profile Info */}
      <div className="px-6 pb-6 -mt-12 sm:-mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Avatar/Logo */}
          <div className="flex-shrink-0">
            {entity.logoUrl ? (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-white shadow-lg overflow-hidden bg-white">
                <Image
                  src={entity.logoUrl}
                  alt={entity.name}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                <TypeIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Name and Details */}
          <div className="flex-1 pt-4 sm:pt-0 sm:pb-2">
            {/* Type Label */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {typeLabel}
              </span>
            </div>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {entity.displayName || entity.name}
            </h1>

            {/* Tagline */}
            {entity.tagline && (
              <p className="text-gray-600 mt-1">{entity.tagline}</p>
            )}

            {/* Location */}
            {entity.location && (entity.location.city || entity.location.state) && (
              <p className="text-sm text-gray-500 mt-2">
                📍 {[entity.location.city, entity.location.state].filter(Boolean).join(', ')}
              </p>
            )}

            {/* Member Since */}
            {entity.memberSince && (
              <p className="text-sm text-gray-400 mt-1">
                Member since {new Date(entity.memberSince).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            )}
          </div>

          {/* Badges */}
          {showBadges && (
            <div className="flex flex-wrap gap-2 sm:pb-2">
              <EntityVerificationBadge entity={entity} />
              <EntityVisibilityBadge entity={entity} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EntityHeader;
