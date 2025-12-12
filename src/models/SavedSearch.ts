/**
 * THE RAIL EXCHANGE™ — Saved Search Model
 * 
 * Users can save search queries to receive notifications
 * when new matching listings are added.
 * 
 * BUYER AUDIT UPGRADE: Extended filter support for equipment-specific searches
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

// Extended filters interface for equipment-specific searches
export interface ISavedSearchFilters {
  // Basic filters
  categories?: string[];
  conditions?: string[];
  minPrice?: number;
  maxPrice?: number;
  state?: string;
  city?: string;
  
  // BUYER AUDIT: Equipment-specific filters
  reportingMarks?: string;
  manufacturers?: string[];
  model?: string;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  minHorsepower?: number;
  maxHorsepower?: number;
  minEngineHours?: number;
  maxEngineHours?: number;
  minMileage?: number;
  maxMileage?: number;
  fraCompliant?: boolean;
  aarCarTypes?: string[];
  availability?: string[];
  sellerTypes?: string[];
  verifiedSellerOnly?: boolean;
  minQuantity?: number;
  
  // Radius search
  radiusLat?: number;
  radiusLng?: number;
  radiusMiles?: number;
}

export interface ISavedSearch extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  query: string;
  filters: ISavedSearchFilters;
  notifyOnMatch: boolean;
  notifyFrequency: 'instant' | 'daily' | 'weekly';
  lastNotifiedAt?: Date;
  matchCount: number;
  newMatchCount: number; // BUYER AUDIT: Track new matches since last view
  lastViewedAt?: Date;   // BUYER AUDIT: Track when user last viewed results
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SavedSearchSchema = new Schema<ISavedSearch>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Search name is required'],
      maxlength: 100,
      trim: true,
    },
    query: {
      type: String,
      default: '',
      maxlength: 200,
    },
    filters: {
      // Basic filters
      categories: [{ type: String }],
      conditions: [{ type: String }],
      minPrice: { type: Number },
      maxPrice: { type: Number },
      state: { type: String },
      city: { type: String },
      
      // BUYER AUDIT: Equipment-specific filters
      reportingMarks: { type: String },
      manufacturers: [{ type: String }],
      model: { type: String },
      minYearBuilt: { type: Number },
      maxYearBuilt: { type: Number },
      minHorsepower: { type: Number },
      maxHorsepower: { type: Number },
      minEngineHours: { type: Number },
      maxEngineHours: { type: Number },
      minMileage: { type: Number },
      maxMileage: { type: Number },
      fraCompliant: { type: Boolean },
      aarCarTypes: [{ type: String }],
      availability: [{ type: String }],
      sellerTypes: [{ type: String }],
      verifiedSellerOnly: { type: Boolean },
      minQuantity: { type: Number },
      
      // Radius search
      radiusLat: { type: Number },
      radiusLng: { type: Number },
      radiusMiles: { type: Number },
    },
    notifyOnMatch: {
      type: Boolean,
      default: true,
    },
    notifyFrequency: {
      type: String,
      enum: ['instant', 'daily', 'weekly'],
      default: 'daily',
    },
    lastNotifiedAt: Date,
    matchCount: {
      type: Number,
      default: 0,
    },
    newMatchCount: {
      type: Number,
      default: 0,
    },
    lastViewedAt: Date,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user queries
SavedSearchSchema.index({ userId: 1, isActive: 1 });
SavedSearchSchema.index({ notifyOnMatch: 1, notifyFrequency: 1, lastNotifiedAt: 1 });

export default mongoose.models.SavedSearch ||
  mongoose.model<ISavedSearch>('SavedSearch', SavedSearchSchema);
