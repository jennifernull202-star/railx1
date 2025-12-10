/**
 * THE RAIL EXCHANGE™ — Upload API
 * 
 * POST /api/upload
 * Generates presigned URLs for S3 uploads.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePresignedUploadUrl, getAllowedTypes, getMaxFileSize } from '@/lib/s3';

interface UploadRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
  folder: 'contractors' | 'listings' | 'documents' | 'avatars';
  subfolder?: string; // Optional subfolder (e.g., 'verification' for contractor documents)
  fileType?: 'image' | 'document';
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: UploadRequest = await request.json();
    const { fileName, contentType, fileSize, folder, subfolder, fileType = 'image' } = body;

    // Validate required fields
    if (!fileName || !contentType || !fileSize || !folder) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fileName, contentType, fileSize, folder' },
        { status: 400 }
      );
    }

    // Validate folder
    const allowedFolders = ['contractors', 'listings', 'documents', 'avatars'];
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json(
        { success: false, error: 'Invalid folder' },
        { status: 400 }
      );
    }
    
    // Validate subfolder if provided (only alphanumeric and hyphens allowed)
    if (subfolder && !/^[a-zA-Z0-9-]+$/.test(subfolder)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subfolder name' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = getAllowedTypes(fileType);
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = getMaxFileSize(fileType);
    if (fileSize > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB` 
        },
        { status: 400 }
      );
    }

    // Generate presigned URL
    // SECURE PATH: /contractors/<userId>/verification/ for verification documents
    const basePath = subfolder 
      ? `${folder}/${session.user.id}/${subfolder}`
      : `${folder}/${session.user.id}`;
    
    const { uploadUrl, fileUrl, key } = await generatePresignedUploadUrl({
      folder: basePath,
      fileName,
      contentType,
      fileSize,
      fileType,
    });

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        fileUrl,
        key,
      },
    });
  } catch (error) {
    console.error('Upload URL generation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
