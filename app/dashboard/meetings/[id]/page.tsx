"use client"

import { DashboardLayoutWithSidebar } from "@/components/ui/dashboard-layout-with-sidebar"
import { VideoPlayer } from "@/components/ui/video-player"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import {
    ArrowLeft,
    BarChart3,
    Bot,
    CheckSquare,
    FileText,
    Play,
    Video
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function MeetingDetailPage() {
  const params = useParams()
  const meetingId = params.id as string
  const { meetings, summaries, decisions, actions, transcripts, loading, error, refreshData } = useDashboardData()
  const [activeTab, setActiveTab] = useState('video')
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [generatingTranscript, setGeneratingTranscript] = useState(false)
  const [videos, setVideos] = useState<any[]>([])
  const [videosLoading, setVideosLoading] = useState(true)

  // Find the current meeting
  const meeting = meetings.find(m => m.id === meetingId)
  
  // Find related data for this meeting
  const meetingSummaries = summaries.filter(s => s.meetingId === meetingId)
  const meetingDecisions = decisions.filter(d => d.meetingId === meetingId)
  const meetingActions = actions.filter(a => a.meetingId === meetingId)
  const meetingTranscripts = transcripts.filter(t => t.meetingId === meetingId)

  // Fetch videos for this meeting
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setVideosLoading(true)
        const response = await fetch(`/api/meetings/${meetingId}/videos`)
        if (response.ok) {
          const videosData = await response.json()
          setVideos(videosData)
        }
      } catch (error) {
        console.error('Error fetching videos:', error)
      } finally {
        setVideosLoading(false)
      }
    }

    if (meetingId) {
      fetchVideos()
    }
  }, [meetingId])

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true)
    try {
      const response = await fetch(`/api/meetings/${meetingId}/generate-summary`, {
        method: 'POST',
      })

      if (response.ok) {
        // Refresh the data to show the new summary
        refreshData()
        alert('Summary generated successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to generate summary: ${error.error}`)
      }
    } catch (error) {
      console.error('Generate summary error:', error)
      alert('Failed to generate summary')
    } finally {
      setGeneratingSummary(false)
    }
  }

  const handleGenerateTranscript = async () => {
    setGeneratingTranscript(true)
    try {
      const response = await fetch(`/api/meetings/${meetingId}/generate-transcript`, {
        method: 'POST',
      })

      if (response.ok) {
        // Refresh the data to show the new transcript
        refreshData()
        alert('Transcript generated successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to generate transcript: ${error.error}`)
      }
    } catch (error) {
      console.error('Generate transcript error:', error)
      alert('Failed to generate transcript')
    } finally {
      setGeneratingTranscript(false)
    }
  }

  const tabs = [
    { id: 'video', label: 'Video Player', icon: Play },
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'transcript', label: 'Transcript', icon: FileText },
    { id: 'actions', label: 'Actions', icon: CheckSquare },
    { id: 'ai-tools', label: 'AI Tools', icon: Bot }
  ]

  if (loading) {
    return (
      <DashboardLayoutWithSidebar>
        <div className="p-4 pl-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading meeting details...</p>
          </div>
        </div>
      </DashboardLayoutWithSidebar>
    )
  }

  if (error || !meeting) {
    return (
      <DashboardLayoutWithSidebar>
        <div className="p-4 pl-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Meeting Not Found</h1>
            <p className="text-gray-400 mb-6">The meeting you're looking for doesn't exist or has been deleted.</p>
            <Link 
              href="/dashboard/meetings"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 mx-auto w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Meetings
            </Link>
          </div>
        </div>
      </DashboardLayoutWithSidebar>
    )
  }

  return (
    <DashboardLayoutWithSidebar>
      <div className="p-4 pl-16 min-h-screen">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-700/30 rounded-lg p-1 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/40 rounded-xl border border-gray-600/20 p-6">
          {activeTab === 'video' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Video className="w-6 h-6" />
                Video Player
              </h2>
              {videosLoading ? (
                <div className="bg-gray-900/50 rounded-lg p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading video...</p>
                </div>
              ) : (
                <VideoPlayer 
                  videoUrl={videos[0]?.videoUrl}
                  title={meeting.title}
                  className="w-full h-96"
                />
              )}
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Meeting Summary
                </h2>
                <button
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  {generatingSummary ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      Generate Summary
                    </>
                  )}
                </button>
              </div>
              {meetingSummaries.length > 0 ? (
                <div className="space-y-4">
                  {meetingSummaries.map((summary) => (
                    <div key={summary.id} className="bg-gray-900/50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">{summary.title}</h3>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          {summary.type}
                        </span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">{summary.content}</p>
                      <div className="mt-4 text-sm text-gray-400">
                        Created: {new Date(summary.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Summary Available</h3>
                  <p className="text-gray-400">
                    This meeting doesn't have a summary yet. Summaries are generated automatically after meetings.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Meeting Transcript
                </h2>
                <button
                  onClick={handleGenerateTranscript}
                  disabled={generatingTranscript}
                  className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  {generatingTranscript ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      Generate Transcript
                    </>
                  )}
                </button>
              </div>
              {meetingTranscripts.length > 0 ? (
                <div className="space-y-4">
                  {meetingTranscripts.map((transcript) => (
                    <div key={transcript.id} className="bg-gray-900/50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Transcript Chunk</h3>
                        <span className="text-sm text-gray-400">
                          {new Date(transcript.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">{transcript.content}</p>
                      <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
                        <span>Speaker: {transcript.speakerName || 'Unknown'}</span>
                        <span>Confidence: {transcript.confidence ? `${(transcript.confidence * 100).toFixed(1)}%` : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Transcript Available</h3>
                  <p className="text-gray-400">
                    This meeting doesn't have a transcript yet. Transcripts are generated automatically during meetings.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-6 h-6" />
                Action Items
              </h2>
              {meetingActions.length > 0 ? (
                <div className="space-y-4">
                  {meetingActions.map((action) => (
                    <div key={action.id} className="bg-gray-900/50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">{action.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          action.status === 'COMPLETED'
                            ? 'bg-green-500/20 text-green-400'
                            : action.status === 'IN_PROGRESS'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {action.status}
                        </span>
                      </div>
                      <p className="text-gray-300 leading-relaxed mb-4">{action.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Assigned to: {action.assignedTo || 'Unassigned'}</span>
                        <span>Due: {action.dueDate ? new Date(action.dueDate).toLocaleDateString() : 'No due date'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Action Items</h3>
                  <p className="text-gray-400">
                    This meeting doesn't have any action items yet. Action items are created during meetings.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai-tools' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bot className="w-6 h-6" />
                AI Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-900/50 rounded-lg p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <BarChart3 className="w-8 h-8 text-cyan-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Generate Summary</h3>
                  <p className="text-gray-400 text-sm">
                    Use AI to create a comprehensive summary of this meeting.
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <FileText className="w-8 h-8 text-purple-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Extract Key Points</h3>
                  <p className="text-gray-400 text-sm">
                    Identify and extract the most important points from the meeting.
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <CheckSquare className="w-8 h-8 text-green-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Generate Actions</h3>
                  <p className="text-gray-400 text-sm">
                    Automatically identify and create action items from the meeting.
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <Bot className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Meeting Insights</h3>
                  <p className="text-gray-400 text-sm">
                    Get AI-powered insights and analytics about the meeting.
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <FileText className="w-8 h-8 text-yellow-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Sentiment Analysis</h3>
                  <p className="text-gray-400 text-sm">
                    Analyze the sentiment and tone of the meeting participants.
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <BarChart3 className="w-8 h-8 text-red-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Meeting Analytics</h3>
                  <p className="text-gray-400 text-sm">
                    Get detailed analytics and statistics about the meeting.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayoutWithSidebar>
  )
}
