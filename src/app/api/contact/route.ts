import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contact from '@/models/Contact';

interface ContactFormData {
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  category: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();
    const { name, companyName, email, phone, category, message } = body;

    // Validate required fields
    const errors: Record<string, string> = {};

    if (!name || name.trim().length === 0) {
      errors.name = 'Name is required';
    } else if (name.trim().length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }

    if (!email || email.trim().length === 0) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!category) {
      errors.category = 'Please select a category';
    } else if (!['support', 'general', 'marketplace', 'contractor'].includes(category)) {
      errors.category = 'Invalid category selected';
    }

    if (!message || message.trim().length === 0) {
      errors.message = 'Message is required';
    } else if (message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    } else if (message.trim().length > 5000) {
      errors.message = 'Message cannot exceed 5000 characters';
    }

    if (companyName && companyName.length > 150) {
      errors.companyName = 'Company name cannot exceed 150 characters';
    }

    if (phone && phone.length > 20) {
      errors.phone = 'Phone number cannot exceed 20 characters';
    }

    // Return validation errors
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    // Connect to database and save
    await connectDB();

    const contact = await Contact.create({
      name: name.trim(),
      companyName: companyName?.trim() || undefined,
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      category,
      message: message.trim(),
      status: 'new',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been sent successfully.',
        id: contact._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
