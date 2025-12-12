/**
 * THE RAIL EXCHANGE™ — Contractor Profile Model
 * 
 * Schema for contractor business profiles.
 * Linked to User model via userId.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// ============================================
// TYPES
// ============================================

export type VerificationStatus = 'none' | 'pending' | 'ai_approved' | 'approved' | 'verified' | 'rejected' | 'expired';

export interface IVerificationDocuments {
  businessLicense?: string;
  insuranceCertificate?: string;
  workPhotos?: string[];
  submittedAt?: Date;
}

export interface IVerificationResult {
  status: 'approved' | 'rejected' | 'needs_review';
  confidence: number;
  notes: string;
  reviewedAt: Date;
  reviewedBy: 'ai' | 'admin';
  adminId?: Types.ObjectId;
  aiRecommendation?: 'approved' | 'rejected' | 'needs_review'; // AI's recommendation for admin reference only
}

// ============================================
// LEGACY: ServiceCategory (kept for backward compatibility)
// NEW: Use ContractorType from @/config/contractor-types
// ============================================
export type ServiceCategory = 
  | 'track-construction'
  | 'track-maintenance'
  | 'signal-systems'
  | 'electrical'
  | 'bridge-structures'
  | 'environmental'
  | 'surveying'
  | 'engineering'
  | 'equipment-rental'
  | 'material-supply'
  | 'demolition'
  | 'welding'
  | 'inspection'
  | 'consulting'
  | 'training'
  | 'emergency-response'
  | 'other';

// ============================================
// STRUCTURED CONTRACTOR TYPES (NEW)
// ============================================
// Primary contractor types from config
export type ContractorTypeValue = 
  | 'track-construction'
  | 'railcar-repair'
  | 'locomotive-service'
  | 'mow'
  | 'signal-communications'
  | 'electrical-power'
  | 'environmental'
  | 'hazmat-spill'
  | 'emergency-response'
  | 'rerail-derailment'
  | 'inspection-compliance'
  | 'transport-logistics'
  | 'scrap-decommission'
  | 'engineering-consulting'
  | 'other';

// Selected sub-services structure
export interface ISelectedSubServices {
  [contractorType: string]: string[]; // contractorType -> array of sub-service IDs
}

// "Other" type additional info
export interface IOtherTypeInfo {
  description: string; // Max 150 chars, required if "other" is selected
  submittedAt: Date;
  normalized?: boolean; // Admin has reviewed and normalized
  normalizedTo?: ContractorTypeValue[]; // Admin-assigned types after review
}

export interface IAddress {
  street?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface IDocument {
  name: string;
  url: string;
  type: 'insurance' | 'safety' | 'license' | 'certification' | 'other';
  expirationDate?: Date;
  uploadedAt: Date;
}

export interface IContractorProfile {
  userId: Types.ObjectId;
  // Business Info
  businessName: string;
  businessDescription: string;
  businessPhone: string;
  businessEmail: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  address: IAddress;
  
  // ============================================
  // STRUCTURED CONTRACTOR TYPES (PRIMARY CLASSIFICATION)
  // ============================================
  // Primary contractor types - REQUIRED, at least one must be selected
  contractorTypes: ContractorTypeValue[];
  // Selected sub-services for each contractor type (optional)
  subServices?: ISelectedSubServices;
  // "Other" type info - required if "other" is in contractorTypes
  otherTypeInfo?: IOtherTypeInfo;
  
  // ============================================
  // LEGACY: Services (kept for backward compatibility)
  // ============================================
  services: ServiceCategory[];
  serviceDescription?: string;
  regionsServed: string[];
  yearsInBusiness: number;
  numberOfEmployees?: string;
  equipmentOwned?: string[];
  // Certifications & Documents
  documents: IDocument[];
  insuranceVerified: boolean;
  safetyRecordVerified: boolean;
  // Verification
  verificationStatus: VerificationStatus;
  verificationDocuments?: IVerificationDocuments;
  verificationResult?: IVerificationResult;
  verifiedAt?: Date;
  verifiedBadgePurchased: boolean;
  verifiedBadgeExpiresAt?: Date;
  renewalRemindersSent?: {
    thirtyDay?: Date;
    sevenDay?: Date;
    dayOf?: Date;
  };
  
  // ============================================
  // PAID VISIBILITY TIER (Required for any directory visibility)
  // ============================================
  // visibilityTier: 'none' | 'verified' | 'featured' | 'priority'
  // No tier = not visible anywhere. 'verified' = base paid tier.
  visibilityTier: 'none' | 'verified' | 'featured' | 'priority';
  visibilitySubscriptionStatus: 'none' | 'active' | 'past_due' | 'canceled' | 'expired';
  visibilitySubscriptionId?: string; // Stripe subscription ID
  visibilityExpiresAt?: Date;
  
  // Verification gate (must pass BEFORE subscribing to visibility tier)
  verificationPurchasedAt?: Date;
  verificationPaymentId?: string; // Stripe payment intent ID
  
  // ============================================
  // BUYER AUDIT: Enhanced contractor discovery
  // ============================================
  
  // Certifications
  certifications?: {
    fra?: {
      certified: boolean;
      certificationNumber?: string;
      expiresAt?: Date;
    };
    aar?: {
      certified: boolean;
      certificationNumber?: string;
      expiresAt?: Date;
    };
    osha?: {
      tenHour?: boolean;
      thirtyHour?: boolean;
      certificationDate?: Date;
    };
    drugFreeWorkplace?: boolean;
    dotCompliant?: boolean;
  };
  
  // Safety record
  safetyRecord?: {
    emrRating?: number;           // Experience Modification Rate
    incidentRate?: number;        // OSHA incident rate
    lastSafetyAudit?: Date;
    yearsWithoutIncident?: number;
  };
  
  // Insurance details (pulled from verification)
  insuranceDetails?: {
    generalLiability?: number;    // Coverage amount
    workersComp?: boolean;
    professionalLiability?: number;
    autoLiability?: number;
    expiresAt?: Date;
  };
  
  // Project portfolio
  projectPortfolio?: {
    title: string;
    description: string;
    images: string[];
    completedAt?: Date;
    clientName?: string;
    projectValue?: number;
  }[];
  
  // Availability calendar
  availability?: {
    status: 'available' | 'limited' | 'booked';
    bookedUntil?: Date;
    nextAvailableDate?: Date;
    notes?: string;
  };
  
  // Major equipment owned
  majorEquipment?: {
    name: string;
    type: string;
    quantity?: number;
    description?: string;
  }[];
  
  // Service area map (for geospatial)
  serviceAreaCoordinates?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  
  // Response metrics
  responseMetrics?: {
    avgResponseTimeHours?: number;
    responseTimeLabel?: 'within-1h' | 'within-4h' | 'within-24h' | 'within-48h' | 'slow';
    totalInquiriesReceived?: number;
    quotesProvided?: number;
  };
  
  // Portfolio
  photos: string[];
  portfolioImages: string[];
  equipmentImages: string[];
  projectHighlights?: string[];
  // Social
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  // Status
  isPublished: boolean;
  isActive: boolean;
  profileCompleteness: number;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface IContractorProfileMethods {
  calculateCompleteness(): number;
  isVerified(): boolean;
  isVisibleInSearch(): boolean;  // HARD gate: verified + paid visibility tier
  getSearchRankBoost(): number;  // For sorting by tier
}

export interface IContractorProfileDocument 
  extends IContractorProfile, 
    IContractorProfileMethods, 
    Document {}

export interface IContractorProfileModel extends Model<IContractorProfileDocument> {
  findByUserId(userId: string | Types.ObjectId): Promise<IContractorProfileDocument | null>;
  findVerifiedContractors(limit?: number): Promise<IContractorProfileDocument[]>;
  findByRegion(region: string): Promise<IContractorProfileDocument[]>;
  findByService(service: ServiceCategory): Promise<IContractorProfileDocument[]>;
}

// ============================================
// SUB-SCHEMAS
// ============================================

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: 'USA', trim: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },
  },
  { _id: false }
);

const DocumentSchema = new Schema<IDocument>(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ['insurance', 'safety', 'license', 'certification', 'other'],
      required: true,
    },
    expirationDate: { type: Date },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ============================================
// MAIN SCHEMA
// ============================================

const ContractorProfileSchema = new Schema<
  IContractorProfileDocument,
  IContractorProfileModel
>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Business Info
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters'],
    },
    businessDescription: {
      type: String,
      required: [true, 'Business description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    businessPhone: {
      type: String,
      required: [true, 'Business phone is required'],
      trim: true,
    },
    businessEmail: {
      type: String,
      required: [true, 'Business email is required'],
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    address: {
      type: AddressSchema,
      required: true,
    },
    
    // ============================================
    // STRUCTURED CONTRACTOR TYPES (PRIMARY CLASSIFICATION)
    // ============================================
    contractorTypes: {
      type: [String],
      enum: [
        'track-construction',
        'railcar-repair',
        'locomotive-service',
        'mow',
        'signal-communications',
        'electrical-power',
        'environmental',
        'hazmat-spill',
        'emergency-response',
        'rerail-derailment',
        'inspection-compliance',
        'transport-logistics',
        'scrap-decommission',
        'engineering-consulting',
        'other',
      ],
      required: [true, 'At least one contractor type is required'],
      validate: [
        {
          validator: function (v: string[]) {
            return v.length > 0;
          },
          message: 'At least one contractor type must be selected',
        },
        {
          validator: function (v: string[]) {
            // Cannot select ONLY "other"
            if (v.length === 1 && v[0] === 'other') {
              return false;
            }
            return true;
          },
          message: 'Cannot select only "Other". Please select at least one primary contractor type.',
        },
      ],
      index: true,
    },
    subServices: {
      type: Schema.Types.Mixed, // { [contractorType]: string[] }
      default: {},
    },
    otherTypeInfo: {
      description: {
        type: String,
        maxlength: [150, 'Other description cannot exceed 150 characters'],
        trim: true,
      },
      submittedAt: { type: Date },
      normalized: { type: Boolean, default: false },
      normalizedTo: [{ type: String }],
    },
    
    // ============================================
    // LEGACY: Services (kept for backward compatibility)
    // ============================================
    services: {
      type: [String],
      enum: [
        'track-construction',
        'track-maintenance',
        'signal-systems',
        'electrical',
        'bridge-structures',
        'environmental',
        'surveying',
        'engineering',
        'equipment-rental',
        'material-supply',
        'demolition',
        'welding',
        'inspection',
        'consulting',
        'training',
        'emergency-response',
        'other',
      ],
      default: [],
    },
    serviceDescription: {
      type: String,
      trim: true,
      maxlength: [1000, 'Service description cannot exceed 1000 characters'],
    },
    regionsServed: {
      type: [String],
      required: [true, 'At least one region is required'],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one region must be selected',
      },
    },
    yearsInBusiness: {
      type: Number,
      required: [true, 'Years in business is required'],
      min: [0, 'Years in business cannot be negative'],
    },
    numberOfEmployees: {
      type: String,
      enum: ['1-10', '11-50', '51-100', '101-500', '500+'],
    },
    equipmentOwned: {
      type: [String],
    },
    // Documents
    documents: {
      type: [DocumentSchema],
      default: [],
    },
    insuranceVerified: {
      type: Boolean,
      default: false,
    },
    safetyRecordVerified: {
      type: Boolean,
      default: false,
    },
    // Verification
    verificationStatus: {
      type: String,
      enum: ['none', 'pending', 'ai_approved', 'approved', 'verified', 'rejected', 'expired'],
      default: 'none',
    },
    verificationDocuments: {
      businessLicense: { type: String },
      insuranceCertificate: { type: String },
      workPhotos: { type: [String], default: [] },
      submittedAt: { type: Date },
    },
    verificationResult: {
      status: { type: String, enum: ['approved', 'rejected', 'needs_review'] },
      confidence: { type: Number },
      notes: { type: String },
      reviewedAt: { type: Date },
      reviewedBy: { type: String, enum: ['ai', 'admin'] },
      adminId: { type: Schema.Types.ObjectId, ref: 'User' },
      aiRecommendation: { type: String, enum: ['approved', 'rejected', 'needs_review'] },
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBadgePurchased: {
      type: Boolean,
      default: false,
    },
    verifiedBadgeExpiresAt: {
      type: Date,
    },
    renewalRemindersSent: {
      thirtyDay: { type: Date },
      sevenDay: { type: Date },
      dayOf: { type: Date },
    },
    
    // ============================================
    // PAID VISIBILITY TIER (Required for any directory visibility)
    // ============================================
    visibilityTier: {
      type: String,
      enum: ['none', 'verified', 'featured', 'priority'],
      default: 'none',
      index: true,
    },
    visibilitySubscriptionStatus: {
      type: String,
      enum: ['none', 'active', 'past_due', 'canceled', 'expired'],
      default: 'none',
      index: true,
    },
    visibilitySubscriptionId: {
      type: String,
      sparse: true, // Allow null/undefined but enforce uniqueness when set
    },
    visibilityExpiresAt: {
      type: Date,
    },
    verificationPurchasedAt: {
      type: Date,
    },
    verificationPaymentId: {
      type: String,
    },
    
    // ============================================
    // BUYER AUDIT: Enhanced contractor discovery schema
    // ============================================
    
    // Certifications
    certifications: {
      fra: {
        certified: { type: Boolean, default: false },
        certificationNumber: { type: String },
        expiresAt: { type: Date },
      },
      aar: {
        certified: { type: Boolean, default: false },
        certificationNumber: { type: String },
        expiresAt: { type: Date },
      },
      osha: {
        tenHour: { type: Boolean, default: false },
        thirtyHour: { type: Boolean, default: false },
        certificationDate: { type: Date },
      },
      drugFreeWorkplace: { type: Boolean, default: false },
      dotCompliant: { type: Boolean, default: false },
    },
    
    // Safety record
    safetyRecord: {
      emrRating: { type: Number },
      incidentRate: { type: Number },
      lastSafetyAudit: { type: Date },
      yearsWithoutIncident: { type: Number },
    },
    
    // Insurance details
    insuranceDetails: {
      generalLiability: { type: Number },
      workersComp: { type: Boolean },
      professionalLiability: { type: Number },
      autoLiability: { type: Number },
      expiresAt: { type: Date },
    },
    
    // Project portfolio
    projectPortfolio: [{
      title: { type: String, required: true },
      description: { type: String },
      images: [{ type: String }],
      completedAt: { type: Date },
      clientName: { type: String },
      projectValue: { type: Number },
    }],
    
    // Availability calendar
    availability: {
      status: { 
        type: String, 
        enum: ['available', 'limited', 'booked'],
        default: 'available',
      },
      bookedUntil: { type: Date },
      nextAvailableDate: { type: Date },
      notes: { type: String },
    },
    
    // Major equipment owned
    majorEquipment: [{
      name: { type: String, required: true },
      type: { type: String },
      quantity: { type: Number },
      description: { type: String },
    }],
    
    // Service area map
    serviceAreaCoordinates: {
      type: { type: String, enum: ['Polygon'] },
      coordinates: { type: [[[Number]]] },
    },
    
    // Response metrics
    responseMetrics: {
      avgResponseTimeHours: { type: Number },
      responseTimeLabel: { 
        type: String, 
        enum: ['within-1h', 'within-4h', 'within-24h', 'within-48h', 'slow'],
      },
      totalInquiriesReceived: { type: Number, default: 0 },
      quotesProvided: { type: Number, default: 0 },
    },
    
    // Portfolio
    photos: {
      type: [String],
      default: [],
    },
    portfolioImages: {
      type: [String],
      default: [],
    },
    equipmentImages: {
      type: [String],
      default: [],
    },
    projectHighlights: {
      type: [String],
      default: [],
    },
    // Social
    socialLinks: {
      linkedin: { type: String },
      facebook: { type: String },
      twitter: { type: String },
    },
    // Status
    isPublished: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
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

ContractorProfileSchema.index({ businessName: 'text', businessDescription: 'text' });
ContractorProfileSchema.index({ services: 1 });
ContractorProfileSchema.index({ regionsServed: 1 });
ContractorProfileSchema.index({ verificationStatus: 1 });
ContractorProfileSchema.index({ isPublished: 1, isActive: 1 });
ContractorProfileSchema.index({ 'address.state': 1 });
ContractorProfileSchema.index({ 'address.city': 1 });
ContractorProfileSchema.index({ verifiedBadgePurchased: 1, verificationStatus: 1 });
ContractorProfileSchema.index({ 'address.coordinates': '2dsphere' });

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Calculate profile completeness percentage
 */
ContractorProfileSchema.methods.calculateCompleteness = function (): number {
  const fields = [
    { field: 'businessName', weight: 10 },
    { field: 'businessDescription', weight: 10 },
    { field: 'businessPhone', weight: 5 },
    { field: 'businessEmail', weight: 5 },
    { field: 'website', weight: 5 },
    { field: 'logo', weight: 10 },
    { field: 'coverImage', weight: 5 },
    { field: 'address', weight: 10 },
    { field: 'services', weight: 10, isArray: true },
    { field: 'regionsServed', weight: 10, isArray: true },
    { field: 'yearsInBusiness', weight: 5 },
    { field: 'photos', weight: 10, isArray: true },
    { field: 'documents', weight: 5, isArray: true },
  ];

  let completeness = 0;

  for (const { field, weight, isArray } of fields) {
    const value = this[field as keyof typeof this];
    if (isArray) {
      if (Array.isArray(value) && value.length > 0) {
        completeness += weight;
      }
    } else if (value && value !== '') {
      completeness += weight;
    }
  }

  return Math.min(completeness, 100);
};

/**
 * Check if contractor is verified
 */
ContractorProfileSchema.methods.isVerified = function (): boolean {
  return this.verificationStatus === 'verified';
};

/**
 * HARD VISIBILITY GATE
 * Contractor MUST be:
 * 1. Verified (verificationStatus === 'verified')
 * 2. Have an active paid visibility tier (visibilityTier !== 'none')
 * 3. Subscription must be active (visibilitySubscriptionStatus === 'active')
 * 4. Visibility must not be expired
 */
ContractorProfileSchema.methods.isVisibleInSearch = function (): boolean {
  // Gate 1: Must be verified
  if (this.verificationStatus !== 'verified') {
    return false;
  }
  
  // Gate 2: Must have a paid visibility tier
  if (!this.visibilityTier || this.visibilityTier === 'none') {
    return false;
  }
  
  // Gate 3: Subscription must be active
  if (this.visibilitySubscriptionStatus !== 'active') {
    return false;
  }
  
  // Gate 4: Visibility must not be expired
  if (this.visibilityExpiresAt && new Date(this.visibilityExpiresAt) < new Date()) {
    return false;
  }
  
  // Gate 5: Verification must not be expired
  if (this.verifiedBadgeExpiresAt && new Date(this.verifiedBadgeExpiresAt) < new Date()) {
    return false;
  }
  
  return true;
};

/**
 * Get search rank boost based on visibility tier
 */
ContractorProfileSchema.methods.getSearchRankBoost = function (): number {
  if (!this.isVisibleInSearch()) {
    return 0;
  }
  
  switch (this.visibilityTier) {
    case 'priority':
      return 3.0;
    case 'featured':
      return 2.0;
    case 'verified':
      return 1.0;
    default:
      return 0;
  }
};

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Calculate completeness before saving
 */
ContractorProfileSchema.pre('save', function () {
  this.profileCompleteness = this.calculateCompleteness();
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find contractor profile by user ID
 */
ContractorProfileSchema.statics.findByUserId = async function (
  userId: string | Types.ObjectId
): Promise<IContractorProfileDocument | null> {
  return this.findOne({ userId });
};

/**
 * Find PAID VERIFIED contractors (HARD VISIBILITY GATE)
 * Only returns contractors who:
 * 1. Are verified
 * 2. Have an active paid visibility tier
 * 3. Have active subscription
 * 4. Are not expired
 * 
 * Sorted by visibility tier (priority > featured > verified)
 */
ContractorProfileSchema.statics.findVerifiedContractors = async function (
  limit = 20
): Promise<IContractorProfileDocument[]> {
  const now = new Date();
  
  return this.find({
    // HARD GATE: Must be verified
    verificationStatus: 'verified',
    // HARD GATE: Must have a paid visibility tier
    visibilityTier: { $in: ['verified', 'featured', 'priority'] },
    // HARD GATE: Subscription must be active
    visibilitySubscriptionStatus: 'active',
    // HARD GATE: Visibility not expired
    $or: [
      { visibilityExpiresAt: { $gt: now } },
      { visibilityExpiresAt: { $exists: false } },
    ],
    // HARD GATE: Verification not expired
    $and: [
      {
        $or: [
          { verifiedBadgeExpiresAt: { $gt: now } },
          { verifiedBadgeExpiresAt: { $exists: false } },
        ],
      },
    ],
    isPublished: true,
    isActive: true,
  })
    // Sort by tier: priority first, then featured, then verified
    .sort({ 
      visibilityTier: -1, // 'priority' > 'featured' > 'verified' alphabetically reversed
      createdAt: -1,
    })
    .limit(limit);
};

/**
 * Find contractors by region
 */
ContractorProfileSchema.statics.findByRegion = async function (
  region: string
): Promise<IContractorProfileDocument[]> {
  return this.find({
    regionsServed: { $in: [region] },
    isPublished: true,
    isActive: true,
  }).sort({ verifiedBadgePurchased: -1, verificationStatus: 1 });
};

/**
 * Find contractors by service
 */
ContractorProfileSchema.statics.findByService = async function (
  service: ServiceCategory
): Promise<IContractorProfileDocument[]> {
  return this.find({
    services: { $in: [service] },
    isPublished: true,
    isActive: true,
  }).sort({ verifiedBadgePurchased: -1, verificationStatus: 1 });
};

// ============================================
// MODEL EXPORT
// ============================================

const ContractorProfile: IContractorProfileModel =
  (mongoose.models.ContractorProfile as IContractorProfileModel) ||
  mongoose.model<IContractorProfileDocument, IContractorProfileModel>(
    'ContractorProfile',
    ContractorProfileSchema
  );

export default ContractorProfile;
