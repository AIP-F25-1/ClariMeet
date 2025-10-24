import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
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

    // Check if meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        attendees: true
      }
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to delete (is an attendee)
    const userAttendee = meeting.attendees.find(attendee => attendee.userId === user.id)
    if (!userAttendee) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this meeting' },
        { status: 403 }
      )
    }

    // Delete the meeting (this will cascade delete related records)
    await prisma.meeting.delete({
      where: { id: meetingId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Meeting deleted successfully' 
    })

  } catch (error) {
    console.error('Delete meeting error:', error)
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    )
  }
}
