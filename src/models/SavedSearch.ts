/**
 * THE RAIL EXCHANGE™ — Saved Search Model
 * 
 * Users can save search queries to receive notifications
 * when new matching listings are added.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISavedSearch extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  query: string;
  filters: {
    categories?: string[];
    conditions?: string[];
    minPrice?: number;
    maxPrice?: number;
    state?: string;
    city?: string;
  };
  notifyOnMatch: boolean;
  notifyFrequency: 'instant' | 'daily' | 'weekly';
  lastNotifiedAt?: Date;
  matchCount: number;
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
      categories: [{ type: String }],
      conditions: [{ type: String }],
      minPrice: { type: Number },
      maxPrice: { type: Number },
      state: { type: String },
      city: { type: String },
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

export default mongoose.models.SavedSearch ||
  mongoose.model<ISavedSearch>('SavedSearch', SavedSearchSchema);
