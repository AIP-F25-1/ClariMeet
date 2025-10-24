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

    // Get the meeting with all details
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        attendees: true,
        summaries: true,
        actions: true,
        decisions: true,
        transcriptChunks: true
      }
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(meeting)

  } catch (error) {
    console.error('Get meeting error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    )
  }
}

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
    const body = await request.json()

    // Update the meeting
    const meeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: body,
      include: {
        attendees: true
      }
    })

    return NextResponse.json(meeting)

  } catch (error) {
    console.error('Update meeting error:', error)
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    )
  }
}