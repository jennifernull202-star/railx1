/**
 * THE RAIL EXCHANGE™ — Listing Model
 * 
 * Core listing schema for rail equipment, materials, and services.
 * Supports premium features like Featured, Top Spot, and Boosted listings.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// Re-export constants from shared file for backward compatibility
export {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  LISTING_STATUSES,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  STATUS_LABELS,
  type ListingCategory,
  type ListingCondition,
  type ListingStatus,
} from '@/lib/listing-constants';

import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  LISTING_STATUSES,
  type ListingCategory,
  type ListingCondition,
  type ListingStatus,
} from '@/lib/listing-constants';

// Premium add-on types (matches config/addons.ts structure)
export interface PremiumAddOns {
  // Visibility tiers (30-day duration from config)
  featured: {
    active: boolean;
    expiresAt?: Date;
    purchasedAt?: Date;
  };
  premium: {
    active: boolean;
    expiresAt?: Date;
    purchasedAt?: Date;
  };
  elite: {
    active: boolean;
    expiresAt?: Date;
    purchasedAt?: Date;
  };
  // Legacy field - kept for backwards compatibility
  topSpot: {
    active: boolean;
    expiresAt?: Date;
    purchasedAt?: Date;
  };
  // Enhancement add-ons (permanent from config)
  aiEnhanced?: boolean;
  specSheet?: {
    generated: boolean;
    url?: string;
    generatedAt?: Date;
  };
}

// Location interface
export interface ListingLocation {
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

// Price interface for different pricing models
export interface ListingPrice {
  type: 'fixed' | 'negotiable' | 'auction' | 'contact' | 'rfq';
  amount?: number;
  currency: string;
  originalAmount?: number; // For showing discounts
  pricePerUnit?: string; // e.g., "per mile", "per ton"
}

// Specification interface for technical details
export interface Specification {
  label: string;
  value: string;
  unit?: string;
}

// Media interface
export interface ListingMedia {
  url: string;
  type: 'image' | 'video' | 'document';
  caption?: string;
  isPrimary?: boolean;
  order: number;
}

// Listing document interface
export interface IListingDocument extends Document {
  // Basic info
  title: string;
  slug: string;
  description: string;
  category: ListingCategory;
  subcategory?: string;
  condition: ListingCondition;
  status: ListingStatus;
  
  // Seller info
  sellerId: Types.ObjectId;
  sellerType: 'individual' | 'dealer' | 'contractor';
  
  // Pricing
  price: ListingPrice;
  
  // Location
  location: ListingLocation;
  
  // Media
  media: ListingMedia[];
  primaryImageUrl?: string;
  
  // Specifications
  specifications: Specification[];
  
  // Inventory
  quantity: number;
  quantityUnit?: string;
  sku?: string;
  
  // Shipping
  shippingOptions: {
    localPickup: boolean;
    sellerShips: boolean;
    buyerArranges: boolean;
    estimatedWeight?: number;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      unit: 'in' | 'ft' | 'cm' | 'm';
    };
  };
  
  // Premium features
  premiumAddOns: PremiumAddOns;
  
  // SEO & Discovery
  tags: string[];
  keywords: string[];
  
  // Analytics
  viewCount: number;
  inquiryCount: number;
  saveCount: number;
  
  // Timestamps
  publishedAt?: Date;
  expiresAt?: Date;
  soldAt?: Date;
  
  // Flags
  isActive: boolean;
  isFlagged: boolean;
  flagReason?: string;
  
  // Timestamps (auto)
  createdAt: Date;
  updatedAt: Date;
}

// Model methods interface
interface IListingModel extends Model<IListingDocument> {
  generateSlug(title: string): Promise<string>;
}

// Schema
const ListingSchema = new Schema<IListingDocument, IListingModel>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
      index: 'text',
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [10000, 'Description cannot exceed 10,000 characters'],
      index: 'text',
    },
    category: {
      type: String,
      enum: LISTING_CATEGORIES,
      required: [true, 'Category is required'],
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
      enum: LISTING_CONDITIONS,
      required: [true, 'Condition is required'],
    },
    status: {
      type: String,
      enum: LISTING_STATUSES,
      default: 'draft',
      index: true,
    },
    
    // Seller
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellerType: {
      type: String,
      enum: ['individual', 'dealer', 'contractor'],
      default: 'individual',
    },
    
    // Pricing
    price: {
      type: {
        type: String,
        enum: ['fixed', 'negotiable', 'auction', 'contact', 'rfq'],
        default: 'fixed',
      },
      amount: Number,
      currency: { type: String, default: 'USD' },
      originalAmount: Number,
      pricePerUnit: String,
    },
    
    // Location
    location: {
      city: { type: String, required: true },
      state: { type: String, required: true, index: true },
      country: { type: String, default: 'USA' },
      zipCode: String,
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
        },
        coordinates: {
          type: [Number],
        },
      },
    },
    
    // Media - Maximum 20 photos per listing
    media: {
      type: [{
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video', 'document'], default: 'image' },
        caption: String,
        isPrimary: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      }],
      validate: {
        validator: function(v: unknown[]) {
          return !v || v.length <= 20;
        },
        message: 'Maximum photo limit reached: Up to 20 images allowed per listing.',
      },
    },
    primaryImageUrl: String,
    
    // Specifications
    specifications: [{
      label: { type: String, required: true },
      value: { type: String, required: true },
      unit: String,
    }],
    
    // Inventory
    quantity: { type: Number, default: 1, min: 0 },
    quantityUnit: String,
    sku: String,
    
    // Shipping
    shippingOptions: {
      localPickup: { type: Boolean, default: true },
      sellerShips: { type: Boolean, default: false },
      buyerArranges: { type: Boolean, default: true },
      estimatedWeight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: { type: String, enum: ['in', 'ft', 'cm', 'm'], default: 'ft' },
      },
    },
    
    // Premium features (matches config/addons.ts)
    premiumAddOns: {
      featured: {
        active: { type: Boolean, default: false },
        expiresAt: Date,
        purchasedAt: Date,
      },
      premium: {
        active: { type: Boolean, default: false },
        expiresAt: Date,
        purchasedAt: Date,
      },
      elite: {
        active: { type: Boolean, default: false },
        expiresAt: Date,
        purchasedAt: Date,
      },
      topSpot: {
        active: { type: Boolean, default: false },
        expiresAt: Date,
        purchasedAt: Date,
      },
      aiEnhanced: { type: Boolean, default: false },
      specSheet: {
        generated: { type: Boolean, default: false },
        url: String,
        generatedAt: Date,
      },
    },
    
    // SEO & Discovery
    tags: [{ type: String, index: true }],
    keywords: [{ type: String, index: true }],
    
    // Analytics
    viewCount: { type: Number, default: 0 },
    inquiryCount: { type: Number, default: 0 },
    saveCount: { type: Number, default: 0 },
    
    // Timestamps
    publishedAt: Date,
    expiresAt: { type: Date, index: true },
    soldAt: Date,
    
    // Flags
    isActive: { type: Boolean, default: true, index: true },
    isFlagged: { type: Boolean, default: false },
    flagReason: String,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        const transformed = ret as Record<string, unknown>;
        transformed.id = String(transformed._id || '');
        delete transformed.__v;
        return transformed;
      },
    },
  }
);

// Create text index for search
ListingSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  { weights: { title: 10, tags: 5, description: 1 } }
);

// Compound indexes for common queries
ListingSchema.index({ category: 1, status: 1, 'premiumAddOns.featured.active': -1, createdAt: -1 });
ListingSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
ListingSchema.index({ 'location.state': 1, category: 1, status: 1 });
ListingSchema.index({ 'location.coordinates': '2dsphere' });

// Generate slug from title
ListingSchema.statics.generateSlug = async function (title: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
  
  // Add random suffix for uniqueness
  const suffix = Math.random().toString(36).substring(2, 8);
  const slug = `${baseSlug}-${suffix}`;
  
  return slug;
};

// Pre-save middleware
ListingSchema.pre('save', async function () {
  // Generate slug if new document
  if (this.isNew && !this.slug) {
    this.slug = await (this.constructor as IListingModel).generateSlug(this.title);
  }
  
  // Set primary image URL from media
  const primaryMedia = this.media.find(m => m.isPrimary) || this.media[0];
  if (primaryMedia) {
    this.primaryImageUrl = primaryMedia.url;
  }
  
  // Set publishedAt when status changes to active
  if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Set soldAt when status changes to sold
  if (this.isModified('status') && this.status === 'sold' && !this.soldAt) {
    this.soldAt = new Date();
  }
  
  // Set default expiration (90 days from publish)
  if (this.isModified('status') && this.status === 'active' && !this.expiresAt) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);
    this.expiresAt = expiresAt;
  }
  
  // #14 fix: Sync isActive with status for consistency
  // isActive should be true only when status is 'active' or 'pending'
  // This ensures queries using either field return consistent results
  if (this.isModified('status')) {
    this.isActive = ['active', 'pending'].includes(this.status);
  }
});

// Virtual for checking if listing is featured
ListingSchema.virtual('isFeatured').get(function () {
  return (
    this.premiumAddOns.featured.active &&
    (!this.premiumAddOns.featured.expiresAt ||
      this.premiumAddOns.featured.expiresAt > new Date())
  );
});

// Virtual for checking if listing is premium
ListingSchema.virtual('isPremium').get(function () {
  return (
    this.premiumAddOns.premium?.active &&
    (!this.premiumAddOns.premium?.expiresAt ||
      this.premiumAddOns.premium.expiresAt > new Date())
  );
});

// Virtual for checking if listing is elite
ListingSchema.virtual('isElite').get(function () {
  return (
    this.premiumAddOns.elite?.active &&
    (!this.premiumAddOns.elite?.expiresAt ||
      this.premiumAddOns.elite.expiresAt > new Date())
  );
});

// Virtual for days until expiration
ListingSchema.virtual('daysUntilExpiration').get(function () {
  if (!this.expiresAt) return null;
  const now = new Date();
  const diff = this.expiresAt.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Prevent model recompilation in development
const Listing =
  (mongoose.models.Listing as IListingModel) ||
  mongoose.model<IListingDocument, IListingModel>('Listing', ListingSchema);

export default Listing;
