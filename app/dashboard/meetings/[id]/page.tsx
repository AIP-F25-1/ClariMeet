'use client'

import { DashboardLayoutWithSidebar } from "@/components/ui/dashboard-layout-with-sidebar"
import { LoadingPopup } from "@/components/ui/loading-popup"
import { ProtectedRoute } from "@/components/ui/protected-route"
import { VideoPlayer } from "@/components/ui/video-player"
import { useAuth } from "@/contexts/AuthContext"
import {
    ArrowLeft,
    BarChart3,
    Calendar,
    Check,
    Clock,
    Copy,
    Download,
    FileText,
    Globe,
    MessageCircle,
    Mic,
    Play,
    Settings,
    Share,
    Sparkles,
    Zap
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Meeting {
  id: string
  title: string
  date: string
  time: string
  duration: string
  transcript: boolean
  summary: boolean
  transcriptContent?: string
  summaryContent?: string
  videoUrl?: string
  thumbnailUrl?: string
}

export default function MeetingDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [transcriptProgress, setTranscriptProgress] = useState(0)
  const [summaryProgress, setSummaryProgress] = useState(0)

  useEffect(() => {
    if (params.id) {
      fetchMeeting()
    }
  }, [params.id])

  const fetchMeeting = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/meetings/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMeeting(data.meeting)
      } else {
        console.error('Failed to fetch meeting')
      }
    } catch (error) {
      console.error('Error fetching meeting:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateTranscript = async () => {
    setIsGeneratingTranscript(true)
    setTranscriptProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setTranscriptProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 10
      })
    }, 500)

    try {
      const response = await fetch('/api/generate-transcript-local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: params.id,
        }),
      })

      if (response.ok) {
        setTranscriptProgress(100)
        await fetchMeeting() // Refresh meeting data
      } else {
        console.error('Failed to generate transcript')
      }
    } catch (error) {
      console.error('Error generating transcript:', error)
    } finally {
      setIsGeneratingTranscript(false)
      setTranscriptProgress(0)
    }
  }

  const generateSummary = async () => {
    setIsGeneratingSummary(true)
    setSummaryProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setSummaryProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 10
      })
    }, 500)

    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: params.id,
          service: 'assemblyai', // Use local TinyLlama
        }),
      })

      if (response.ok) {
        setSummaryProgress(100)
        await fetchMeeting() // Refresh meeting data
      } else {
        console.error('Failed to generate summary')
      }
    } catch (error) {
      console.error('Error generating summary:', error)
    } finally {
      setIsGeneratingSummary(false)
      setSummaryProgress(0)
    }
  }

  const handleDeleteMeeting = async () => {
    if (!confirm(`Are you sure you want to delete "${meeting?.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/meetings/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        console.log('✅ Meeting deleted successfully')
        // Navigate back to meetings list
        router.push('/dashboard/meetings')
      } else {
        console.error('❌ Failed to delete meeting')
        alert('Failed to delete meeting. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error deleting meeting:', error)
      alert('Error deleting meeting. Please try again.')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadContent = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayoutWithSidebar>
          <div className="p-4 pl-16 min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-300">Loading meeting...</span>
          </div>
        </DashboardLayoutWithSidebar>
      </ProtectedRoute>
    )
  }

  if (!meeting) {
    return (
      <ProtectedRoute>
        <DashboardLayoutWithSidebar>
          <div className="p-4 pl-16 min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Meeting not found</h2>
              <p className="text-gray-400 mb-4">The meeting you're looking for doesn't exist.</p>
              <button
                onClick={() => router.push('/dashboard/meetings')}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Back to Meetings
              </button>
            </div>
          </div>
        </DashboardLayoutWithSidebar>
      </ProtectedRoute>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'video', label: 'Video', icon: Play },
    { id: 'transcript', label: 'Transcript', icon: FileText },
    { id: 'summary', label: 'Summary', icon: BarChart3 },
    { id: 'workflows', label: 'Workflows', icon: Zap },
    { id: 'notes', label: 'Notes', icon: MessageCircle },
  ]

  return (
    <ProtectedRoute>
      <DashboardLayoutWithSidebar>
        <div className="p-4 pl-16 min-h-screen">
          {/* Header */}
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard/meetings')}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-300" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{meeting.title}</h1>
                  <div className="flex items-center gap-4 text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{meeting.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{meeting.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>{meeting.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                  <Share className="w-5 h-5 text-gray-300" />
                </button>
                <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                  <Settings className="w-5 h-5 text-gray-300" />
                </button>
                <button 
                  onClick={handleDeleteMeeting}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                  title="Delete Meeting"
                >
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-700/30 rounded-lg p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-cyan-500 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 md:p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Meeting Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Meeting Details</h3>
                    <div className="space-y-2 text-gray-300">
                      <p><span className="font-medium">Title:</span> {meeting.title}</p>
                      <p><span className="font-medium">Date:</span> {meeting.date}</p>
                      <p><span className="font-medium">Time:</span> {meeting.time}</p>
                      <p><span className="font-medium">Duration:</span> {meeting.duration}</p>
                    </div>
                  </div>
                  <div className="bg-gray-700/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {meeting.transcript ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />
                        )}
                        <span className="text-gray-300">Transcript Generated</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {meeting.summary ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />
                        )}
                        <span className="text-gray-300">Summary Created</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Video Player</h2>
                <div className="bg-gray-900 rounded-xl overflow-hidden p-4">
                  {meeting.videoUrl ? (
                    <VideoPlayer
                      videoUrl={meeting.videoUrl}
                      thumbnailUrl={meeting.thumbnailUrl}
                      title={meeting.title}
                      className="w-full"
                    />
                  ) : (
                    <div className="bg-gray-800 rounded-lg p-8 text-center">
                      <div className="text-yellow-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">No Video URL Available</h3>
                      <p className="text-gray-400 mb-4">The video URL is missing from the meeting data</p>
                      <div className="text-sm text-gray-500">
                        <p>Meeting ID: {meeting.id}</p>
                        <p>Video URL: {meeting.videoUrl || 'Not available'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Transcript</h2>
                  <div className="flex items-center gap-2">
                    {meeting.transcriptContent && (
                      <>
                        <button
                          onClick={() => copyToClipboard(meeting.transcriptContent || '')}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-300" />
                        </button>
                        <button
                          onClick={() => downloadContent(meeting.transcriptContent || '', `${meeting.title}-transcript.txt`)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4 text-gray-300" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={generateTranscript}
                      disabled={isGeneratingTranscript}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm"
                    >
                      <Mic className="w-4 h-4" />
                      {meeting.transcript ? 'Regenerate Transcript' : 'Generate Transcript'}
                    </button>
                  </div>
                </div>

                {meeting.transcriptContent ? (
                  <div className="bg-gray-700/30 rounded-xl p-6">
                    <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {meeting.transcriptContent}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No transcript yet</h3>
                    <p className="text-gray-400 mb-4">Generate a transcript to see the meeting content</p>
                    <button
                      onClick={generateTranscript}
                      disabled={isGeneratingTranscript}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 flex items-center gap-2 mx-auto"
                    >
                      <Mic className="w-4 h-4" />
                      Generate Transcript
                    </button>
                    <p className="text-gray-500 text-sm mt-2">Uses local Whisper AI for transcription</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Summary</h2>
                  <div className="flex items-center gap-2">
                    {meeting.summaryContent && (
                      <>
                        <button
                          onClick={() => copyToClipboard(meeting.summaryContent || '')}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-300" />
                        </button>
                        <button
                          onClick={() => downloadContent(meeting.summaryContent || '', `${meeting.title}-summary.txt`)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4 text-gray-300" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={generateSummary}
                      disabled={isGeneratingSummary}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      {meeting.summary ? 'Regenerate Summary' : 'Generate Summary'}
                    </button>
                  </div>
                </div>

                {meeting.summaryContent ? (
                  <div className="bg-gray-700/30 rounded-xl p-6">
                    <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {meeting.summaryContent}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No summary yet</h3>
                    <p className="text-gray-400 mb-4">Generate a summary to see key insights</p>
                    <button
                      onClick={generateSummary}
                      disabled={isGeneratingSummary}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 flex items-center gap-2 mx-auto"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Summary
                    </button>
                    <p className="text-gray-500 text-sm mt-2">Uses local TinyLlama AI for summarization</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'workflows' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Workflows</h2>
                <div className="text-center py-12">
                  <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">Workflows coming soon</h3>
                  <p className="text-gray-400">Automated workflows will be available here</p>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Notes</h2>
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">Notes coming soon</h3>
                  <p className="text-gray-400">Meeting notes will be available here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading Popups */}
        {isGeneratingTranscript && (
          <LoadingPopup
            isOpen={isGeneratingTranscript}
            progress={transcriptProgress}
            message="Processing audio with Whisper AI..."
          />
        )}

        {isGeneratingSummary && (
          <LoadingPopup
            isOpen={isGeneratingSummary}
            progress={summaryProgress}
            message="Creating summary with TinyLlama AI..."
          />
        )}
      </DashboardLayoutWithSidebar>
    </ProtectedRoute>
  )
}
