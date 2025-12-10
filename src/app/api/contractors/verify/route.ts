/**
 * THE RAIL EXCHANGE™ — Contractor Verification API
 * 
 * POST /api/contractors/verify - Submit documents for AI verification
 * GET /api/contractors/verify - Get verification status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import Notification from '@/models/Notification';

// Initialize OpenAI
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({ apiKey });
};

// ============================================================================
// GET - Get verification status
// CRITICAL: Contractors must NOT see AI summaries, admin notes, or internal flags
// ============================================================================

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const profile = await ContractorProfile.findOne({ userId: session.user.id });

    if (!profile) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    // SECURITY: Only return contractor-safe fields
    // DO NOT return: verificationResult (contains AI analysis), admin notes, internal flags
    return NextResponse.json({
      verificationStatus: profile.verificationStatus,
      verificationDocuments: profile.verificationDocuments,
      // verificationResult is OMITTED — contractors must NOT see AI summaries
      verifiedAt: profile.verifiedAt,
      verifiedBadgePurchased: profile.verifiedBadgePurchased,
      verifiedBadgeExpiresAt: profile.verifiedBadgeExpiresAt,
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Submit documents for verification
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessLicense, insuranceCertificate, workPhotos } = body;

    // Validate required documents
    if (!businessLicense || !insuranceCertificate) {
      return NextResponse.json(
        { error: 'Business license and insurance certificate are required' },
        { status: 400 }
      );
    }

    await connectDB();
    const profile = await ContractorProfile.findOne({ userId: session.user.id });

    if (!profile) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    // Check if already verified or pending
    if (profile.verificationStatus === 'verified') {
      return NextResponse.json(
        { error: 'Profile is already verified' },
        { status: 400 }
      );
    }

    if (profile.verificationStatus === 'pending') {
      return NextResponse.json(
        { error: 'Verification is already in progress' },
        { status: 400 }
      );
    }

    // Update profile with submitted documents
    profile.verificationDocuments = {
      businessLicense,
      insuranceCertificate,
      workPhotos: workPhotos || [],
      submittedAt: new Date(),
    };
    profile.verificationStatus = 'pending';
    await profile.save();

    // Run AI analysis for ADMIN REVIEW ONLY
    // CRITICAL: AI is ASSIST ONLY — it CANNOT approve, deny, or change verification status
    // All AI output is labeled "AI REVIEW SUMMARY — ADMIN MUST MAKE FINAL DECISION"
    try {
      const result = await runAIVerification(profile);
      
      // Store AI analysis for ADMIN VIEWING ONLY
      // Status ALWAYS stays 'pending' — only admin can change it
      profile.verificationResult = {
        status: 'needs_review', // AI can NEVER set approved/rejected — always needs_review
        confidence: result.confidence,
        notes: `AI REVIEW SUMMARY — ADMIN MUST MAKE FINAL DECISION.\n\n${result.notes}`,
        reviewedAt: new Date(),
        reviewedBy: 'ai',
        aiRecommendation: result.status, // Store AI recommendation for admin reference only
      };

      // Status ALWAYS stays 'pending' — only admin can approve
      // AI CANNOT change verificationStatus under any circumstances
      await profile.save();

      // Notify contractor that submission is under review
      await Notification.create({
        userId: session.user.id,
        type: 'verification_pending',
        title: 'Verification Submitted',
        message: 'Your documents have been submitted for review. Our team will review them within 24-48 hours.',
        read: false,
      });

      // Contractor sees ONLY that status is pending — NOT AI analysis
      return NextResponse.json({
        success: true,
        verificationStatus: 'pending',
        message: 'Documents submitted for admin review.',
      });
    } catch (aiError) {
      console.error('AI verification error:', aiError);
      
      // If AI fails, queue for manual review
      profile.verificationResult = {
        status: 'needs_review',
        confidence: 0,
        notes: 'AI verification unavailable, queued for manual review',
        reviewedAt: new Date(),
        reviewedBy: 'ai',
      };
      await profile.save();

      await Notification.create({
        userId: session.user.id,
        type: 'verification_pending',
        title: 'Verification Under Review',
        message: 'Your documents are being reviewed by our team. We\'ll notify you within 24-48 hours.',
        read: false,
      });

      return NextResponse.json({
        success: true,
        verificationStatus: 'pending',
        result: {
          status: 'needs_review',
          notes: 'Your documents are being reviewed by our team.',
        },
      });
    }
  } catch (error) {
    console.error('Submit verification error:', error);
    return NextResponse.json(
      { error: 'Failed to submit verification' },
      { status: 500 }
    );
  }
}

// ============================================================================
// AI Verification Function
// ============================================================================

interface VerificationResult {
  status: 'approved' | 'rejected' | 'needs_review';
  confidence: number;
  notes: string;
}

async function runAIVerification(profile: typeof ContractorProfile.prototype): Promise<VerificationResult> {
  const openai = getOpenAI();

  const businessLicenseUrl = profile.verificationDocuments?.businessLicense;
  const insuranceUrl = profile.verificationDocuments?.insuranceCertificate;

  if (!businessLicenseUrl || !insuranceUrl) {
    return {
      status: 'rejected',
      confidence: 100,
      notes: 'Missing required documents',
    };
  }

  // Analyze documents with GPT-4 Vision
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a document verification specialist for The Rail Exchange, a railroad equipment marketplace. 
Your task is to verify contractor documentation for authenticity and validity.

Analyze the provided documents and determine:
1. Is the business license document authentic and valid (not expired)?
2. Is the insurance certificate authentic and valid (not expired)?
3. Does the business name on documents match: "${profile.businessName}"?

Respond in JSON format:
{
  "status": "approved" | "rejected" | "needs_review",
  "confidence": 0-100,
  "notes": "Brief explanation of decision",
  "businessLicense": {
    "valid": boolean,
    "businessName": "extracted name",
    "expirationDate": "date if visible",
    "issues": "any issues found"
  },
  "insurance": {
    "valid": boolean,
    "businessName": "extracted name", 
    "expirationDate": "date if visible",
    "issues": "any issues found"
  }
}

Rules:
- Approve if both documents appear valid and business name matches (80%+ confidence)
- Reject if documents are clearly fake, expired, or business names don't match
- Mark needs_review if unclear, low quality images, or cannot determine validity`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Please verify these documents for contractor "${profile.businessName}":`,
          },
          {
            type: 'image_url',
            image_url: {
              url: businessLicenseUrl,
              detail: 'high',
            },
          },
          {
            type: 'image_url',
            image_url: {
              url: insuranceUrl,
              detail: 'high',
            },
          },
        ],
      },
    ],
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI');
  }

  try {
    const parsed = JSON.parse(content);
    return {
      status: parsed.status || 'needs_review',
      confidence: parsed.confidence || 50,
      notes: parsed.notes || 'Unable to parse verification result',
    };
  } catch {
    return {
      status: 'needs_review',
      confidence: 0,
      notes: 'AI response could not be parsed',
    };
  }
}
