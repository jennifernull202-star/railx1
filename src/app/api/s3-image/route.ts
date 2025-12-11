/**
 * THE RAIL EXCHANGE™ — S3 Image Proxy API
 * 
 * Proxies S3 images using presigned GET URLs.
 * This allows images to be served even when the bucket blocks public access.
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

// Cache presigned URLs for 1 hour (they expire in 1 hour)
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
    const sanitizedKey = key.replace(/\.\./g, '');

    // Check cache
    const cached = urlCache.get(sanitizedKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.redirect(cached.url);
    }

    // Generate presigned URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: sanitizedKey,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    // Cache the URL
    urlCache.set(sanitizedKey, {
      url: presignedUrl,
      expires: Date.now() + 50 * 60 * 1000, // Cache for 50 minutes
    });

    // Redirect to the presigned URL
    return NextResponse.redirect(presignedUrl);
  } catch (error) {
    console.error('S3 image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
