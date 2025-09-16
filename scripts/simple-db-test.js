const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Testing PostgreSQL connection...');
    console.log(
      'Connection string:',
      process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')
    );

    await client.connect();
    console.log('✅ Connected successfully!');

    const result = await client.query('SELECT 1 as test');
    console.log('✅ Query test successful:', result.rows[0]);

    console.log('🎉 Database is ready!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();
