// Simple API test script
const BASE_URL = 'http://localhost:3000/api'

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }
    
    if (data) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    const result = await response.json()
    
    console.log(`✅ ${method} ${endpoint}: ${response.status}`)
    console.log('Response:', result)
    return result
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}: Error -`, error.message)
    return null
  }
}

async function runTests() {
  console.log('🧪 Testing ClariMeet APIs...\n')

  // Test basic endpoints
  await testAPI('/enable-clarimeet', 'GET')
  await testAPI('/get-started', 'GET')
  
  // Test with sample data
  const sampleMeeting = {
    orgId: 'test-org',
    title: 'Test Meeting',
    startedAt: new Date().toISOString(),
    platform: 'GOOGLE_MEET',
    attendees: [
      {
        email: 'test@example.com',
        name: 'Test User',
        role: 'HOST'
      }
    ]
  }

  console.log('\n📝 Testing with sample data...')
  await testAPI('/meetings', 'POST', sampleMeeting)
  
  console.log('\n✅ API tests completed!')
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests()
}
