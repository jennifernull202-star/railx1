/**
 * THE RAIL EXCHANGE™ — Seller Verification Model
 * 
 * Stores seller verification applications with AI review results,
 * admin decisions, and document references.
 * 
 * Badge activates only after:
 * 1. AI verification complete
 * 2. Admin approval
 * 3. Valid paid Stripe subscription
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// ============================================
// TYPES
// ============================================

export type VerificationDocumentType = 'drivers_license' | 'business_license' | 'ein_document' | 'insurance_certificate';

export interface IVerificationDocument {
  type: VerificationDocumentType;
  s3Key: string;
  fileName: string;
  uploadedAt: Date;
  expirationDate?: Date;
  documentHash?: string; // Perceptual hash for duplicate detection
}

export interface IAIVerificationResult {
  status: 'pending' | 'passed' | 'flagged' | 'failed';
  confidence: number; // 0-100
  flags: string[];
  extractedData: {
    name?: string;
    businessName?: string;
    ein?: string;
    licenseNumber?: string;
    expirationDate?: string;
    address?: string;
  };
  nameMatchScore?: number; // 0-100
  dateValidation?: {
    isExpired: boolean;
    expirationDate?: string;
  };
  tamperingDetection?: {
    score: number; // 0-100
    indicators: string[];
  };
  duplicateCheck?: {
    isDuplicate: boolean;
    matchingUserId?: string;
  };
  fraudSignals?: string[];
  processedAt: Date;
  rawResponse?: string; // For debugging
}

export interface IAdminReview {
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  notes?: string;
  rejectionReason?: string;
}

export interface ISellerVerification {
  userId: Types.ObjectId;
  
  // Documents (stored in S3, admin-only access)
  documents: IVerificationDocument[];
  
  // AI verification results
  aiVerification: IAIVerificationResult;
  
  // Admin review
  adminReview: IAdminReview;
  
  // Verification tier (standard = $29, priority = $49)
  verificationTier: 'standard' | 'priority' | null;
  
  // Stripe payment (one-time, not subscription)
  stripePaymentId?: string;
  stripeSubscriptionId?: string; // Legacy, kept for backwards compat
  subscriptionStatus?: 'pending' | 'active' | 'past_due' | 'canceled' | 'expired';
  subscriptionPriceId?: string;
  subscriptionPeriod?: 'monthly' | 'yearly';
  
  // Overall status
  status: 'draft' | 'pending-ai' | 'pending-admin' | 'pending-payment' | 'active' | 'revoked' | 'expired';
  
  // Expiration tracking (1 year from approval)
  approvedAt?: Date;
  expiresAt?: Date;
  
  // Priority tier benefits
  rankingBoostExpiresAt?: Date; // 3-day boost for first listing
  
  // Audit trail
  statusHistory: Array<{
    status: string;
    changedAt: Date;
    changedBy?: Types.ObjectId;
    reason?: string;
  }>;
  
  // Renewal tracking
  lastAIRevalidation?: Date;
  nextAIRevalidation?: Date;
  renewalRemindersSent?: {
    thirtyDay?: Date;
    sevenDay?: Date;
    dayOf?: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ISellerVerificationDocument extends ISellerVerification, Document {}

export interface ISellerVerificationModel extends Model<ISellerVerificationDocument> {
  findByUserId(userId: string | Types.ObjectId): Promise<ISellerVerificationDocument | null>;
  findPendingAdminReviews(): Promise<ISellerVerificationDocument[]>;
  findActiveVerifications(): Promise<ISellerVerificationDocument[]>;
}

// ============================================
// SCHEMA
// ============================================

const VerificationDocumentSchema = new Schema({
  type: {
    type: String,
    enum: ['drivers_license', 'business_license', 'ein_document', 'insurance_certificate'],
    required: true,
  },
  s3Key: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  expirationDate: {
    type: Date,
    default: null,
  },
  documentHash: {
    type: String,
    default: null,
    index: true, // Index for duplicate detection queries
  },
}, { _id: false });

const AIVerificationResultSchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'passed', 'flagged', 'failed'],
    default: 'pending',
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  flags: {
    type: [String],
    default: [],
  },
  extractedData: {
    name: String,
    businessName: String,
    ein: String,
    licenseNumber: String,
    expirationDate: String,
    address: String,
  },
  nameMatchScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  dateValidation: {
    isExpired: Boolean,
    expirationDate: String,
  },
  tamperingDetection: {
    score: Number,
    indicators: [String],
  },
  duplicateCheck: {
    isDuplicate: Boolean,
    matchingUserId: String,
  },
  fraudSignals: [String],
  processedAt: Date,
  rawResponse: String,
}, { _id: false });

const AdminReviewSchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: Date,
  notes: String,
  rejectionReason: String,
}, { _id: false });

const StatusHistorySchema = new Schema({
  status: {
    type: String,
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  changedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  reason: String,
}, { _id: false });

const SellerVerificationSchema = new Schema<ISellerVerificationDocument, ISellerVerificationModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    documents: {
      type: [VerificationDocumentSchema],
      default: [],
    },
    aiVerification: {
      type: AIVerificationResultSchema,
      default: () => ({
        status: 'pending',
        confidence: 0,
        flags: [],
        extractedData: {},
      }),
    },
    adminReview: {
      type: AdminReviewSchema,
      default: () => ({
        status: 'pending',
      }),
    },
    verificationTier: {
      type: String,
      enum: ['standard', 'priority', null],
      default: null,
    },
    stripePaymentId: String,
    stripeSubscriptionId: String,
    subscriptionStatus: {
      type: String,
      enum: ['pending', 'active', 'past_due', 'canceled', 'expired'],
    },
    subscriptionPriceId: String,
    subscriptionPeriod: {
      type: String,
      enum: ['monthly', 'yearly'],
    },
    status: {
      type: String,
      enum: ['draft', 'pending-ai', 'pending-admin', 'pending-payment', 'active', 'revoked', 'expired'],
      default: 'draft',
    },
    approvedAt: Date,
    expiresAt: Date,
    rankingBoostExpiresAt: Date,
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
    lastAIRevalidation: Date,
    nextAIRevalidation: Date,
    renewalRemindersSent: {
      thirtyDay: Date,
      sevenDay: Date,
      dayOf: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================

SellerVerificationSchema.index({ userId: 1 }, { unique: true });
SellerVerificationSchema.index({ status: 1 });
SellerVerificationSchema.index({ 'adminReview.status': 1 });
SellerVerificationSchema.index({ 'aiVerification.status': 1 });
SellerVerificationSchema.index({ createdAt: -1 });
SellerVerificationSchema.index({ nextAIRevalidation: 1 });

// ============================================
// STATIC METHODS
// ============================================

SellerVerificationSchema.statics.findByUserId = async function (
  userId: string | Types.ObjectId
): Promise<ISellerVerificationDocument | null> {
  return this.findOne({ userId }).populate('userId', 'name email');
};

SellerVerificationSchema.statics.findPendingAdminReviews = async function (): Promise<ISellerVerificationDocument[]> {
  return this.find({ 
    status: 'pending-admin',
    'adminReview.status': 'pending',
  })
    .populate('userId', 'name email')
    .sort({ createdAt: 1 });
};

SellerVerificationSchema.statics.findActiveVerifications = async function (): Promise<ISellerVerificationDocument[]> {
  return this.find({ status: 'active' })
    .populate('userId', 'name email isVerifiedSeller')
    .sort({ createdAt: -1 });
};

// ============================================
// MODEL EXPORT
// ============================================

const SellerVerification: ISellerVerificationModel =
  (mongoose.models.SellerVerification as ISellerVerificationModel) ||
  mongoose.model<ISellerVerificationDocument, ISellerVerificationModel>('SellerVerification', SellerVerificationSchema);

export default SellerVerification;
