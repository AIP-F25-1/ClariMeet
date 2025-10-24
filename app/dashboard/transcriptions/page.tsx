"use client"

import { DashboardLayoutWithSidebar } from "@/components/ui/dashboard-layout-with-sidebar"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import {
    Calendar,
    Clock,
    Download,
    Eye,
    FileText,
    Filter,
    Search
} from "lucide-react"

export default function TranscriptionsPage() {
  const { transcripts, loading, error } = useDashboardData()
  return (
    <DashboardLayoutWithSidebar>
      <div className="p-4 pl-16 min-h-screen">
        {/* Page Header */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                <FileText className="w-10 h-10 text-gray-300" />
                Transcriptions
              </h1>
              <p className="text-xl text-gray-300">
                View and manage all your meeting transcriptions
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transcriptions..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-800/40 border border-gray-600/30 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/40 border border-gray-600/30 text-gray-300 hover:bg-cyan-500/10 transition-colors">
              <Filter className="w-5 h-5" />
              Filter
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading transcriptions...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-400">Error loading transcriptions: {error}</p>
            </div>
          )}

          {/* Transcriptions List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transcripts.length > 0 ? (
              transcripts.map((transcript) => (
                <div key={transcript.id} className="bg-gray-800/40 rounded-xl p-6 border border-gray-600/20 hover:border-gray-600/40 transition-all duration-300 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{transcript.meeting.title} - Transcript</h3>
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
                    From: {transcript.meeting.title}
                  </p>

                  <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(transcript.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(transcript.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-gray-300 text-sm font-medium">
                      {transcript.text?.length || 0} characters
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      Completed
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No transcriptions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayoutWithSidebar>
  )
}