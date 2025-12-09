/**
 * THE RAIL EXCHANGE™ — Message Model
 * 
 * Schema for messaging between users.
 * Supports threads, attachments, and listing references.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// ============================================
// TYPES
// ============================================

export interface IAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface IMessage {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  threadId: Types.ObjectId;
  content: string;
  attachments: IAttachment[];
  listingId?: Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageDocument extends IMessage, Document {}

export interface IMessageModel extends Model<IMessageDocument> {
  findByThread(threadId: string | Types.ObjectId): Promise<IMessageDocument[]>;
  findUserThreads(userId: string | Types.ObjectId): Promise<IMessageDocument[]>;
  markThreadAsRead(threadId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<void>;
  getUnreadCount(userId: string | Types.ObjectId): Promise<number>;
}

// ============================================
// THREAD MODEL
// ============================================

export interface IThread {
  participants: Types.ObjectId[];
  listingId?: Types.ObjectId;
  lastMessage?: {
    content: string;
    senderId: Types.ObjectId;
    createdAt: Date;
  };
  unreadCount: Map<string, number>;
  isArchived: Map<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IThreadDocument extends IThread, Document {}

export interface IThreadModel extends Model<IThreadDocument> {
  findOrCreateThread(
    participant1: string | Types.ObjectId,
    participant2: string | Types.ObjectId,
    listingId?: string | Types.ObjectId
  ): Promise<IThreadDocument>;
  findUserThreads(userId: string | Types.ObjectId): Promise<IThreadDocument[]>;
}

// ============================================
// SUB-SCHEMAS
// ============================================

const AttachmentSchema = new Schema<IAttachment>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

// ============================================
// THREAD SCHEMA
// ============================================

const ThreadSchema = new Schema<IThreadDocument, IThreadModel>(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
    },
    lastMessage: {
      content: String,
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: Date,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    isArchived: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ThreadSchema.index({ participants: 1 });
ThreadSchema.index({ updatedAt: -1 });
ThreadSchema.index({ listingId: 1, participants: 1 });

// Static methods
ThreadSchema.statics.findOrCreateThread = async function(
  participant1: string | Types.ObjectId,
  participant2: string | Types.ObjectId,
  listingId?: string | Types.ObjectId
): Promise<IThreadDocument> {
  const p1 = new mongoose.Types.ObjectId(participant1);
  const p2 = new mongoose.Types.ObjectId(participant2);

  // Find existing thread between these participants
  let thread = await this.findOne({
    participants: { $all: [p1, p2] },
    ...(listingId && { listingId: new mongoose.Types.ObjectId(listingId) }),
  });

  if (!thread) {
    thread = await this.create({
      participants: [p1, p2],
      listingId: listingId ? new mongoose.Types.ObjectId(listingId) : undefined,
      unreadCount: new Map(),
      isArchived: new Map(),
    });
  }

  return thread;
};

ThreadSchema.statics.findUserThreads = async function(
  userId: string | Types.ObjectId
): Promise<IThreadDocument[]> {
  const id = new mongoose.Types.ObjectId(userId);
  
  return this.find({
    participants: id,
    [`isArchived.${id.toString()}`]: { $ne: true },
  })
    .populate('participants', 'name email image')
    .populate('listingId', 'title slug images')
    .sort({ updatedAt: -1 });
};

// ============================================
// MESSAGE SCHEMA
// ============================================

const MessageSchema = new Schema<IMessageDocument, IMessageModel>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },
    threadId: {
      type: Schema.Types.ObjectId,
      ref: 'Thread',
      required: [true, 'Thread is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
      trim: true,
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
      validate: {
        validator: (v: IAttachment[]) => v.length <= 10,
        message: 'Maximum 10 attachments allowed',
      },
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MessageSchema.index({ threadId: 1, createdAt: 1 });
MessageSchema.index({ recipientId: 1, isRead: 1 });

// Static methods
MessageSchema.statics.findByThread = async function(
  threadId: string | Types.ObjectId
): Promise<IMessageDocument[]> {
  return this.find({ threadId: new mongoose.Types.ObjectId(threadId) })
    .populate('senderId', 'name email image')
    .sort({ createdAt: 1 });
};

MessageSchema.statics.markThreadAsRead = async function(
  threadId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<void> {
  const tid = new mongoose.Types.ObjectId(threadId);
  const uid = new mongoose.Types.ObjectId(userId);

  await this.updateMany(
    { threadId: tid, recipientId: uid, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  // Update thread unread count
  const Thread = mongoose.models.Thread as IThreadModel;
  await Thread.updateOne(
    { _id: tid },
    { $set: { [`unreadCount.${uid.toString()}`]: 0 } }
  );
};

MessageSchema.statics.getUnreadCount = async function(
  userId: string | Types.ObjectId
): Promise<number> {
  return this.countDocuments({
    recipientId: new mongoose.Types.ObjectId(userId),
    isRead: false,
  });
};

// Post-save hook to update thread
MessageSchema.post('save', async function(doc) {
  const Thread = mongoose.models.Thread as IThreadModel;
  if (Thread) {
    await Thread.updateOne(
      { _id: doc.threadId },
      {
        lastMessage: {
          content: doc.content.substring(0, 100),
          senderId: doc.senderId,
          createdAt: doc.createdAt,
        },
        $inc: { [`unreadCount.${doc.recipientId.toString()}`]: 1 },
      }
    );
  }
});

// ============================================
// MODELS
// ============================================

const Thread = (mongoose.models.Thread as IThreadModel) || 
  mongoose.model<IThreadDocument, IThreadModel>('Thread', ThreadSchema);

const Message = (mongoose.models.Message as IMessageModel) || 
  mongoose.model<IMessageDocument, IMessageModel>('Message', MessageSchema);

export { Thread, Message };
export default Message;
