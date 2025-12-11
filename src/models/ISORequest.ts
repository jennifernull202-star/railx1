/**
 * THE RAIL EXCHANGE™ — ISO (In Search Of) Request Model
 * 
 * Lightweight "wanted" posts for users looking for:
 * - Equipment, Tools, Railcars, Materials, Locomotives
 * - Contractors, Services
 * 
 * Available for ALL membership tiers (free feature).
 * No images, no add-ons, no ranking logic.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { 
  ISO_CATEGORIES, 
  ISO_STATUS_VALUES, 
  ISO_CATEGORY_LABELS,
  type ISOCategory, 
  type ISOStatus 
} from '@/lib/iso-constants';

// Re-export for convenience
export { ISO_CATEGORY_LABELS, type ISOCategory, type ISOStatus };

// ============================================
// TYPES
// ============================================

export interface IISORequest {
  userId: Types.ObjectId;
  title: string;
  category: ISOCategory;
  description: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  budget?: {
    min?: number;
    max?: number;
    currency: string;
    type: 'fixed' | 'range' | 'negotiable';
  };
  neededBy?: Date;
  allowMessaging: boolean;
  status: ISOStatus;
  responseCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IISORequestDocument extends IISORequest, Document {}

export interface IISORequestModel extends Model<IISORequestDocument> {
  findActiveRequests(limit?: number): Promise<IISORequestDocument[]>;
  findByUser(userId: string | Types.ObjectId): Promise<IISORequestDocument[]>;
  findByCategory(category: ISOCategory): Promise<IISORequestDocument[]>;
}

// ============================================
// SCHEMA
// ============================================

const ISORequestSchema = new Schema<IISORequestDocument, IISORequestModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    category: {
      type: String,
      enum: {
        values: ISO_CATEGORIES,
        message: 'Invalid category',
      },
      required: [true, 'Category is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: 'USA' },
    },
    budget: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: 'USD' },
      type: { 
        type: String, 
        enum: ['fixed', 'range', 'negotiable'],
        default: 'negotiable',
      },
    },
    neededBy: {
      type: Date,
      default: null,
    },
    allowMessaging: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: {
        values: ISO_STATUS_VALUES,
        message: 'Invalid status',
      },
      default: 'active',
      index: true,
    },
    responseCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ============================================
// INDEXES
// ============================================

ISORequestSchema.index({ status: 1, createdAt: -1 });
ISORequestSchema.index({ category: 1, status: 1 });
ISORequestSchema.index({ userId: 1, status: 1 });

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find all active ISO requests
 */
ISORequestSchema.statics.findActiveRequests = async function (
  limit = 50
): Promise<IISORequestDocument[]> {
  return this.find({ status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name email image');
};

/**
 * Find ISO requests by user
 */
ISORequestSchema.statics.findByUser = async function (
  userId: string | Types.ObjectId
): Promise<IISORequestDocument[]> {
  return this.find({ 
    userId, 
    status: { $ne: 'deleted' } 
  })
    .sort({ createdAt: -1 });
};

/**
 * Find ISO requests by category
 */
ISORequestSchema.statics.findByCategory = async function (
  category: ISOCategory
): Promise<IISORequestDocument[]> {
  return this.find({ 
    category, 
    status: 'active' 
  })
    .sort({ createdAt: -1 })
    .populate('userId', 'name email image');
};

// ============================================
// MODEL EXPORT
// ============================================

const ISORequest: IISORequestModel =
  (mongoose.models.ISORequest as IISORequestModel) ||
  mongoose.model<IISORequestDocument, IISORequestModel>('ISORequest', ISORequestSchema);

export default ISORequest;
