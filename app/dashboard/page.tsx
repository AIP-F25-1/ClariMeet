'use client'

import { AnimatedDashboardCards } from "@/components/ui/animated-dashboard-cards"
import { DashboardLayoutWithSidebar } from "@/components/ui/dashboard-layout-with-sidebar"
import { Meteors } from "@/components/ui/meteors"
import { ProtectedRoute } from "@/components/ui/protected-route"
import { UploadMeetingModal } from "@/components/ui/upload-meeting-modal"
import { useAuth } from "@/contexts/AuthContext"
import { BarChart3, Calendar, FileText, Upload, Video } from "lucide-react"
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

export default function Dashboard() {
  const { user } = useAuth()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMeetings: 0,
    transcriptsGenerated: 0,
    summariesCreated: 0,
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/meetings')
      const data = await response.json()
      const allMeetings: Meeting[] = data.meetings || []

      setMeetings(allMeetings.slice(0, 6)) // Show only 6 recent meetings

      setStats({
        totalMeetings: allMeetings.length,
        transcriptsGenerated: allMeetings.filter(m => m.transcript).length,
        summariesCreated: allMeetings.filter(m => m.summary).length,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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
        // Refresh dashboard data
        await fetchDashboardData()
        // Don't close modal here - let the modal handle it
      } else {
        console.error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayoutWithSidebar>
        <div className="p-4 pl-16 min-h-screen">
          {/* Dashboard Header */}
          <div className="relative bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 md:p-8 mb-6 overflow-hidden">
            <div className="absolute inset-0 z-0">
              <Meteors number={30} />
            </div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                  <Calendar className="w-10 h-10 text-gray-300" />
                  Dashboard
                </h1>
                <p className="text-xl text-gray-300">
                  Welcome back, {user?.given_name || user?.name || 'User'}! Here's your overview.
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

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-300">Loading stats...</span>
                </div>
              ) : (
                <>
                  <StatCard title="Total Meetings" value={stats.totalMeetings} icon={Calendar} color="from-blue-500 to-blue-600" />
                  <StatCard title="Transcripts Generated" value={stats.transcriptsGenerated} icon={FileText} color="from-green-500 to-green-600" />
                  <StatCard title="Summaries Created" value={stats.summariesCreated} icon={BarChart3} color="from-purple-500 to-purple-600" />
                </>
              )}
            </div>
          </div>

          {/* Recent Meetings */}
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Video className="w-6 h-6 text-gray-300" />
                Recent Meetings
              </h2>
              <Link href="/dashboard/meetings" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium">
                View All &rarr;
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-300">Loading meetings...</span>
              </div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No meetings yet</h3>
                <p className="text-gray-400 mb-4">Upload your first meeting to get started</p>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <Upload className="w-5 h-5" />
                  Upload First Meeting
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {meetings.map((meeting) => (
                  <Link key={meeting.id} href={`/dashboard/meetings/${meeting.id}`} className="group block">
                    <div className="bg-gray-800/40 rounded-xl p-6 border border-gray-600/20 hover:border-gray-600/40 hover:bg-gray-800/60 transition-all duration-300 flex flex-col cursor-pointer h-full">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{meeting.title}</h3>
                      <p className="text-gray-400 text-sm mb-4 flex-grow">
                        {meeting.date} at {meeting.time} • {meeting.duration}
                      </p>
                      <div className="flex items-center gap-2 mt-auto">
                        {meeting.transcript && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Transcript</span>
                        )}
                        {meeting.summary && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">Summary</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Animated Dashboard Cards */}
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 md:p-8 mb-24">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            <AnimatedDashboardCards />
          </div>
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

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-black/40 rounded-xl p-6 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg bg-gradient-to-r ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
    <p className="text-gray-400 text-sm">{title}</p>
  </div>
)