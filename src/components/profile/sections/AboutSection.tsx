/**
 * THE RAIL EXCHANGE™ — About Section
 * 
 * Displays entity description, tagline, and membership info.
 * Uses marketplace empty state pattern if no content.
 */

import type { AboutSectionProps } from '../types';

export function AboutSection({ 
  description, 
  tagline, 
  memberSince 
}: AboutSectionProps) {
  // No description = hide section
  if (!description) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
      
      {tagline && (
        <p className="text-gray-700 font-medium mb-3 text-base">
          {tagline}
        </p>
      )}
      
      <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
        {description}
      </p>

      {memberSince && (
        <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-gray-100">
          Member since {new Date(memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      )}
    </div>
  );
}

export default AboutSection;
