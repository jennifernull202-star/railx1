/**
 * THE RAIL EXCHANGE™ — Single Contractor API
 * 
 * GET /api/contractors/[id] - Get contractor profile
 * PUT /api/contractors/[id] - Update contractor profile
 * DELETE /api/contractors/[id] - Delete contractor profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - Fetch single contractor profile
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contractor ID' },
        { status: 400 }
      );
    }

    const contractor = await ContractorProfile.findById(id)
      .populate('userId', 'name image email');

    if (!contractor) {
      return NextResponse.json(
        { success: false, error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Only return if published or if owner/admin
    const session = await getServerSession(authOptions);
    const isOwner = session?.user?.id === contractor.userId?.toString();
    const isAdmin = session?.user?.isAdmin;

    if (!contractor.isPublished && !isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Contractor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contractor,
    });
  } catch (error) {
    console.error('Get contractor error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contractor' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update contractor profile
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contractor ID' },
        { status: 400 }
      );
    }

    const contractor = await ContractorProfile.findById(id);

    if (!contractor) {
      return NextResponse.json(
        { success: false, error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Check ownership or admin
    const isOwner = session.user.id === contractor.userId.toString();
    const isAdmin = session.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to update this profile' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Fields that can be updated
    const allowedUpdates = [
      'businessName',
      'businessDescription',
      'businessPhone',
      'businessEmail',
      'website',
      'logo',
      'coverImage',
      'address',
      'services',
      'serviceDescription',
      'regionsServed',
      'yearsInBusiness',
      'numberOfEmployees',
      'equipmentOwned',
      'photos',
      'projectHighlights',
      'socialLinks',
      'isPublished',
    ];

    // Admin-only fields
    const adminOnlyFields = [
      'verificationStatus',
      'verifiedAt',
      'insuranceVerified',
      'safetyRecordVerified',
    ];

    // Apply updates
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        (contractor as unknown as Record<string, unknown>)[field] = body[field];
      }
    }

    // Apply admin-only updates
    if (isAdmin) {
      for (const field of adminOnlyFields) {
        if (body[field] !== undefined) {
          (contractor as unknown as Record<string, unknown>)[field] = body[field];
        }
      }
    }

    await contractor.save();

    return NextResponse.json({
      success: true,
      message: 'Contractor profile updated successfully',
      data: contractor,
    });
  } catch (error) {
    console.error('Update contractor error:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update contractor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete contractor profile
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contractor ID' },
        { status: 400 }
      );
    }

    const contractor = await ContractorProfile.findById(id);

    if (!contractor) {
      return NextResponse.json(
        { success: false, error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Check ownership or admin
    const isOwner = session.user.id === contractor.userId.toString();
    const isAdmin = session.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this profile' },
        { status: 403 }
      );
    }

    // Soft delete by setting isActive to false
    contractor.isActive = false;
    contractor.isPublished = false;
    await contractor.save();

    return NextResponse.json({
      success: true,
      message: 'Contractor profile deleted successfully',
    });
  } catch (error) {
    console.error('Delete contractor error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contractor' },
      { status: 500 }
    );
  }
}
