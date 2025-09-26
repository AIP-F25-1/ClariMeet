import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log the get started action
    console.log('🚀 Get Started clicked:', {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      body: body
    })

    // You can add any logic here like:
    // - Track analytics
    // - Send to external service
    // - Store in database
    // - Send email notification

    return NextResponse.json({
      success: true,
      message: 'Get Started action recorded',
      timestamp: new Date().toISOString(),
      data: {
        action: 'get_started_clicked',
        ...body
      }
    })

  } catch (error) {
    console.error('Error in get-started endpoint:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process get started action' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Get Started API endpoint',
    methods: ['POST'],
    usage: 'Send POST request when user clicks Get Started button'
  })
}
