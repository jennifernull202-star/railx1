/**
 * THE RAIL EXCHANGE™ — User Model
 * 
 * Schema for all users in the platform.
 * Supports multiple roles: buyer, seller, contractor, admin.
 * Includes subscription tier management for sellers and contractors.
 */

import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// ============================================
// TYPES
// ============================================

export type UserRole = 'buyer' | 'seller' | 'contractor' | 'admin';

// Subscription tier types (inline to avoid circular deps)
export type SellerTierType = 'buyer' | 'basic' | 'plus' | 'pro' | 'enterprise';
export type ContractorTierType = 'none' | 'verified' | 'featured' | 'priority';
export type SubscriptionStatusType = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'paused';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole; // Legacy - kept for admin check only
  image?: string;
  phone?: string;
  company?: string;
  emailVerified?: Date;
  isActive: boolean;
  lastLogin?: Date;
  
  // ============================================
  // CAPABILITY FLAGS (new capability-based system)
  // ============================================
  isSeller: boolean;           // True for ALL users by default (everyone can sell)
  isContractor: boolean;       // False by default, true only if opted-in
  isAdmin: boolean;            // False by default, true only for admin users
  
  // Seller Pro tier tracking
  sellerProActive: boolean;
  sellerProExpiresAt: Date | null;
  
  // Verification statuses
  sellerVerificationStatus: 'none' | 'pending-ai' | 'pending-admin' | 'active' | 'revoked';
  sellerVerificationSubscriptionId: string | null;
  contractorVerificationStatus: 'none' | 'pending-ai' | 'pending-admin' | 'active' | 'revoked';
  contractorVerificationSubscriptionId: string | null;
  
  // Subscription fields for sellers
  sellerTier: SellerTierType;
  sellerSubscriptionStatus: SubscriptionStatusType | null;
  sellerSubscriptionId: string | null;
  
  // Subscription fields for contractors
  contractorTier: ContractorTierType;
  contractorSubscriptionStatus: SubscriptionStatusType | null;
  contractorSubscriptionId: string | null;
  
  // Shared Stripe fields
  stripeCustomerId: string | null;
  
  // SECURITY: Separate subscription periods - do not share one field
  // Seller subscription period
  sellerCurrentPeriodEnd: Date | null;
  sellerCancelAtPeriodEnd: boolean;
  
  // Contractor subscription period  
  contractorCurrentPeriodEnd: Date | null;
  contractorCancelAtPeriodEnd: boolean;
  
  // Legacy shared field (deprecated - use separate fields above)
  subscriptionCurrentPeriodEnd: Date | null;
  subscriptionCancelAtPeriodEnd: boolean;
  
  // Listing tracking
  activeListingCount: number;
  
  // Password reset
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  
  // User preferences
  preferences?: {
    showSellerSection?: boolean;
    showContractorSection?: boolean;
  };
  
  // Pending add-ons from cart checkout
  pendingAddons?: {
    addonType?: string;
    listingId?: string;
    checkoutSessionId?: string;
  }[];
  
  // Promo code tracking
  usedPromoCodes?: {
    code: string;
    usedAt: Date;
    subscriptionType?: string;
    tier?: string;
  }[];
  
  // PayPal invoice email (external payment - NOT processed by platform)
  paypalEmail?: string | null;
  paypalVerified?: boolean;
  
  // ============================================
  // VERIFIED SELLER FIELDS
  // Badge activates only after: AI review + Admin approval + Valid paid subscription
  // ============================================
  isVerifiedSeller: boolean;
  verifiedSellerStatus: 'none' | 'pending-ai' | 'pending-admin' | 'active' | 'revoked' | 'expired';
  verifiedSellerTier: 'standard' | 'priority' | null; // NEW: Two-tier system
  verifiedSellerApprovedAt: Date | null; // NEW: When verification was approved
  verifiedSellerExpiresAt: Date | null; // NEW: 1 year from approval
  verifiedSellerStartedAt: Date | null;
  verifiedSellerSubscriptionId: string | null;
  verifiedSellerLastAICheck: Date | null;
  verifiedSellerRankingBoostExpiresAt: Date | null; // NEW: Priority tier gets 3-day boost
  
  // ============================================
  // BUYER AUDIT: TRUST SIGNALS
  // ============================================
  trustSignals: {
    // Response time tracking (in hours)
    avgResponseTimeHours?: number;
    responseTimeLabel?: 'within-1h' | 'within-4h' | 'within-24h' | 'within-48h' | 'slow';
    totalInquiriesReceived?: number;
    totalInquiriesResponded?: number;
    
    // Transaction history
    transactionCount?: number;
    successfulTransactions?: number;
    
    // Activity tracking
    lastActiveAt?: Date;
    lastActiveLabel?: 'today' | 'this-week' | 'this-month' | 'inactive';
    
    // Fleet/inventory indicators (for dealers)
    fleetSize?: number;
    fleetSizeLabel?: 'small' | 'medium' | 'large' | 'enterprise';
    
    // Railroad affiliation
    railroadAffiliation?: string; // BNSF, UP, CSX, NS, etc.
    railroadType?: 'class-i' | 'regional' | 'shortline' | 'industrial' | 'none';
    
    // Certifications
    aarCertified?: boolean;
    aarCertificationNumber?: string;
    locationVerified?: boolean;
    locationVerifiedAt?: Date;
  };
  
  // ============================================
  // SECTION 9: SPAM & ABUSE TRACKING
  // ============================================
  spamWarnings: number;  // Count of spam warnings (escalates to suspension at 3)
  spamSuspendedUntil: Date | null;  // If suspended, when does it lift
  spamLastWarningAt: Date | null;  // When was the last warning issued
  reportCount: number;  // Number of times this user's content was reported
  
  // BATCH E-3: Serial reporter detection (admin visibility only)
  isSerialReporterFlagged: boolean;  // Internal flag for high-volume reporters
  serialReporterFlaggedAt: Date | null;
  
  // BATCH E-3: Inquiry spam tracking (when sellers mark buyer's inquiries as spam)
  inquirySpamMarkedCount: number;  // How many times other sellers marked this buyer's inquiries as spam
  
  // S-1.4: False report tracking for rate-limiting abuse reporters
  rejectedReportCount: number;  // Reports marked invalid/false by admin
  reportRateLimitedUntil: Date | null;  // Rate limit for repeat false reporters
  
  // Recently viewed listings (for buyer dashboard)
  recentlyViewed?: {
    listingId: mongoose.Types.ObjectId;
    viewedAt: Date;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  toPublicJSON(): Omit<IUserDocument, 'password'>;
}

export interface IUserDocument extends IUser, IUserMethods, Document {}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findActiveUsers(): Promise<IUserDocument[]>;
  findByStripeCustomerId(customerId: string): Promise<IUserDocument | null>;
}

// ============================================
// CONSTANTS
// ============================================

const SELLER_TIER_VALUES: SellerTierType[] = ['buyer', 'basic', 'plus', 'pro', 'enterprise'];
const CONTRACTOR_TIER_VALUES: ContractorTierType[] = ['none', 'verified', 'featured', 'priority'];
const SUBSCRIPTION_STATUS_VALUES: SubscriptionStatusType[] = [
  'active', 'past_due', 'canceled', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired', 'paused'
];

// ============================================
// SCHEMA
// ============================================

const UserSchema = new Schema<IUserDocument, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['buyer', 'seller', 'contractor', 'admin'],
        message: 'Role must be buyer, seller, contractor, or admin',
      },
      default: 'buyer',
    },
    
    // ============================================
    // CAPABILITY FLAGS (new capability-based system)
    // ============================================
    isSeller: {
      type: Boolean,
      default: true, // ALL users can sell by default
    },
    isContractor: {
      type: Boolean,
      default: false, // Only true if user opts in
    },
    isAdmin: {
      type: Boolean,
      default: false, // Only true for admin users
    },
    
    // Seller Pro tier tracking
    sellerProActive: {
      type: Boolean,
      default: false,
    },
    sellerProExpiresAt: {
      type: Date,
      default: null,
    },
    
    // Verification statuses
    sellerVerificationStatus: {
      type: String,
      enum: ['none', 'pending-ai', 'pending-admin', 'active', 'revoked'],
      default: 'none',
    },
    sellerVerificationSubscriptionId: {
      type: String,
      default: null,
    },
    contractorVerificationStatus: {
      type: String,
      enum: ['none', 'pending-ai', 'pending-admin', 'active', 'revoked'],
      default: 'none',
    },
    contractorVerificationSubscriptionId: {
      type: String,
      default: null,
    },
    
    image: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    company: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
      default: null,
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    
    // ============================================
    // SUBSCRIPTION FIELDS - SELLERS
    // ============================================
    sellerTier: {
      type: String,
      enum: {
        values: SELLER_TIER_VALUES,
        message: 'Invalid seller tier',
      },
      default: 'buyer',
    },
    sellerSubscriptionStatus: {
      type: String,
      enum: {
        values: [...SUBSCRIPTION_STATUS_VALUES, null],
        message: 'Invalid subscription status',
      },
      default: null,
    },
    sellerSubscriptionId: {
      type: String,
      default: null,
    },
    
    // ============================================
    // SUBSCRIPTION FIELDS - CONTRACTORS
    // ============================================
    contractorTier: {
      type: String,
      enum: {
        values: CONTRACTOR_TIER_VALUES,
        message: 'Invalid contractor tier',
      },
      default: 'none', // IMPORTANT: No free tier. Default is 'none' (invisible)
    },
    contractorSubscriptionStatus: {
      type: String,
      enum: {
        values: [...SUBSCRIPTION_STATUS_VALUES, null],
        message: 'Invalid subscription status',
      },
      default: null,
    },
    contractorSubscriptionId: {
      type: String,
      default: null,
    },
    
    // ============================================
    // SHARED STRIPE FIELDS
    // ============================================
    stripeCustomerId: {
      type: String,
      default: null,
      sparse: true,
    },
    
    // SECURITY: Separate subscription periods - do not share one field
    // Seller subscription period
    sellerCurrentPeriodEnd: {
      type: Date,
      default: null,
    },
    sellerCancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    
    // Contractor subscription period
    contractorCurrentPeriodEnd: {
      type: Date,
      default: null,
    },
    contractorCancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    
    // Legacy shared field (deprecated - migrate to separate fields)
    subscriptionCurrentPeriodEnd: {
      type: Date,
      default: null,
    },
    subscriptionCancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    
    // ============================================
    // LISTING TRACKING
    // ============================================
    activeListingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // ============================================
    // PASSWORD RESET
    // ============================================
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    
    // ============================================
    // USER PREFERENCES (Dashboard visibility)
    // ============================================
    preferences: {
      type: {
        showSellerSection: { type: Boolean, default: true },
        showContractorSection: { type: Boolean, default: true },
      },
      default: {
        showSellerSection: true,
        showContractorSection: true,
      },
    },
    
    // ============================================
    // PENDING CART ADD-ONS (for checkout webhook)
    // ============================================
    pendingAddons: {
      type: [{
        addonType: { type: String },
        listingId: { type: String },
        checkoutSessionId: { type: String },
      }],
      default: [],
    },
    
    // ============================================
    // PROMO CODE TRACKING
    // ============================================
    usedPromoCodes: {
      type: [{
        code: { type: String, required: true },
        usedAt: { type: Date, default: Date.now },
        subscriptionType: { type: String }, // 'seller' or 'contractor'
        tier: { type: String }, // The tier it was applied to
      }],
      default: [],
    },
    
    // ============================================
    // PAYPAL INVOICE EMAIL
    // User-provided PayPal email for external invoicing.
    // The Rail Exchange does NOT process payments.
    // ============================================
    paypalEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid PayPal email address',
      ],
    },
    paypalVerified: {
      type: Boolean,
      default: false,
    },
    
    // ============================================
    // VERIFIED SELLER FIELDS
    // Badge activates only after: AI review + Admin approval + Valid paid subscription
    // ============================================
    isVerifiedSeller: {
      type: Boolean,
      default: false,
    },
    verifiedSellerStatus: {
      type: String,
      enum: ['none', 'pending-ai', 'pending-admin', 'active', 'revoked', 'expired'],
      default: 'none',
    },
    verifiedSellerTier: {
      type: String,
      enum: ['standard', 'priority', null],
      default: null,
    },
    verifiedSellerApprovedAt: {
      type: Date,
      default: null,
    },
    verifiedSellerExpiresAt: {
      type: Date,
      default: null,
    },
    verifiedSellerStartedAt: {
      type: Date,
      default: null,
    },
    verifiedSellerSubscriptionId: {
      type: String,
      default: null,
    },
    verifiedSellerLastAICheck: {
      type: Date,
      default: null,
    },
    verifiedSellerRankingBoostExpiresAt: {
      type: Date,
      default: null,
    },
    
    // ============================================
    // BUYER AUDIT: TRUST SIGNALS
    // ============================================
    trustSignals: {
      // Response time tracking
      avgResponseTimeHours: { type: Number },
      responseTimeLabel: { 
        type: String, 
        enum: ['within-1h', 'within-4h', 'within-24h', 'within-48h', 'slow'],
      },
      totalInquiriesReceived: { type: Number, default: 0 },
      totalInquiriesResponded: { type: Number, default: 0 },
      
      // Transaction history
      transactionCount: { type: Number, default: 0 },
      successfulTransactions: { type: Number, default: 0 },
      
      // Activity tracking
      lastActiveAt: { type: Date },
      lastActiveLabel: { 
        type: String, 
        enum: ['today', 'this-week', 'this-month', 'inactive'],
      },
      
      // Fleet/inventory indicators
      fleetSize: { type: Number },
      fleetSizeLabel: { 
        type: String, 
        enum: ['small', 'medium', 'large', 'enterprise'],
      },
      
      // Railroad affiliation
      railroadAffiliation: { type: String },
      railroadType: { 
        type: String, 
        enum: ['class-i', 'regional', 'shortline', 'industrial', 'none'],
      },
      
      // Certifications
      aarCertified: { type: Boolean, default: false },
      aarCertificationNumber: { type: String },
      locationVerified: { type: Boolean, default: false },
      locationVerifiedAt: { type: Date },
    },
    
    // ============================================
    // SECTION 9: SPAM & ABUSE TRACKING
    // ============================================
    spamWarnings: { type: Number, default: 0 },
    spamSuspendedUntil: { type: Date, default: null },
    spamLastWarningAt: { type: Date, default: null },
    reportCount: { type: Number, default: 0 },
    
    // BATCH E-3: Serial reporter detection (admin visibility only)
    isSerialReporterFlagged: { type: Boolean, default: false },
    serialReporterFlaggedAt: { type: Date, default: null },
    
    // BATCH E-3: Inquiry spam tracking
    inquirySpamMarkedCount: { type: Number, default: 0 },
    
    // S-1.4: False report tracking for rate-limiting abuse reporters
    rejectedReportCount: { type: Number, default: 0 },  // Reports marked invalid/false
    reportRateLimitedUntil: { type: Date, default: null },  // Rate limit for false reporters
    
    // Recently viewed listings
    recentlyViewed: [{
      listingId: { type: Schema.Types.ObjectId, ref: 'Listing' },
      viewedAt: { type: Date, default: Date.now },
    }],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ============================================
// INDEXES
// ============================================

// Note: email index is created automatically via `unique: true` on the field
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isActive: 1, role: 1 });
UserSchema.index({ stripeCustomerId: 1 }, { sparse: true });
UserSchema.index({ sellerTier: 1 });
UserSchema.index({ contractorTier: 1 });
UserSchema.index({ isVerifiedSeller: 1 });
UserSchema.index({ verifiedSellerStatus: 1 });
// Capability flag indexes
UserSchema.index({ isSeller: 1 });
UserSchema.index({ isContractor: 1 });
UserSchema.index({ isAdmin: 1 });
UserSchema.index({ sellerVerificationStatus: 1 });
UserSchema.index({ contractorVerificationStatus: 1 });

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Hash password before saving
 */
UserSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Compare password for authentication
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

/**
 * Return user data without sensitive fields
 */
UserSchema.methods.toPublicJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find user by email
 */
UserSchema.statics.findByEmail = async function (
  email: string
): Promise<IUserDocument | null> {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

/**
 * Find all active users
 */
UserSchema.statics.findActiveUsers = async function (): Promise<IUserDocument[]> {
  return this.find({ isActive: true });
};

/**
 * Find user by Stripe customer ID
 */
UserSchema.statics.findByStripeCustomerId = async function (
  customerId: string
): Promise<IUserDocument | null> {
  return this.findOne({ stripeCustomerId: customerId });
};

// ============================================
// MODEL EXPORT
// ============================================

// Prevent model overwrite in development with hot reload
const User: IUserModel =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUserDocument, IUserModel>('User', UserSchema);

export default User;
