/**
 * SEV-1 DIAGNOSTIC: Check admin user status
 * Usage: node scripts/check-admin.js <email>
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkAdmin() {
  const email = process.argv[2] || 'jennnull4@gmail.com';

  try {
    console.log('=== SEV-1 ADMIN DIAGNOSTIC ===\n');
    console.log('Connecting to database...');
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ Connected!\n');

    const user = await mongoose.connection.db.collection('users').findOne(
      { email: email.toLowerCase() }
    );

    if (!user) {
      console.log(`❌ User with email ${email} NOT FOUND in database`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('=== USER FOUND ===');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('ID:', user._id.toString());
    console.log('');
    console.log('=== ROLE & ADMIN FLAGS ===');
    console.log('role (legacy):', user.role);
    console.log('isAdmin:', user.isAdmin);
    console.log('isActive:', user.isActive);
    console.log('');
    console.log('=== CAPABILITY FLAGS ===');
    console.log('isSeller:', user.isSeller);
    console.log('isContractor:', user.isContractor);
    console.log('');
    console.log('=== PASSWORD CHECK ===');
    console.log('password field exists:', !!user.password);
    console.log('password length:', user.password ? user.password.length : 0);
    console.log('password starts with $2:', user.password ? user.password.startsWith('$2') : false);
    console.log('');
    console.log('=== SUBSCRIPTION ===');
    console.log('sellerTier:', user.sellerTier);
    console.log('stripeCustomerId:', user.stripeCustomerId);
    console.log('');
    console.log('=== LAST LOGIN ===');
    console.log('lastLogin:', user.lastLogin);

    // Identify issues
    console.log('\n=== DIAGNOSTIC RESULTS ===');
    const issues = [];
    
    if (user.role !== 'admin') {
      issues.push('❌ role is NOT "admin" (value: ' + user.role + ')');
    } else {
      console.log('✅ role = admin');
    }
    
    if (user.isAdmin !== true) {
      issues.push('❌ isAdmin is NOT true (value: ' + user.isAdmin + ')');
    } else {
      console.log('✅ isAdmin = true');
    }
    
    if (user.isActive !== true) {
      issues.push('❌ isActive is NOT true (value: ' + user.isActive + ')');
    } else {
      console.log('✅ isActive = true');
    }
    
    if (!user.password) {
      issues.push('❌ password field is MISSING');
    } else if (!user.password.startsWith('$2')) {
      issues.push('❌ password is NOT a bcrypt hash');
    } else {
      console.log('✅ password appears to be valid bcrypt hash');
    }

    if (issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      issues.forEach(i => console.log('  ' + i));
      console.log('\nRUN FIX: node scripts/make-admin.js ' + email);
    } else {
      console.log('\n✅ ALL CHECKS PASSED - Admin user is properly configured');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAdmin();
