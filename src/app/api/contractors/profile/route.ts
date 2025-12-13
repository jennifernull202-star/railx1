/**
 * THE RAIL EXCHANGE™ — Contractor Profile API
 * 
 * FREE Contractor Profile - Simplified for basic profiles.
 * NO documents required at this stage.
 * 
 * SECURITY CONTROLS (Section 8):
 * - Contractor type validation (cannot select only "other")
 * - Input sanitization
 * - "Other" type abuse prevention
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
import { sanitizeString, sanitizeHTML } from '@/lib/sanitize';

// SECTION 8: Valid contractor types
const VALID_CONTRACTOR_TYPES = [
  'track_construction',
  'track_maintenance',
  'signaling',
  'bridge_construction',
  'rolling_stock_maintenance',
  'environmental',
  'consulting',
  'engineering',
  'inspection',
  'welding',
  'other'
];

// Maximum "other" type description length (prevents gaming with long descriptions)
const MAX_OTHER_DESCRIPTION = 150;

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
          // Contractor types
          contractorTypes: profile.contractorTypes || [],
          subServices: profile.subServices || {},
          otherTypeInfo: profile.otherTypeInfo || null,
          // Location
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
 * Create or update contractor profile with structured contractor types
 * 
 * REQUIRED:
 * - companyName (business name)
 * - contactInfo.email
 * - contractorTypes (at least one, cannot be only "other")
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
      contractorTypes,
      subServices,
      otherTypeInfo,
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

    // Validate contractor types (REQUIRED)
    if (!contractorTypes || contractorTypes.length === 0) {
      return NextResponse.json(
        { error: 'At least one contractor type must be selected' },
        { status: 400 }
      );
    }

    // SECTION 8: Validate contractor types against allowed list
    const invalidTypes = contractorTypes.filter((t: string) => !VALID_CONTRACTOR_TYPES.includes(t));
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Invalid contractor type(s): ${invalidTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Cannot select only "Other" (prevents misrepresentation)
    if (contractorTypes.length === 1 && contractorTypes[0] === 'other') {
      return NextResponse.json(
        { error: 'Cannot select only "Other". Please select at least one primary contractor type.' },
        { status: 400 }
      );
    }

    // If "Other" is selected, description is required but limited
    if (contractorTypes.includes('other')) {
      if (!otherTypeInfo?.description?.trim()) {
        return NextResponse.json(
          { error: 'Please provide a description for "Other" services' },
          { status: 400 }
        );
      }
      // Limit "other" description length to prevent keyword stuffing
      if (otherTypeInfo.description.length > MAX_OTHER_DESCRIPTION) {
        return NextResponse.json(
          { error: `"Other" service description must be ${MAX_OTHER_DESCRIPTION} characters or less` },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const userId = new Types.ObjectId(session.user.id);

    // SECURITY: Email verification required before creating contractor profile (enterprise abuse prevention)
    const currentUser = await User.findById(userId).select('emailVerified');
    if (!currentUser?.emailVerified) {
      return NextResponse.json(
        { error: 'This action is temporarily unavailable due to account or security requirements.' },
        { status: 403 }
      );
    }

    // Check if profile exists
    const existingProfile = await ContractorProfile.findOne({ userId });

    // Build profile data matching model schema
    // SECURITY: All text inputs sanitized
    const profileData: Record<string, unknown> = {
      userId,
      businessName: sanitizeString(companyName.trim(), { maxLength: 150 }) || companyName.trim(),
      businessDescription: sanitizeHTML(description?.trim() || 'Professional contractor services') || 'Professional contractor services',
      businessEmail: contactInfo.email.trim().toLowerCase(),
      businessPhone: sanitizeString(contactInfo.phone?.trim() || 'Contact via email', { maxLength: 30 }) || 'Contact via email',
      website: sanitizeString(contactInfo.website?.trim() || '', { maxLength: 200 }) || '',
      // NEW: Structured contractor types (PRIMARY CLASSIFICATION)
      contractorTypes: contractorTypes,
      subServices: subServices || {},
      otherTypeInfo: contractorTypes.includes('other') && otherTypeInfo ? {
        description: sanitizeString(otherTypeInfo.description?.trim(), { maxLength: MAX_OTHER_DESCRIPTION }),
        submittedAt: new Date(),
        normalized: false,
      } : undefined,
      // Legacy services - use provided or default
      services: services?.length > 0 ? services : ['other'],
      // Regions - use provided or default
      regionsServed: serviceAreas?.length > 0 ? serviceAreas : [primaryState || 'Nationwide'],
      yearsInBusiness: existingProfile?.yearsInBusiness || 1,
      // Address - minimal required
      address: {
        city: sanitizeString('Not specified', { maxLength: 100 }) || 'Not specified',
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
