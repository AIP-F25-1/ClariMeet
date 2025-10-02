import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log the enable clarimeet action (removed for performance)

    // You can add logic here like:
    // - Track user onboarding progress
    // - Send welcome email
    // - Initialize user preferences
    // - Connect to external services
    // - Store user consent

    return NextResponse.json({
      success: true,
      message: 'ClariMeet enabled successfully',
      timestamp: new Date().toISOString(),
      data: {
        action: 'clarimeet_enabled',
        user_id: body.user_id || 'demo-user',
        source: body.source || 'access_grant_popup',
        ...body
      }
    })

  } catch (error) {
    // Handle error silently for performance
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to enable ClariMeet' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Enable ClariMeet API endpoint',
    methods: ['POST'],
    usage: 'Send POST request when user enables ClariMeet'
  })
}
