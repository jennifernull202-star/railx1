/**
 * THE RAIL EXCHANGE™ — Profile Header
 * 
 * Displays entity name, type, location, ratings, and badges.
 * Used at the top of unified profile page.
 */

import Image from 'next/image';
import { MapPin, Building2, User, Truck } from 'lucide-react';
import { ProfileRatings } from './ProfileRatings';
import { ProfileBadges } from './ProfileBadges';
import type { ProfileHeaderProps } from './types';

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  // No profile = don't render
  if (!profile) {
    return null;
  }

  // Entity type label
  const typeLabels: Record<string, string> = {
    seller: 'Seller',
    contractor: 'Contractor',
    company: 'Company',
  };

  // Entity type icon
  const TypeIcon = {
    seller: User,
    contractor: Truck,
    company: Building2,
  }[profile.type] || User;

  // Format location
  const locationParts = [
    profile.location?.city,
    profile.location?.state,
    profile.location?.country,
  ].filter(Boolean);
  const locationString = locationParts.join(', ');

  return (
    <div className="relative">
      {/* Banner */}
      {profile.bannerUrl ? (
        <div className="h-48 md:h-64 relative rounded-2xl overflow-hidden">
          <Image
            src={profile.bannerUrl}
            alt={`${profile.name} banner`}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      ) : (
        <div className="h-48 md:h-64 bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl" />
      )}

      {/* Profile Info */}
      <div className="relative px-4 md:px-6 -mt-16 md:-mt-20">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
            {/* Avatar/Logo */}
            <div className="flex-shrink-0">
              {profile.logoUrl ? (
                <div className="w-24 h-24 md:w-28 md:h-28 relative rounded-xl overflow-hidden border-4 border-white shadow-md">
                  <Image
                    src={profile.logoUrl}
                    alt={profile.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-orange-500 to-rail-orange rounded-xl flex items-center justify-center border-4 border-white shadow-md">
                  <span className="text-white text-3xl md:text-4xl font-bold">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              {/* Name and Type */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                  {profile.displayName || profile.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full w-fit">
                  <TypeIcon className="h-3 w-3" />
                  {typeLabels[profile.type] || 'Entity'}
                </span>
              </div>

              {/* Tagline */}
              {profile.tagline && (
                <p className="text-gray-600 text-sm md:text-base mb-3">
                  {profile.tagline}
                </p>
              )}

              {/* Location and Ratings Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {locationString && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <span>{locationString}</span>
                  </div>
                )}

                {/* Ratings */}
                <ProfileRatings 
                  ratings={profile.ratings} 
                  size="md" 
                  showCount={true} 
                />
              </div>

              {/* Badges */}
              <div className="mt-3">
                <ProfileBadges 
                  verification={profile.verification} 
                  visibility={profile.visibility} 
                />
              </div>

              {/* Member Since */}
              {profile.memberSince && (
                <p className="text-xs text-slate-400 mt-3">
                  Member since {new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;
