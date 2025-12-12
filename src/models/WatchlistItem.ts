/**
 * THE RAIL EXCHANGE™ — Watchlist Model
 * 
 * Users can save listings to their watchlist for later viewing.
 * Tracks when items were added and supports notifications.
 * 
 * BUYER AUDIT UPGRADE: Enhanced price tracking, procurement workflow
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

// Procurement workflow status
export type ProcurementStatus = 'watching' | 'reviewing' | 'approved' | 'purchased' | 'archived';

export interface IWatchlistItem extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  listingId: Types.ObjectId;
  notes?: string;
  notifyOnPriceChange: boolean;
  notifyOnStatusChange: boolean;
  lastPrice?: number;
  
  // BUYER AUDIT: Enhanced tracking
  priceWhenAdded?: number;          // Original price when added to watchlist
  currentPriceDiff?: number;        // Price difference (positive = increase, negative = drop)
  priceDiffPercent?: number;        // Percentage difference
  hasNewPriceDrop?: boolean;        // Flag for unviewed price drops
  
  // BUYER AUDIT: Procurement workflow
  procurementStatus: ProcurementStatus;
  internalSku?: string;             // Buyer's internal reference
  purchaseOrderNumber?: string;     // PO number if purchased
  budgetCategory?: string;          // Internal budget tracking
  
  // BUYER AUDIT: Timestamps
  lastViewedAt?: Date;
  statusChangedAt?: Date;
  
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
    
    // BUYER AUDIT: Enhanced tracking
    priceWhenAdded: {
      type: Number,
    },
    currentPriceDiff: {
      type: Number,
      default: 0,
    },
    priceDiffPercent: {
      type: Number,
      default: 0,
    },
    hasNewPriceDrop: {
      type: Boolean,
      default: false,
    },
    
    // BUYER AUDIT: Procurement workflow
    procurementStatus: {
      type: String,
      enum: ['watching', 'reviewing', 'approved', 'purchased', 'archived'],
      default: 'watching',
      index: true,
    },
    internalSku: {
      type: String,
      maxlength: 100,
    },
    purchaseOrderNumber: {
      type: String,
      maxlength: 100,
    },
    budgetCategory: {
      type: String,
      maxlength: 100,
    },
    
    // BUYER AUDIT: Timestamps
    lastViewedAt: Date,
    statusChangedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for unique user-listing pairs
WatchlistItemSchema.index({ userId: 1, listingId: 1 }, { unique: true });

// Index for procurement workflow queries
WatchlistItemSchema.index({ userId: 1, procurementStatus: 1 });
WatchlistItemSchema.index({ userId: 1, hasNewPriceDrop: 1 });

export default mongoose.models.WatchlistItem ||
  mongoose.model<IWatchlistItem>('WatchlistItem', WatchlistItemSchema);
