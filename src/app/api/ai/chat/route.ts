/**
 * THE RAIL EXCHANGE™ — AI Chat Support API
 * 
 * Provides AI-powered responses to customer support questions.
 * Uses OpenAI GPT to answer questions about the platform.
 * Includes escalation to human support via email.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { sendEmail } from '@/lib/email';

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

SUBSCRIPTION MANAGEMENT:
- To cancel a subscription, users should go to Dashboard > Settings > Billing, or use this link: /dashboard/billing
- Users can manage their subscription, update payment methods, and cancel anytime through the billing portal
- Cancellations take effect at the end of the current billing period
- If someone wants to cancel, provide them the link and explain they can do it themselves, or offer to escalate to human support

SUPPORT:
- Email: support@therailexchange.com
- Contact form available on the website
- Response time: Usually within 24 hours for email

ESCALATION:
- If a user asks to speak to a human, wants to report a serious issue, or you cannot help them, tell them you will escalate to human support
- Serious issues include: billing disputes, account problems, harassment reports, or anything requiring human judgment

Be helpful, professional, and concise. If you don't know something specific, suggest they contact support@therailexchange.com or use the contact form. Don't make up information about specific listings or prices that weren't provided.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Check if the conversation needs human escalation
function needsEscalation(messages: ChatMessage[]): boolean {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content.toLowerCase() || '';
  
  const escalationTriggers = [
    'speak to human',
    'talk to human',
    'real person',
    'human support',
    'talk to someone',
    'speak to someone',
    'human agent',
    'customer service',
    'supervisor',
    'manager',
    'escalate',
    'complaint',
    'sue',
    'lawyer',
    'legal',
    'refund',
    'billing issue',
    'charged incorrectly',
    'unauthorized charge',
    'harassment',
    'report user',
    'scam',
    'fraud',
  ];
  
  return escalationTriggers.some(trigger => lastUserMessage.includes(trigger));
}

// Send escalation email to support
async function sendEscalationEmail(messages: ChatMessage[], reason: string) {
  const transcript = messages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');
  
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@therailexchange.com';
  
  try {
    await sendEmail(supportEmail, {
      subject: `[ESCALATION] AI Chat Support Request`,
      text: `A user has requested human support or reported an issue that requires attention.

ESCALATION REASON: ${reason}

CHAT TRANSCRIPT:
================
${transcript}
================

Please follow up with this user as soon as possible.

Sent automatically from The Rail Exchange AI Support System`,
      html: `
        <h2 style="color: #0A1A2F; margin-bottom: 16px;">AI Chat Escalation</h2>
        <p style="color: #475569;"><strong>Reason:</strong> ${reason}</p>
        <h3 style="color: #0A1A2F; margin-top: 24px;">Chat Transcript:</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; font-size: 13px; color: #333;">
${transcript}
        </div>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Sent automatically from The Rail Exchange AI Support System
        </p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send escalation email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, escalate } = body as { messages: ChatMessage[]; escalate?: boolean };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // Check if user explicitly requested escalation or if auto-escalation is needed
    const shouldEscalate = escalate || needsEscalation(messages);
    
    if (shouldEscalate) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || 'User requested support';
      const escalationSent = await sendEscalationEmail(messages, lastUserMessage.substring(0, 100));
      
      if (escalationSent) {
        return NextResponse.json({ 
          message: "I've escalated your request to our human support team. They will review your conversation and get back to you within 24 hours at the email associated with your account. Is there anything else I can help you with in the meantime?",
          escalated: true 
        });
      }
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
