/**
 * THE RAIL EXCHANGE™ — AI Image Analysis API
 * 
 * Uses OpenAI Vision to analyze listing images and extract:
 * - Equipment identification
 * - Condition assessment
 * - Suggested tags and keywords
 * - Specification extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

interface ImageAnalysisResult {
  equipmentType: string;
  condition: string;
  conditionNotes: string;
  suggestedTags: string[];
  suggestedKeywords: string[];
  extractedSpecs: Array<{
    label: string;
    value: string;
  }>;
  description: string;
}

// POST /api/ai/image-analysis - Analyze equipment image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'AI image analysis is not configured. Please set OPENAI_API_KEY.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { imageUrl, category } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert railroad equipment appraiser and analyst. 
Analyze the provided image of railroad equipment and extract detailed information.

Your response MUST be valid JSON with this exact structure:
{
  "equipmentType": "The type of equipment (e.g., 'Rail Grinder', 'Track Geometry Car', 'Ballast Regulator')",
  "condition": "One of: 'new', 'like-new', 'excellent', 'good', 'fair', 'poor', 'for-parts'",
  "conditionNotes": "Brief assessment of visible condition",
  "suggestedTags": ["array", "of", "relevant", "tags"],
  "suggestedKeywords": ["array", "of", "SEO", "keywords"],
  "extractedSpecs": [
    {"label": "Spec Name", "value": "Spec Value"}
  ],
  "description": "A professional description of the equipment suitable for a marketplace listing"
}

Focus on:
- Identifying the exact type and model of equipment if visible
- Assessing physical condition from visible wear, rust, damage
- Extracting any visible specifications, model numbers, or measurements
- Generating relevant tags for railroad industry search
- Creating SEO-friendly keywords
- Writing a compelling but accurate description`;

    const userPrompt = category
      ? `Analyze this railroad ${category} equipment image and provide detailed information in JSON format.`
      : `Analyze this railroad equipment image and provide detailed information in JSON format.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
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
      return NextResponse.json(
        { error: 'No analysis generated' },
        { status: 500 }
      );
    }

    let analysis: ImageAnalysisResult;
    try {
      analysis = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json(
        { error: 'Failed to parse analysis results' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis,
      usage: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      },
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    
    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.status === 400) {
        return NextResponse.json(
          { error: 'Invalid image or unsupported format.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
