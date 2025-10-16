'use client'

import { DashboardLayoutWithSidebar } from "@/components/ui/dashboard-layout-with-sidebar"
import { ProtectedRoute } from "@/components/ui/protected-route"
import { UploadMeetingModal } from "@/components/ui/upload-meeting-modal"
import { useAuth } from "@/contexts/AuthContext"
import { BarChart3, Calendar, Clock, FileText, Play, Search, Upload, Video } from "lucide-react"
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

export default function MeetingsPage() {
  const { user } = useAuth()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/meetings')
      const data = await response.json()
      setMeetings(data.meetings || [])
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File, meetingName: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('meetingName', meetingName)

    try {
      const response = await fetch('/api/upload-meeting', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        await fetchMeetings()
        // Don't close modal here - let the modal handle it
      } else {
        console.error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
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
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                  <Video className="w-10 h-10 text-gray-300" />
                  My Meetings
                </h1>
                <p className="text-xl text-gray-300">
                  Manage and view all your meeting recordings
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload MP4
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Meetings Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-300">Loading meetings...</span>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                {searchTerm ? 'No meetings found' : 'No meetings yet'}
              </h3>
              <p className="text-gray-400 mb-4">
                {searchTerm ? 'Try a different search term' : 'Upload your first meeting to get started'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <Upload className="w-5 h-5" />
                  Upload First Meeting
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMeetings.map((meeting) => (
                <Link key={meeting.id} href={`/dashboard/meetings/${meeting.id}`} className="group block">
                  <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 hover:border-gray-600/50 hover:bg-gray-800/80 transition-all duration-300 group-hover:scale-105">
                    {/* Meeting Thumbnail */}
                    <div className="relative mb-4">
                      <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                        <span className="text-white text-sm font-medium">{meeting.duration}</span>
                      </div>
                    </div>

                    {/* Meeting Info */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {meeting.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-gray-400 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{meeting.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{meeting.time}</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                        {meeting.transcript && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Transcript
                          </span>
                        )}
                        {meeting.summary && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            Summary
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <UploadMeetingModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleFileUpload}
        />
      </DashboardLayoutWithSidebar>
    </ProtectedRoute>
  )
}