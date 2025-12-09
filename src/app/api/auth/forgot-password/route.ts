/**
 * THE RAIL EXCHANGE™ — Forgot Password API
 * 
 * Handles password reset token generation and email sending.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we don't reveal that
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token and expiry (1 hour)
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    // Send email (if email service is configured)
    try {
      // Check if Resend is configured
      if (process.env.RESEND_API_KEY) {
        const { sendPasswordResetEmail } = await import('@/lib/email');
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
        });
        console.log(`Password reset email sent to: ${user.email}`);
      } else {
        // Log the reset URL for development
        console.log(`[DEV] Password reset URL for ${user.email}: ${resetUrl}`);
      }
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't fail the request if email fails, token is still saved
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
