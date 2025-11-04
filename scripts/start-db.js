// Script to start the database with helpful messages
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting PostgreSQL database...\n');

// Check if Docker is running
try {
  execSync('docker ps', { stdio: 'ignore', timeout: 5000 });
  console.log('✅ Docker is running\n');
} catch (error) {
  console.error('❌ Docker Desktop is not running!');
  console.error('\n💡 Please follow these steps:');
  console.error('1. Open Docker Desktop application');
  console.error('2. Wait for Docker Desktop to fully start (whale icon in system tray should be steady)');
  console.error('3. Run this command again: npm run db:up');
  console.error('\n📝 Alternative: If you have PostgreSQL installed locally,');
  console.error('   you can use that instead by updating your DATABASE_URL.\n');
  process.exit(1);
}

// Try to start the database
try {
  console.log('📦 Starting database container...');
  execSync('docker-compose up -d', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('\n✅ Database container started!');
  console.log('⏳ Waiting for database to be ready...');
  
  // Wait a bit for the database to be ready
  setTimeout(() => {
    console.log('✅ Database should be ready now!');
  }, 3000);
  console.log('\n📍 Connection details:');
  console.log('   Host: localhost');
  console.log('   Port: 5555');
  console.log('   Database: clarimeet_db');
  console.log('   User: clarimeet_user');
  console.log('\n🧪 Test connection: npm run db:test');
  
} catch (error) {
  console.error('\n❌ Failed to start database container:');
  console.error(error.message);
  console.error('\n💡 Troubleshooting:');
  console.error('1. Make sure Docker Desktop is running');
  console.error('2. Check if port 5555 is already in use');
  console.error('3. Try: docker-compose down (to stop existing containers)');
  console.error('4. Then try: npm run db:up again');
  process.exit(1);
}

