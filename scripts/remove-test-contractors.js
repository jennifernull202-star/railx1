/**
 * THE RAIL EXCHANGE™ — Remove Test Contractors Script
 * 
 * This script removes test contractor profiles from the database.
 * Run with: node scripts/remove-test-contractors.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

// ContractorProfile schema (simplified for this script)
const contractorProfileSchema = new mongoose.Schema({
  businessName: String,
  businessDescription: String,
  isActive: Boolean,
  isPublished: Boolean,
}, { timestamps: true });

const ContractorProfile = mongoose.models.ContractorProfile || mongoose.model('ContractorProfile', contractorProfileSchema);

async function removeTestContractors() {
  try {
    const mongoUri = envVars.DATABASE_URL;
    
    if (!mongoUri) {
      console.error('❌ DATABASE_URL not found in .env.local');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all contractors
    const allContractors = await ContractorProfile.find({});
    console.log(`📊 Found ${allContractors.length} total contractor profiles:`);
    
    allContractors.forEach((c, i) => {
      console.log(`  ${i + 1}. "${c.businessName}" (ID: ${c._id})`);
    });

    // Find test contractors (names containing "test", "demo", "sample", etc.)
    const testContractors = await ContractorProfile.find({
      $or: [
        { businessName: { $regex: /test/i } },
        { businessName: { $regex: /demo/i } },
        { businessName: { $regex: /sample/i } },
        { businessDescription: { $regex: /test/i } },
      ]
    });

    if (testContractors.length === 0) {
      console.log('\n✅ No test contractors found to remove.');
    } else {
      console.log(`\n🗑️  Found ${testContractors.length} test contractors to remove:`);
      testContractors.forEach((c, i) => {
        console.log(`  ${i + 1}. "${c.businessName}"`);
      });

      // Delete them
      const result = await ContractorProfile.deleteMany({
        $or: [
          { businessName: { $regex: /test/i } },
          { businessName: { $regex: /demo/i } },
          { businessName: { $regex: /sample/i } },
          { businessDescription: { $regex: /test/i } },
        ]
      });

      console.log(`\n✅ Deleted ${result.deletedCount} test contractor profiles.`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

removeTestContractors();
