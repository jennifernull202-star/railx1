/**
 * THE RAIL EXCHANGE™ — S3 Image Proxy API
 * 
 * Proxies S3 images by streaming directly from S3.
 * This allows images to be served even when the bucket blocks public access.
 * Streams the image directly instead of redirecting for Next.js Image compatibility.
 * 
 * GET /api/s3-image?key=<s3-key>
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME || 'railexchange-uploads';

// Cache presigned URLs for 55 minutes (they expire in 1 hour)
const urlCache = new Map<string, { url: string; expires: number }>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing key parameter' },
        { status: 400 }
      );
    }

    // Sanitize key to prevent path traversal
    const sanitizedKey = decodeURIComponent(key).replace(/\.\./g, '');

    // Check cache
    const cached = urlCache.get(sanitizedKey);
    if (cached && cached.expires > Date.now()) {
      // Fetch the image and return it directly (no redirect)
      const imageResponse = await fetch(cached.url);
      const imageBuffer = await imageResponse.arrayBuffer();
      return new Response(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': imageResponse.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Generate presigned URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: sanitizedKey,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Cache the URL
    urlCache.set(sanitizedKey, {
      url: presignedUrl,
      expires: Date.now() + 55 * 60 * 1000, // 55 minutes
    });

    // Clean old cache entries periodically
    if (urlCache.size > 500) {
      const now = Date.now();
      const keysToDelete: string[] = [];
      urlCache.forEach((value, cacheKey) => {
        if (value.expires < now) {
          keysToDelete.push(cacheKey);
        }
      });
      keysToDelete.forEach(k => urlCache.delete(k));
    }

    // Fetch the image and return it directly (no redirect for Next.js Image compatibility)
    const imageResponse = await fetch(presignedUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': imageResponse.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('S3 image proxy error:', error);
    
    // Return a placeholder for missing images
    return NextResponse.redirect(new URL('/placeholders/listing-no-image.png', request.url));
  }
}
