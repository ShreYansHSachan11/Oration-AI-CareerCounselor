import { prisma } from './prisma';

export async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test query execution
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query execution successful');

    // Test user count (should work even with empty database)
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);

    return { success: true, userCount };
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    await prisma.$disconnect();
  }
}
