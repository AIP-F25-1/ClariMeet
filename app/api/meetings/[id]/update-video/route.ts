import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
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
    const { videoUrl, thumbnailUrl } = await request.json()

    // Update the meeting with video URL
    const meeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl
      },
      include: {
        attendees: true
      }
    })

    return NextResponse.json({
      success: true,
      meeting
    })

  } catch (error) {
    console.error('Update video error:', error)
    return NextResponse.json(
      { error: 'Failed to update video URL' },
      { status: 500 }
    )
  }
}
