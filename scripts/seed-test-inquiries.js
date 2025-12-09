/**
 * Seed Test Inquiries Script
 * 
 * Creates test inquiries (conversations) with the correct Inquiry schema.
 * This is what the /dashboard/messages page actually uses.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  if (line.startsWith('#') || !line.trim()) return;
  const eqIndex = line.indexOf('=');
  if (eqIndex === -1) return;
  const key = line.substring(0, eqIndex).trim();
  let value = line.substring(eqIndex + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
});

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

async function seedTestInquiries() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Get test users
    const seller = await db.collection('users').findOne({ email: 'testseller@railexchange.com' });
    const buyer = await db.collection('users').findOne({ email: 'testbuyer@railexchange.com' });
    const listing = await db.collection('listings').findOne({ title: /Test Locomotive/ });

    if (!seller || !buyer) {
      console.log('❌ Test users not found. Run seed-test-messages.js first.');
      await mongoose.disconnect();
      return;
    }

    if (!listing) {
      console.log('❌ Test listing not found.');
      await mongoose.disconnect();
      return;
    }

    console.log('Found seller:', seller._id.toString(), seller.name);
    console.log('Found buyer:', buyer._id.toString(), buyer.name);
    console.log('Found listing:', listing._id.toString(), listing.title);

    // Delete old test inquiries
    const deleted = await db.collection('inquiries').deleteMany({
      $or: [
        { buyer: buyer._id },
        { seller: seller._id }
      ]
    });
    console.log('Deleted old inquiries:', deleted.deletedCount);

    // Create an inquiry with conversation messages
    const now = new Date();
    const inquiry = {
      listing: listing._id,
      buyer: buyer._id,
      seller: seller._id,
      subject: `Inquiry about: ${listing.title}`,
      status: 'replied',
      messages: [
        {
          _id: new mongoose.Types.ObjectId(),
          sender: buyer._id,
          content: "Hi! I'm interested in your EMD SD40-2 locomotive. Is it still available?",
          attachments: [],
          createdAt: new Date(now - 3600000 * 48) // 2 days ago
        },
        {
          _id: new mongoose.Types.ObjectId(),
          sender: seller._id,
          content: "Hello! Yes, it's still available. It's in excellent running condition with recent maintenance records.",
          attachments: [],
          createdAt: new Date(now - 3600000 * 24) // 1 day ago
        },
        {
          _id: new mongoose.Types.ObjectId(),
          sender: buyer._id,
          content: "Great! What's the engine hours on it? And can you share the maintenance records?",
          attachments: [],
          createdAt: new Date(now - 3600000 * 18)
        },
        {
          _id: new mongoose.Types.ObjectId(),
          sender: seller._id,
          content: "It has about 45,000 hours. I can email you the full maintenance history. Would you like to schedule an inspection?",
          attachments: [],
          createdAt: new Date(now - 3600000 * 12)
        },
        {
          _id: new mongoose.Types.ObjectId(),
          sender: buyer._id,
          content: "Yes, I'd like to inspect it. I'm available next week. What days work for you?",
          attachments: [],
          createdAt: new Date(now - 3600000 * 2) // 2 hours ago
        }
      ],
      lastMessageAt: new Date(now - 3600000 * 2),
      buyerUnreadCount: 0,
      sellerUnreadCount: 1, // Seller has 1 unread
      isArchived: false,
      createdAt: new Date(now - 3600000 * 48),
      updatedAt: new Date(now - 3600000 * 2)
    };

    const result = await db.collection('inquiries').insertOne(inquiry);
    console.log('Created inquiry:', result.insertedId.toString());

    console.log('\n========================================');
    console.log('🎉 TEST INQUIRY CREATED!');
    console.log('========================================');
    console.log('\n📧 Test Accounts:');
    console.log('   Seller: testseller@railexchange.com');
    console.log('   Buyer:  testbuyer@railexchange.com');
    console.log('   Password: TestPassword123!');
    console.log('\n📬 To test messaging:');
    console.log('   1. Login as testseller@railexchange.com');
    console.log('   2. Go to /dashboard/messages');
    console.log('   3. Click "Seller" tab');
    console.log('   4. You should see 1 inquiry with 1 unread message');
    console.log('\n   Or login as testbuyer@railexchange.com');
    console.log('   and click "Buyer" tab to see the same conversation');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedTestInquiries();
