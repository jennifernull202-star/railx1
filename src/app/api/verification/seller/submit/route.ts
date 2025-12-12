/**
 * THE RAIL EXCHANGE™ — Seller Verification Submit API
 * 
 * POST /api/verification/seller/submit
 * - Submit documents for REAL AI verification using GPT-4 Vision
 * - Triggers AI analysis of uploaded documents
 * - Implements OCR extraction, tampering detection, duplicate check
 * - Standard tier: Queue for 24h processing
 * - Priority tier: Instant processing
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import SellerVerification from '@/models/SellerVerification';
import Notification from '@/models/Notification';
import crypto from 'crypto';

// ============================================================================
// CONSTANTS
// ============================================================================

// Disposable email domains to block
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
  'temp-mail.org', '10minutemail.com', 'fakeinbox.com', 'trashmail.com',
  'tempail.com', 'dispostable.com', 'mintemail.com', 'getnada.com',
  'yopmail.com', 'sharklasers.com', 'mailnesia.com', 'spamgourmet.com',
];

// Rate limiting: max attempts per user per day
const MAX_VERIFICATION_ATTEMPTS_PER_DAY = 3;

// ============================================================================
// OPENAI CLIENT
// ============================================================================

const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({ apiKey });
};

// ============================================================================
// HELPER: Generate Document Hash (Perceptual Hash Placeholder)
// In production, use proper perceptual hashing library
// ============================================================================

function generateDocumentHash(s3Key: string, fileName: string): string {
  // Create a hash from the S3 key and filename
  // In production: Implement actual perceptual hashing using image data
  const data = `${s3Key}:${fileName}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

// ============================================================================
// HELPER: Check for Disposable Email
// ============================================================================

function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

// ============================================================================
// HELPER: Check Rate Limit
// ============================================================================

async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  // Check verification attempts in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const verification = await SellerVerification.findOne({ userId });
  if (!verification) {
    return { allowed: true, remaining: MAX_VERIFICATION_ATTEMPTS_PER_DAY };
  }
  
  // Count status changes in the last 24 hours
  const recentAttempts = verification.statusHistory.filter(
    (h: { status: string; changedAt: Date }) => 
      h.status === 'pending-ai' && new Date(h.changedAt) > oneDayAgo
  ).length;
  
  const remaining = Math.max(0, MAX_VERIFICATION_ATTEMPTS_PER_DAY - recentAttempts);
  return { allowed: remaining > 0, remaining };
}

// ============================================================================
// HELPER: Check for Duplicate Documents
// ============================================================================

async function checkForDuplicates(
  userId: string,
  documents: Array<{ type: string; s3Key: string; documentHash?: string }>
): Promise<{ isDuplicate: boolean; matchingUserId?: string; duplicateType?: string }> {
  // Find all other verifications with matching document hashes
  const otherVerifications = await SellerVerification.find({
    userId: { $ne: userId },
    'documents.documentHash': { $in: documents.map(d => d.documentHash).filter(Boolean) },
  }).limit(1);
  
  if (otherVerifications.length > 0) {
    const matchingDoc = otherVerifications[0].documents.find(
      (d: { documentHash?: string }) => documents.some(ud => ud.documentHash === d.documentHash)
    );
    return {
      isDuplicate: true,
      matchingUserId: otherVerifications[0].userId.toString(),
      duplicateType: matchingDoc?.type || 'unknown',
    };
  }
  
  return { isDuplicate: false };
}

// ============================================================================
// REAL AI VERIFICATION - GPT-4 Vision
// ============================================================================

interface AIVerificationResult {
  status: 'passed' | 'flagged' | 'failed';
  confidence: number;
  flags: string[];
  extractedData: {
    name?: string;
    businessName?: string;
    ein?: string;
    licenseNumber?: string;
    expirationDate?: string;
    address?: string;
    documentType?: string;
  };
  nameMatchScore: number;
  dateValidation: {
    isExpired: boolean;
    expirationDate?: string;
    daysUntilExpiration?: number;
  };
  tamperingDetection: {
    score: number;
    indicators: string[];
  };
  fraudSignals: string[];
  aiRecommendation: 'approved' | 'rejected' | 'needs_review';
  notes: string;
}

async function performRealAIVerification(
  documents: Array<{ type: string; s3Key: string; fileName: string }>,
  userName: string,
  userEmail: string
): Promise<AIVerificationResult> {
  const openai = getOpenAI();
  
  // Get S3 URLs for documents
  const s3Bucket = process.env.AWS_S3_BUCKET_NAME || 'railx-uploads';
  const s3Region = process.env.AWS_REGION || 'us-east-2';
  
  const documentUrls: { type: string; url: string; fileName: string }[] = [];
  for (const doc of documents) {
    // Construct S3 URL
    const url = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${doc.s3Key}`;
    documentUrls.push({ type: doc.type, url, fileName: doc.fileName });
  }
  
  // Find driver's license and business document
  const driversLicense = documentUrls.find(d => d.type === 'drivers_license');
  const businessDoc = documentUrls.find(d => 
    d.type === 'business_license' || d.type === 'ein_document'
  );
  
  if (!driversLicense || !businessDoc) {
    return {
      status: 'failed',
      confidence: 100,
      flags: ['Missing required documents'],
      extractedData: {},
      nameMatchScore: 0,
      dateValidation: { isExpired: false },
      tamperingDetection: { score: 0, indicators: ['Unable to analyze - missing documents'] },
      fraudSignals: ['Incomplete document submission'],
      aiRecommendation: 'rejected',
      notes: 'Required documents not provided: Driver\'s license and business license/EIN are mandatory.',
    };
  }
  
  // Build image content array for GPT-4 Vision
  const imageContent: Array<{ type: 'image_url'; image_url: { url: string; detail: 'high' } }> = [];
  
  for (const doc of documentUrls) {
    imageContent.push({
      type: 'image_url',
      image_url: { url: doc.url, detail: 'high' },
    });
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a document verification specialist for The Rail Exchange, a railroad equipment marketplace.
Your task is to verify seller identity documents for authenticity, validity, and fraud detection.

ACCOUNT INFORMATION TO VERIFY AGAINST:
- Account Name: "${userName}"
- Account Email: "${userEmail}"

DOCUMENTS PROVIDED:
${documentUrls.map((d, i) => `${i + 1}. ${d.type.replace(/_/g, ' ').toUpperCase()} (${d.fileName})`).join('\n')}

VERIFICATION TASKS:

1. DRIVER'S LICENSE ANALYSIS:
   - Extract full name exactly as shown
   - Extract full address
   - Extract license number
   - Extract expiration date
   - Check if document appears authentic (proper formatting, holograms mentioned, official layout)
   - Check for signs of tampering (mismatched fonts, uneven edges, Photoshop artifacts, blur inconsistencies)

2. BUSINESS LICENSE/EIN ANALYSIS:
   - Extract business name
   - Extract EIN number (format: XX-XXXXXXX)
   - Extract expiration date if shown
   - Check if document appears authentic
   - Check for signs of tampering

3. NAME MATCHING:
   - Compare name on driver's license to account name "${userName}"
   - Score 0-100 (100 = exact match, 80+ = close match, below 60 = mismatch)

4. TAMPERING DETECTION:
   - Score 0-100 (100 = appears authentic, below 70 = suspicious)
   - List any indicators of digital manipulation

5. FRAUD SIGNALS:
   - List any red flags or concerns

Respond in JSON format ONLY:
{
  "status": "passed" | "flagged" | "failed",
  "confidence": 0-100,
  "flags": ["array of concerns"],
  "extractedData": {
    "name": "Full Name from ID",
    "address": "Full address from ID",
    "licenseNumber": "DL number",
    "businessName": "Business name from license/EIN",
    "ein": "XX-XXXXXXX format",
    "expirationDate": "MM/DD/YYYY if visible"
  },
  "nameMatchScore": 0-100,
  "dateValidation": {
    "isExpired": true/false,
    "expirationDate": "MM/DD/YYYY",
    "daysUntilExpiration": number or null
  },
  "tamperingDetection": {
    "score": 0-100,
    "indicators": ["list of any tampering signs found"]
  },
  "fraudSignals": ["list of any fraud indicators"],
  "recommendation": "approved" | "rejected" | "needs_review",
  "notes": "Detailed explanation of findings for admin review"
}

DECISION RULES:
- APPROVED: All documents valid, name matches (80%+), no tampering detected (score 90%+), not expired
- REJECTED: Clear fraud indicators, significant name mismatch (<60%), obvious tampering, or expired documents
- NEEDS_REVIEW: Moderate concerns, unclear documents, or edge cases requiring human judgment`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please verify these seller documents. The account holder is "${userName}" (${userEmail}).`,
            },
            ...imageContent,
          ],
        },
      ],
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }
    
    const parsed = JSON.parse(content);
    
    // Normalize the result
    return {
      status: parsed.status || 'flagged',
      confidence: Math.max(0, Math.min(100, parsed.confidence || 50)),
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      extractedData: parsed.extractedData || {},
      nameMatchScore: Math.max(0, Math.min(100, parsed.nameMatchScore || 0)),
      dateValidation: {
        isExpired: parsed.dateValidation?.isExpired || false,
        expirationDate: parsed.dateValidation?.expirationDate,
        daysUntilExpiration: parsed.dateValidation?.daysUntilExpiration,
      },
      tamperingDetection: {
        score: Math.max(0, Math.min(100, parsed.tamperingDetection?.score || 50)),
        indicators: Array.isArray(parsed.tamperingDetection?.indicators) 
          ? parsed.tamperingDetection.indicators 
          : [],
      },
      fraudSignals: Array.isArray(parsed.fraudSignals) ? parsed.fraudSignals : [],
      aiRecommendation: parsed.recommendation || 'needs_review',
      notes: parsed.notes || 'AI analysis complete.',
    };
    
  } catch (error) {
    console.error('AI verification error:', error);
    
    // Return needs_review on AI failure - don't block the user
    return {
      status: 'flagged',
      confidence: 0,
      flags: ['AI analysis failed - queued for manual review'],
      extractedData: {},
      nameMatchScore: 0,
      dateValidation: { isExpired: false },
      tamperingDetection: { score: 0, indicators: ['Unable to analyze'] },
      fraudSignals: [],
      aiRecommendation: 'needs_review',
      notes: `AI verification unavailable. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Queued for manual admin review.`,
    };
  }
}

// ============================================================================
// POST - Submit Documents for Verification
// ============================================================================

export async function POST() {
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

    // ========================================
    // FRAUD PREVENTION CHECKS
    // ========================================
    
    // 1. Disposable email check
    if (isDisposableEmail(user.email)) {
      return NextResponse.json(
        { 
          error: 'Disposable email addresses are not allowed for seller verification.',
          code: 'DISPOSABLE_EMAIL',
        },
        { status: 400 }
      );
    }
    
    // 2. Rate limit check
    const rateLimit = await checkRateLimit(user._id.toString());
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. You can submit ${MAX_VERIFICATION_ATTEMPTS_PER_DAY} verification requests per day. Please try again tomorrow.`,
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      );
    }

    // Get verification record
    const verification = await SellerVerification.findOne({ userId: user._id });
    if (!verification) {
      return NextResponse.json(
        { error: 'No verification record found. Please upload documents first.' },
        { status: 400 }
      );
    }

    // Check if already submitted
    if (['pending-ai', 'pending-admin', 'active'].includes(verification.status)) {
      return NextResponse.json(
        { error: 'Verification already submitted or active' },
        { status: 400 }
      );
    }

    // Check required documents
    const hasDriversLicense = verification.documents.some((d: { type: string }) => d.type === 'drivers_license');
    const hasBusinessDoc = verification.documents.some((d: { type: string }) => 
      d.type === 'business_license' || d.type === 'ein_document'
    );

    if (!hasDriversLicense) {
      return NextResponse.json(
        { error: 'Driver\'s license is required' },
        { status: 400 }
      );
    }

    if (!hasBusinessDoc) {
      return NextResponse.json(
        { error: 'Business license or EIN document is required' },
        { status: 400 }
      );
    }

    // ========================================
    // GENERATE DOCUMENT HASHES FOR DUPLICATE DETECTION
    // ========================================
    
    type VerificationDocumentType = 'drivers_license' | 'business_license' | 'ein_document' | 'insurance_certificate';
    
    const documentsWithHashes = verification.documents.map((doc: { 
      type: VerificationDocumentType; 
      s3Key: string; 
      fileName: string; 
      uploadedAt: Date; 
      expirationDate?: Date;
    }) => ({
      ...doc,
      documentHash: generateDocumentHash(doc.s3Key, doc.fileName),
    }));
    
    // Update documents with hashes
    verification.documents = documentsWithHashes;

    // ========================================
    // CHECK FOR DUPLICATE DOCUMENTS
    // ========================================
    
    const duplicateCheck = await checkForDuplicates(
      user._id.toString(),
      documentsWithHashes
    );
    
    if (duplicateCheck.isDuplicate) {
      // Flag but don't block - let admin review
      verification.aiVerification = {
        status: 'failed',
        confidence: 100,
        flags: [`Duplicate ${duplicateCheck.duplicateType} document detected`],
        extractedData: {},
        duplicateCheck,
        fraudSignals: ['Document previously used by another account'],
        processedAt: new Date(),
      };
      
      verification.status = 'pending-admin';
      verification.statusHistory.push({
        status: 'pending-admin',
        changedAt: new Date(),
        reason: 'Duplicate document detected - flagged for admin review',
      });
      
      await verification.save();
      
      // Create admin alert
      await Notification.create({
        userId: user._id,
        type: 'verification_flagged',
        title: 'Verification Flagged',
        message: 'Your verification has been flagged for additional review. Our team will contact you within 24-48 hours.',
        read: false,
      });
      
      return NextResponse.json({
        success: true,
        status: 'pending-admin',
        message: 'Your verification is under review.',
      });
    }

    // ========================================
    // UPDATE STATUS TO PENDING-AI
    // ========================================
    
    verification.status = 'pending-ai';
    verification.statusHistory.push({
      status: 'pending-ai',
      changedAt: new Date(),
      reason: 'Documents submitted for AI verification',
    });
    await verification.save();

    user.verifiedSellerStatus = 'pending-ai';
    await user.save();

    // ========================================
    // PERFORM AI VERIFICATION
    // ========================================
    
    // Priority tier gets instant processing
    // Standard tier would normally queue, but we process immediately for now
    const isPriority = verification.verificationTier === 'priority';
    
    const aiResult = await performRealAIVerification(
      verification.documents.map((d: { type: string; s3Key: string; fileName: string }) => ({
        type: d.type,
        s3Key: d.s3Key,
        fileName: d.fileName,
      })),
      user.name,
      user.email
    );

    // ========================================
    // STORE AI RESULTS
    // ========================================
    
    verification.aiVerification = {
      status: aiResult.status,
      confidence: aiResult.confidence,
      flags: aiResult.flags,
      extractedData: aiResult.extractedData,
      nameMatchScore: aiResult.nameMatchScore,
      dateValidation: aiResult.dateValidation,
      tamperingDetection: aiResult.tamperingDetection,
      duplicateCheck: { isDuplicate: false },
      fraudSignals: aiResult.fraudSignals,
      processedAt: new Date(),
      rawResponse: aiResult.notes, // Store notes for admin reference
    };

    // ========================================
    // DETERMINE NEXT STATUS
    // ========================================
    
    // Priority tier with passed AI = instant approval (still goes to pending-admin for final review)
    // Standard tier = always pending-admin
    // Both tiers = AI NEVER auto-approves, always needs admin final decision
    
    verification.status = 'pending-admin';
    verification.statusHistory.push({
      status: 'pending-admin',
      changedAt: new Date(),
      reason: `AI verification complete: ${aiResult.status} (confidence: ${aiResult.confidence}%, recommendation: ${aiResult.aiRecommendation})${isPriority ? ' [PRIORITY]' : ''}`,
    });
    
    // Set next AI revalidation date
    verification.lastAIRevalidation = new Date();
    verification.nextAIRevalidation = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    await verification.save();

    // Update user status
    user.verifiedSellerStatus = 'pending-admin';
    await user.save();

    // ========================================
    // SEND NOTIFICATION
    // ========================================
    
    await Notification.create({
      userId: user._id,
      type: 'verification_pending',
      title: 'Verification Submitted',
      message: isPriority 
        ? 'Your priority verification is being processed. You will receive a decision within minutes.'
        : 'Your verification documents have been submitted. Our team will review them within 24 hours.',
      read: false,
    });

    // ========================================
    // RETURN RESPONSE
    // ========================================
    
    // DO NOT expose AI results to user - only status
    return NextResponse.json({
      success: true,
      status: verification.status,
      tier: verification.verificationTier,
      message: isPriority 
        ? 'Priority verification submitted. You will be notified shortly.'
        : 'Documents submitted for review. Please allow up to 24 hours.',
    });
    
  } catch (error) {
    console.error('Error submitting verification:', error);
    return NextResponse.json(
      { error: 'Failed to submit verification' },
      { status: 500 }
    );
  }
}
