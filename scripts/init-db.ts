#!/usr/bin/env tsx

import { execSync } from 'child_process';

async function main() {
  console.log('🚀 Initializing database...\n');

  try {
    console.log('1️⃣ Generating Prisma client...');
    execSync('npm run db:generate', { stdio: 'inherit' });

    console.log('\n2️⃣ Pushing schema to database...');
    execSync('npm run db:push', { stdio: 'inherit' });

    console.log('\n3️⃣ Seeding database with sample data...');
    execSync('npm run db:seed', { stdio: 'inherit' });

    console.log('\n✅ Database initialization complete!');
    console.log(
      "🎉 You can now start the development server with 'npm run dev'"
    );
  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error('Make sure your DATABASE_URL is configured in .env.local');
    console.error(
      'Example: DATABASE_URL="postgresql://username:password@localhost:5432/career_counseling_chat"'
    );
    process.exit(1);
  }
}

main().catch(console.error);
