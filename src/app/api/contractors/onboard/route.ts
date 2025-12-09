/**
 * THE RAIL EXCHANGE™ — Contractor Onboarding API
 * 
 * POST /api/contractors/onboard
 * Creates a new contractor profile for authenticated users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import User from '@/models/User';

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

    await connectDB();

    // Check if user already has a contractor profile
    const existingProfile = await ContractorProfile.findByUserId(session.user.id);
    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: 'Contractor profile already exists' },
        { status: 409 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'businessName',
      'businessDescription',
      'businessPhone',
      'businessEmail',
      'address',
      'services',
      'regionsServed',
      'yearsInBusiness',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create contractor profile
    const profile = new ContractorProfile({
      userId: session.user.id,
      businessName: body.businessName,
      businessDescription: body.businessDescription,
      businessPhone: body.businessPhone,
      businessEmail: body.businessEmail,
      website: body.website,
      logo: body.logo,
      coverImage: body.coverImage,
      address: body.address,
      services: body.services,
      serviceDescription: body.serviceDescription,
      regionsServed: body.regionsServed,
      yearsInBusiness: body.yearsInBusiness,
      numberOfEmployees: body.numberOfEmployees,
      equipmentOwned: body.equipmentOwned,
      photos: body.photos || [],
      projectHighlights: body.projectHighlights || [],
      socialLinks: body.socialLinks,
      isPublished: body.isPublished || false,
    });

    await profile.save();

    // Update user role to contractor if not already
    if (session.user.role !== 'contractor') {
      await User.findByIdAndUpdate(session.user.id, { role: 'contractor' });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Contractor profile created successfully',
        profile: profile.toJSON(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contractor onboarding error:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // MongoDB duplicate key error
    if (error instanceof Error && 'code' in error && (error as { code: number }).code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A contractor profile already exists for this account. Please contact support.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create contractor profile' },
      { status: 500 }
    );
  }
}
