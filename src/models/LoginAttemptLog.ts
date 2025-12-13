/**
 * THE RAIL EXCHANGE™ — Login Attempt Log Model
 * 
 * Tracks failed login attempts for security audit compliance.
 * Enterprise requirement: Audit trail for authentication failures.
 * 
 * NO UI - Server-side logging only.
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface ILoginAttemptLog extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  email: string;
  ipAddress: string;
  userAgent?: string;
  reason: 'invalid_credentials' | 'account_not_found' | 'account_inactive' | 'session_expired' | 'idle_timeout';
  success: boolean;
  createdAt: Date;
}

interface ILoginAttemptLogModel extends Model<ILoginAttemptLog> {
  logAttempt(params: {
    userId?: string | Types.ObjectId;
    email: string;
    ipAddress: string;
    userAgent?: string;
    reason: ILoginAttemptLog['reason'];
    success: boolean;
  }): Promise<ILoginAttemptLog>;
  
  getRecentFailures(email: string, windowMinutes?: number): Promise<number>;
}

const LoginAttemptLogSchema = new Schema<ILoginAttemptLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
    },
    reason: {
      type: String,
      required: true,
      enum: ['invalid_credentials', 'account_not_found', 'account_inactive', 'session_expired', 'idle_timeout'],
    },
    success: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for efficient queries
LoginAttemptLogSchema.index({ email: 1, createdAt: -1 });
LoginAttemptLogSchema.index({ ipAddress: 1, createdAt: -1 });
LoginAttemptLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // Auto-delete after 90 days

// Static method to log login attempts
LoginAttemptLogSchema.statics.logAttempt = async function (params: {
  userId?: string | Types.ObjectId;
  email: string;
  ipAddress: string;
  userAgent?: string;
  reason: ILoginAttemptLog['reason'];
  success: boolean;
}) {
  return this.create({
    userId: params.userId ? new Types.ObjectId(params.userId.toString()) : undefined,
    email: params.email.toLowerCase(),
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    reason: params.reason,
    success: params.success,
  });
};

// Static method to get recent failures for an email (for rate limiting visibility)
LoginAttemptLogSchema.statics.getRecentFailures = async function (
  email: string,
  windowMinutes = 60
): Promise<number> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  return this.countDocuments({
    email: email.toLowerCase(),
    success: false,
    createdAt: { $gte: since },
  });
};

export default (mongoose.models.LoginAttemptLog as ILoginAttemptLogModel) ||
  mongoose.model<ILoginAttemptLog, ILoginAttemptLogModel>('LoginAttemptLog', LoginAttemptLogSchema);
