// Simple script to check database tables
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking database tables...\n')
    
    // Check if users table exists and get count
    const userCount = await prisma.user.count()
    console.log(`📊 Users table: ${userCount} records`)
    
    // Get sample users
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })
    
    if (users.length > 0) {
      console.log('\n👥 Sample users:')
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.name || 'No name'}) - ${user.createdAt}`)
      })
    } else {
      console.log('\n📝 No users found in database')
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    console.log('\n💡 Make sure:')
    console.log('  1. Database is running (docker-compose up -d postgres)')
    console.log('  2. DATABASE_URL is set in .env.local')
    console.log('  3. Prisma schema is pushed (npx prisma db push)')
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()

