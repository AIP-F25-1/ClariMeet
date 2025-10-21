'use client'

import { DashboardLayoutWithSidebar } from "@/components/ui/dashboard-layout-with-sidebar"
import { Meteors } from "@/components/ui/meteors"
import { ProtectedRoute } from "@/components/ui/protected-route"
import { useAuth } from "@/contexts/AuthContext"
import { Calendar, Clock, FileText, Search } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Meeting {
  id: string
  title: string
  date: string
  time: string
  duration: string
  transcript: boolean
  summary: boolean
}

export default function TranscriptionsPage() {
  const { user } = useAuth()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTranscriptions()
  }, [])

  const fetchTranscriptions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/meetings')
      const data = await response.json()
      // Filter meetings that have transcripts
      const meetingsWithTranscripts = (data.meetings || []).filter((meeting: Meeting) => meeting.transcript)
      setMeetings(meetingsWithTranscripts)
    } catch (error) {
      console.error('Error fetching transcriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ProtectedRoute>
      <DashboardLayoutWithSidebar>
        <div className="p-4 pl-16 min-h-screen">
          {/* Header */}
          <div className="relative bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 md:p-8 mb-6 overflow-hidden">
            <Meteors number={30} />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                  <FileText className="w-10 h-10 text-gray-300" />
                  Transcriptions
                </h1>
                <p className="text-xl text-gray-300">
                  View and manage all your meeting transcripts
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search transcriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Transcriptions List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-300">Loading transcriptions...</span>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                {searchTerm ? 'No transcriptions found' : 'No transcriptions yet'}
              </h3>
              <p className="text-gray-400 mb-4">
                {searchTerm ? 'Try a different search term' : 'Generate transcripts for your meetings to see them here'}
              </p>
              {!searchTerm && (
                <Link
                  href="/dashboard/meetings"
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 mx-auto w-fit"
                >
                  <FileText className="w-5 h-5" />
                  Go to Meetings
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings.map((meeting) => (
                <Link key={meeting.id} href={`/dashboard/transcriptions/${meeting.id}`} className="block">
                  <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 hover:border-gray-600/50 hover:bg-gray-800/80 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-2">
                          {meeting.title}
                        </h3>
                        <div className="flex items-center gap-4 text-gray-400 text-sm mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{meeting.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{meeting.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Duration: {meeting.duration}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Transcript Available
                          </span>
                          {meeting.summary && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 flex items-center gap-1">
                              <span>Summary Available</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-400 group-hover:text-cyan-400 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DashboardLayoutWithSidebar>
    </ProtectedRoute>
  )
}