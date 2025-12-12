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

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow if no secret configured (dev mode)
  if (!cronSecret) return true;
  
  return authHeader === `Bearer ${cronSecret}`;
}

async function sendRenewalEmail(
  email: string,
  name: string,
  daysRemaining: number,
  expirationDate: Date
): Promise<boolean> {
  try {
    const transporter = getTransporter();
    const formattedDate = expirationDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    let subject: string;
    let urgency: string;
    
    if (daysRemaining === 0) {
      subject = '⚠️ Your Seller Verification Expires Today';
      urgency = 'expires today';
    } else if (daysRemaining === 7) {
      subject = '⏰ Your Seller Verification Expires in 7 Days';
      urgency = 'expires in 7 days';
    } else {
      subject = '📅 Your Seller Verification Expires in 30 Days';
      urgency = 'expires in 30 days';
    }

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
                  Your seller verification ${urgency} on <strong>${formattedDate}</strong>.
                  ${daysRemaining === 0 
                    ? 'Your ability to create and edit listings will be restricted until you renew.' 
                    : 'Renew now to keep your listings active and maintain your verified seller status.'
                  }
                </p>
              </div>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="https://www.therailexchange.com/dashboard/verification/seller" 
                   style="display: inline-block; background: ${daysRemaining === 0 ? '#dc2626' : '#FF6A1A'}; color: white; font-weight: 600; padding: 14px 28px; border-radius: 8px; text-decoration: none;">
                  Renew Verification Now
                </a>
              </div>
              
              <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h3 style="color: #0A1A2F; font-size: 14px; margin: 0 0 12px 0;">Renewal Pricing:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
                  <li>Standard Verification: $29 (24-hour approval)</li>
                  <li>Priority Verification: $49 (Instant approval)</li>
                </ul>
              </div>
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                You're receiving this email because your seller verification is expiring soon.
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
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const results = {
      expired: 0,
      thirtyDayReminders: 0,
      sevenDayReminders: 0,
      dayOfReminders: 0,
      errors: [] as string[],
    };

    // 1. Mark expired verifications
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

      results.expired++;
    }

    // 2. Send 30-day reminders (expires between 29-30 days from now)
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
      
      // Check if already sent
      if (verification?.renewalRemindersSent?.thirtyDay) continue;
      
      const sent = await sendRenewalEmail(
        user.email,
        user.name,
        30,
        user.verifiedSellerExpiresAt!
      );
      
      if (sent && verification) {
        if (!verification.renewalRemindersSent) {
          verification.renewalRemindersSent = {};
        }
        verification.renewalRemindersSent.thirtyDay = now;
        await verification.save();
        results.thirtyDayReminders++;
      }
    }

    // 3. Send 7-day reminders
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
        user.verifiedSellerExpiresAt!
      );
      
      if (sent && verification) {
        if (!verification.renewalRemindersSent) {
          verification.renewalRemindersSent = {};
        }
        verification.renewalRemindersSent.sevenDay = now;
        await verification.save();
        results.sevenDayReminders++;
      }
    }

    // 4. Send day-of reminders
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
        user.verifiedSellerExpiresAt!
      );
      
      if (sent && verification) {
        if (!verification.renewalRemindersSent) {
          verification.renewalRemindersSent = {};
        }
        verification.renewalRemindersSent.dayOf = now;
        await verification.save();
        results.dayOfReminders++;
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
