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
}

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

export interface IAddress {
  street?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
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
  // Services & Capabilities
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
    // Services & Capabilities
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
      required: [true, 'At least one service is required'],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one service must be selected',
      },
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
 * Find verified contractors
 */
ContractorProfileSchema.statics.findVerifiedContractors = async function (
  limit = 20
): Promise<IContractorProfileDocument[]> {
  return this.find({
    verificationStatus: 'verified',
    isPublished: true,
    isActive: true,
  })
    .sort({ verifiedBadgePurchased: -1, createdAt: -1 })
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
