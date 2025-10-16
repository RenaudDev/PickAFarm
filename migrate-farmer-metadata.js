/**
 * One-time Migration Script: Move Farmer Metadata
 *
 * Migrates farmer role from unsafeMetadata to publicMetadata
 * so middleware can access it via session claims.
 *
 * Usage:
 *   node migrate-farmer-metadata.js <userId>
 *
 * Example:
 *   node migrate-farmer-metadata.js user_2abc123xyz
 */

import { createClerkClient } from '@clerk/backend';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error('❌ Error: CLERK_SECRET_KEY environment variable not set');
  process.exit(1);
}

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: Missing userId argument');
  console.log('\nUsage: node migrate-farmer-metadata.js <userId>');
  console.log('Example: node migrate-farmer-metadata.js user_2abc123xyz\n');
  process.exit(1);
}

const clerkClient = createClerkClient({
  secretKey: CLERK_SECRET_KEY,
});

async function migrateUserMetadata() {
  try {
    console.log(`\n🔍 Fetching user: ${userId}`);

    // Get the user
    const user = await clerkClient.users.getUser(userId);

    console.log(`✅ User found: ${user.emailAddresses[0]?.emailAddress || 'N/A'}`);
    console.log(`\n📋 Current metadata:`);
    console.log(`   unsafeMetadata:`, user.unsafeMetadata);
    console.log(`   publicMetadata:`, user.publicMetadata);

    // Extract role, farmId, and claimToken from unsafeMetadata
    const role = user.unsafeMetadata?.role;
    const farmId = user.unsafeMetadata?.farmId;
    const claimToken = user.unsafeMetadata?.claimToken;

    if (!role && !farmId && !claimToken) {
      console.log('\n⚠️  No farmer metadata found in unsafeMetadata. Nothing to migrate.');
      process.exit(0);
    }

    // Prepare the new publicMetadata
    const newPublicMetadata = { ...user.publicMetadata };

    if (role) newPublicMetadata.role = role;
    if (farmId) newPublicMetadata.farmId = farmId;
    if (claimToken) newPublicMetadata.claimToken = claimToken;

    console.log(`\n🔄 Migrating to publicMetadata:`, newPublicMetadata);

    // Update the user
    await clerkClient.users.updateUser(userId, {
      publicMetadata: newPublicMetadata,
    });

    console.log('\n✅ Migration successful!');
    console.log('\n📝 Next steps:');
    console.log('   1. User should sign out and sign back in');
    console.log('   2. Middleware will now be able to detect farmer role');
    console.log('   3. Visit /debug-auth to verify publicMetadata is set');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.errors) {
      console.error('Details:', error.errors);
    }
    process.exit(1);
  }
}

migrateUserMetadata();
