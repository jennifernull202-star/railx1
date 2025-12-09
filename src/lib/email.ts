/**
 * THE RAIL EXCHANGE™ — Email Service
 * 
 * Handles all email notifications using nodemailer.
 * Supports inquiry notifications, welcome emails, and more.
 */

import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@therailexchange.com';
const FROM_NAME = 'The Rail Exchange';
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Email templates
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function getEmailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Rail Exchange</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f5f7;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A1A2F 0%, #1a2f4f 100%); padding: 24px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 24px; font-weight: bold; color: #ffffff;">The Rail</span>
                    <span style="font-size: 24px; font-weight: bold; color: #FF6A1A; margin-left: 4px;">Exchange</span>
                    <span style="font-size: 12px; color: #FF6A1A; vertical-align: super;">™</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="color: #64748b; font-size: 12px; line-height: 1.5;">
                    <p style="margin: 0 0 8px 0;">This email was sent by The Rail Exchange™</p>
                    <p style="margin: 0;">
                      <a href="${BASE_URL}/dashboard/settings" style="color: #FF6A1A; text-decoration: none;">Manage email preferences</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Template generators
export function newInquiryEmail(data: {
  sellerName: string;
  buyerName: string;
  buyerEmail: string;
  listingTitle: string;
  listingUrl: string;
  message: string;
}): EmailTemplate {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #0A1A2F;">New Inquiry Received</h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #475569; line-height: 1.6;">
      Hi ${data.sellerName},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #475569; line-height: 1.6;">
      You've received a new inquiry about your listing:
    </p>
    
    <!-- Listing Card -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #0A1A2F;">${data.listingTitle}</p>
          <a href="${data.listingUrl}" style="color: #FF6A1A; text-decoration: none; font-size: 14px;">View Listing →</a>
        </td>
      </tr>
    </table>

    <!-- Buyer Info -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; background-color: #fff7ed; border-left: 4px solid #FF6A1A; border-radius: 0 8px 8px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #9a3412; font-weight: 600;">From: ${data.buyerName}</p>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #9a3412;">${data.buyerEmail}</p>
          <p style="margin: 0; font-size: 16px; color: #0A1A2F; line-height: 1.6;">"${data.message}"</p>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td>
          <a href="${BASE_URL}/dashboard/messages" style="display: inline-block; background-color: #FF6A1A; color: #ffffff; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
            Reply to Inquiry
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `New inquiry about "${data.listingTitle}"`,
    html: getEmailWrapper(content),
    text: `
New Inquiry Received

Hi ${data.sellerName},

You've received a new inquiry about your listing: ${data.listingTitle}

From: ${data.buyerName} (${data.buyerEmail})

Message:
"${data.message}"

Reply at: ${BASE_URL}/dashboard/messages

---
The Rail Exchange™
    `.trim(),
  };
}

export function inquiryReplyEmail(data: {
  recipientName: string;
  senderName: string;
  listingTitle: string;
  message: string;
}): EmailTemplate {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #0A1A2F;">New Reply</h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #475569; line-height: 1.6;">
      Hi ${data.recipientName},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #475569; line-height: 1.6;">
      ${data.senderName} replied to your inquiry about "${data.listingTitle}":
    </p>
    
    <!-- Message -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; background-color: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 16px; color: #0A1A2F; line-height: 1.6;">"${data.message}"</p>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td>
          <a href="${BASE_URL}/dashboard/messages" style="display: inline-block; background-color: #FF6A1A; color: #ffffff; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
            View Conversation
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `Reply from ${data.senderName} about "${data.listingTitle}"`,
    html: getEmailWrapper(content),
    text: `
New Reply

Hi ${data.recipientName},

${data.senderName} replied to your inquiry about "${data.listingTitle}":

"${data.message}"

View conversation at: ${BASE_URL}/dashboard/messages

---
The Rail Exchange™
    `.trim(),
  };
}

export function welcomeEmail(data: {
  name: string;
  email: string;
}): EmailTemplate {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #0A1A2F;">Welcome to The Rail Exchange!</h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #475569; line-height: 1.6;">
      Hi ${data.name},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #475569; line-height: 1.6;">
      Thank you for joining The Rail Exchange — the premier marketplace for rail industry equipment, materials, and services.
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #475569; line-height: 1.6;">
      Here's what you can do:
    </p>
    
    <ul style="margin: 0 0 24px 0; padding-left: 24px; color: #475569; font-size: 16px; line-height: 2;">
      <li>Browse thousands of rail equipment listings</li>
      <li>List your equipment for sale</li>
      <li>Connect with verified contractors</li>
      <li>Get instant inquiries from serious buyers</li>
    </ul>

    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td>
          <a href="${BASE_URL}/listings" style="display: inline-block; background-color: #FF6A1A; color: #ffffff; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
            Start Exploring
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: 'Welcome to The Rail Exchange!',
    html: getEmailWrapper(content),
    text: `
Welcome to The Rail Exchange!

Hi ${data.name},

Thank you for joining The Rail Exchange — the premier marketplace for rail industry equipment, materials, and services.

Here's what you can do:
- Browse thousands of rail equipment listings
- List your equipment for sale
- Connect with verified contractors
- Get instant inquiries from serious buyers

Start exploring at: ${BASE_URL}/listings

---
The Rail Exchange™
    `.trim(),
  };
}

// Send email function
export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<boolean> {
  // Skip in development if no SMTP configured
  if (!process.env.SMTP_USER) {
    console.log('[Email] SMTP not configured, skipping email to:', to);
    console.log('[Email] Subject:', template.subject);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    console.log('[Email] Sent to:', to);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

// Password reset email
export function passwordResetEmail(data: {
  name: string;
  resetUrl: string;
}): EmailTemplate {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #0A1A2F;">Reset Your Password</h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #475569; line-height: 1.6;">
      Hi ${data.name},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #475569; line-height: 1.6;">
      We received a request to reset your password. Click the button below to choose a new password:
    </p>
    
    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td>
          <a href="${data.resetUrl}" style="display: inline-block; background-color: #FF6A1A; color: #ffffff; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b; line-height: 1.6;">
      This link will expire in 1 hour for security reasons.
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b; line-height: 1.6;">
      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
    </p>
    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${data.resetUrl}" style="color: #FF6A1A; word-break: break-all;">${data.resetUrl}</a>
    </p>
  `;

  return {
    subject: 'Reset your password - The Rail Exchange',
    html: getEmailWrapper(content),
    text: `
Reset Your Password

Hi ${data.name},

We received a request to reset your password. Click the link below to choose a new password:

${data.resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

---
The Rail Exchange™
    `.trim(),
  };
}

// Send password reset email helper
export async function sendPasswordResetEmail(data: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<boolean> {
  const template = passwordResetEmail({ name: data.name, resetUrl: data.resetUrl });
  return sendEmail(data.to, template);
}
