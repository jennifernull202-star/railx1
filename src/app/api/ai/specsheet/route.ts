/**
 * THE RAIL EXCHANGE™ — Spec Sheet Generator API
 * 
 * Generates professional PDF specification sheets for equipment listings.
 * Uses pdf-lib for PDF creation with The Rail Exchange branding.
 * Uploads generated PDFs to S3 for persistent storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Listing from '@/models/Listing';
import { Types } from 'mongoose';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// S3 client initialization
const getS3Client = () => {
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
};

const BUCKET_NAME = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME || 'railexchange-uploads';

// Brand colors
const NAVY = rgb(10 / 255, 26 / 255, 47 / 255); // #0A1A2F
const ORANGE = rgb(255 / 255, 106 / 255, 26 / 255); // #FF6A1A
const GRAY = rgb(100 / 255, 116 / 255, 139 / 255); // #64748B
const LIGHT_GRAY = rgb(241 / 255, 245 / 255, 249 / 255); // #F1F5F9

interface ListingForSpec {
  _id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: {
    type: string;
    amount?: number;
    currency: string;
  };
  location: {
    city: string;
    state: string;
    country: string;
  };
  specifications: Array<{
    label: string;
    value: string;
    unit?: string;
  }>;
  quantity: number;
  quantityUnit?: string;
  media: Array<{
    url: string;
    type: string;
  }>;
  sellerId: {
    name: string;
    email: string;
  };
  createdAt: Date;
}

function formatPrice(price: ListingForSpec['price']): string {
  if (price.type === 'contact') return 'Contact for Price';
  if (price.type === 'rfq') return 'Request for Quote';
  if (!price.amount) return 'Price on Request';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price.amount);
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const avgCharWidth = fontSize * 0.5; // Approximate character width

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = testLine.length * avgCharWidth;

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// POST /api/ai/specsheet - Generate spec sheet PDF for a listing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingId } = body;

    if (!listingId || !Types.ObjectId.isValid(listingId)) {
      return NextResponse.json(
        { error: 'Valid listing ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const listing = await Listing.findById(listingId)
      .populate('sellerId', 'name email')
      .lean() as ListingForSpec | null;

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size

    // Embed fonts
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { width, height } = page.getSize();
    let y = height - 50;

    // Header with brand colors
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width: width,
      height: 80,
      color: NAVY,
    });

    // Brand name in header
    page.drawText('The Rail', {
      x: 50,
      y: height - 45,
      size: 20,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    page.drawText('Exchange™', {
      x: 138,
      y: height - 45,
      size: 20,
      font: helveticaBold,
      color: ORANGE,
    });

    // Subtitle
    page.drawText('EQUIPMENT SPECIFICATION SHEET', {
      x: 50,
      y: height - 65,
      size: 10,
      font: helvetica,
      color: rgb(1, 1, 1),
    });

    // Generated date
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    page.drawText(`Generated: ${dateStr}`, {
      x: width - 180,
      y: height - 65,
      size: 9,
      font: helvetica,
      color: rgb(0.8, 0.8, 0.8),
    });

    y = height - 110;

    // Title section
    page.drawText(listing.title, {
      x: 50,
      y,
      size: 18,
      font: helveticaBold,
      color: NAVY,
      maxWidth: width - 100,
    });

    y -= 30;

    // Category and condition badges
    page.drawText(`${listing.category.toUpperCase()} • ${listing.condition.toUpperCase()}`, {
      x: 50,
      y,
      size: 10,
      font: helvetica,
      color: GRAY,
    });

    y -= 30;

    // Price box
    page.drawRectangle({
      x: 50,
      y: y - 25,
      width: 200,
      height: 35,
      color: LIGHT_GRAY,
      borderColor: ORANGE,
      borderWidth: 2,
    });

    page.drawText(formatPrice(listing.price), {
      x: 60,
      y: y - 15,
      size: 16,
      font: helveticaBold,
      color: NAVY,
    });

    // Quantity on same line
    if (listing.quantity > 1) {
      page.drawText(`Qty: ${listing.quantity} ${listing.quantityUnit || 'units'}`, {
        x: 270,
        y: y - 12,
        size: 11,
        font: helvetica,
        color: GRAY,
      });
    }

    y -= 60;

    // Location
    const locationStr = `${listing.location.city}, ${listing.location.state}, ${listing.location.country}`;
    page.drawText('Location:', {
      x: 50,
      y,
      size: 10,
      font: helveticaBold,
      color: NAVY,
    });
    page.drawText(locationStr, {
      x: 105,
      y,
      size: 10,
      font: helvetica,
      color: GRAY,
    });

    y -= 25;

    // Divider line
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: LIGHT_GRAY,
    });

    y -= 20;

    // Description section
    page.drawText('DESCRIPTION', {
      x: 50,
      y,
      size: 11,
      font: helveticaBold,
      color: NAVY,
    });

    y -= 18;

    // Wrap and draw description
    const descLines = wrapText(listing.description, width - 100, 10);
    const maxDescLines = 8; // Limit to prevent overflow
    for (let i = 0; i < Math.min(descLines.length, maxDescLines); i++) {
      page.drawText(descLines[i], {
        x: 50,
        y,
        size: 10,
        font: helvetica,
        color: GRAY,
      });
      y -= 14;
    }
    if (descLines.length > maxDescLines) {
      page.drawText('...', {
        x: 50,
        y,
        size: 10,
        font: helvetica,
        color: GRAY,
      });
      y -= 14;
    }

    y -= 15;

    // Specifications section
    if (listing.specifications && listing.specifications.length > 0) {
      // Divider
      page.drawLine({
        start: { x: 50, y },
        end: { x: width - 50, y },
        thickness: 1,
        color: LIGHT_GRAY,
      });

      y -= 20;

      page.drawText('SPECIFICATIONS', {
        x: 50,
        y,
        size: 11,
        font: helveticaBold,
        color: NAVY,
      });

      y -= 18;

      // Draw specs in two columns
      const colWidth = (width - 120) / 2;
      let col = 0;
      const startY = y;

      for (let i = 0; i < listing.specifications.length; i++) {
        const spec = listing.specifications[i];
        const x = 50 + col * (colWidth + 20);
        const specY = startY - Math.floor(i / 2) * 20;

        if (specY < 150) break; // Leave room for footer

        // Spec label
        page.drawText(`${spec.label}:`, {
          x,
          y: specY,
          size: 9,
          font: helveticaBold,
          color: NAVY,
        });

        // Spec value
        const valueText = spec.unit ? `${spec.value} ${spec.unit}` : spec.value;
        page.drawText(valueText, {
          x: x + 100,
          y: specY,
          size: 9,
          font: helvetica,
          color: GRAY,
        });

        col = (col + 1) % 2;
      }

      y = startY - Math.ceil(listing.specifications.length / 2) * 20 - 10;
    }

    // Footer
    const footerY = 50;

    page.drawLine({
      start: { x: 50, y: footerY + 30 },
      end: { x: width - 50, y: footerY + 30 },
      thickness: 1,
      color: LIGHT_GRAY,
    });

    // Seller info
    page.drawText('Contact Seller:', {
      x: 50,
      y: footerY + 10,
      size: 9,
      font: helveticaBold,
      color: NAVY,
    });

    page.drawText(listing.sellerId.name, {
      x: 130,
      y: footerY + 10,
      size: 9,
      font: helvetica,
      color: GRAY,
    });

    // Website
    page.drawText('therailexchange.com', {
      x: width - 130,
      y: footerY + 10,
      size: 9,
      font: helvetica,
      color: ORANGE,
    });

    // Disclaimer
    page.drawText(
      'This specification sheet is provided for informational purposes only. Verify all details with seller.',
      {
        x: 50,
        y: footerY - 10,
        size: 7,
        font: helvetica,
        color: rgb(0.6, 0.6, 0.6),
      }
    );

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    // Upload to S3
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const key = `spec-sheets/${listing._id}-${timestamp}-${randomId}.pdf`;
    
    try {
      const s3Client = getS3Client();
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: Buffer.from(pdfBytes),
        ContentType: 'application/pdf',
        ContentDisposition: `attachment; filename="spec-sheet-${listing._id}.pdf"`,
      }));
      
      // Construct the public URL
      const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com/${key}`;
      
      // Update listing with spec sheet info and URL
      await Listing.findByIdAndUpdate(listingId, {
        $set: {
          'premiumAddOns.specSheet': {
            generated: true,
            generatedAt: new Date(),
            url: s3Url,
          },
        },
      });

      return NextResponse.json({
        success: true,
        url: s3Url,
        filename: `spec-sheet-${listing._id}.pdf`,
        message: 'Spec sheet generated and uploaded successfully',
      });
    } catch (s3Error) {
      console.error('S3 upload error:', s3Error);
      
      // Fallback: return as base64 if S3 upload fails
      const base64Pdf = Buffer.from(pdfBytes).toString('base64');
      
      // Still mark as generated, but without URL
      await Listing.findByIdAndUpdate(listingId, {
        $set: {
          'premiumAddOns.specSheet': {
            generated: true,
            generatedAt: new Date(),
          },
        },
      });

      return NextResponse.json({
        success: true,
        pdf: base64Pdf,
        filename: `spec-sheet-${listing._id}.pdf`,
        message: 'Spec sheet generated (S3 upload unavailable)',
      });
    }
  } catch (error) {
    console.error('Spec sheet generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate spec sheet' },
      { status: 500 }
    );
  }
}
