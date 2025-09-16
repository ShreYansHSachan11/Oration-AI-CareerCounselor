#!/usr/bin/env tsx

import { testDatabaseConnection } from '../src/lib/test-db';

async function main() {
  console.log('🚀 Testing database and authentication setup...\n');

  const dbResult = await testDatabaseConnection();

  if (dbResult.success) {
    console.log('\n✅ Database setup verification complete!');
    console.log('📋 Next steps:');
    console.log('   1. Set up your DATABASE_URL in .env.local');
    console.log("   2. Run 'npm run db:push' to create tables");
    console.log("   3. Run 'npm run db:seed' to add sample data");
    console.log('   4. Configure your Google OAuth credentials');
  } else {
    console.log('\n❌ Database setup needs attention:');
    console.log(`   Error: ${dbResult.error}`);
    console.log('   Make sure your DATABASE_URL is configured correctly');
  }
}

main().catch(console.error);
