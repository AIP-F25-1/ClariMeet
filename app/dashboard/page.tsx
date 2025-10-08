"use client"

import { DashboardLayoutWithSidebar } from "@/components/ui/dashboard-layout-with-sidebar"
import { ProtectedRoute } from "@/components/ui/protected-route"
import { UserProfileCompact } from "@/components/ui/user-profile"
import { useAuth } from "@/contexts/AuthContext"
import {
    BarChart3,
    Brain,
    Calendar,
    Clock,
    FileText,
    Sparkles,
    TrendingUp,
    Upload
} from "lucide-react"
import Link from "next/link"

const dashboardOptions = [
  {
    id: "meetings",
    title: "My Meetings",
    description: "View and manage your meeting recordings",
    icon: Calendar,
    href: "/dashboard/meetings",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-400/30"
  },
  {
    id: "transcriptions",
    title: "My Transcriptions",
    description: "Access and edit your meeting transcripts",
    icon: FileText,
    href: "/dashboard/transcriptions",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-400/30"
  },
  {
    id: "summaries",
    title: "Summary",
    description: "AI-generated meeting summaries and insights",
    icon: BarChart3,
    href: "/dashboard/summaries",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-400/30"
  },
  {
    id: "ai-tools",
    title: "AI Tools",
    description: "Advanced AI features and analysis tools",
    icon: Brain,
    href: "/dashboard/ai-tools",
    color: "from-cyan-500 to-cyan-600",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-400/30"
  }
]

const quickStats = [
  {
    title: "Total Meetings",
    value: "12",
    icon: Calendar,
    change: "+3 this week",
    trend: "up"
  },
  {
    title: "Transcripts",
    value: "8",
    icon: FileText,
    change: "+2 this week",
    trend: "up"
  },
  {
    title: "AI Credits",
    value: "47",
    icon: Sparkles,
    change: "Used 3 today",
    trend: "neutral"
  }
]

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <DashboardLayoutWithSidebar>
        <div className="space-y-8">
          {/* Dashboard Header */}
          <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  Welcome back, {user?.given_name || user?.name}!
                </h1>
                <p className="text-xl text-gray-300">
                  Manage your meetings, transcripts, and AI tools
                </p>
              </div>
              <UserProfileCompact />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {quickStats.map((stat, index) => (
                <div key={index} className="bg-black/40 rounded-xl p-6 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-400' : 
                      stat.trend === 'down' ? 'text-red-400' : 
                      'text-gray-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardOptions.map((option) => (
              <Link
                key={option.id}
                href={option.href}
                className="group block"
              >
                <div className={`bg-black/60 backdrop-blur-xl rounded-3xl border ${option.borderColor} shadow-2xl p-8 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] h-full`}>
                  <div className="flex flex-col items-center text-center h-full">
                    <div className={`${option.bgColor} p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${option.color}`}>
                        <option.icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                      {option.title}
                    </h3>
                    
                    <p className="text-gray-300 text-sm leading-relaxed flex-grow">
                      {option.description}
                    </p>

                    <div className="mt-6 flex items-center text-cyan-400 text-sm font-medium group-hover:text-white transition-colors">
                      <span>Explore</span>
                      <TrendingUp className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-cyan-400/20">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">Team Standup Meeting</h4>
                  <p className="text-gray-400 text-sm">2 hours ago • 5 participants</p>
                </div>
                <span className="text-green-400 text-sm">Transcript Ready</span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-cyan-400/20">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">Weekly Review Summary</h4>
                  <p className="text-gray-400 text-sm">1 day ago • AI Generated</p>
                </div>
                <span className="text-cyan-400 text-sm">View Summary</span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-cyan-400/20">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">Client Presentation</h4>
                  <p className="text-gray-400 text-sm">3 days ago • Uploaded</p>
                </div>
                <span className="text-blue-400 text-sm">Processing</span>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayoutWithSidebar>
    </ProtectedRoute>
  )
}
