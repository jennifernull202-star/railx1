/**
 * THE RAIL EXCHANGE™ — S3 Upload Utility
 * 
 * Provides secure file upload functionality using AWS S3.
 * Uses presigned URLs for direct client uploads.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME || 'railexchange-uploads';

// Allowed file types by category
const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  all: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
};

// Max file sizes in bytes
const MAX_FILE_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024, // 10MB
  document: 25 * 1024 * 1024, // 25MB
};

interface UploadConfig {
  folder: string;
  fileType: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}

interface PresignedUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

/**
 * Generate a presigned URL for direct client upload
 */
export async function generatePresignedUploadUrl(
  config: UploadConfig
): Promise<PresignedUrlResult> {
  const { folder, fileName, contentType, fileSize, fileType } = config;

  // Validate content type
  const allowedTypes = ALLOWED_TYPES[fileType] || ALLOWED_TYPES.all;
  if (!allowedTypes.includes(contentType)) {
    throw new Error(`File type ${contentType} is not allowed`);
  }

  // Validate file size
  const maxSize = MAX_FILE_SIZES[fileType] || MAX_FILE_SIZES.image;
  if (fileSize > maxSize) {
    throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
  }

  // Generate unique key
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${timestamp}-${randomId}-${sanitizedFileName}`;

  // Create presigned URL
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

  // Construct the public URL
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    fileUrl,
    key,
  };
}

/**
 * Generate a presigned URL for downloading/viewing a file
 */
export async function generatePresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Extract the key from a full S3 URL
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Remove leading slash
    return urlObj.pathname.substring(1);
  } catch {
    return null;
  }
}

/**
 * Get allowed file types for a category
 */
export function getAllowedTypes(category: string): string[] {
  return ALLOWED_TYPES[category] || ALLOWED_TYPES.all;
}

/**
 * Get max file size for a category
 */
export function getMaxFileSize(category: string): number {
  return MAX_FILE_SIZES[category] || MAX_FILE_SIZES.image;
}
