import { NextRequest, NextResponse } from 'next/server'

// Mock meeting data
const mockMeetings: Record<string, any> = {
  '1': {
    id: '1',
    title: 'Team Standup Meeting',
    date: '2024-01-15',
    time: '10:00 AM',
    duration: '15m',
    transcript: true,
    summary: true,
    transcriptContent: `[00:00] John: Good morning everyone, let's start with our daily standup.

[00:15] Sarah: I completed the user authentication flow yesterday. Today I'll be working on the dashboard layout.

[00:30] Mike: I finished the API endpoints for meetings. Planning to add error handling today.

[00:45] Emma: I've been working on the UI components. The transcript panel is almost ready.

[01:00] John: Great progress team! Any blockers?

[01:15] Sarah: No blockers on my end.

[01:20] Mike: All good here.

[01:25] Emma: Same, everything's moving smoothly.

[01:30] John: Perfect! Let's keep up the momentum. See you all tomorrow.`,
    summaryContent: `**Meeting Summary: Team Standup**

**Date:** January 15, 2024
**Duration:** 15 minutes
**Participants:** John, Sarah, Mike, Emma

**Key Updates:**
- Sarah completed user authentication flow and will focus on dashboard layout
- Mike finished API endpoints for meetings and will add error handling
- Emma is working on UI components, transcript panel nearing completion

**Blockers:** None

**Next Steps:**
- Continue with assigned tasks
- Next standup scheduled for tomorrow`
  },
  '2': {
    id: '2',
    title: 'Client Presentation Review',
    date: '2024-01-14',
    time: '2:30 PM',
    duration: '45m',
    transcript: true,
    summary: false,
    transcriptContent: `[00:00] Client: Thanks for presenting the updates. The design looks great!

[00:20] John: We're glad you like it. Let me walk you through the new features.

[00:35] Client: The AI transcription is impressive. How accurate is it?

[00:50] Sarah: We're seeing 95%+ accuracy with our current model.

[01:10] Client: That's excellent. What about data security?

[01:25] Mike: All data is encrypted at rest and in transit. We follow industry best practices.

[01:45] Client: Perfect. When can we expect the beta release?

[02:00] John: We're targeting next month for the beta launch.

[02:15] Client: Sounds good. We'll prepare our team for testing.`
  },
  '3': {
    id: '3',
    title: 'Weekly Planning Session',
    date: '2024-01-13',
    time: '9:00 AM',
    duration: '30m',
    transcript: false,
    summary: false
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meeting = mockMeetings[params.id]

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ meeting })
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
    const meeting = mockMeetings[params.id]

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // In a real app, you would delete from database
    delete mockMeetings[params.id]

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting meeting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
