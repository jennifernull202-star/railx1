# Scripts Directory

## Migration Scripts

### User Model Migration (Role → Capability Flags)

The user model has been migrated from role-based (`role: 'buyer' | 'seller' | 'contractor' | 'admin'`) to capability-based permissions:

- `isSeller: boolean` (default: true) - Can list items for sale
- `isContractor: boolean` (default: false) - Can access contractor features
- `isAdmin: boolean` (default: false) - Admin access

**Migration Script:** Create `migrateUsers.js` to run:

```javascript
// One-time migration for existing users
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function migrateUsers() {
  await mongoose.connect(process.env.DATABASE_URL);
  
  // Set isAdmin for all admin role users
  await mongoose.connection.db.collection('users').updateMany(
    { role: 'admin' },
    { $set: { isAdmin: true } }
  );
  
  // Set isContractor for all contractor role users
  await mongoose.connection.db.collection('users').updateMany(
    { role: 'contractor' },
    { $set: { isContractor: true } }
  );
  
  // isSeller defaults to true in schema, so no migration needed
  
  console.log('Migration complete');
  await mongoose.disconnect();
}

migrateUsers();
```

**Auth Fallback:** The auth.ts file includes a fallback for migration:
```typescript
isAdmin: user.isAdmin ?? (user.role === 'admin')
```

This ensures existing admin users work without running migration.

## Utility Scripts

### make-admin.js
Makes a user an admin.
```bash
node scripts/make-admin.js <email>
```

### check-subscription.js
Check a user's subscription status.

### seed-test-inquiries.js / seed-test-messages.js
Seed test data for development.

### remove-test-contractors.js
Clean up test contractor data.

### fix-test-messages.js
Fix test message data.
