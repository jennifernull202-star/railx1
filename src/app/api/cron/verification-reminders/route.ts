/**
 * THE RAIL EXCHANGE™ — Seller Verification Expiration Cron Job
 * 
 * GET /api/cron/verification-reminders
 * 
 * Runs daily to:
 * 1. Send renewal reminders (30 days, 7 days, day of expiration)
 * 2. Mark expired verifications as expired
 * 3. Restrict seller actions when expired
 * 
 * Called by Vercel cron or external scheduler.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import SellerVerification from '@/models/SellerVerification';
import nodemailer from 'nodemailer';

// Email configuration
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@therailexchange.com';

// SECURITY: Verify cron secret - FAIL CLOSED if not configured
function verifyCronSecret(request: NextRequest): { allowed: boolean; error?: string } {
  const cronSecret = process.env.CRON_SECRET;
  
  // SECURITY: CRON_SECRET is REQUIRED - fail closed if not set
  // DO NOT allow access without a configured secret
  if (!cronSecret) {
    console.error('SECURITY: CRON_SECRET not configured - blocking cron access');
    return { allowed: false, error: 'Service not configured' };
  }
  
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return { allowed: false, error: 'Unauthorized' };
  }
  
  return { allowed: true };
}

async function sendRenewalEmail(
  email: string,
  name: string,
  daysRemaining: number,
  expirationDate: Date,
  type: 'seller' | 'contractor' = 'seller'
): Promise<boolean> {
  try {
    const transporter = getTransporter();
    const formattedDate = expirationDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const typeLabel = type === 'contractor' ? 'Contractor Verification Badge' : 'Seller Verification';
    const renewUrl = type === 'contractor' 
      ? 'https://www.therailexchange.com/dashboard/contractor/verify'
      : 'https://www.therailexchange.com/dashboard/verification/seller';
    
    let subject: string;
    let urgency: string;
    
    if (daysRemaining === 0) {
      subject = `⚠️ Your ${typeLabel} Expires Today`;
      urgency = 'expires today';
    } else if (daysRemaining === 7) {
      subject = `⏰ Your ${typeLabel} Expires in 7 Days`;
      urgency = 'expires in 7 days';
    } else {
      subject = `📅 Your ${typeLabel} Expires in 30 Days`;
      urgency = 'expires in 30 days';
    }

    const actionText = type === 'contractor'
      ? 'Your verified contractor badge and priority placement will be removed until you renew.'
      : 'Your ability to create and edit listings will be restricted until you renew.';

    const pricingHtml = type === 'contractor'
      ? `<li>Contractor Verification Badge: $149/year</li>`
      : `<li>Standard Verification: $29 (24-hour approval)</li>
         <li>Priority Verification: $49 (Instant approval)</li>`;

    await transporter.sendMail({
      from: `"The Rail Exchange" <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1a1a2e; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #0A1A2F; font-size: 24px; margin: 0;">
                  The Rail <span style="color: #FF6A1A;">Exchange</span>™
                </h1>
              </div>
              
              <div style="background: ${daysRemaining === 0 ? '#fef2f2' : '#fffbeb'}; border: 1px solid ${daysRemaining === 0 ? '#fecaca' : '#fed7aa'}; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h2 style="color: ${daysRemaining === 0 ? '#dc2626' : '#d97706'}; font-size: 18px; margin: 0 0 12px 0;">
                  ${daysRemaining === 0 ? '⚠️ Action Required Today' : '⏰ Renewal Reminder'}
                </h2>
                <p style="color: #4b5563; margin: 0;">
                  Hi ${name},<br><br>
                  Your ${typeLabel.toLowerCase()} ${urgency} on <strong>${formattedDate}</strong>.
                  ${daysRemaining === 0 
                    ? actionText
                    : `Renew now to maintain your verified ${type} status.`
                  }
                </p>
              </div>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${renewUrl}" 
                   style="display: inline-block; background: ${daysRemaining === 0 ? '#dc2626' : '#FF6A1A'}; color: white; font-weight: 600; padding: 14px 28px; border-radius: 8px; text-decoration: none;">
                  Renew Verification Now
                </a>
              </div>
              
              <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h3 style="color: #0A1A2F; font-size: 14px; margin: 0 0 12px 0;">Renewal Pricing:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
                  ${pricingHtml}
                </ul>
              </div>
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                You're receiving this email because your ${typeLabel.toLowerCase()} is expiring soon.
                <br>
                <a href="https://www.therailexchange.com/dashboard/settings" style="color: #FF6A1A;">Manage email preferences</a>
              </p>
            </div>
          </body>
        </html>
      `,
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send renewal email:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  // SECURITY: Verify cron secret - fail closed
  const authCheck = verifyCronSecret(request);
  if (!authCheck.allowed) {
    return NextResponse.json({ error: authCheck.error }, { status: 401 });
  }

  try {
    await connectDB();
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const results = {
      // Seller results
      sellerExpired: 0,
      sellerThirtyDayReminders: 0,
      sellerSevenDayReminders: 0,
      sellerDayOfReminders: 0,
      // Contractor results
      contractorExpired: 0,
      contractorThirtyDayReminders: 0,
      contractorSevenDayReminders: 0,
      contractorDayOfReminders: 0,
      errors: [] as string[],
    };

    // ========================================
    // SELLER VERIFICATION EXPIRATION
    // ========================================

    // 1. Mark expired seller verifications
    const expiredUsers = await User.find({
      isVerifiedSeller: true,
      verifiedSellerStatus: 'active',
      verifiedSellerExpiresAt: { $lte: now },
    });

    for (const user of expiredUsers) {
      user.verifiedSellerStatus = 'expired';
      user.isVerifiedSeller = false;
      await user.save();

      // Update verification record
      const verification = await SellerVerification.findOne({ userId: user._id });
      if (verification) {
        verification.status = 'expired';
        verification.statusHistory.push({
          status: 'expired',
          changedAt: now,
          reason: 'Verification expired - auto-expired by cron job',
        });
        await verification.save();
      }

      results.sellerExpired++;
    }

    // 2. Send 30-day seller reminders
    const thirtyDayUsers = await User.find({
      isVerifiedSeller: true,
      verifiedSellerStatus: 'active',
      verifiedSellerExpiresAt: {
        $gte: new Date(thirtyDaysFromNow.getTime() - 24 * 60 * 60 * 1000),
        $lt: thirtyDaysFromNow,
      },
    });

    for (const user of thirtyDayUsers) {
      const verification = await SellerVerification.findOne({ userId: user._id });
      
      if (verification?.renewalRemindersSent?.thirtyDay) continue;
      
      const sent = await sendRenewalEmail(
        user.email,
        user.name,
        30,
        user.verifiedSellerExpiresAt!,
        'seller'
      );
      
      if (sent && verification) {
        if (!verification.renewalRemindersSent) {
          verification.renewalRemindersSent = {};
        }
        verification.renewalRemindersSent.thirtyDay = now;
        await verification.save();
        results.sellerThirtyDayReminders++;
      }
    }

    // 3. Send 7-day seller reminders
    const sevenDayUsers = await User.find({
      isVerifiedSeller: true,
      verifiedSellerStatus: 'active',
      verifiedSellerExpiresAt: {
        $gte: new Date(sevenDaysFromNow.getTime() - 24 * 60 * 60 * 1000),
        $lt: sevenDaysFromNow,
      },
    });

    for (const user of sevenDayUsers) {
      const verification = await SellerVerification.findOne({ userId: user._id });
      
      if (verification?.renewalRemindersSent?.sevenDay) continue;
      
      const sent = await sendRenewalEmail(
        user.email,
        user.name,
        7,
        user.verifiedSellerExpiresAt!,
        'seller'
      );
      
      if (sent && verification) {
        if (!verification.renewalRemindersSent) {
          verification.renewalRemindersSent = {};
        }
        verification.renewalRemindersSent.sevenDay = now;
        await verification.save();
        results.sellerSevenDayReminders++;
      }
    }

    // 4. Send day-of seller reminders
    const dayOfUsers = await User.find({
      isVerifiedSeller: true,
      verifiedSellerStatus: 'active',
      verifiedSellerExpiresAt: {
        $gte: now,
        $lt: oneDayFromNow,
      },
    });

    for (const user of dayOfUsers) {
      const verification = await SellerVerification.findOne({ userId: user._id });
      
      if (verification?.renewalRemindersSent?.dayOf) continue;
      
      const sent = await sendRenewalEmail(
        user.email,
        user.name,
        0,
        user.verifiedSellerExpiresAt!,
        'seller'
      );
      
      if (sent && verification) {
        if (!verification.renewalRemindersSent) {
          verification.renewalRemindersSent = {};
        }
        verification.renewalRemindersSent.dayOf = now;
        await verification.save();
        results.sellerDayOfReminders++;
      }
    }

    // ========================================
    // CONTRACTOR BADGE EXPIRATION
    // ========================================
    
    // Import ContractorProfile for contractor handling
    const ContractorProfile = (await import('@/models/ContractorProfile')).default;

    // 5. Mark expired contractor badges
    const expiredContractors = await ContractorProfile.find({
      verifiedBadgePurchased: true,
      verificationStatus: 'verified',
      verifiedBadgeExpiresAt: { $lte: now },
    });

    for (const contractor of expiredContractors) {
      contractor.verificationStatus = 'expired';
      contractor.verifiedBadgePurchased = false;
      await contractor.save();

      // Get user and reset contractor tier to 'none' (invisible)
      const user = await User.findById(contractor.userId);
      if (user) {
        user.contractorTier = 'none'; // HARD GATE: Expired = invisible
        await user.save();
      }

      results.contractorExpired++;
    }

    // 6. Send 30-day contractor reminders
    const thirtyDayContractors = await ContractorProfile.find({
      verifiedBadgePurchased: true,
      verificationStatus: 'verified',
      verifiedBadgeExpiresAt: {
        $gte: new Date(thirtyDaysFromNow.getTime() - 24 * 60 * 60 * 1000),
        $lt: thirtyDaysFromNow,
      },
      'renewalRemindersSent.thirtyDay': { $exists: false },
    });

    for (const contractor of thirtyDayContractors) {
      const user = await User.findById(contractor.userId);
      if (!user) continue;
      
      const sent = await sendRenewalEmail(
        user.email,
        contractor.businessName || user.name,
        30,
        contractor.verifiedBadgeExpiresAt!,
        'contractor'
      );
      
      if (sent) {
        if (!contractor.renewalRemindersSent) {
          contractor.renewalRemindersSent = {};
        }
        contractor.renewalRemindersSent.thirtyDay = now;
        await contractor.save();
        results.contractorThirtyDayReminders++;
      }
    }

    // 7. Send 7-day contractor reminders
    const sevenDayContractors = await ContractorProfile.find({
      verifiedBadgePurchased: true,
      verificationStatus: 'verified',
      verifiedBadgeExpiresAt: {
        $gte: new Date(sevenDaysFromNow.getTime() - 24 * 60 * 60 * 1000),
        $lt: sevenDaysFromNow,
      },
      'renewalRemindersSent.sevenDay': { $exists: false },
    });

    for (const contractor of sevenDayContractors) {
      const user = await User.findById(contractor.userId);
      if (!user) continue;
      
      const sent = await sendRenewalEmail(
        user.email,
        contractor.businessName || user.name,
        7,
        contractor.verifiedBadgeExpiresAt!,
        'contractor'
      );
      
      if (sent) {
        if (!contractor.renewalRemindersSent) {
          contractor.renewalRemindersSent = {};
        }
        contractor.renewalRemindersSent.sevenDay = now;
        await contractor.save();
        results.contractorSevenDayReminders++;
      }
    }

    // 8. Send day-of contractor reminders
    const dayOfContractors = await ContractorProfile.find({
      verifiedBadgePurchased: true,
      verificationStatus: 'verified',
      verifiedBadgeExpiresAt: {
        $gte: now,
        $lt: oneDayFromNow,
      },
      'renewalRemindersSent.dayOf': { $exists: false },
    });

    for (const contractor of dayOfContractors) {
      const user = await User.findById(contractor.userId);
      if (!user) continue;
      
      const sent = await sendRenewalEmail(
        user.email,
        contractor.businessName || user.name,
        0,
        contractor.verifiedBadgeExpiresAt!,
        'contractor'
      );
      
      if (sent) {
        if (!contractor.renewalRemindersSent) {
          contractor.renewalRemindersSent = {};
        }
        contractor.renewalRemindersSent.dayOf = now;
        await contractor.save();
        results.contractorDayOfReminders++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('Verification reminder cron error:', error);
    return NextResponse.json(
      { error: 'Failed to process verification reminders' },
      { status: 500 }
    );
  }
}
