/**
 * THE RAIL EXCHANGE™ — Contractor Profile API
 * 
 * FREE Contractor Profile - Simplified for basic profiles.
 * NO documents required at this stage.
 * 
 * GET /api/contractors/profile - Get current user's profile
 * POST /api/contractors/profile - Create/update profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import User from '@/models/User';
import { Types } from 'mongoose';

/**
 * GET /api/contractors/profile
 * Get current user's contractor profile
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const profile = await ContractorProfile.findOne({ 
      userId: new Types.ObjectId(session.user.id) 
    }).lean();

    // Transform to expected format for frontend
    if (profile) {
      return NextResponse.json({
        profile: {
          ...profile,
          // Map fields to match frontend expectations
          companyName: profile.businessName,
          slug: profile.businessName
            ? profile.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50)
            : '',
          description: profile.businessDescription || '',
          contactInfo: {
            email: profile.businessEmail,
            phone: profile.businessPhone,
            website: profile.website || '',
          },
          primaryState: profile.address?.state || '',
          serviceAreas: profile.regionsServed || [],
          serviceRadius: '', // Not stored in current model
          customServices: [], // Not stored in current model
        },
      });
    }

    return NextResponse.json({ profile: null });
  } catch (error) {
    console.error('Error fetching contractor profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contractors/profile
 * Create or update contractor profile (FREE - no documents)
 * 
 * Uses minimum required fields from the model.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyName,
      contactInfo,
      description,
      services,
      primaryState,
      serviceAreas,
      photos,
    } = body;

    // Validate required fields
    if (!companyName?.trim()) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    if (!contactInfo?.email?.trim()) {
      return NextResponse.json(
        { error: 'Contact email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = new Types.ObjectId(session.user.id);

    // Check if profile exists
    const existingProfile = await ContractorProfile.findOne({ userId });

    // Build profile data matching model schema
    const profileData: Record<string, unknown> = {
      userId,
      businessName: companyName.trim(),
      businessDescription: description?.trim() || 'Professional contractor services',
      businessEmail: contactInfo.email.trim(),
      businessPhone: contactInfo.phone?.trim() || 'Contact via email',
      website: contactInfo.website?.trim() || '',
      // Services - use provided or default
      services: services?.length > 0 ? services : ['other'],
      // Regions - use provided or default
      regionsServed: serviceAreas?.length > 0 ? serviceAreas : [primaryState || 'Nationwide'],
      yearsInBusiness: existingProfile?.yearsInBusiness || 1,
      // Address - minimal required
      address: {
        city: 'Not specified',
        state: primaryState || 'US',
        zipCode: '00000',
        country: 'USA',
      },
      // Photos
      photos: photos || [],
      // Status
      isPublished: true,
      isActive: true,
      documents: existingProfile?.documents || [],
      insuranceVerified: existingProfile?.insuranceVerified || false,
      safetyRecordVerified: existingProfile?.safetyRecordVerified || false,
      verificationStatus: existingProfile?.verificationStatus || 'none',
      verifiedBadgePurchased: existingProfile?.verifiedBadgePurchased || false,
      portfolioImages: existingProfile?.portfolioImages || [],
      equipmentImages: existingProfile?.equipmentImages || [],
      profileCompleteness: 50, // Basic profile
      updatedAt: new Date(),
    };

    let profile;
    
    if (existingProfile) {
      // Update existing profile
      profile = await ContractorProfile.findByIdAndUpdate(
        existingProfile._id,
        { $set: profileData },
        { new: true, runValidators: false } // Skip strict validation for simplified profile
      );
    } else {
      // Create new profile
      profile = new ContractorProfile({
        ...profileData,
        createdAt: new Date(),
      });
      await profile.save({ validateBeforeSave: false }); // Skip strict validation

      // Update user to mark as contractor
      await User.findByIdAndUpdate(userId, {
        $set: { isContractor: true },
      });
    }

    // Generate slug for response
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    return NextResponse.json({
      success: true,
      slug,
      message: 'Profile saved successfully',
    });
  } catch (error) {
    console.error('Error saving contractor profile:', error);
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}
