/**
 * THE RAIL EXCHANGE™ — MongoDB Connection Utility
 * 
 * Provides a singleton database connection using Mongoose.
 * Handles connection caching for serverless environments (Vercel).
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL || '';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Connect to MongoDB
 * Returns a cached connection if available, otherwise creates a new one.
 */
async function connectDB(): Promise<typeof mongoose> {
  // Skip connection during build time if no DATABASE_URL
  if (!MONGODB_URI) {
    console.warn('⚠️ DATABASE_URL not set - skipping MongoDB connection');
    throw new Error('Database not configured');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB
 * Useful for graceful shutdown in production.
 */
async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('🔌 MongoDB disconnected');
  }
}

/**
 * Check if MongoDB is connected
 */
function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Get connection status
 */
function getConnectionStatus(): string {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
}

export { connectDB, disconnectDB, isConnected, getConnectionStatus };
export default connectDB;
