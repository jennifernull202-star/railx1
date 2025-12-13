/**
 * THE RAIL EXCHANGE™ — Listing Report Model
 * 
 * SECURITY: User-submitted reports for suspicious listings.
 * Enables community-driven fraud detection.
 * 
 * RULES:
 * 1. Auto-flag listings with multiple reports
 * 2. Escalate to admin review queue
 * 3. Track report patterns for abuse detection
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// Report reason categories
export const REPORT_REASONS = [
  'fake_listing',           // Listing appears to be fake/fraudulent
  'misleading_price',       // Price is misleading or bait-and-switch
  'wrong_category',         // Listed in wrong category
  'stolen_images',          // Images appear stolen from elsewhere
  'spam',                   // Spam or duplicate listing
  'scam',                   // Appears to be a scam
  'sold_item',              // Item already sold but still listed
  'counterfeit',            // Counterfeit or misrepresented item
  'safety_concern',         // Safety or legal concern
  'other',                  // Other reason
] as const;

export type ReportReason = typeof REPORT_REASONS[number];

// Report status
export const REPORT_STATUSES = [
  'pending',      // Awaiting review
  'reviewing',    // Under admin review
  'valid',        // Report confirmed valid
  'invalid',      // Report was false/unfounded
  'duplicate',    // Duplicate of another report
] as const;

export type ReportStatus = typeof REPORT_STATUSES[number];

// Report interface
export interface IListingReport {
  listingId: Types.ObjectId;
  reporterId: Types.ObjectId;
  reason: ReportReason;
  description: string;
  evidence?: string[];       // URLs to screenshots/evidence
  status: ReportStatus;
  adminNotes?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  // Auto-flag tracking
  autoFlagged: boolean;
  flaggedAt?: Date;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface IListingReportDocument extends IListingReport, Document {}

export interface IListingReportModel extends Model<IListingReportDocument> {
  getReportCount(listingId: string | Types.ObjectId): Promise<number>;
  hasUserReported(listingId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<boolean>;
  getPendingReports(limit?: number): Promise<IListingReportDocument[]>;
  getReportsByListing(listingId: string | Types.ObjectId): Promise<IListingReportDocument[]>;
  // BATCH E-3: Serial reporter detection
  checkSerialReporter(userId: string | Types.ObjectId): Promise<{
    isSerialReporter: boolean;
    reportCountLast24h: number;
    reportCountLast7d: number;
    totalReports: number;
  }>;
}

const ListingReportSchema = new Schema<IListingReportDocument, IListingReportModel>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    evidence: [{
      type: String,
      maxlength: 500,
    }],
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: 'pending',
      index: true,
    },
    adminNotes: {
      type: String,
      maxlength: 2000,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    autoFlagged: {
      type: Boolean,
      default: false,
    },
    flaggedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
ListingReportSchema.index({ listingId: 1, reporterId: 1 }, { unique: true }); // One report per user per listing
ListingReportSchema.index({ status: 1, createdAt: -1 });
ListingReportSchema.index({ reason: 1, status: 1 });
ListingReportSchema.index({ reporterId: 1, createdAt: -1 }); // BATCH E-3: Serial reporter detection

// Auto-flag threshold - flag listing after this many unique reports
// S-1.4: Increased from 3 to 5 to reduce false positive auto-flags
const AUTO_FLAG_THRESHOLD = 5;

// BATCH E-3: Serial reporter thresholds (internal flagging only)
const SERIAL_REPORTER_24H_THRESHOLD = 5;   // More than 5 reports in 24 hours = flag
const SERIAL_REPORTER_7D_THRESHOLD = 15;   // More than 15 reports in 7 days = flag

// Static methods
ListingReportSchema.statics.getReportCount = async function (listingId: string | Types.ObjectId): Promise<number> {
  return this.countDocuments({ listingId: new Types.ObjectId(listingId.toString()) });
};

ListingReportSchema.statics.hasUserReported = async function (
  listingId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<boolean> {
  const report = await this.findOne({
    listingId: new Types.ObjectId(listingId.toString()),
    reporterId: new Types.ObjectId(userId.toString()),
  });
  return !!report;
};

ListingReportSchema.statics.getPendingReports = async function (limit = 50): Promise<IListingReportDocument[]> {
  return this.find({ status: 'pending' })
    .populate('listingId', 'title slug primaryImageUrl sellerId')
    .populate('reporterId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

ListingReportSchema.statics.getReportsByListing = async function (
  listingId: string | Types.ObjectId
): Promise<IListingReportDocument[]> {
  return this.find({ listingId: new Types.ObjectId(listingId.toString()) })
    .populate('reporterId', 'name email')
    .sort({ createdAt: -1 });
};

// BATCH E-3: Serial reporter detection
// Checks if a user exhibits serial reporting behavior
// Internal flagging only - no user-facing action
ListingReportSchema.statics.checkSerialReporter = async function (
  userId: string | Types.ObjectId
): Promise<{
  isSerialReporter: boolean;
  reportCountLast24h: number;
  reportCountLast7d: number;
  totalReports: number;
}> {
  const userObjectId = new Types.ObjectId(userId.toString());
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [reportCountLast24h, reportCountLast7d, totalReports] = await Promise.all([
    this.countDocuments({ reporterId: userObjectId, createdAt: { $gte: oneDayAgo } }),
    this.countDocuments({ reporterId: userObjectId, createdAt: { $gte: sevenDaysAgo } }),
    this.countDocuments({ reporterId: userObjectId }),
  ]);

  const isSerialReporter =
    reportCountLast24h > SERIAL_REPORTER_24H_THRESHOLD ||
    reportCountLast7d > SERIAL_REPORTER_7D_THRESHOLD;

  return {
    isSerialReporter,
    reportCountLast24h,
    reportCountLast7d,
    totalReports,
  };
};

// Post-save hook to auto-flag listings with multiple reports
// BATCH E-3: Also updates report metadata on listing
ListingReportSchema.post('save', async function (doc) {
  try {
    const Listing = mongoose.model('Listing');
    const ReportModel = mongoose.model('ListingReport') as IListingReportModel;
    
    const reportCount = await ReportModel.getReportCount(doc.listingId);
    
    // BATCH E-3: Get unique reporter count
    const uniqueReporters = await ReportModel.distinct('reporterId', { listingId: doc.listingId });
    const uniqueReporterCount = uniqueReporters.length;
    
    // Update listing metadata regardless of auto-flag
    await Listing.updateOne(
      { _id: doc.listingId },
      {
        $set: {
          reportCount,
          uniqueReporterCount,
          lastReportAt: new Date(),
        },
      }
    );
    
    if (reportCount >= AUTO_FLAG_THRESHOLD) {
      // Auto-flag the listing
      await Listing.updateOne(
        { _id: doc.listingId },
        {
          $set: {
            isFlagged: true,
            flagReason: `Auto-flagged: ${reportCount} user reports from ${uniqueReporterCount} unique reporters`,
          },
        }
      );
      
      // Mark this report as the one that triggered the flag
      await ReportModel.updateOne(
        { _id: doc._id },
        { $set: { autoFlagged: true, flaggedAt: new Date() } }
      );
      
      console.log(`Listing ${doc.listingId} auto-flagged with ${reportCount} reports from ${uniqueReporterCount} unique reporters`);
    }
  } catch (error) {
    console.error('Error in auto-flag hook:', error);
  }
});

const ListingReport =
  (mongoose.models.ListingReport as IListingReportModel) ||
  mongoose.model<IListingReportDocument, IListingReportModel>('ListingReport', ListingReportSchema);

export default ListingReport;
