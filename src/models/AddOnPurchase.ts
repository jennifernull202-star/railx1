/**
 * THE RAIL EXCHANGE™ — Add-On Purchase Model
 * 
 * Tracks all add-on purchases for listings and contractors.
 * 
 * IMPORTANT: All pricing, durations, and metadata are imported from /src/config/addons.ts
 * Do not hardcode any pricing here - use the config file as the single source of truth.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  ADD_ON_TYPES,
  ADD_ON_PRICING,
  ADD_ON_DURATION,
  ADD_ON_METADATA,
  type AddOnType,
} from '@/config/addons';

// Re-export from config for backwards compatibility
export { ADD_ON_TYPES, ADD_ON_PRICING, ADD_ON_DURATION, type AddOnType };

// Re-export descriptions in the old format for backwards compatibility
export const ADD_ON_DESCRIPTIONS = ADD_ON_METADATA;

export interface IAddOnPurchase extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  listingId?: Types.ObjectId;
  contractorId?: Types.ObjectId;
  type: AddOnType;
  amount: number;
  currency: string;
  stripePaymentId?: string;
  stripeSessionId?: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'refunded';
  startedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AddOnPurchaseSchema = new Schema<IAddOnPurchase>(
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
      index: true,
    },
    contractorId: {
      type: Schema.Types.ObjectId,
      ref: 'ContractorProfile',
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ADD_ON_TYPES),
      required: [true, 'Add-on type is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    stripePaymentId: {
      type: String,
      index: true,
    },
    stripeSessionId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    startedAt: Date,
    expiresAt: {
      type: Date,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
AddOnPurchaseSchema.index({ userId: 1, type: 1 });
AddOnPurchaseSchema.index({ listingId: 1, status: 1 });
AddOnPurchaseSchema.index({ contractorId: 1, status: 1 });
AddOnPurchaseSchema.index({ status: 1, expiresAt: 1 });

// Static method to check if a listing has an active add-on
AddOnPurchaseSchema.statics.hasActiveAddOn = async function(
  listingId: Types.ObjectId,
  type: AddOnType
): Promise<boolean> {
  const addOn = await this.findOne({
    listingId,
    type,
    status: 'active',
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null },
    ],
  });
  return !!addOn;
};

// Static method to get all active add-ons for a listing
AddOnPurchaseSchema.statics.getActiveAddOns = async function(
  listingId: Types.ObjectId
): Promise<AddOnType[]> {
  const addOns = await this.find({
    listingId,
    status: 'active',
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null },
    ],
  }).select('type');
  return addOns.map((a: IAddOnPurchase) => a.type);
};

// Pre-save: calculate expiration based on add-on type
AddOnPurchaseSchema.pre('save', function () {
  if (this.isNew && this.status === 'active' && !this.expiresAt) {
    const duration = ADD_ON_DURATION[this.type as AddOnType];
    if (duration) {
      this.startedAt = new Date();
      this.expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    }
  }
});

export default mongoose.models.AddOnPurchase ||
  mongoose.model<IAddOnPurchase>('AddOnPurchase', AddOnPurchaseSchema);
