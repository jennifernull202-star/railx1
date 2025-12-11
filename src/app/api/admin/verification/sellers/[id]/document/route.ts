/**
 * THE RAIL EXCHANGE™ — Admin Document Viewer API
 * 
 * GET /api/admin/verification/sellers/[id]/document
 * - Get presigned URL to view a verification document
 * - Admin-only access
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import SellerVerification from '@/models/SellerVerification';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'railexchange-uploads';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const admin = await User.findOne({ email: session.user.email });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const documentType = searchParams.get('type');

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type required' },
        { status: 400 }
      );
    }

    const verification = await SellerVerification.findById(id);
    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    const document = verification.documents.find(d => d.type === documentType);
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Generate presigned URL for viewing (valid for 15 minutes)
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: document.s3Key,
    });

    const viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return NextResponse.json({
      viewUrl,
      fileName: document.fileName,
      type: document.type,
      uploadedAt: document.uploadedAt,
    });
  } catch (error) {
    console.error('Error getting document URL:', error);
    return NextResponse.json(
      { error: 'Failed to get document URL' },
      { status: 500 }
    );
  }
}
