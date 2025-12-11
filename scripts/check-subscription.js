/**
 * THE RAIL EXCHANGE™ — Check Subscription Status
 * 
 * Debug script to check a user's subscription status in the database.
 * 
 * Usage: node scripts/check-subscription.js <email>
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let value = match[2].trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1].trim()] = value;
    }
  });
}

async function checkSubscription(email) {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      console.error('MONGODB_URI or DATABASE_URL not found in .env.local');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Define minimal User schema for query
    const UserSchema = new mongoose.Schema({
      email: String,
      name: String,
      role: String,
      sellerTier: String,
      sellerSubscriptionStatus: String,
      sellerSubscriptionId: String,
      contractorTier: String,
      contractorSubscriptionStatus: String,
      contractorSubscriptionId: String,
      subscriptionCurrentPeriodEnd: Date,
      subscriptionCancelAtPeriodEnd: Boolean,
      stripeCustomerId: String,
      usedPromoCodes: Array,
    }, { strict: false });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('='.repeat(60));
    console.log('USER SUBSCRIPTION STATUS');
    console.log('='.repeat(60));
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`🎭 Role: ${user.role}`);
    console.log('');
    console.log('--- SELLER SUBSCRIPTION ---');
    console.log(`💼 Seller Tier: ${user.sellerTier || 'buyer (no subscription)'}`);
    console.log(`📊 Status: ${user.sellerSubscriptionStatus || 'N/A'}`);
    console.log(`🔑 Subscription ID: ${user.sellerSubscriptionId || 'N/A'}`);
    console.log('');
    console.log('--- CONTRACTOR SUBSCRIPTION ---');
    console.log(`🔧 Contractor Tier: ${user.contractorTier || 'free'}`);
    console.log(`📊 Status: ${user.contractorSubscriptionStatus || 'N/A'}`);
    console.log(`🔑 Subscription ID: ${user.contractorSubscriptionId || 'N/A'}`);
    console.log('');
    console.log('--- BILLING ---');
    console.log(`💳 Stripe Customer ID: ${user.stripeCustomerId || 'N/A'}`);
    console.log(`📅 Current Period End: ${user.subscriptionCurrentPeriodEnd || 'N/A'}`);
    console.log(`🚫 Cancel at Period End: ${user.subscriptionCancelAtPeriodEnd || false}`);
    console.log('');
    
    if (user.usedPromoCodes && user.usedPromoCodes.length > 0) {
      console.log('--- USED PROMO CODES ---');
      user.usedPromoCodes.forEach((promo, i) => {
        console.log(`  ${i + 1}. ${promo.code} (${promo.tier}) - Used: ${promo.usedAt}`);
      });
    } else {
      console.log('--- USED PROMO CODES ---');
      console.log('  No promo codes recorded');
    }
    
    console.log('');
    console.log('='.repeat(60));

    // Check for issues
    console.log('');
    console.log('DIAGNOSTIC CHECKS:');
    
    if (user.sellerTier === 'buyer' || !user.sellerTier) {
      console.log('⚠️  User is on buyer tier (no seller subscription active)');
    }
    
    if (!user.sellerSubscriptionId && user.sellerTier !== 'buyer') {
      console.log('⚠️  Has seller tier but no Stripe subscription ID');
    }
    
    if (!user.stripeCustomerId) {
      console.log('⚠️  No Stripe customer ID - checkout may not have completed');
    }
    
    if (user.sellerSubscriptionStatus === 'trialing') {
      console.log('✅ User is on a TRIAL subscription');
      if (user.subscriptionCurrentPeriodEnd) {
        const daysLeft = Math.ceil((new Date(user.subscriptionCurrentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`   Trial ends in ${daysLeft} days`);
      }
    }
    
    if (user.sellerSubscriptionStatus === 'active') {
      console.log('✅ Subscription is ACTIVE');
    }

    if (!user.sellerSubscriptionStatus && user.sellerTier && user.sellerTier !== 'buyer') {
      console.log('❌ PROBLEM: Has tier but no status - webhook may not have fired');
    }

    console.log('');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: node scripts/check-subscription.js <email>');
  console.log('Example: node scripts/check-subscription.js admin@example.com');
  process.exit(1);
}

checkSubscription(email);
