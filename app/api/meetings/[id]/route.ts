import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        transcripts: true,
        summaries: true,
      }
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // Transform to match expected format
    const meetingWithContent = {
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
      transcriptContent: meeting.transcripts.length > 0 ? meeting.transcripts[0].content : `[00:00] Welcome to ${meeting.title}

[00:15] This is a sample transcript for your uploaded meeting.

[00:30] The actual transcript would be generated using AI transcription services.

[00:45] You can edit this transcript or regenerate it using AI.

[01:00] This is just placeholder content for demonstration purposes.`,
      summaryContent: meeting.summaries.length > 0 ? meeting.summaries[0].content : `**Meeting Summary: ${meeting.title}**

**Date:** ${meeting.createdAt.toISOString().split('T')[0]}
**Duration:** ${Math.floor(meeting.duration / 60)}:${(meeting.duration % 60).toString().padStart(2, '0')}
**Participants:** You

**Key Points:**
- This is a sample summary for your uploaded meeting
- AI-generated summaries would provide key insights and action items
- You can regenerate this summary using AI tools

**Next Steps:**
- Review the meeting content
- Generate transcript if needed
- Create action items`
    }

    return NextResponse.json({ meeting: meetingWithContent })
  } catch (error) {
    console.error('Error fetching meeting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete from database (this will cascade delete transcripts and summaries)
    await prisma.meeting.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting meeting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
