// Test database connection
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { PrismaClient } = require('../lib/generated/client');

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  console.log('🔍 Testing database connection...');
  console.log('📍 DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query test passed:', result);
    
    await prisma.$disconnect();
    console.log('✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Make sure your database server is running on port 5555');
      console.error('2. If using Docker, run: npm run db:up');
      console.error('3. Check if port 5555 is accessible: netstat -ano | findstr :5555');
      console.error('4. Verify your DATABASE_URL in .env.local is correct');
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();

