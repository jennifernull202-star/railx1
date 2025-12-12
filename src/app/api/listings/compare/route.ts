/**
 * THE RAIL EXCHANGE™ — Compare Listings API
 * 
 * BUYER AUDIT IMPLEMENTATION: Side-by-side listing comparison
 * 
 * GET /api/listings/compare?ids=id1,id2,id3,id4
 * Returns up to 4 listings with full details for comparison
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Listing from '@/models/Listing';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Listing IDs required' },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',').slice(0, 4); // Max 4 listings

    if (ids.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 listing IDs required for comparison' },
        { status: 400 }
      );
    }

    const listings = await Listing.find({
      _id: { $in: ids },
      isActive: true,
    })
      .populate('sellerId', 'name isVerifiedSeller trustSignals createdAt company')
      .lean();

    if (listings.length < 2) {
      return NextResponse.json(
        { error: 'Could not find enough valid listings to compare' },
        { status: 404 }
      );
    }

    // Structure comparison data
    const comparisonFields = [
      // Basic info
      { key: 'title', label: 'Title', group: 'basic' },
      { key: 'category', label: 'Category', group: 'basic' },
      { key: 'condition', label: 'Condition', group: 'basic' },
      { key: 'price.amount', label: 'Price', group: 'basic', format: 'currency' },
      { key: 'quantity', label: 'Quantity', group: 'basic' },
      { key: 'location.city', label: 'City', group: 'location' },
      { key: 'location.state', label: 'State', group: 'location' },
      
      // Equipment data
      { key: 'equipment.reportingMarks', label: 'Reporting Marks', group: 'equipment' },
      { key: 'equipment.manufacturer', label: 'Manufacturer', group: 'equipment' },
      { key: 'equipment.model', label: 'Model', group: 'equipment' },
      { key: 'equipment.yearBuilt', label: 'Year Built', group: 'equipment' },
      { key: 'equipment.yearRebuilt', label: 'Year Rebuilt', group: 'equipment' },
      { key: 'equipment.horsepower', label: 'Horsepower', group: 'locomotive' },
      { key: 'equipment.engineHours', label: 'Engine Hours', group: 'locomotive' },
      { key: 'equipment.mileage', label: 'Mileage', group: 'locomotive' },
      { key: 'equipment.tractionMotors', label: 'Traction Motors', group: 'locomotive' },
      { key: 'equipment.trucks', label: 'Trucks', group: 'locomotive' },
      { key: 'equipment.fuelCapacity', label: 'Fuel Capacity (gal)', group: 'locomotive' },
      { key: 'equipment.dynamicBrakes', label: 'Dynamic Brakes', group: 'locomotive', format: 'boolean' },
      { key: 'equipment.multipleUnitCapable', label: 'MU Capable', group: 'locomotive', format: 'boolean' },
      
      // Freight car
      { key: 'equipment.aarCarType', label: 'AAR Car Type', group: 'freight' },
      { key: 'equipment.loadLimit', label: 'Load Limit (lbs)', group: 'freight' },
      { key: 'equipment.lightWeight', label: 'Light Weight (lbs)', group: 'freight' },
      { key: 'equipment.insideLength', label: 'Inside Length (ft)', group: 'freight' },
      { key: 'equipment.insideWidth', label: 'Inside Width (ft)', group: 'freight' },
      { key: 'equipment.insideHeight', label: 'Inside Height (ft)', group: 'freight' },
      { key: 'equipment.cubicCapacity', label: 'Cubic Capacity (cu ft)', group: 'freight' },
      { key: 'equipment.tankCapacity', label: 'Tank Capacity (gal)', group: 'freight' },
      
      // Compliance
      { key: 'equipment.fraCompliant', label: 'FRA Compliant', group: 'compliance', format: 'boolean' },
      { key: 'equipment.fraClass', label: 'FRA Class', group: 'compliance' },
      { key: 'equipment.lastFraInspection', label: 'Last FRA Inspection', group: 'compliance', format: 'date' },
      { key: 'equipment.lastServiceDate', label: 'Last Service Date', group: 'compliance', format: 'date' },
      { key: 'equipment.availability', label: 'Availability', group: 'status' },
      
      // Seller
      { key: 'sellerType', label: 'Seller Type', group: 'seller' },
    ];

    // Helper to get nested value
    const getValue = (obj: Record<string, unknown>, path: string): unknown => {
      return path.split('.').reduce((acc: unknown, part: string) => {
        if (acc && typeof acc === 'object' && part in acc) {
          return (acc as Record<string, unknown>)[part];
        }
        return undefined;
      }, obj);
    };

    // Build comparison matrix
    const comparisonMatrix = comparisonFields.map(field => {
      const values = listings.map(listing => {
        const value = getValue(listing as unknown as Record<string, unknown>, field.key);
        return {
          raw: value,
          formatted: formatValue(value, field.format),
        };
      });

      // Check if values differ
      const uniqueValues = new Set(values.map(v => String(v.raw)));
      const hasDifference = uniqueValues.size > 1;

      return {
        ...field,
        values,
        hasDifference,
      };
    });

    // Group comparison data
    const groups = {
      basic: comparisonMatrix.filter(f => f.group === 'basic'),
      location: comparisonMatrix.filter(f => f.group === 'location'),
      equipment: comparisonMatrix.filter(f => f.group === 'equipment'),
      locomotive: comparisonMatrix.filter(f => f.group === 'locomotive'),
      freight: comparisonMatrix.filter(f => f.group === 'freight'),
      compliance: comparisonMatrix.filter(f => f.group === 'compliance'),
      status: comparisonMatrix.filter(f => f.group === 'status'),
      seller: comparisonMatrix.filter(f => f.group === 'seller'),
    };

    return NextResponse.json({
      success: true,
      data: {
        listings: listings.map(l => ({
          _id: l._id,
          title: l.title,
          slug: l.slug,
          primaryImageUrl: l.primaryImageUrl,
          price: l.price,
          seller: l.sellerId,
        })),
        comparison: groups,
        totalDifferences: comparisonMatrix.filter(f => f.hasDifference).length,
      },
    });
  } catch (error) {
    console.error('Compare listings error:', error);
    return NextResponse.json(
      { error: 'Failed to compare listings' },
      { status: 500 }
    );
  }
}

function formatValue(value: unknown, format?: string): string {
  if (value === undefined || value === null) {
    return '—';
  }

  switch (format) {
    case 'currency':
      return typeof value === 'number' 
        ? `$${value.toLocaleString()}` 
        : String(value);
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'date':
      return value instanceof Date 
        ? value.toLocaleDateString() 
        : typeof value === 'string'
          ? new Date(value).toLocaleDateString()
          : String(value);
    default:
      return String(value);
  }
}
