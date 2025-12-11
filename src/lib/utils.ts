import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize image URLs for display.
 * Now that S3 bucket has public read access and CORS configured,
 * we can use direct S3 URLs instead of proxying through our API.
 * 
 * @param url - Original URL (could be S3 URL, proxy URL, or other)
 * @returns Direct S3 URL or original URL
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url) return '/placeholders/listing-no-image.png';
  
  // If it's a proxy URL, convert back to direct S3 URL
  if (url.startsWith('/api/s3-image?key=')) {
    const keyParam = url.replace('/api/s3-image?key=', '');
    const key = decodeURIComponent(keyParam);
    return `https://railx-uploads.s3.us-east-2.amazonaws.com/${key}`;
  }
  
  // Already an S3 URL or other URL - return as-is
  return url;
}
