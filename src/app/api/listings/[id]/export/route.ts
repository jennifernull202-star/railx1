/**
 * THE RAIL EXCHANGE™ — Listing Export API
 * 
 * BUYER AUDIT IMPLEMENTATION: Export listing as PDF/JSON for procurement review
 * 
 * GET /api/listings/[id]/export?format=pdf|json
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Listing from '@/models/Listing';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const listing = await Listing.findById(id)
      .populate('sellerId', 'name email company phone isVerifiedSeller trustSignals createdAt')
      .lean();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Build export data structure
    const exportData = {
      exportedAt: new Date().toISOString(),
      source: 'The Rail Exchange™',
      sourceUrl: `https://www.therailexchange.com/listings/${listing.slug}`,
      
      listing: {
        id: listing._id,
        title: listing.title,
        category: listing.category,
        subcategory: listing.subcategory,
        condition: listing.condition,
        status: listing.status,
        
        pricing: {
          type: listing.price.type,
          amount: listing.price.amount,
          currency: listing.price.currency,
          pricePerUnit: listing.price.pricePerUnit,
        },
        
        location: {
          city: listing.location.city,
          state: listing.location.state,
          country: listing.location.country,
          zipCode: listing.location.zipCode,
        },
        
        quantity: listing.quantity,
        quantityUnit: listing.quantityUnit,
        
        // Equipment data (structured)
        equipment: listing.equipment || {},
        
        // Legacy specifications
        specifications: listing.specifications || [],
        
        description: listing.description,
        
        // Media
        images: listing.media?.filter(m => m.type === 'image').map(m => m.url) || [],
        documents: listing.media?.filter(m => m.type === 'document').map(m => ({
          url: m.url,
          caption: m.caption,
        })) || [],
        
        // Shipping
        shipping: {
          localPickup: listing.shippingOptions?.localPickup,
          sellerShips: listing.shippingOptions?.sellerShips,
          buyerArranges: listing.shippingOptions?.buyerArranges,
          estimatedWeight: listing.shippingOptions?.estimatedWeight,
          dimensions: listing.shippingOptions?.dimensions,
        },
        
        // Stats
        daysOnMarket: listing.daysOnMarket,
        viewCount: listing.viewCount,
        publishedAt: listing.publishedAt,
        
        // Seller info
        seller: {
          name: (listing.sellerId as { name?: string })?.name,
          company: (listing.sellerId as { company?: string })?.company,
          type: listing.sellerType,
          isVerified: (listing.sellerId as { isVerifiedSeller?: boolean })?.isVerifiedSeller,
          memberSince: (listing.sellerId as { createdAt?: Date })?.createdAt,
        },
      },
    };

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: exportData,
      });
    }

    // For PDF format, return HTML that can be printed to PDF
    // (Client-side will handle actual PDF generation)
    if (format === 'pdf') {
      const html = generatePDFHtml(exportData);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="${listing.slug}-export.html"`,
        },
      });
    }

    // CSV format for spreadsheet import
    if (format === 'csv') {
      const csv = generateCSV(exportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${listing.slug}-export.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Export listing error:', error);
    return NextResponse.json(
      { error: 'Failed to export listing' },
      { status: 500 }
    );
  }
}

function generatePDFHtml(data: Record<string, unknown>): string {
  const listing = data.listing as Record<string, unknown>;
  const equipment = listing.equipment as Record<string, unknown> || {};
  const pricing = listing.pricing as Record<string, unknown>;
  const location = listing.location as Record<string, unknown>;
  const seller = listing.seller as Record<string, unknown>;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${listing.title} - The Rail Exchange™</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #0A1A2F; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #0A1A2F; }
    .logo span { color: #FF6A1A; }
    .export-date { color: #6b7280; font-size: 12px; }
    h1 { font-size: 28px; color: #0A1A2F; margin-bottom: 20px; }
    .badges { display: flex; gap: 10px; margin-bottom: 20px; }
    .badge { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-category { background: #e0e7ff; color: #4338ca; }
    .badge-condition { background: #d1fae5; color: #065f46; }
    .badge-verified { background: #dbeafe; color: #1d4ed8; }
    .price { font-size: 32px; font-weight: bold; color: #059669; margin-bottom: 20px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: 600; color: #0A1A2F; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .field { }
    .field-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { font-size: 14px; color: #1a1a2e; font-weight: 500; }
    .description { white-space: pre-wrap; color: #374151; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">The Rail <span>Exchange</span>™</div>
    <div class="export-date">Exported: ${new Date().toLocaleString()}</div>
  </div>
  
  <h1>${listing.title}</h1>
  
  <div class="badges">
    <span class="badge badge-category">${listing.category}</span>
    <span class="badge badge-condition">${listing.condition}</span>
    ${seller.isVerified ? '<span class="badge badge-verified">✓ Verified Seller</span>' : ''}
  </div>
  
  <div class="price">
    ${pricing.amount ? `$${Number(pricing.amount).toLocaleString()}` : 'Contact for Price'}
    ${pricing.pricePerUnit ? `<span style="font-size: 16px; color: #6b7280;"> ${pricing.pricePerUnit}</span>` : ''}
  </div>
  
  <div class="section">
    <div class="section-title">Equipment Details</div>
    <div class="grid">
      ${equipment.reportingMarks ? `<div class="field"><div class="field-label">Reporting Marks</div><div class="field-value">${equipment.reportingMarks}</div></div>` : ''}
      ${equipment.manufacturer ? `<div class="field"><div class="field-label">Manufacturer</div><div class="field-value">${equipment.manufacturer}</div></div>` : ''}
      ${equipment.model ? `<div class="field"><div class="field-label">Model</div><div class="field-value">${equipment.model}</div></div>` : ''}
      ${equipment.yearBuilt ? `<div class="field"><div class="field-label">Year Built</div><div class="field-value">${equipment.yearBuilt}</div></div>` : ''}
      ${equipment.yearRebuilt ? `<div class="field"><div class="field-label">Year Rebuilt</div><div class="field-value">${equipment.yearRebuilt}</div></div>` : ''}
      ${equipment.horsepower ? `<div class="field"><div class="field-label">Horsepower</div><div class="field-value">${Number(equipment.horsepower).toLocaleString()} HP</div></div>` : ''}
      ${equipment.engineHours ? `<div class="field"><div class="field-label">Engine Hours</div><div class="field-value">${Number(equipment.engineHours).toLocaleString()}</div></div>` : ''}
      ${equipment.mileage ? `<div class="field"><div class="field-label">Mileage</div><div class="field-value">${Number(equipment.mileage).toLocaleString()}</div></div>` : ''}
      ${equipment.fraCompliant ? `<div class="field"><div class="field-label">FRA Compliant</div><div class="field-value">${equipment.fraCompliant ? 'Yes' : 'No'}</div></div>` : ''}
      ${equipment.aarCarType ? `<div class="field"><div class="field-label">AAR Car Type</div><div class="field-value">${equipment.aarCarType}</div></div>` : ''}
      ${equipment.availability ? `<div class="field"><div class="field-label">Availability</div><div class="field-value">${equipment.availability}</div></div>` : ''}
      <div class="field"><div class="field-label">Quantity</div><div class="field-value">${listing.quantity}${listing.quantityUnit ? ` ${listing.quantityUnit}` : ''}</div></div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Location</div>
    <div class="grid">
      <div class="field"><div class="field-label">City</div><div class="field-value">${location.city}</div></div>
      <div class="field"><div class="field-label">State</div><div class="field-value">${location.state}</div></div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Seller Information</div>
    <div class="grid">
      <div class="field"><div class="field-label">Name</div><div class="field-value">${seller.name || 'N/A'}</div></div>
      <div class="field"><div class="field-label">Company</div><div class="field-value">${seller.company || 'N/A'}</div></div>
      <div class="field"><div class="field-label">Type</div><div class="field-value">${listing.sellerType}</div></div>
      <div class="field"><div class="field-label">Verified</div><div class="field-value">${seller.isVerified ? 'Yes' : 'No'}</div></div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Description</div>
    <div class="description">${listing.description}</div>
  </div>
  
  <div class="footer">
    <p>This document was generated from The Rail Exchange™</p>
    <p>${data.sourceUrl}</p>
  </div>
</body>
</html>
  `;
}

function generateCSV(data: Record<string, unknown>): string {
  const listing = data.listing as Record<string, unknown>;
  const equipment = listing.equipment as Record<string, unknown> || {};
  const pricing = listing.pricing as Record<string, unknown>;
  const location = listing.location as Record<string, unknown>;
  const seller = listing.seller as Record<string, unknown>;
  
  const rows = [
    ['Field', 'Value'],
    ['Title', String(listing.title || '')],
    ['Category', String(listing.category || '')],
    ['Condition', String(listing.condition || '')],
    ['Price', pricing.amount ? `$${pricing.amount}` : 'Contact'],
    ['Quantity', String(listing.quantity || '')],
    ['City', String(location.city || '')],
    ['State', String(location.state || '')],
    ['Reporting Marks', String(equipment.reportingMarks || '')],
    ['Manufacturer', String(equipment.manufacturer || '')],
    ['Model', String(equipment.model || '')],
    ['Year Built', String(equipment.yearBuilt || '')],
    ['Horsepower', String(equipment.horsepower || '')],
    ['Engine Hours', String(equipment.engineHours || '')],
    ['Mileage', String(equipment.mileage || '')],
    ['FRA Compliant', equipment.fraCompliant ? 'Yes' : 'No'],
    ['AAR Car Type', String(equipment.aarCarType || '')],
    ['Availability', String(equipment.availability || '')],
    ['Seller Name', String(seller.name || '')],
    ['Seller Company', String(seller.company || '')],
    ['Seller Verified', seller.isVerified ? 'Yes' : 'No'],
    ['Days on Market', String(listing.daysOnMarket || '')],
    ['Source URL', String(data.sourceUrl || '')],
  ];
  
  return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}
