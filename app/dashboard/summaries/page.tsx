"use client"

import { DashboardLayoutWithSidebar } from "@/components/ui/dashboard-layout-with-sidebar"
import {
    BarChart3,
    Calendar,
    Clock,
    Download,
    Eye,
    Filter,
    Search,
    TrendingUp
} from "lucide-react"

const mockSummaries = [
  {
    id: 1,
    title: "Team Standup Meeting - Summary",
    meetingTitle: "Team Standup Meeting",
    date: "2024-01-15",
    duration: "15m",
    keyPoints: 5,
    status: "Completed"
  },
  {
    id: 2,
    title: "Client Project Kick-off - Summary",
    meetingTitle: "Client Project Kick-off",
    date: "2024-01-14",
    duration: "45m",
    keyPoints: 8,
    status: "Completed"
  },
  {
    id: 3,
    title: "Weekly Sync - Summary",
    meetingTitle: "Weekly Sync",
    date: "2024-01-12",
    duration: "30m",
    keyPoints: 6,
    status: "Completed"
  }
]

export default function SummariesPage() {
  return (
    <DashboardLayoutWithSidebar>
      <div className="p-4 pl-16 min-h-screen">
        {/* Page Header */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                <BarChart3 className="w-10 h-10 text-gray-300" />
                Summaries
              </h1>
              <p className="text-xl text-gray-300">
                View and manage all your meeting summaries
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search summaries..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-800/40 border border-gray-600/30 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/40 border border-gray-600/30 text-gray-300 hover:bg-cyan-500/10 transition-colors">
              <Filter className="w-5 h-5" />
              Filter
            </button>
          </div>

          {/* Summaries List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockSummaries.map((summary) => (
              <div key={summary.id} className="bg-gray-800/40 rounded-xl p-6 border border-gray-600/20 hover:border-gray-600/40 transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{summary.title}</h3>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-full bg-cyan-500/20 text-gray-300 hover:bg-cyan-500/30 transition-colors" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mb-4 flex-grow">
                  From: {summary.meetingTitle}
                </p>

                <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {summary.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {summary.duration}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1 text-gray-300 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    {summary.keyPoints} key points
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                    {summary.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayoutWithSidebar>
  )
}