import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert S3 URLs to proxy URLs for images.
 * This allows images to be served even when S3 bucket blocks public access.
 * 
 * @param url - Original URL (could be S3 URL, proxy URL, or other)
 * @returns Proxy URL if it's an S3 URL, otherwise returns the original URL
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url) return '/placeholders/listing-no-image.png';
  
  // Already a proxy URL
  if (url.startsWith('/api/s3-image')) {
    return url;
  }
  
  // Check if it's an S3 URL and convert to proxy
  const s3Pattern = /https?:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)/;
  const match = url.match(s3Pattern);
  
  if (match) {
    const key = match[3];
    return `/api/s3-image?key=${encodeURIComponent(key)}`;
  }
  
  // Also handle S3 URLs in path style: https://s3.region.amazonaws.com/bucket/key
  const s3PathPattern = /https?:\/\/s3\.([^.]+)\.amazonaws\.com\/([^/]+)\/(.+)/;
  const pathMatch = url.match(s3PathPattern);
  
  if (pathMatch) {
    const key = pathMatch[3];
    return `/api/s3-image?key=${encodeURIComponent(key)}`;
  }
  
  // Return original URL for non-S3 URLs (e.g., placeholder images, external URLs)
  return url;
}
