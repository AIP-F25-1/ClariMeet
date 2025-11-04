// Load environment variables from .env.local
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  console.error('Please add DATABASE_URL to your .env.local file:');
  console.error('DATABASE_URL=postgresql://clarimeet_user:clarimeet_password@localhost:5555/clarimeet_db');
  process.exit(1);
}

console.log('✅ DATABASE_URL loaded:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

// Run Prisma db push
const { execSync } = require('child_process');
try {
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  });
} catch (error) {
  console.error('❌ Failed to push database schema:', error.message);
  process.exit(1);
}

