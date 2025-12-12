/**
 * THE RAIL EXCHANGE™ — Verification Processing Cron Job
 * 
 * GET /api/cron/process-verifications
 * 
 * Runs hourly to:
 * 1. Process pending-ai seller verifications (Standard tier 24h SLA)
 * 2. Auto-escalate verifications that exceed SLA
 * 3. Send SLA breach alerts to admins
 * 
 * Called by Vercel cron or external scheduler.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import SellerVerification from '@/models/SellerVerification';
import Notification from '@/models/Notification';

// ============================================================================
// CONSTANTS
// ============================================================================

const STANDARD_TIER_SLA_HOURS = 24;

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

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow if no secret configured (dev mode)
  if (!cronSecret) return true;
  
  return authHeader === `Bearer ${cronSecret}`;
}

// ============================================================================
// AI VERIFICATION FUNCTION (Same as submit route)
// ============================================================================

interface AIVerificationResult {
  status: 'passed' | 'flagged' | 'failed';
  confidence: number;
  flags: string[];
  extractedData: Record<string, string>;
  nameMatchScore: number;
  dateValidation: {
    isExpired: boolean;
    expirationDate?: string;
  };
  tamperingDetection: {
    score: number;
    indicators: string[];
  };
  fraudSignals: string[];
  aiRecommendation: 'approved' | 'rejected' | 'needs_review';
  notes: string;
}

async function runAIVerification(
  documents: Array<{ type: string; s3Key: string; fileName: string }>,
  userName: string,
  userEmail: string
): Promise<AIVerificationResult> {
  const openai = getOpenAI();
  const s3Bucket = process.env.AWS_S3_BUCKET_NAME || 'railx-uploads';
  const s3Region = process.env.AWS_REGION || 'us-east-2';
  
  const documentUrls: { type: string; url: string; fileName: string }[] = [];
  for (const doc of documents) {
    const url = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${doc.s3Key}`;
    documentUrls.push({ type: doc.type, url, fileName: doc.fileName });
  }
  
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
      tamperingDetection: { score: 0, indicators: ['Unable to analyze'] },
      fraudSignals: ['Incomplete document submission'],
      aiRecommendation: 'rejected',
      notes: 'Required documents not provided.',
    };
  }
  
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
          content: `You are a document verification specialist for The Rail Exchange.
Verify seller identity documents for authenticity, validity, and fraud detection.

ACCOUNT: "${userName}" (${userEmail})

Respond in JSON:
{
  "status": "passed" | "flagged" | "failed",
  "confidence": 0-100,
  "flags": ["concerns"],
  "extractedData": {"name": "", "address": "", "licenseNumber": "", "businessName": "", "ein": "", "expirationDate": ""},
  "nameMatchScore": 0-100,
  "dateValidation": {"isExpired": false, "expirationDate": ""},
  "tamperingDetection": {"score": 0-100, "indicators": []},
  "fraudSignals": [],
  "recommendation": "approved" | "rejected" | "needs_review",
  "notes": "explanation"
}`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Verify documents for "${userName}" (${userEmail}).` },
            ...imageContent,
          ],
        },
      ],
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');
    
    const parsed = JSON.parse(content);
    return {
      status: parsed.status || 'flagged',
      confidence: Math.max(0, Math.min(100, parsed.confidence || 50)),
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      extractedData: parsed.extractedData || {},
      nameMatchScore: Math.max(0, Math.min(100, parsed.nameMatchScore || 0)),
      dateValidation: {
        isExpired: parsed.dateValidation?.isExpired || false,
        expirationDate: parsed.dateValidation?.expirationDate,
      },
      tamperingDetection: {
        score: Math.max(0, Math.min(100, parsed.tamperingDetection?.score || 50)),
        indicators: Array.isArray(parsed.tamperingDetection?.indicators) 
          ? parsed.tamperingDetection.indicators : [],
      },
      fraudSignals: Array.isArray(parsed.fraudSignals) ? parsed.fraudSignals : [],
      aiRecommendation: parsed.recommendation || 'needs_review',
      notes: parsed.notes || 'AI analysis complete.',
    };
  } catch (error) {
    console.error('AI verification error:', error);
    return {
      status: 'flagged',
      confidence: 0,
      flags: ['AI analysis failed'],
      extractedData: {},
      nameMatchScore: 0,
      dateValidation: { isExpired: false },
      tamperingDetection: { score: 0, indicators: ['Unable to analyze'] },
      fraudSignals: [],
      aiRecommendation: 'needs_review',
      notes: `AI unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// GET - Process Pending Verifications
// ============================================================================

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    
    const now = new Date();
    const slaDeadline = new Date(now.getTime() - STANDARD_TIER_SLA_HOURS * 60 * 60 * 1000);
    
    const results = {
      processed: 0,
      escalated: 0,
      errors: [] as string[],
    };

    // ========================================
    // 1. FIND PENDING-AI VERIFICATIONS
    // ========================================
    
    const pendingVerifications = await SellerVerification.find({
      status: 'pending-ai',
      verificationTier: 'standard', // Only process standard tier (priority is instant)
    }).limit(50); // Process 50 at a time

    for (const verification of pendingVerifications) {
      try {
        const user = await User.findById(verification.userId);
        if (!user) {
          results.errors.push(`User not found for verification ${verification._id}`);
          continue;
        }

        // Check when it was submitted
        const submittedAt = verification.statusHistory.find(
          (h: { status: string }) => h.status === 'pending-ai'
        )?.changedAt;

        if (!submittedAt) {
          results.errors.push(`No submission date for verification ${verification._id}`);
          continue;
        }

        const submissionTime = new Date(submittedAt);
        const isOverdue = submissionTime < slaDeadline;

        // Run AI verification
        const aiResult = await runAIVerification(
          verification.documents.map((d: { type: string; s3Key: string; fileName: string }) => ({
            type: d.type,
            s3Key: d.s3Key,
            fileName: d.fileName,
          })),
          user.name,
          user.email
        );

        // Store AI results
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
          processedAt: now,
          rawResponse: aiResult.notes,
        };

        // Move to pending-admin
        verification.status = 'pending-admin';
        verification.statusHistory.push({
          status: 'pending-admin',
          changedAt: now,
          reason: `AI verification complete (background processor): ${aiResult.status} (confidence: ${aiResult.confidence}%)${isOverdue ? ' [SLA BREACHED]' : ''}`,
        });

        verification.lastAIRevalidation = now;
        verification.nextAIRevalidation = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

        await verification.save();

        // Update user status
        user.verifiedSellerStatus = 'pending-admin';
        await user.save();

        // Notify user
        await Notification.create({
          userId: user._id,
          type: 'verification_pending',
          title: 'Verification Review In Progress',
          message: 'Your documents have been processed and are now under admin review.',
          read: false,
        });

        results.processed++;

        if (isOverdue) {
          results.escalated++;
          // TODO: Send admin alert for SLA breach
          console.warn(`SLA breach for verification ${verification._id} - submitted ${submissionTime.toISOString()}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Error processing ${verification._id}: ${errorMessage}`);
      }
    }

    // ========================================
    // 2. CHECK FOR STUCK VERIFICATIONS (>48h)
    // ========================================
    
    const stuckDeadline = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const stuckVerifications = await SellerVerification.find({
      status: 'pending-ai',
      createdAt: { $lt: stuckDeadline },
    });

    for (const verification of stuckVerifications) {
      // Force escalate to admin with error note
      verification.status = 'pending-admin';
      verification.aiVerification = {
        status: 'failed',
        confidence: 0,
        flags: ['Automatic escalation - exceeded 48 hour processing time'],
        extractedData: {},
        fraudSignals: [],
        processedAt: now,
      };
      verification.statusHistory.push({
        status: 'pending-admin',
        changedAt: now,
        reason: 'Auto-escalated: Exceeded 48-hour processing limit',
      });
      await verification.save();
      
      results.escalated++;
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('Verification processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process verifications' },
      { status: 500 }
    );
  }
}
