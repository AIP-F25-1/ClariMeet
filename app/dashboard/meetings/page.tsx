"use client"

import AnimatedBackground from "@/components/ui/animated-background"
import { Header } from "@/components/ui/header"
import { useAuth } from "@/contexts/AuthContext"
import { 
  Calendar, 
  Clock, 
  Users, 
  Play, 
  Download, 
  Share2, 
  MoreHorizontal,
  Search,
  Filter,
  Upload,
  FileText,
  BarChart3
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const mockMeetings = [
  {
    id: 1,
    title: "Team Standup Meeting",
    date: "2024-01-15",
    time: "10:00 AM",
    duration: "15m",
    participants: ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson"],
    status: "Completed",
    transcript: true,
    summary: true
  },
  {
    id: 2,
    title: "Client Presentation Review",
    date: "2024-01-14",
    time: "2:30 PM",
    duration: "45m",
    participants: ["John Doe", "Client Team", "Marketing Team"],
    status: "Completed",
    transcript: true,
    summary: false
  },
  {
    id: 3,
    title: "Weekly Planning Session",
    date: "2024-01-13",
    time: "9:00 AM",
    duration: "30m",
    participants: ["John Doe", "Product Team"],
    status: "Processing",
    transcript: false,
    summary: false
  }
]

export default function MeetingsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen relative bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen relative bg-black">
      <AnimatedBackground />
      <Header />

      <main className="pt-24 pb-12 relative z-20">
        <div className="mx-auto max-w-7xl px-6 space-y-8">
          {/* Page Header */}
          <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                  <Calendar className="w-10 h-10 text-cyan-400" />
                  My Meetings
                </h1>
                <p className="text-xl text-gray-300">
                  Manage and review your meeting recordings
                </p>
              </div>
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Meeting
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search meetings, participants, or topics..."
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-cyan-400/30 rounded-xl text-white placeholder-gray-400 focus:border-cyan-400/60 focus:outline-none transition-colors"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-3 bg-black/40 border border-cyan-400/30 rounded-xl text-white hover:border-cyan-400/60 transition-colors">
                <Filter className="w-5 h-5" />
                Filter
              </button>
            </div>
          </div>

          {/* Meetings List */}
          <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Meetings</h2>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-sm">Sort by:</span>
                <select className="bg-black/40 border border-cyan-400/30 rounded-lg px-3 py-1 text-white text-sm focus:border-cyan-400/60 focus:outline-none">
                  <option>Date (Newest)</option>
                  <option>Date (Oldest)</option>
                  <option>Duration</option>
                  <option>Title</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {mockMeetings.map((meeting) => (
                <div key={meeting.id} className="bg-black/40 rounded-xl border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                          <Play className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-1">{meeting.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {meeting.date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {meeting.time} • {meeting.duration}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Users className="w-4 h-4" />
                          {meeting.participants.length} participants
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          meeting.status === 'Completed' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {meeting.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        {meeting.participants.slice(0, 3).map((participant, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                              {participant.charAt(0)}
                            </div>
                            <span>{participant}</span>
                          </div>
                        ))}
                        {meeting.participants.length > 3 && (
                          <span className="text-sm text-gray-400">
                            +{meeting.participants.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <button className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                          meeting.transcript 
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          <FileText className="w-4 h-4" />
                          Transcript {meeting.transcript ? 'Ready' : 'Processing'}
                        </button>
                        <button className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                          meeting.summary 
                            ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          <BarChart3 className="w-4 h-4" />
                          Summary {meeting.summary ? 'Ready' : 'Processing'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
                        <Download className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
