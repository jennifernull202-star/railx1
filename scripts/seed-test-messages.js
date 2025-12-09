/**
 * Seed Test Messages Script
 * 
 * Creates test users, a listing, and sample messages for testing the messaging system.
 * 
 * Usage: node scripts/seed-test-messages.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  // Skip comments and empty lines
  if (line.startsWith('#') || !line.trim()) return;
  
  const eqIndex = line.indexOf('=');
  if (eqIndex === -1) return;
  
  const key = line.substring(0, eqIndex).trim();
  let value = line.substring(eqIndex + 1).trim();
  
  // Remove surrounding quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  
  if (key) {
    process.env[key] = value;
  }
});

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI/DATABASE_URL not found in .env.local');
  process.exit(1);
}

// Define schemas inline to avoid ESM/CJS issues
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: { type: String, default: 'buyer' },
  isActive: { type: Boolean, default: true },
  sellerTier: { type: String, default: 'basic' },
  contractorTier: { type: String, default: 'free' },
}, { timestamps: true });

const ListingSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  condition: String,
  price: Number,
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'active' },
  images: [String],
  location: {
    city: String,
    state: String,
    country: String,
  },
}, { timestamps: true });

const MessageSchema = new mongoose.Schema({
  conversationId: String,
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  content: String,
  read: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

async function seedTestMessages() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    const Listing = mongoose.models.Listing || mongoose.model('Listing', ListingSchema);
    const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

    // Create test password
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);

    // Create or find Seller user
    let seller = await User.findOne({ email: 'testseller@railexchange.com' });
    if (!seller) {
      seller = await User.create({
        name: 'Test Seller',
        email: 'testseller@railexchange.com',
        password: hashedPassword,
        role: 'seller',
        sellerTier: 'plus',
      });
      console.log('✅ Created test seller:', seller.email);
    } else {
      console.log('ℹ️  Test seller already exists:', seller.email);
    }

    // Create or find Buyer user
    let buyer = await User.findOne({ email: 'testbuyer@railexchange.com' });
    if (!buyer) {
      buyer = await User.create({
        name: 'Test Buyer',
        email: 'testbuyer@railexchange.com',
        password: hashedPassword,
        role: 'buyer',
      });
      console.log('✅ Created test buyer:', buyer.email);
    } else {
      console.log('ℹ️  Test buyer already exists:', buyer.email);
    }

    // Create or find test listing
    let listing = await Listing.findOne({ seller: seller._id, title: /Test Locomotive/i });
    if (!listing) {
      listing = await Listing.create({
        title: 'Test Locomotive - EMD SD40-2',
        description: 'Well-maintained EMD SD40-2 locomotive. Perfect for testing the messaging system.',
        category: 'locomotives',
        condition: 'good',
        price: 150000,
        seller: seller._id,
        status: 'active',
        images: [],
        location: {
          city: 'Chicago',
          state: 'IL',
          country: 'USA',
        },
      });
      console.log('✅ Created test listing:', listing.title);
    } else {
      console.log('ℹ️  Test listing already exists:', listing.title);
    }

    // Create conversation ID
    const conversationId = [buyer._id.toString(), seller._id.toString()].sort().join('-') + '-' + listing._id.toString();

    // Check if messages already exist
    const existingMessages = await Message.countDocuments({ conversationId });
    if (existingMessages > 0) {
      console.log(`ℹ️  ${existingMessages} messages already exist in this conversation`);
    }

    // Create sample messages
    const messages = [
      {
        conversationId,
        sender: buyer._id,
        recipient: seller._id,
        listing: listing._id,
        content: 'Hi! I\'m interested in your EMD SD40-2 locomotive. Is it still available?',
        read: true,
        readAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
        createdAt: new Date(Date.now() - 3600000 * 48), // 2 days ago
      },
      {
        conversationId,
        sender: seller._id,
        recipient: buyer._id,
        listing: listing._id,
        content: 'Hello! Yes, it\'s still available. It\'s in excellent running condition with recent maintenance records.',
        read: true,
        readAt: new Date(Date.now() - 3600000 * 20),
        createdAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
      },
      {
        conversationId,
        sender: buyer._id,
        recipient: seller._id,
        listing: listing._id,
        content: 'Great! What\'s the engine hours on it? And can you share the maintenance records?',
        read: true,
        readAt: new Date(Date.now() - 3600000 * 10),
        createdAt: new Date(Date.now() - 3600000 * 18),
      },
      {
        conversationId,
        sender: seller._id,
        recipient: buyer._id,
        listing: listing._id,
        content: 'It has about 45,000 hours. I can email you the full maintenance history. Would you like to schedule an inspection?',
        read: true,
        readAt: new Date(Date.now() - 3600000 * 5),
        createdAt: new Date(Date.now() - 3600000 * 12),
      },
      {
        conversationId,
        sender: buyer._id,
        recipient: seller._id,
        listing: listing._id,
        content: 'Yes, I\'d like to inspect it. I\'m available next week. What days work for you?',
        read: false, // Unread message for seller
        createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      },
    ];

    // Insert messages
    for (const msg of messages) {
      await Message.create(msg);
    }
    console.log(`✅ Created ${messages.length} test messages`);

    console.log('\n========================================');
    console.log('🎉 TEST DATA CREATED SUCCESSFULLY!');
    console.log('========================================');
    console.log('\n📧 Test Accounts:');
    console.log('   Seller: testseller@railexchange.com');
    console.log('   Buyer:  testbuyer@railexchange.com');
    console.log('   Password: TestPassword123!');
    console.log('\n📬 To test messaging:');
    console.log('   1. Login as testseller@railexchange.com');
    console.log('   2. Go to /dashboard/messages');
    console.log('   3. You should see 1 unread message from Test Buyer');
    console.log('   4. Login as testbuyer@railexchange.com to see the other side');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedTestMessages();
