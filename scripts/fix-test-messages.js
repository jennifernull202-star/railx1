/**
 * Fix Test Messages Script
 * 
 * Creates test messages with the correct Thread/Message schema.
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

async function fixTestMessages() {
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

    console.log('Found seller:', seller._id.toString());
    console.log('Found buyer:', buyer._id.toString());
    console.log('Found listing:', listing?._id?.toString() || 'none');

    // Delete old test messages and threads
    const delMessages = await db.collection('messages').deleteMany({
      $or: [
        { sender: seller._id },
        { sender: buyer._id },
        { senderId: seller._id },
        { senderId: buyer._id },
        { recipientId: seller._id },
        { recipientId: buyer._id }
      ]
    });
    console.log('Deleted old messages:', delMessages.deletedCount);

    const delThreads = await db.collection('threads').deleteMany({
      participants: { $in: [seller._id, buyer._id] }
    });
    console.log('Deleted old threads:', delThreads.deletedCount);

    // Create a thread with correct schema
    const threadResult = await db.collection('threads').insertOne({
      participants: [buyer._id, seller._id],
      listingId: listing?._id,
      lastMessage: {
        content: "Yes, I'd like to inspect it. I'm available next week. What days work for you?",
        senderId: buyer._id,
        createdAt: new Date(Date.now() - 3600000 * 2)
      },
      unreadCount: {
        [seller._id.toString()]: 1,
        [buyer._id.toString()]: 0
      },
      isArchived: {},
      createdAt: new Date(Date.now() - 3600000 * 48),
      updatedAt: new Date(Date.now() - 3600000 * 2)
    });
    
    const threadId = threadResult.insertedId;
    console.log('Created thread:', threadId.toString());

    // Create messages with correct schema
    const messages = [
      {
        senderId: buyer._id,
        recipientId: seller._id,
        threadId: threadId,
        content: "Hi! I'm interested in your EMD SD40-2 locomotive. Is it still available?",
        attachments: [],
        listingId: listing?._id,
        isRead: true,
        readAt: new Date(Date.now() - 3600000 * 24),
        createdAt: new Date(Date.now() - 3600000 * 48),
        updatedAt: new Date(Date.now() - 3600000 * 48)
      },
      {
        senderId: seller._id,
        recipientId: buyer._id,
        threadId: threadId,
        content: "Hello! Yes, it's still available. It's in excellent running condition with recent maintenance records.",
        attachments: [],
        listingId: listing?._id,
        isRead: true,
        readAt: new Date(Date.now() - 3600000 * 20),
        createdAt: new Date(Date.now() - 3600000 * 24),
        updatedAt: new Date(Date.now() - 3600000 * 24)
      },
      {
        senderId: buyer._id,
        recipientId: seller._id,
        threadId: threadId,
        content: "Great! What's the engine hours on it? And can you share the maintenance records?",
        attachments: [],
        listingId: listing?._id,
        isRead: true,
        readAt: new Date(Date.now() - 3600000 * 10),
        createdAt: new Date(Date.now() - 3600000 * 18),
        updatedAt: new Date(Date.now() - 3600000 * 18)
      },
      {
        senderId: seller._id,
        recipientId: buyer._id,
        threadId: threadId,
        content: "It has about 45,000 hours. I can email you the full maintenance history. Would you like to schedule an inspection?",
        attachments: [],
        listingId: listing?._id,
        isRead: true,
        readAt: new Date(Date.now() - 3600000 * 5),
        createdAt: new Date(Date.now() - 3600000 * 12),
        updatedAt: new Date(Date.now() - 3600000 * 12)
      },
      {
        senderId: buyer._id,
        recipientId: seller._id,
        threadId: threadId,
        content: "Yes, I'd like to inspect it. I'm available next week. What days work for you?",
        attachments: [],
        listingId: listing?._id,
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 2),
        updatedAt: new Date(Date.now() - 3600000 * 2)
      }
    ];

    const result = await db.collection('messages').insertMany(messages);
    console.log('Created', result.insertedCount, 'messages');

    console.log('\n========================================');
    console.log('🎉 TEST MESSAGES FIXED!');
    console.log('========================================');
    console.log('\n📧 Test Accounts:');
    console.log('   Seller: testseller@railexchange.com');
    console.log('   Buyer:  testbuyer@railexchange.com');
    console.log('   Password: TestPassword123!');
    console.log('\n📬 To test messaging:');
    console.log('   1. Login as testseller@railexchange.com');
    console.log('   2. Go to /dashboard/messages');
    console.log('   3. You should see 1 conversation with 1 unread message');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixTestMessages();
