/**
 * THE RAIL EXCHANGE™ — Inquiry Model
 * 
 * Schema for buyer inquiries and messages about listings.
 * Supports threaded conversations between buyers and sellers.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// Inquiry status types
export const INQUIRY_STATUSES = [
  'new',
  'read',
  'replied',
  'closed',
  'spam',
] as const;

export type InquiryStatus = typeof INQUIRY_STATUSES[number];

// Buyer intent timeline options
export const BUYER_TIMELINE_OPTIONS = [
  'immediate',      // Need within 2 weeks
  'short_term',     // Within 1-3 months
  'medium_term',    // Within 3-6 months
  'long_term',      // 6+ months / Planning phase
  'unspecified',    // No timeline
] as const;

export type BuyerTimeline = typeof BUYER_TIMELINE_OPTIONS[number];

// Buyer intent interface
export interface IBuyerIntent {
  quantity?: number;         // How many units they need
  timeline?: BuyerTimeline;  // When they need it
  purpose?: string;          // What they'll use it for (optional)
}

// Message interface for conversation thread
export interface IMessage {
  sender: Types.ObjectId;
  content: string;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
  }>;
  readAt?: Date;
  createdAt: Date;
}

// Main Inquiry interface
export interface IInquiry {
  listing: Types.ObjectId;
  buyer: Types.ObjectId;
  seller: Types.ObjectId;
  subject: string;
  status: InquiryStatus;
  messages: IMessage[];
  lastMessageAt: Date;
  buyerUnreadCount: number;
  sellerUnreadCount: number;
  isArchived: boolean;
  archivedBy?: Types.ObjectId;
  // Buyer intent fields (Phase 3 - Lead Quality)
  buyerIntent?: IBuyerIntent;
  // Response time tracking
  firstReplyAt?: Date;
  responseTimeMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IInquiryDocument extends IInquiry, Document {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IInquiryModel extends Model<IInquiryDocument> {}

// ============================================
// SCHEMA
// ============================================

const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [10000, 'Message cannot exceed 10,000 characters'],
    },
    attachments: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const InquirySchema = new Schema<IInquiryDocument, IInquiryModel>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing reference is required'],
      index: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer reference is required'],
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller reference is required'],
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    status: {
      type: String,
      enum: {
        values: INQUIRY_STATUSES,
        message: 'Invalid inquiry status',
      },
      default: 'new',
      index: true,
    },
    messages: [MessageSchema],
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    buyerUnreadCount: {
      type: Number,
      default: 0,
    },
    sellerUnreadCount: {
      type: Number,
      default: 1, // Initial message is unread by seller
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    // Buyer intent fields (Phase 3 - Lead Quality)
    buyerIntent: {
      quantity: {
        type: Number,
        min: [1, 'Quantity must be at least 1'],
      },
      timeline: {
        type: String,
        enum: {
          values: BUYER_TIMELINE_OPTIONS,
          message: 'Invalid timeline option',
        },
        default: 'unspecified',
      },
      purpose: {
        type: String,
        maxlength: [500, 'Purpose cannot exceed 500 characters'],
      },
    },
    // Response time tracking
    firstReplyAt: {
      type: Date,
      default: null,
    },
    responseTimeMinutes: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ============================================
// INDEXES
// ============================================

// Compound indexes for efficient querying
InquirySchema.index({ seller: 1, status: 1, lastMessageAt: -1 });
InquirySchema.index({ buyer: 1, status: 1, lastMessageAt: -1 });
InquirySchema.index({ listing: 1, buyer: 1 }, { unique: true }); // One inquiry per buyer per listing

// ============================================
// MODEL EXPORT
// ============================================

const Inquiry =
  (mongoose.models.Inquiry as IInquiryModel) ||
  mongoose.model<IInquiryDocument, IInquiryModel>('Inquiry', InquirySchema);

export default Inquiry;
