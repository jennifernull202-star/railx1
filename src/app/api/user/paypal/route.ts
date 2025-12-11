/**
 * THE RAIL EXCHANGE™ — PayPal Email API
 * 
 * IMPORTANT LEGAL DISCLAIMER:
 * - The Rail Exchange does NOT process any PayPal payments.
 * - PayPal is ONLY used as a user-provided contact detail.
 * - All PayPal interactions happen OFF-platform between users.
 * - No financial data is stored other than a plain email string.
 * 
 * Endpoints:
 * - GET: Retrieve user's PayPal email
 * - PUT: Save/update PayPal email
 * - DELETE: Remove PayPal email
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

/**
 * GET /api/user/paypal
 * Get current user's PayPal email
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('paypalEmail paypalVerified');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      paypalEmail: user.paypalEmail || null,
      paypalVerified: user.paypalVerified || false,
      connected: !!user.paypalEmail,
    });
  } catch (error) {
    console.error('Get PayPal error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve PayPal information' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/paypal
 * Save or update PayPal email
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paypalEmail } = body;

    if (!paypalEmail || typeof paypalEmail !== 'string') {
      return NextResponse.json(
        { error: 'PayPal email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paypalEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        paypalEmail: paypalEmail.toLowerCase().trim(),
        paypalVerified: true, // User self-verified by entering
      },
      { new: true }
    ).select('paypalEmail paypalVerified');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paypalEmail: user.paypalEmail,
      paypalVerified: user.paypalVerified,
      connected: true,
      message: 'PayPal email saved successfully',
    });
  } catch (error) {
    console.error('Save PayPal error:', error);
    return NextResponse.json(
      { error: 'Failed to save PayPal information' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/paypal
 * Remove PayPal email
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        paypalEmail: null,
        paypalVerified: false,
      },
      { new: true }
    ).select('paypalEmail paypalVerified');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paypalEmail: null,
      paypalVerified: false,
      connected: false,
      message: 'PayPal email removed successfully',
    });
  } catch (error) {
    console.error('Remove PayPal error:', error);
    return NextResponse.json(
      { error: 'Failed to remove PayPal information' },
      { status: 500 }
    );
  }
}
