/**
 * THE RAIL EXCHANGE™ — Stripe Event Model
 * 
 * SECURITY: Stores processed Stripe webhook event IDs for idempotency.
 * Prevents duplicate processing of webhook events.
 * 
 * RULE: If event.id exists in this collection, skip processing.
 * RULE: Fail closed on DB errors - return 500, not 200.
 */

import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IStripeEvent {
  eventId: string;          // Stripe event ID (evt_xxx)
  eventType: string;        // Event type (checkout.session.completed, etc.)
  processedAt: Date;        // When we processed it
  status: 'processed' | 'failed' | 'skipped';
  metadata?: Record<string, unknown>;
  error?: string;           // Error message if failed
}

export interface IStripeEventDocument extends IStripeEvent, Document {}

export interface IStripeEventModel extends Model<IStripeEventDocument> {
  isProcessed(eventId: string): Promise<boolean>;
  markProcessed(eventId: string, eventType: string, metadata?: Record<string, unknown>): Promise<IStripeEventDocument>;
  markFailed(eventId: string, eventType: string, error: string): Promise<IStripeEventDocument>;
}

const StripeEventSchema = new Schema<IStripeEventDocument, IStripeEventModel>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['processed', 'failed', 'skipped'],
      default: 'processed',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index - auto-delete events after 90 days
StripeEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

/**
 * Check if an event has already been processed
 */
StripeEventSchema.statics.isProcessed = async function (eventId: string): Promise<boolean> {
  const existing = await this.findOne({ eventId });
  return !!existing;
};

/**
 * Mark an event as processed
 */
StripeEventSchema.statics.markProcessed = async function (
  eventId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<IStripeEventDocument> {
  return this.create({
    eventId,
    eventType,
    status: 'processed',
    processedAt: new Date(),
    metadata,
  });
};

/**
 * Mark an event as failed
 */
StripeEventSchema.statics.markFailed = async function (
  eventId: string,
  eventType: string,
  error: string
): Promise<IStripeEventDocument> {
  return this.create({
    eventId,
    eventType,
    status: 'failed',
    processedAt: new Date(),
    error,
  });
};

const StripeEvent =
  (mongoose.models.StripeEvent as IStripeEventModel) ||
  mongoose.model<IStripeEventDocument, IStripeEventModel>('StripeEvent', StripeEventSchema);

export default StripeEvent;
