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
export type ContractorTierType = 'free' | 'verified';
export type SubscriptionStatusType = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'paused';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  image?: string;
  phone?: string;
  company?: string;
  emailVerified?: Date;
  isActive: boolean;
  lastLogin?: Date;
  
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
  
  // Subscription metadata
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
const CONTRACTOR_TIER_VALUES: ContractorTierType[] = ['free', 'verified'];
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
      default: 'free',
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
