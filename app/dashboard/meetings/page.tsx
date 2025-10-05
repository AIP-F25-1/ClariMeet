"use client"

import { DashboardLayoutWithSidebar } from "@/components/ui/dashboard-layout-with-sidebar"
import {
    BarChart3,
    Calendar,
    Clock,
    FileText,
    Filter,
    MoreHorizontal,
    Play,
    Search,
    Upload,
    Users
} from "lucide-react"

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
    title: "Client Project Kick-off",
    date: "2024-01-14",
    time: "02:00 PM",
    duration: "45m",
    participants: ["Alice Brown", "Bob White"],
    status: "Completed",
    transcript: true,
    summary: false
  },
  {
    id: 3,
    title: "Weekly Sync",
    date: "2024-01-12",
    time: "09:00 AM",
    duration: "30m",
    participants: ["Team Lead", "All Developers"],
    status: "Completed",
    transcript: false,
    summary: true
  },
  {
    id: 4,
    title: "Product Brainstorm",
    date: "2024-01-11",
    time: "03:30 PM",
    duration: "60m",
    participants: ["Product Team"],
    status: "Scheduled",
    transcript: false,
    summary: false
  }
]

export default function MeetingsPage() {
  return (
    <DashboardLayoutWithSidebar>
      <div className="p-4 pl-16 min-h-screen">
        {/* Page Header */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                <Calendar className="w-10 h-10 text-gray-300" />
                My Meetings
              </h1>
              <p className="text-xl text-gray-300">
                View and manage all your recorded meetings
              </p>
            </div>
            <button className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload New Meeting
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search meetings..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-800/40 border border-gray-600/30 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/40 border border-gray-600/30 text-gray-300 hover:bg-cyan-500/10 transition-colors">
              <Filter className="w-5 h-5" />
              Filter
            </button>
          </div>

          {/* Meetings List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockMeetings.map((meeting) => (
              <div key={meeting.id} className="bg-gray-800/40 rounded-xl p-6 border border-gray-600/20 hover:border-gray-600/40 transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{meeting.title}</h3>
                  <MoreHorizontal className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                </div>
                <p className="text-gray-400 text-sm mb-4 flex-grow">
                  {meeting.date} at {meeting.time}
                </p>

                <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {meeting.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {meeting.participants.length} participants
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    meeting.status === 'Completed'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {meeting.status}
                  </span>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-full bg-cyan-500/20 text-gray-300 hover:bg-cyan-500/30 transition-colors" title="Play Meeting">
                      <Play className="w-4 h-4" />
                    </button>
                    {meeting.transcript && (
                      <button className="p-2 rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors" title="View Transcript">
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    {meeting.summary && (
                      <button className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors" title="View Summary">
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayoutWithSidebar>
  )
}