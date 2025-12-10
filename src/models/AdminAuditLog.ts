/**
 * THE RAIL EXCHANGE™ — Admin Audit Log Model
 * 
 * Tracks all admin actions for compliance and accountability.
 * 
 * #10 fix: Persist admin audit trails instead of console.log
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IAdminAuditLog extends Document {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  adminEmail: string;
  action: 'delete_photo' | 'delete_listing' | 'suspend_user' | 'verify_contractor' | 'reject_contractor' | 'edit_listing' | 'refund' | 'other';
  targetType: 'listing' | 'user' | 'contractor' | 'photo' | 'addon' | 'other';
  targetId: Types.ObjectId;
  targetTitle?: string;
  details: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

interface IAdminAuditLogModel extends Model<IAdminAuditLog> {
  logAction(params: {
    adminId: string | Types.ObjectId;
    adminEmail: string;
    action: IAdminAuditLog['action'];
    targetType: IAdminAuditLog['targetType'];
    targetId: string | Types.ObjectId;
    targetTitle?: string;
    details?: Record<string, unknown>;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<IAdminAuditLog>;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['delete_photo', 'delete_listing', 'suspend_user', 'verify_contractor', 'reject_contractor', 'edit_listing', 'refund', 'other'],
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['listing', 'user', 'contractor', 'photo', 'addon', 'other'],
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetTitle: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    reason: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
AdminAuditLogSchema.index({ action: 1, createdAt: -1 });
AdminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
AdminAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

// Only export createdAt timestamp (no updatedAt since logs are immutable)
AdminAuditLogSchema.set('toJSON', {
  virtuals: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

// Helper static method to log admin actions
AdminAuditLogSchema.statics.logAction = async function (params: {
  adminId: string | Types.ObjectId;
  adminEmail: string;
  action: IAdminAuditLog['action'];
  targetType: IAdminAuditLog['targetType'];
  targetId: string | Types.ObjectId;
  targetTitle?: string;
  details?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return this.create({
    adminId: new Types.ObjectId(params.adminId.toString()),
    adminEmail: params.adminEmail,
    action: params.action,
    targetType: params.targetType,
    targetId: new Types.ObjectId(params.targetId.toString()),
    targetTitle: params.targetTitle,
    details: params.details || {},
    reason: params.reason,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
};

export default (mongoose.models.AdminAuditLog as IAdminAuditLogModel) ||
  mongoose.model<IAdminAuditLog, IAdminAuditLogModel>('AdminAuditLog', AdminAuditLogSchema);
