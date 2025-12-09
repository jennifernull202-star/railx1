/**
 * THE RAIL EXCHANGE™ — Watchlist Model
 * 
 * Users can save listings to their watchlist for later viewing.
 * Tracks when items were added and supports notifications.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWatchlistItem extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  listingId: Types.ObjectId;
  notes?: string;
  notifyOnPriceChange: boolean;
  notifyOnStatusChange: boolean;
  lastPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const WatchlistItemSchema = new Schema<IWatchlistItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing ID is required'],
      index: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    notifyOnPriceChange: {
      type: Boolean,
      default: true,
    },
    notifyOnStatusChange: {
      type: Boolean,
      default: true,
    },
    lastPrice: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique user-listing pairs
WatchlistItemSchema.index({ userId: 1, listingId: 1 }, { unique: true });

export default mongoose.models.WatchlistItem ||
  mongoose.model<IWatchlistItem>('WatchlistItem', WatchlistItemSchema);
