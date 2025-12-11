/**
 * THE RAIL EXCHANGE™ — Seller Verification Document Upload API
 * 
 * POST /api/verification/seller/upload
 * - Upload verification documents (drivers license, business license, EIN, insurance)
 * - Documents stored in secure S3 folder (admin-only access)
 * 
 * GET /api/verification/seller/upload
 * - Get current verification status and documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import SellerVerification from '@/models/SellerVerification';
import { generatePresignedUploadUrl } from '@/lib/s3';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get existing verification
    const verification = await SellerVerification.findByUserId(user._id);

    return NextResponse.json({
      verification: verification ? {
        status: verification.status,
        documents: verification.documents.map(d => ({
          type: d.type,
          fileName: d.fileName,
          uploadedAt: d.uploadedAt,
        })),
        aiVerification: {
          status: verification.aiVerification.status,
          confidence: verification.aiVerification.confidence,
          flags: verification.aiVerification.flags,
        },
        adminReview: {
          status: verification.adminReview.status,
          rejectionReason: verification.adminReview.rejectionReason,
        },
        subscriptionStatus: verification.subscriptionStatus,
      } : null,
      userStatus: {
        isVerifiedSeller: user.isVerifiedSeller,
        verifiedSellerStatus: user.verifiedSellerStatus,
        verifiedSellerExpiresAt: user.verifiedSellerExpiresAt,
      },
    });
  } catch (error) {
    console.error('Error fetching verification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { documentType, fileName, contentType, fileSize } = body;

    // Validate document type
    const validTypes = ['drivers_license', 'business_license', 'ein_document', 'insurance_certificate'];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    // Validate file type (images and PDFs only)
    const allowedContentTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedContentTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, WebP) and PDFs are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (fileSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate presigned URL for secure upload
    // Documents go to a private folder that requires admin access
    const { uploadUrl, key } = await generatePresignedUploadUrl({
      folder: `verification/sellers/${user._id}`,
      fileName,
      contentType,
      fileSize,
      fileType: contentType.startsWith('image/') ? 'image' : 'document',
    });

    // Get or create verification record
    let verification = await SellerVerification.findOne({ userId: user._id });
    if (!verification) {
      verification = new SellerVerification({
        userId: user._id,
        documents: [],
        status: 'draft',
        statusHistory: [{
          status: 'draft',
          changedAt: new Date(),
          reason: 'Verification started',
        }],
      });
    }

    // Check if document of this type already exists
    const existingDocIndex = verification.documents.findIndex(
      d => d.type === documentType
    );

    const newDocument = {
      type: documentType,
      s3Key: key,
      fileName,
      uploadedAt: new Date(),
    };

    if (existingDocIndex >= 0) {
      // Replace existing document
      verification.documents[existingDocIndex] = newDocument;
    } else {
      // Add new document
      verification.documents.push(newDocument);
    }

    await verification.save();

    return NextResponse.json({
      uploadUrl,
      key,
      documentType,
      message: 'Upload URL generated. Use PUT request to upload file.',
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
