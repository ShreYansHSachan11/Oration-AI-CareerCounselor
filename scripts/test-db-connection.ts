import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testConnection() {
  console.log(
    'DATABASE_URL:',
    process.env.DATABASE_URL ? 'Found' : 'Not found'
  );
  console.log(
    'Connection string:',
    process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')
  );

  const prisma = new PrismaClient();

  try {
    console.log('🔄 Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query test successful:', result);

    console.log('🎉 Database is ready to use!');
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);

    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 Suggestions:');
        console.log('1. Make sure PostgreSQL is running');
        console.log('2. Check if the connection string is correct');
        console.log('3. Try using a cloud database like Supabase or Neon');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
