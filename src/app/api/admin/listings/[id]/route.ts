/**
 * THE RAIL EXCHANGE™ — Admin Single Listing API
 * 
 * Update listing status (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Listing from '@/models/Listing';
import Notification, { NOTIFICATION_TYPES } from '@/models/Notification';
import { Types } from 'mongoose';
import { deleteFile, extractKeyFromUrl } from '@/lib/s3';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/listings/[id] - Update listing status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
    }

    await connectDB();

    const body = await request.json();
    const { status, isActive, adminNotes } = body;

    const listing = await Listing.findById(id);

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const previousStatus = listing.status;

    // Update allowed fields
    if (status) {
      listing.status = status;
      
      // Set publishedAt if activating
      if (status === 'active' && !listing.publishedAt) {
        listing.publishedAt = new Date();
      }
    }

    if (typeof isActive === 'boolean') {
      listing.isActive = isActive;
    }

    await listing.save();

    // Send notification to seller about status change
    if (status && status !== previousStatus) {
      let notificationType: string = NOTIFICATION_TYPES.LISTING_APPROVED;
      let title = 'Listing Approved';
      let message = `Your listing "${listing.title}" has been approved and is now live.`;

      if (status === 'removed') {
        notificationType = NOTIFICATION_TYPES.LISTING_REJECTED;
        title = 'Listing Removed';
        message = `Your listing "${listing.title}" has been removed. ${adminNotes ? `Reason: ${adminNotes}` : 'Please contact support for more information.'}`;
      }

      await Notification.create({
        userId: listing.sellerId,
        type: notificationType,
        title,
        message,
        link: `/dashboard/listings`,
        data: { listingId: listing._id },
      });
    }

    return NextResponse.json({
      success: true,
      listing: {
        _id: listing._id,
        title: listing.title,
        status: listing.status,
        isActive: listing.isActive,
      },
    });
  } catch (error) {
    console.error('Admin update listing error:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/listings/[id] - Delete listing
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
    }

    await connectDB();

    // First fetch the listing to get image URLs
    const listing = await Listing.findById(id);

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Clean up S3 images in background (don't block deletion)
    const mediaItems = listing.media || [];
    const imageUrls = mediaItems
      .filter((m: { type: string }) => m.type === 'image')
      .map((m: { url: string }) => m.url);
    
    if (imageUrls.length > 0) {
      // Fire and forget - don't wait for S3 cleanup
      Promise.all(
        imageUrls.map(async (url: string) => {
          try {
            const key = extractKeyFromUrl(url);
            if (key) {
              await deleteFile(key);
              console.log(`Deleted S3 file: ${key}`);
            }
          } catch (error) {
            console.error(`Failed to delete S3 file for URL ${url}:`, error);
          }
        })
      ).catch(console.error);
    }

    // Delete the listing
    await Listing.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully',
    });
  } catch (error) {
    console.error('Admin delete listing error:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
