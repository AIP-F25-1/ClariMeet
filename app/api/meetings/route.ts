import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const meetings = await prisma.meeting.findMany({
      include: {
        transcripts: true,
        summaries: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform to match the expected format
    const transformedMeetings = meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      date: meeting.createdAt.toISOString().split('T')[0],
      time: meeting.createdAt.toLocaleTimeString('en-US', { hour12: false }),
      duration: `${Math.floor(meeting.duration / 60)}:${(meeting.duration % 60).toString().padStart(2, '0')}`,
      participants: ['You'],
      transcript: meeting.transcripts.length > 0,
      summary: meeting.summaries.length > 0,
      status: meeting.status,
      videoUrl: meeting.videoUrl,
      thumbnailUrl: meeting.thumbnailUrl,
    }))

    return NextResponse.json({ meetings: transformedMeetings })
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    )
  }
}
