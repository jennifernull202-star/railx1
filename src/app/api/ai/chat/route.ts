/**
 * THE RAIL EXCHANGE™ — AI Chat Support API
 * 
 * Provides AI-powered responses to customer support questions.
 * Uses OpenAI GPT to answer questions about the platform.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful customer support assistant for The Rail Exchange™, an online marketplace for buying and selling railroad equipment, locomotives, and rolling stock. You also help connect buyers with verified railroad contractors.

Key information about The Rail Exchange:

MARKETPLACE:
- Buyers can browse and purchase railroad equipment including locomotives, railcars, track materials, and parts
- Sellers can list equipment with photos and detailed specifications
- All listings include seller contact information for direct negotiation

SELLER PLANS:
- Basic (Free): Up to 3 active listings, basic analytics
- Plus ($29/month): Up to 10 listings, full analytics, priority support
- Pro ($59/month): Unlimited listings, 24/7 support, homepage rotation

CONTRACTOR SERVICES:
- Free Listing: Basic contractor profile, appear in search
- Verified ($100/month): Verified badge, priority placement, lead generation, full analytics

ADD-ONS FOR LISTINGS:
- Featured ($49): 7-day homepage spotlight
- Premium ($99): 14-day enhanced visibility
- Elite ($199): 30-day top placement with marketing
- AI Enhancement ($19): AI-optimized description
- Spec Sheet ($39): Professional spec sheet generation

SUPPORT:
- Email: support@therailexchange.com
- Contact form available on the website
- Response time: Usually within 24 hours for email

Be helpful, professional, and concise. If you don't know something specific, suggest they contact support@therailexchange.com or use the contact form. Don't make up information about specific listings or prices that weren't provided.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // Limit conversation history to last 10 messages to manage context
    const recentMessages = messages.slice(-10);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...recentMessages,
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const assistantMessage = response.choices[0]?.message?.content || 
      "I apologize, but I couldn't generate a response. Please try again or contact support@therailexchange.com.";

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
