/**
 * THE RAIL EXCHANGE™ — Saved Searches API
 * 
 * Manage user's saved search queries with notification preferences.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import SavedSearch from '@/models/SavedSearch';
import { Types } from 'mongoose';

// GET /api/savedsearches - Get user's saved searches
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searches = await SavedSearch.find({
      userId: session.user.id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      data: searches,
    });
  } catch (error) {
    console.error('Get saved searches error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved searches' },
      { status: 500 }
    );
  }
}

// POST /api/savedsearches - Create a saved search
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, query, filters, notifyOnMatch, notifyFrequency } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search name is required' },
        { status: 400 }
      );
    }

    // Check for duplicate names
    const existing = await SavedSearch.findOne({
      userId: session.user.id,
      name: name.trim(),
      isActive: true,
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A saved search with this name already exists' },
        { status: 409 }
      );
    }

    // Limit saved searches per user
    const count = await SavedSearch.countDocuments({
      userId: session.user.id,
      isActive: true,
    });

    if (count >= 20) {
      return NextResponse.json(
        { error: 'Maximum of 20 saved searches allowed' },
        { status: 400 }
      );
    }

    const savedSearch = new SavedSearch({
      userId: new Types.ObjectId(session.user.id),
      name: name.trim(),
      query: query || '',
      filters: filters || {},
      notifyOnMatch: notifyOnMatch !== false,
      notifyFrequency: notifyFrequency || 'daily',
    });

    await savedSearch.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Search saved successfully',
        data: savedSearch,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create saved search error:', error);
    return NextResponse.json(
      { error: 'Failed to save search' },
      { status: 500 }
    );
  }
}

// PUT /api/savedsearches - Update a saved search
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { id, name, notifyOnMatch, notifyFrequency, isActive } = body;

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Valid search ID is required' },
        { status: 400 }
      );
    }

    const savedSearch = await SavedSearch.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (name) savedSearch.name = name.trim();
    if (typeof notifyOnMatch === 'boolean') savedSearch.notifyOnMatch = notifyOnMatch;
    if (notifyFrequency) savedSearch.notifyFrequency = notifyFrequency;
    if (typeof isActive === 'boolean') savedSearch.isActive = isActive;

    await savedSearch.save();

    return NextResponse.json({
      success: true,
      message: 'Saved search updated',
      data: savedSearch,
    });
  } catch (error) {
    console.error('Update saved search error:', error);
    return NextResponse.json(
      { error: 'Failed to update saved search' },
      { status: 500 }
    );
  }
}

// DELETE /api/savedsearches - Delete a saved search
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Valid search ID is required' },
        { status: 400 }
      );
    }

    const result = await SavedSearch.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Saved search deleted',
    });
  } catch (error) {
    console.error('Delete saved search error:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved search' },
      { status: 500 }
    );
  }
}
