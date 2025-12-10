/**
 * THE RAIL EXCHANGE™ — Admin Photo Management API
 * 
 * DELETE /api/admin/listings/[id]/photos
 * Admin can delete inappropriate photos from listings
 * 
 * PART 7: Admin MUST have full access to:
 * - view photos
 * - delete inappropriate photos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Listing from '@/models/Listing';
import AdminAuditLog from '@/models/AdminAuditLog';
import { Types } from 'mongoose';
import { deleteFile, extractKeyFromUrl } from '@/lib/s3';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/admin/listings/[id]/photos - Delete specific photo(s) from listing
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    // Admin only
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
    }

    await connectDB();

    const body = await request.json();
    const { photoUrls, reason } = body;

    if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
      return NextResponse.json(
        { error: 'photoUrls array is required' },
        { status: 400 }
      );
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Filter out the photos to be deleted
    const originalCount = listing.media?.length || 0;
    listing.media = (listing.media || []).filter(
      (m: { url: string }) => !photoUrls.includes(m.url)
    );
    const deletedCount = originalCount - listing.media.length;

    // Update primaryImageUrl if needed
    if (listing.primaryImageUrl && photoUrls.includes(listing.primaryImageUrl)) {
      const firstImage = listing.media.find((m: { type: string }) => m.type === 'image');
      listing.primaryImageUrl = firstImage?.url || undefined;
    }

    await listing.save();

    // Delete from S3 (fire and forget)
    Promise.all(
      photoUrls.map(async (url: string) => {
        try {
          const key = extractKeyFromUrl(url);
          if (key) {
            await deleteFile(key);
            console.log(`Admin deleted S3 file: ${key}`);
          }
        } catch (error) {
          console.error(`Failed to delete S3 file ${url}:`, error);
        }
      })
    ).catch(console.error);

    // Log admin action
    console.log(`Admin ${session.user.id} deleted ${deletedCount} photo(s) from listing ${id}. Reason: ${reason || 'Not specified'}`);
    
    // #10 fix: Persist audit log to database
    try {
      await AdminAuditLog.logAction({
        adminId: session.user.id,
        adminEmail: session.user.email || 'unknown',
        action: 'delete_photo',
        targetType: 'listing',
        targetId: id,
        targetTitle: listing.title,
        details: {
          deletedPhotoUrls: photoUrls,
          deletedCount,
          remainingPhotos: listing.media.length,
        },
        reason: reason || 'Not specified',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      message: `${deletedCount} photo(s) deleted successfully`,
      deletedCount,
      remainingPhotos: listing.media.length,
    });
  } catch (error) {
    console.error('Admin delete photos error:', error);
    return NextResponse.json(
      { error: 'Failed to delete photos' },
      { status: 500 }
    );
  }
}

// GET /api/admin/listings/[id]/photos - Get all photos for a listing
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    // Admin only
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
    }

    await connectDB();

    const listing = await Listing.findById(id).select('title media primaryImageUrl');

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      listingId: listing._id,
      title: listing.title,
      photos: listing.media || [],
      primaryImageUrl: listing.primaryImageUrl,
      photoCount: listing.media?.length || 0,
    });
  } catch (error) {
    console.error('Admin get photos error:', error);
    return NextResponse.json(
      { error: 'Failed to get photos' },
      { status: 500 }
    );
  }
}
