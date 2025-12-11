/**
 * THE RAIL EXCHANGE™ — User Model Migration Script
 * 
 * Migrates users from role-based to capability-based permission system.
 * 
 * Migration rules:
 * - ALL users get isSeller: true (everyone can sell)
 * - ONLY users with role === 'contractor' get isContractor: true
 * - ONLY users with role === 'admin' get isAdmin: true
 * - sellerVerificationStatus defaults to 'none'
 * - contractorVerificationStatus defaults to 'none'
 * 
 * Usage: node scripts/migrateUsers.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment');
  process.exit(1);
}

async function migrateUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${users.length} users to migrate`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Skip if already migrated (has isSeller field)
        if (user.isSeller !== undefined) {
          console.log(`⏭️  User ${user.email} already migrated, skipping...`);
          skipped++;
          continue;
        }

        const update = {
          $set: {
            // Capability flags
            isSeller: true, // ALL users can sell
            isContractor: user.role === 'contractor', // Only if previously contractor
            isAdmin: user.role === 'admin', // Only if previously admin
            
            // Seller Pro tier tracking
            sellerProActive: false,
            sellerProExpiresAt: null,
            
            // Verification statuses (migrate from existing verified seller fields if present)
            sellerVerificationStatus: user.verifiedSellerStatus || 'none',
            sellerVerificationSubscriptionId: user.verifiedSellerSubscriptionId || null,
            contractorVerificationStatus: user.contractorTier === 'verified' ? 'active' : 'none',
            contractorVerificationSubscriptionId: user.contractorSubscriptionId || null,
          },
        };

        await usersCollection.updateOne(
          { _id: user._id },
          update
        );

        console.log(`✅ Migrated user: ${user.email} (role: ${user.role}) → isSeller: true, isContractor: ${user.role === 'contractor'}, isAdmin: ${user.role === 'admin'}`);
        updated++;
      } catch (err) {
        console.error(`❌ Error migrating user ${user.email}:`, err.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total: ${users.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run migration
migrateUsers();
