/**
 * THE RAIL EXCHANGE™ — AI Enhancement API
 * 
 * Uses OpenAI to generate optimized listing content:
 * - Compelling titles
 * - Professional descriptions
 * - SEO keywords
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Listing from '@/models/Listing';
import { Types } from 'mongoose';
import OpenAI from 'openai';

// Initialize OpenAI client lazily to avoid build errors
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface EnhancementRequest {
  listingId?: string;
  title?: string;
  description?: string;
  category?: string;
  condition?: string;
  specifications?: Array<{ label: string; value: string }>;
}

interface EnhancementResult {
  enhancedTitle: string;
  enhancedDescription: string;
  seoKeywords: string[];
  tags: string[];
}

// POST /api/ai/enhance - Generate AI-enhanced listing content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'AI enhancement is not configured. Please set OPENAI_API_KEY.' },
        { status: 503 }
      );
    }

    const body: EnhancementRequest = await request.json();
    const { listingId, title, description, category, condition, specifications } = body;

    let existingListing = null;
    let inputTitle = title;
    let inputDescription = description;
    let inputCategory = category;
    let inputCondition = condition;
    let inputSpecs = specifications;

    // If listingId provided, fetch existing data
    if (listingId) {
      if (!Types.ObjectId.isValid(listingId)) {
        return NextResponse.json(
          { error: 'Invalid listing ID' },
          { status: 400 }
        );
      }

      await connectDB();
      existingListing = await Listing.findById(listingId);

      if (!existingListing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        );
      }

      // Verify ownership
      if (
        existingListing.sellerId.toString() !== session.user.id &&
        session.user.role !== 'admin'
      ) {
        return NextResponse.json(
          { error: 'Not authorized to enhance this listing' },
          { status: 403 }
        );
      }

      // Use existing data if not provided
      inputTitle = title || existingListing.title;
      inputDescription = description || existingListing.description;
      inputCategory = category || existingListing.category;
      inputCondition = condition || existingListing.condition;
      inputSpecs = specifications || existingListing.specifications;
    }

    if (!inputTitle || !inputDescription) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Build context for OpenAI
    const specsText = inputSpecs?.length
      ? inputSpecs.map((s) => `${s.label}: ${s.value}`).join('\n')
      : '';

    const prompt = `You are an expert copywriter specializing in the rail industry and heavy equipment marketplace. 
    
Given the following listing information, generate:
1. An optimized, compelling title (max 100 characters)
2. A professional, detailed description (2-3 paragraphs)
3. 8-10 SEO keywords relevant to rail industry buyers
4. 5-8 tags for categorization

Current Information:
Title: ${inputTitle}
Category: ${inputCategory || 'Equipment'}
Condition: ${inputCondition || 'Not specified'}
Description: ${inputDescription}
${specsText ? `Specifications:\n${specsText}` : ''}

Requirements:
- Use professional rail industry terminology
- Highlight key selling points
- Include relevant technical details
- Make it compelling for industry buyers
- Avoid generic marketing phrases
- Be accurate and honest

Respond in JSON format:
{
  "enhancedTitle": "string",
  "enhancedDescription": "string",
  "seoKeywords": ["string"],
  "tags": ["string"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a professional copywriter for a B2B rail equipment marketplace. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const enhancement: EnhancementResult = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      enhancement,
      usage: completion.usage,
    });
  } catch (error) {
    console.error('AI enhancement error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI enhancement' },
      { status: 500 }
    );
  }
}

// PUT /api/ai/enhance - Apply AI enhancement to a listing
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { listingId, enhancedTitle, enhancedDescription, seoKeywords, tags } = body;

    if (!listingId || !Types.ObjectId.isValid(listingId)) {
      return NextResponse.json(
        { error: 'Valid listing ID is required' },
        { status: 400 }
      );
    }

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (
      listing.sellerId.toString() !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'Not authorized to update this listing' },
        { status: 403 }
      );
    }

    // Apply enhancements
    const updateData: Record<string, unknown> = {
      'premiumAddOns.aiEnhanced': true,
    };

    if (enhancedTitle) {
      updateData.title = enhancedTitle;
    }
    if (enhancedDescription) {
      updateData.description = enhancedDescription;
    }
    if (seoKeywords?.length) {
      updateData.seoKeywords = seoKeywords;
    }
    if (tags?.length) {
      const existingTags = listing.tags || [];
      updateData.tags = Array.from(new Set([...existingTags, ...tags]));
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      listingId,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      listing: {
        id: updatedListing?._id,
        title: updatedListing?.title,
        description: updatedListing?.description,
        tags: updatedListing?.tags,
        aiEnhanced: true,
      },
    });
  } catch (error) {
    console.error('Apply AI enhancement error:', error);
    return NextResponse.json(
      { error: 'Failed to apply enhancement' },
      { status: 500 }
    );
  }
}
