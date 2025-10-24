import { useEffect, useState } from 'react'

interface Meeting {
  id: string
  title: string
  startedAt: string
  endedAt?: string
  platform: string
  status: string
  attendees: Array<{
    name: string
    email: string
    role: string
  }>
}

interface Summary {
  id: string
  meetingId: string
  type: string
  content: string
  createdAt: string
  meeting: {
    title: string
    startedAt: string
    platform: string
  }
}

interface Decision {
  id: string
  meetingId: string
  statement: string
  rationale: string
  createdAt: string
  meeting: {
    title: string
    startedAt: string
    platform: string
  }
}

interface Action {
  id: string
  meetingId: string
  title: string
  assignee: string
  dueDate: string
  status: string
  confidence: number
  createdAt: string
  meeting: {
    title: string
    startedAt: string
    platform: string
  }
}

interface TranscriptChunk {
  id: string
  meetingId: string
  text: string
  speakerId?: string
  confidence?: number
  createdAt: string
  meeting: {
    title: string
    startedAt: string
    platform: string
  }
}

export function useDashboardData() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [transcripts, setTranscripts] = useState<TranscriptChunk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [meetingsRes, summariesRes, decisionsRes, actionsRes, transcriptsRes] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/summaries'),
        fetch('/api/decisions'),
        fetch('/api/actions'),
        fetch('/api/transcriptions')
      ])

      // Check if all requests were successful
      if (!meetingsRes.ok || !summariesRes.ok || !decisionsRes.ok || !actionsRes.ok || !transcriptsRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      // Parse responses
          const [meetingsData, summariesData, decisionsData, actionsData, transcriptsData] = await Promise.all([
            meetingsRes.json(),
            summariesRes.json(),
            decisionsRes.json(),
            actionsRes.json(),
            transcriptsRes.json()
          ])

          setMeetings(meetingsData || [])
          setSummaries(summariesData || [])
          setDecisions(decisionsData.decisions || decisionsData || [])
          setActions(actionsData || [])
          setTranscripts(transcriptsData.transcriptions || transcriptsData || [])

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      
      // No fallback to mock data - show empty state
      setMeetings([])
      setSummaries([])
      setDecisions([])
      setActions([])
      setTranscripts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const refreshData = () => {
    fetchData()
  }

  return {
    meetings,
    summaries,
    decisions,
    actions,
    transcripts,
    loading,
    error,
    refreshData
  }
}
