/**
 * THE RAIL EXCHANGE™ — User Registration API
 * 
 * POST /api/auth/register
 * Creates a new user account with email/password.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User, { UserRole } from '@/models/User';

interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequestBody = await request.json();
    const { name, email, password, role = 'buyer' } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Name, email, and password are required' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please provide a valid email address' 
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must be at least 8 characters long' 
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: UserRole[] = ['buyer', 'seller', 'contractor'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid role. Must be buyer, seller, or contractor' 
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'An account with this email already exists' 
        },
        { status: 409 }
      );
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
    });

    await user.save();

    // Return success response (without password)
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred during registration. Please try again.' 
      },
      { status: 500 }
    );
  }
}
