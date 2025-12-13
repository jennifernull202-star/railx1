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
  // Verified Asset Badge (30-day duration)
  verifiedBadge?: {
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

// ============================================
// STRUCTURED EQUIPMENT FIELDS (BUYER AUDIT UPGRADE)
// ============================================

// Manufacturer enum for locomotives and rolling stock
export type EquipmentManufacturer = 
  | 'EMD' | 'GE' | 'Wabtec' | 'Alco' | 'MLW' | 'BLW' 
  | 'Trinity' | 'Greenbrier' | 'FreightCar America' | 'National Steel Car'
  | 'TrinityRail' | 'GATX' | 'Union Tank Car' | 'American Railcar'
  | 'Progress Rail' | 'Siemens' | 'Stadler' | 'Alstom' | 'Other';

// AAR Car Type codes
export type AARCarType = 
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J' | 'K' 
  | 'L' | 'M' | 'N' | 'P' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Z';

// Availability status
export type EquipmentAvailability = 'immediate' | 'storage' | 'in-service' | 'lease-return' | 'pending-repair';

// Seller type expanded
export type SellerType = 'individual' | 'dealer' | 'contractor' | 'railroad' | 'leasing-company' | 'scrap-yard';

// Structured equipment data interface
export interface EquipmentData {
  // Core identifiers
  reportingMarks?: string;           // BNSF 1234, UP 5678
  manufacturer?: string;             // EMD, GE, Trinity, etc.
  model?: string;                    // GP38-2, SD70MAC, etc.
  yearBuilt?: number;
  yearRebuilt?: number;
  serialNumber?: string;
  
  // Locomotive-specific
  horsepower?: number;
  engineHours?: number;
  mileage?: number;
  tractionMotors?: string;           // D77, GE752
  trucks?: string;                   // Blomberg B, HTC
  fuelCapacity?: number;             // gallons
  sandCapacity?: number;             // cubic feet
  dynamicBrakes?: boolean;
  multipleUnitCapable?: boolean;
  engineType?: string;               // 16-645E3, 7FDL16
  
  // Freight car specific
  aarCarType?: string;               // T, B, G, H, etc.
  loadLimit?: number;                // pounds
  lightWeight?: number;              // pounds
  insideLength?: number;             // feet
  insideWidth?: number;              // feet
  insideHeight?: number;             // feet
  cubicCapacity?: number;            // cubic feet
  tankCapacity?: number;             // gallons
  commodityLastCarried?: string;
  axleCount?: number;                // 4, 6, 8
  
  // Track materials specific
  railWeight?: number;               // lbs per yard
  railLength?: number;               // feet
  tieType?: string;                  // wood, concrete, composite
  
  // Regulatory & compliance
  fraCompliant?: boolean;
  fraClass?: string;                 // Class I, II, III
  lastFraInspection?: Date;
  lastServiceDate?: Date;
  lastQualificationDate?: Date;      // For tank cars
  dotSpec?: string;                  // DOT-111, DOT-117
  
  // Availability & quantity
  availability?: EquipmentAvailability;
  quantityAvailable?: number;
  minimumOrder?: number;
  
  // Gauge
  gauge?: string;                    // standard, narrow, etc.
}

// Price history tracking
export interface PriceHistoryEntry {
  amount: number;
  changedAt: Date;
  reason?: string;
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
  sellerType: SellerType;
  
  // Pricing
  price: ListingPrice;
  priceHistory?: PriceHistoryEntry[];
  
  // Location
  location: ListingLocation;
  
  // Media
  media: ListingMedia[];
  primaryImageUrl?: string;
  
  // S-1.3: Image hashes for duplicate detection
  imageHashes?: string[];
  
  // ============================================
  // STRUCTURED EQUIPMENT DATA (Buyer Audit Upgrade)
  // ============================================
  equipment: EquipmentData;
  
  // Legacy specifications (kept for backward compatibility)
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
  
  // Days on market tracking
  daysOnMarket?: number;
  
  // Timestamps
  publishedAt?: Date;
  expiresAt?: Date;
  soldAt?: Date;
  
  // Flags
  isActive: boolean;
  isFlagged: boolean;
  flagReason?: string;
  
  // BATCH E-3: Auto-flagging metadata (admin visibility)
  reportCount: number;  // Total number of reports received
  uniqueReporterCount: number;  // Number of unique users who reported
  lastReportAt?: Date;  // When was the last report
  
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
      enum: ['individual', 'dealer', 'contractor', 'railroad', 'leasing-company', 'scrap-yard'],
      default: 'individual',
      index: true,
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
    
    // Price history tracking
    priceHistory: [{
      amount: { type: Number, required: true },
      changedAt: { type: Date, default: Date.now },
      reason: String,
    }],
    
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
    
    // S-1.3: Image hashes for duplicate detection across sellers
    imageHashes: {
      type: [String],
      index: true,
      default: [],
    },
    
    // Legacy Specifications (backward compatibility)
    specifications: [{
      label: { type: String, required: true },
      value: { type: String, required: true },
      unit: String,
    }],
    
    // ============================================
    // STRUCTURED EQUIPMENT DATA (Buyer Audit Upgrade)
    // ============================================
    equipment: {
      // Core identifiers
      reportingMarks: { type: String, trim: true, index: true },
      manufacturer: { type: String, trim: true, index: true },
      model: { type: String, trim: true, index: true },
      yearBuilt: { type: Number, index: true },
      yearRebuilt: { type: Number },
      serialNumber: { type: String, trim: true },
      
      // Locomotive-specific
      horsepower: { type: Number, index: true },
      engineHours: { type: Number },
      mileage: { type: Number },
      tractionMotors: { type: String },
      trucks: { type: String },
      fuelCapacity: { type: Number },
      sandCapacity: { type: Number },
      dynamicBrakes: { type: Boolean },
      multipleUnitCapable: { type: Boolean },
      engineType: { type: String },
      
      // Freight car specific
      aarCarType: { type: String, trim: true, index: true },
      loadLimit: { type: Number },
      lightWeight: { type: Number },
      insideLength: { type: Number },
      insideWidth: { type: Number },
      insideHeight: { type: Number },
      cubicCapacity: { type: Number },
      tankCapacity: { type: Number },
      commodityLastCarried: { type: String },
      axleCount: { type: Number },
      
      // Track materials specific
      railWeight: { type: Number },
      railLength: { type: Number },
      tieType: { type: String },
      
      // Regulatory & compliance
      fraCompliant: { type: Boolean, index: true },
      fraClass: { type: String },
      lastFraInspection: { type: Date },
      lastServiceDate: { type: Date },
      lastQualificationDate: { type: Date },
      dotSpec: { type: String },
      
      // Availability & quantity
      availability: { 
        type: String, 
        enum: ['immediate', 'storage', 'in-service', 'lease-return', 'pending-repair'],
        index: true,
      },
      quantityAvailable: { type: Number },
      minimumOrder: { type: Number },
      
      // Gauge
      gauge: { type: String, default: 'standard' },
    },
    
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
      verifiedBadge: {
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
    daysOnMarket: { type: Number, default: 0 },
    
    // Timestamps
    publishedAt: Date,
    expiresAt: { type: Date, index: true },
    soldAt: Date,
    
    // Flags
    isActive: { type: Boolean, default: true, index: true },
    isFlagged: { type: Boolean, default: false },
    flagReason: String,
    
    // BATCH E-3: Auto-flagging metadata (admin visibility)
    reportCount: { type: Number, default: 0 },
    uniqueReporterCount: { type: Number, default: 0 },
    lastReportAt: { type: Date },
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

// Create text index for search including equipment fields
ListingSchema.index(
  { 
    title: 'text', 
    description: 'text', 
    tags: 'text',
    'equipment.reportingMarks': 'text',
    'equipment.model': 'text',
    'equipment.manufacturer': 'text',
  },
  { 
    weights: { 
      title: 10, 
      'equipment.reportingMarks': 8,
      'equipment.model': 6,
      tags: 5, 
      'equipment.manufacturer': 4,
      description: 1 
    } 
  }
);

// Compound indexes for common queries
ListingSchema.index({ category: 1, status: 1, 'premiumAddOns.featured.active': -1, createdAt: -1 });
ListingSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
ListingSchema.index({ 'location.state': 1, category: 1, status: 1 });
ListingSchema.index({ 'location.coordinates': '2dsphere' });

// Equipment-specific indexes for buyer search (Buyer Audit Upgrade)
ListingSchema.index({ 'equipment.yearBuilt': 1, category: 1, status: 1 });
ListingSchema.index({ 'equipment.horsepower': 1, category: 1, status: 1 });
ListingSchema.index({ 'equipment.manufacturer': 1, 'equipment.model': 1, status: 1 });
ListingSchema.index({ 'equipment.fraCompliant': 1, category: 1, status: 1 });
ListingSchema.index({ 'equipment.availability': 1, status: 1 });
ListingSchema.index({ sellerType: 1, status: 1, createdAt: -1 });
ListingSchema.index({ quantity: 1, status: 1 });

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
  
  // Track price history when price changes
  if (this.isModified('price.amount') && this.price.amount) {
    if (!this.priceHistory) {
      this.priceHistory = [];
    }
    this.priceHistory.push({
      amount: this.price.amount,
      changedAt: new Date(),
      reason: this.isNew ? 'Initial price' : 'Price update',
    });
  }
  
  // Set publishedAt when status changes to active
  if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Calculate days on market
  if (this.publishedAt) {
    const now = new Date();
    const diff = now.getTime() - this.publishedAt.getTime();
    this.daysOnMarket = Math.floor(diff / (1000 * 60 * 60 * 24));
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
