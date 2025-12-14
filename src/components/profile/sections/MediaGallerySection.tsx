/**
 * THE RAIL EXCHANGE™ — Media Gallery Section
 * 
 * Displays media gallery with placeholder grid.
 * Uses marketplace empty state pattern.
 * NO mock data.
 */

import Image from 'next/image';
import { Images, Camera } from 'lucide-react';
import type { MediaGallerySectionProps } from '../types';

export function MediaGallerySection({ media, maxItems = 6 }: MediaGallerySectionProps) {
  const displayedMedia = media?.slice(0, maxItems) || [];
  const hasMedia = displayedMedia.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Images className="h-5 w-5 text-gray-400" />
          Gallery
        </h2>
        {hasMedia && (
          <span className="text-sm text-gray-500">
            {media?.length} image{(media?.length || 0) !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {hasMedia ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {displayedMedia.map((item) => (
              <div
                key={item.id}
                className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden group"
              >
                <Image
                  src={item.url}
                  alt={item.alt || 'Gallery image'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>

          {/* View More Link */}
          {(media?.length || 0) > maxItems && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                View all {media?.length} images →
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State - Placeholder Grid */
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center"
              >
                <Camera className="h-6 w-6 text-slate-300" />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center mt-3">
            No gallery images available
          </p>
        </>
      )}
    </div>
  );
}

export default MediaGallerySection;
