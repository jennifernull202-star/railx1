/**
 * THE RAIL EXCHANGE™ — Media Gallery Block
 * 
 * Displays media gallery for entities.
 * Placeholder grid style matching marketplace cards.
 * NO mock data. Empty placeholder if no images.
 */

import Image from 'next/image';
import { Images, Camera } from 'lucide-react';
import { Entity } from '@/types/entity';

export interface MediaGalleryBlockProps {
  entity: Entity | null;
  maxItems?: number;
}

interface MediaItem {
  id: string;
  url: string;
  alt?: string;
  type: 'image' | 'video';
}

export function MediaGalleryBlock({ entity, maxItems = 6 }: MediaGalleryBlockProps) {
  // Don't render if no entity
  if (!entity) {
    return null;
  }

  // Future: entity.media array
  // For now, collect images from listings
  const mediaItems: MediaItem[] = [];
  
  // Pull images from listings if seller
  if (entity.listings?.length) {
    entity.listings.forEach(listing => {
      if (listing.primaryImageUrl) {
        mediaItems.push({
          id: `listing-${listing.id}`,
          url: listing.primaryImageUrl,
          alt: listing.title,
          type: 'image',
        });
      }
    });
  }

  // Also check for logo/banner as media
  if (entity.bannerUrl) {
    mediaItems.unshift({
      id: 'banner',
      url: entity.bannerUrl,
      alt: `${entity.name} banner`,
      type: 'image',
    });
  }

  const displayedMedia = mediaItems.slice(0, maxItems);
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
            {mediaItems.length} image{mediaItems.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {hasMedia ? (
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
      ) : (
        /* Empty State - Marketplace Pattern */
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
      )}

      {/* Empty State Message */}
      {!hasMedia && (
        <p className="text-xs text-slate-400 text-center mt-3">
          No gallery images available
        </p>
      )}

      {/* View More Link */}
      {mediaItems.length > maxItems && (
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            View all {mediaItems.length} images →
          </button>
        </div>
      )}
    </div>
  );
}
