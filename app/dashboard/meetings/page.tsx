"use client"

import { DashboardLayoutWithSidebar } from "@/components/ui/dashboard-layout-with-sidebar"
import { VideoUpload } from "@/components/ui/video-upload"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import {
  BarChart3,
  Calendar,
  Clock,
  FileText,
  Filter,
  MoreHorizontal,
  Play,
  Search,
  Trash2,
  Upload,
  Users
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function MeetingsPage() {
  const { meetings, loading, error, refreshData } = useDashboardData()
  const [showUpload, setShowUpload] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  const handleUploadComplete = (result: any) => {
    console.log('Upload completed:', result)
    // Refresh the meetings data
    refreshData()
    setShowUpload(false)
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      return
    }

    setDeletingId(meetingId)
    try {
      const response = await fetch(`/api/meetings/${meetingId}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh the meetings data
        refreshData()
      } else {
        const error = await response.json()
        alert(`Failed to delete meeting: ${error.error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete meeting')
    } finally {
      setDeletingId(null)
      setShowDropdown(null)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(null)
    }

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showDropdown])

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
            <button 
              onClick={() => setShowUpload(!showUpload)}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {showUpload ? 'Cancel Upload' : 'Upload New Meeting'}
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

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading meetings...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-400">Error loading meetings: {error}</p>
            </div>
          )}

          {/* Video Upload Component */}
          {showUpload && (
            <div className="mb-6">
              <VideoUpload onUploadComplete={handleUploadComplete} />
            </div>
          )}

          {/* Meetings List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.length > 0 ? (
              meetings.map((meeting) => (
                <Link 
                  key={meeting.id} 
                  href={`/dashboard/meetings/${meeting.id}`}
                  className="bg-gray-800/40 rounded-xl p-6 border border-gray-600/20 hover:border-gray-600/40 transition-all duration-300 flex flex-col hover:scale-105 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{meeting.title}</h3>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowDropdown(showDropdown === meeting.id ? null : meeting.id)
                        }}
                        className="p-1 rounded-full hover:bg-gray-700/50 transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5 text-gray-400 hover:text-white" />
                      </button>
                      
                      {showDropdown === meeting.id && (
                        <div 
                          className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDeleteMeeting(meeting.id)
                            }}
                            disabled={deletingId === meeting.id}
                            className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            {deletingId === meeting.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 flex-grow">
                    {new Date(meeting.startedAt).toLocaleDateString()} at {new Date(meeting.startedAt).toLocaleTimeString()}
                  </p>

                  <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {meeting.endedAt ? 
                        `${Math.round((new Date(meeting.endedAt).getTime() - new Date(meeting.startedAt).getTime()) / 60000)}m` : 
                        'Ongoing'
                      }
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {meeting.attendees.length} participants
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      meeting.status === 'COMPLETED'
                        ? 'bg-green-500/20 text-green-400'
                        : meeting.status === 'IN_PROGRESS'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {meeting.status}
                    </span>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-full bg-cyan-500/20 text-gray-300 hover:bg-cyan-500/30 transition-colors" title="Play Meeting">
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors" title="View Transcript">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors" title="View Summary">
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No meetings found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayoutWithSidebar>
  )
}