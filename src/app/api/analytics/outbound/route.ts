/**
 * THE RAIL EXCHANGE™ — Outbound Click Tracking API
 * 
 * POST /api/analytics/outbound
 * Tracks outbound clicks (phone, email, website) for analytics.
 * 
 * ANALYTICS REQUIREMENTS:
 * - Aggregate counts only (no PII stored)
 * - Server-side tracking (not client-side pixels)
 * - Used for Professional plan analytics dashboards
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

// Outbound click types
type ClickType = 'phone' | 'email' | 'website' | 'inquiry';

// Outbound Click schema (aggregate storage)
interface OutboundClickDocument {
  targetType: 'listing' | 'contractor' | 'seller';
  targetId: mongoose.Types.ObjectId;
  clickType: ClickType;
  date: Date; // Rounded to day for aggregation
  count: number;
}

// Create schema if not exists
const OutboundClickSchema = new mongoose.Schema<OutboundClickDocument>({
  targetType: {
    type: String,
    enum: ['listing', 'contractor', 'seller'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  clickType: {
    type: String,
    enum: ['phone', 'email', 'website', 'inquiry'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  count: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: false, // We manage date manually for aggregation
});

// Compound index for efficient aggregation
OutboundClickSchema.index({ targetType: 1, targetId: 1, clickType: 1, date: 1 }, { unique: true });

const OutboundClick = mongoose.models.OutboundClick || 
  mongoose.model<OutboundClickDocument>('OutboundClick', OutboundClickSchema);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetType, targetId, clickType } = body;

    // Validate required fields
    if (!targetType || !targetId || !clickType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate enums
    if (!['listing', 'contractor', 'seller'].includes(targetType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid target type' },
        { status: 400 }
      );
    }

    if (!['phone', 'email', 'website', 'inquiry'].includes(clickType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid click type' },
        { status: 400 }
      );
    }

    await connectDB();

    // Round to start of day for aggregation (no PII - just daily counts)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert: increment count for this target/type/day combo
    await OutboundClick.findOneAndUpdate(
      {
        targetType,
        targetId: new mongoose.Types.ObjectId(targetId),
        clickType,
        date: today,
      },
      {
        $inc: { count: 1 },
      },
      {
        upsert: true,
        new: true,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Outbound click tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track click' },
      { status: 500 }
    );
  }
}

// GET endpoint for fetching aggregate stats (for analytics dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    const days = parseInt(searchParams.get('days') || '30', 10);

    if (!targetType || !targetId) {
      return NextResponse.json(
        { success: false, error: 'Missing targetType or targetId' },
        { status: 400 }
      );
    }

    await connectDB();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Aggregate clicks by type
    const stats = await OutboundClick.aggregate([
      {
        $match: {
          targetType,
          targetId: new mongoose.Types.ObjectId(targetId),
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$clickType',
          total: { $sum: '$count' },
        },
      },
    ]);

    // Format response
    const result = {
      phone: 0,
      email: 0,
      website: 0,
      inquiry: 0,
    };

    for (const stat of stats) {
      result[stat._id as ClickType] = stat.total;
    }

    return NextResponse.json({
      success: true,
      data: result,
      period: `${days} days`,
    });
  } catch (error) {
    console.error('Outbound stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
