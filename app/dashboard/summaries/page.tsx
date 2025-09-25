"use client"

import AnimatedBackground from "@/components/ui/animated-background"
import { Header } from "@/components/ui/header"
import { useAuth } from "@/contexts/AuthContext"
import { 
  BarChart3, 
  Clock, 
  Users, 
  Download, 
  Share2, 
  MoreHorizontal,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  Target,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const mockSummaries = [
  {
    id: 1,
    title: "Team Standup Meeting",
    date: "2024-01-15",
    duration: "15m",
    participants: ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson"],
    status: "Complete",
    summaryType: "Key Points",
    wordCount: 450,
    insights: 5,
    actionItems: 3,
    confidence: 95
  },
  {
    id: 2,
    title: "Client Presentation Review",
    date: "2024-01-14",
    duration: "45m",
    participants: ["John Doe", "Client Team", "Marketing Team"],
    status: "Complete",
    summaryType: "Executive Summary",
    wordCount: 1200,
    insights: 12,
    actionItems: 7,
    confidence: 92
  },
  {
    id: 3,
    title: "Weekly Planning Session",
    date: "2024-01-13",
    duration: "30m",
    participants: ["John Doe", "Product Team"],
    status: "Processing",
    summaryType: "Action Items",
    wordCount: 0,
    insights: 0,
    actionItems: 0,
    confidence: 0
  }
]

const summaryTypes = [
  { id: "key-points", name: "Key Points", icon: Target, color: "from-blue-500 to-blue-600" },
  { id: "executive", name: "Executive Summary", icon: TrendingUp, color: "from-purple-500 to-purple-600" },
  { id: "action-items", name: "Action Items", icon: CheckCircle, color: "from-green-500 to-green-600" },
  { id: "insights", name: "Insights", icon: Sparkles, color: "from-cyan-500 to-cyan-600" }
]

export default function SummariesPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")

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
                  <BarChart3 className="w-10 h-10 text-purple-400" />
                  Summary
                </h1>
                <p className="text-xl text-gray-300">
                  AI-generated meeting summaries and insights
                </p>
              </div>
              <button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Generate Summary
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search summaries, meetings, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-cyan-400/30 rounded-xl text-white placeholder-gray-400 focus:border-cyan-400/60 focus:outline-none transition-colors"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-3 bg-black/40 border border-cyan-400/30 rounded-xl text-white hover:border-cyan-400/60 transition-colors">
                <Filter className="w-5 h-5" />
                Filter
              </button>
            </div>
          </div>

          {/* Summary Types */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-6 rounded-xl border transition-all duration-300 ${
                  selectedType === type.id
                    ? 'border-purple-400/60 bg-purple-500/10'
                    : 'border-cyan-400/30 bg-black/40 hover:border-cyan-400/50'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${type.color} mb-3`}>
                    <type.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-medium text-sm">{type.name}</h3>
                </div>
              </button>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-cyan-400/30 p-6 hover:bg-black/70 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">12</span>
              </div>
              <h3 className="text-gray-400 text-sm">Total Summaries</h3>
            </div>

            <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-cyan-400/30 p-6 hover:bg-black/70 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">28</span>
              </div>
              <h3 className="text-gray-400 text-sm">Action Items</h3>
            </div>

            <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-cyan-400/30 p-6 hover:bg-black/70 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">45</span>
              </div>
              <h3 className="text-gray-400 text-sm">Key Insights</h3>
            </div>

            <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-cyan-400/30 p-6 hover:bg-black/70 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">94%</span>
              </div>
              <h3 className="text-gray-400 text-sm">Avg Accuracy</h3>
            </div>
          </div>

          {/* Summaries List */}
          <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Summaries</h2>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-sm">Sort by:</span>
                <select className="bg-black/40 border border-cyan-400/30 rounded-lg px-3 py-1 text-white text-sm focus:border-cyan-400/60 focus:outline-none">
                  <option>Date (Newest)</option>
                  <option>Date (Oldest)</option>
                  <option>Confidence</option>
                  <option>Title</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {mockSummaries.map((summary) => (
                <div key={summary.id} className="bg-black/40 rounded-xl border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-1">{summary.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {summary.date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {summary.duration}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {summary.participants.length} participants
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          summary.status === 'Complete' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {summary.status}
                        </span>
                        <span className="text-sm text-gray-400">
                          Type: {summary.summaryType}
                        </span>
                        {summary.status === 'Complete' && (
                          <>
                            <span className="text-sm text-gray-400">
                              Confidence: {summary.confidence}%
                            </span>
                            <span className="text-sm text-gray-400">
                              {summary.wordCount} words
                            </span>
                          </>
                        )}
                      </div>

                      {summary.status === 'Complete' && (
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-gray-400">{summary.insights} Insights</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-gray-400">{summary.actionItems} Action Items</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg text-sm transition-colors">
                          <FileText className="w-4 h-4" />
                          View Summary
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-sm transition-colors">
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm transition-colors">
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
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
