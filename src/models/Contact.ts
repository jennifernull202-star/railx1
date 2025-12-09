import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContact extends Document {
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  category: 'support' | 'general' | 'marketplace' | 'contractor';
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: [150, 'Company name cannot exceed 150 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['support', 'general', 'marketplace', 'contractor'],
        message: 'Invalid category selected',
      },
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

// Index for admin queries
ContactSchema.index({ status: 1, createdAt: -1 });
ContactSchema.index({ email: 1 });

const Contact: Model<IContact> =
  mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;
