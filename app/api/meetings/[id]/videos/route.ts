import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await auth(request)
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const meetingId = params.id

    // Get videos for this meeting
    const videos = await prisma.video.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(videos)

  } catch (error) {
    console.error('Get videos error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}
