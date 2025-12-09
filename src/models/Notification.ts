/**
 * THE RAIL EXCHANGE™ — Notification Model
 * 
 * Stores user notifications for various events:
 * - New messages/inquiries
 * - Listing approvals
 * - Contractor verification
 * - Add-on expirations
 * - Saved search matches
 * - Price changes on watchlist items
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export const NOTIFICATION_TYPES = {
  // Messaging
  NEW_INQUIRY: 'new_inquiry',
  NEW_MESSAGE: 'new_message',
  
  // Listings
  LISTING_APPROVED: 'listing_approved',
  LISTING_REJECTED: 'listing_rejected',
  LISTING_EXPIRED: 'listing_expired',
  LISTING_SOLD: 'listing_sold',
  
  // Watchlist
  WATCHLIST_PRICE_CHANGE: 'watchlist_price_change',
  WATCHLIST_STATUS_CHANGE: 'watchlist_status_change',
  
  // Saved searches
  SAVED_SEARCH_MATCH: 'saved_search_match',
  
  // Contractors
  CONTRACTOR_VERIFIED: 'contractor_verified',
  CONTRACTOR_REJECTED: 'contractor_rejected',
  REVIEW_RECEIVED: 'review_received',
  
  // Add-ons
  ADDON_EXPIRING: 'addon_expiring',
  ADDON_EXPIRED: 'addon_expired',
  
  // System
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  WELCOME: 'welcome',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  isEmailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: [true, 'Notification type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: 200,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: 1000,
    },
    link: {
      type: String,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    isEmailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // Auto-delete after 90 days

// Static method to create notification with optional email
NotificationSchema.statics.createNotification = async function(
  data: {
    userId: Types.ObjectId | string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    data?: Record<string, unknown>;
  }
) {
  const notification = new this({
    userId: typeof data.userId === 'string' ? new Types.ObjectId(data.userId) : data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link,
    data: data.data,
  });

  await notification.save();
  return notification;
};

export default mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
