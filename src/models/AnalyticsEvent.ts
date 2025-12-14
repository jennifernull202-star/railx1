/**
 * THE RAIL EXCHANGE™ — Analytics Event Model
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ANALYTICS EXPANSION (POST-PROFILES)                                     │
 * │                                                                          │
 * │ This model tracks:                                                       │
 * │ • Outbound clicks (website, LinkedIn, phone, email)                     │
 * │ • Source attribution (Search, Map, Profile, Listing, Direct)            │
 * │ • Map visibility (impressions, opens, click-through)                    │
 * │ • Page views with referrer tracking                                     │
 * │                                                                          │
 * │ PRIVACY: Aggregate counts only. No PII stored.                          │
 * │ Daily aggregation for efficient querying.                               │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ENTITLEMENT RULES (LOCKED):
 * - Buyers: Never see analytics
 * - Sellers: Only if analytics add-on purchased
 * - Professionals (Contractor/Company): Always included
 */

import mongoose, { Document, Schema } from 'mongoose';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Target types for analytics tracking
 */
export type AnalyticsTargetType = 'listing' | 'contractor' | 'seller' | 'company';

/**
 * Click types for outbound tracking
 */
export type AnalyticsClickType = 'phone' | 'email' | 'website' | 'linkedin' | 'inquiry';

/**
 * Source attribution - where did the user come from?
 */
export type AnalyticsSource = 'search' | 'map' | 'profile' | 'listing' | 'direct' | 'external';

/**
 * Event types for analytics
 */
export type AnalyticsEventType = 
  | 'outbound_click'   // Click on external link
  | 'page_view'        // Profile/listing view
  | 'map_impression'   // Appeared on map
  | 'map_open'         // Map marker clicked
  | 'search_impression'; // Appeared in search results

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

interface AnalyticsEventDocument extends Document {
  targetType: AnalyticsTargetType;
  targetId: mongoose.Types.ObjectId;
  eventType: AnalyticsEventType;
  clickType?: AnalyticsClickType; // Only for outbound_click events
  source: AnalyticsSource;
  date: Date; // Rounded to day for aggregation
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

const AnalyticsEventSchema = new Schema<AnalyticsEventDocument>({
  targetType: {
    type: String,
    enum: ['listing', 'contractor', 'seller', 'company'],
    required: true,
    index: true,
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    enum: ['outbound_click', 'page_view', 'map_impression', 'map_open', 'search_impression'],
    required: true,
    index: true,
  },
  clickType: {
    type: String,
    enum: ['phone', 'email', 'website', 'linkedin', 'inquiry'],
    required: false, // Only required for outbound_click events
  },
  source: {
    type: String,
    enum: ['search', 'map', 'profile', 'listing', 'direct', 'external'],
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  count: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPOUND INDEXES
// ═══════════════════════════════════════════════════════════════════════════

// Primary aggregation index - unique by target, event, click, source, day
AnalyticsEventSchema.index(
  { targetType: 1, targetId: 1, eventType: 1, clickType: 1, source: 1, date: 1 },
  { unique: true }
);

// Query patterns:
// - Get all events for a target in date range
AnalyticsEventSchema.index({ targetId: 1, date: -1 });
// - Get outbound clicks by type
AnalyticsEventSchema.index({ targetId: 1, eventType: 1, date: -1 });
// - Get source breakdown
AnalyticsEventSchema.index({ targetId: 1, source: 1, date: -1 });

// ═══════════════════════════════════════════════════════════════════════════
// MODEL EXPORT
// ═══════════════════════════════════════════════════════════════════════════

const AnalyticsEvent = mongoose.models.AnalyticsEvent || 
  mongoose.model<AnalyticsEventDocument>('AnalyticsEvent', AnalyticsEventSchema);

export default AnalyticsEvent;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get start of day for aggregation (no PII - just daily counts)
 */
export function getAggregationDate(date?: Date): Date {
  const d = date || new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get date range for time period queries
 */
export function getDateRange(days: 7 | 30 | 90): { start: Date; end: Date } {
  const end = getAggregationDate();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return { start, end };
}
