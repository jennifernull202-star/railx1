/**
 * Script to make a user an admin
 * Usage: node scripts/make-admin.js <email>
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function makeAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: node scripts/make-admin.js <email>');
    console.log('Example: node scripts/make-admin.js jennnull4@gmail.com');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected!');

    const result = await mongoose.connection.db.collection('users').findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { role: 'admin' } },
      { returnDocument: 'after' }
    );

    if (result) {
      console.log(`✅ Successfully updated ${email} to admin role`);
      console.log('User:', {
        email: result.email,
        name: result.name,
        role: result.role
      });
    } else {
      console.log(`❌ User with email ${email} not found`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

makeAdmin();
