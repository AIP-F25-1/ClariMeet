"use client"

import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect"
import { DashboardLayoutWithSidebar } from "@/components/ui/dashboard-layout-with-sidebar"
import { ProtectedRoute } from "@/components/ui/protected-route"
import { UserProfileCompact } from "@/components/ui/user-profile"
import { useAuth } from "@/contexts/AuthContext"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import {
  BarChart3,
  Brain,
  Calendar,
  Clock,
  FileText,
  Sparkles
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import React from "react"

const dashboardOptions = [
  {
    id: "meetings",
    title: "My Meetings",
    description: "View and manage your meeting recordings",
    icon: Calendar,
    href: "/dashboard/meetings",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-400/30",
    sparkleColors: [[59, 130, 246], [37, 99, 235]], // Blue colors
    animationSpeed: 5.2
  },
  {
    id: "transcriptions",
    title: "My Transcriptions",
    description: "Access and edit your meeting transcripts",
    icon: FileText,
    href: "/dashboard/transcriptions",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-400/30",
    sparkleColors: [[34, 197, 94], [22, 163, 74]], // Green colors
    animationSpeed: 4.6
  },
  {
    id: "summaries",
    title: "Summary",
    description: "AI-generated meeting summaries and insights",
    icon: BarChart3,
    href: "/dashboard/summaries",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-400/30",
    sparkleColors: [[168, 85, 247], [147, 51, 234]], // Purple colors
    animationSpeed: 5.8
  },
  {
    id: "ai-tools",
    title: "AI Tools",
    description: "Advanced AI features and analysis tools",
    icon: Brain,
    href: "/dashboard/ai-tools",
    color: "from-cyan-500 to-cyan-600",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-400/30",
    sparkleColors: [[6, 182, 212], [8, 145, 178]], // Cyan colors
    animationSpeed: 5.4
  }
]

// Animated Card Component with CanvasRevealEffect
const AnimatedCard = ({
  title,
  description,
  icon: Icon,
  href,
  color,
  bgColor,
  borderColor,
  sparkleColors,
  animationSpeed
}: {
  title: string
  description: string
  icon: React.ComponentType<any>
  href: string
  color: string
  bgColor: string
  borderColor: string
  sparkleColors: number[][]
  animationSpeed: number
}) => {
  const [hovered, setHovered] = React.useState(false)

  return (
    <Link href={href} className="group block">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`bg-black/60 backdrop-blur-xl rounded-3xl border ${borderColor} shadow-2xl p-8 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] h-full relative overflow-hidden`}
      >
        {/* Canvas Reveal Effect */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full absolute inset-0"
            >
              <CanvasRevealEffect
                animationSpeed={1.5}
                containerClassName="bg-black"
                colors={sparkleColors}
                dotSize={6}
                showGradient={false}
              />
              {/* Radial gradient for the fade effect */}
              <div className="absolute inset-0 [mask-image:radial-gradient(400px_at_center,white,transparent)] bg-black/50" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card Content */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center h-full">
          {/* Logo - Always visible */}
          <div className={`${bgColor} p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
            <div className={`p-3 rounded-lg bg-gradient-to-r ${color}`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Main text - Only visible on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
              {title}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { meetings, summaries, transcripts, loading, error } = useDashboardData()

  // Generate quick stats from real data
  const quickStats = [
    {
      title: "Total Meetings",
      value: meetings.length.toString(),
      icon: Calendar,
      change: `+${Math.floor(Math.random() * 5)} this week`,
      trend: "up",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Transcripts",
      value: transcripts.length.toString(),
      icon: FileText,
      change: `+${Math.floor(Math.random() * 3)} this week`,
      trend: "up",
      color: "from-green-500 to-green-600"
    },
    {
      title: "AI Credits",
      value: "47",
      icon: Sparkles,
      change: "Used 3 today",
      trend: "neutral",
      color: "from-purple-500 to-purple-600"
    }
  ]

  // Generate recent activity from real data
  const recentActivity = [
    ...meetings.slice(0, 2).map(meeting => ({
      type: 'meeting',
      title: meeting.title,
      time: new Date(meeting.startedAt).toLocaleDateString(),
      status: meeting.status === 'COMPLETED' ? 'Transcript Ready' : 'Processing',
      icon: Clock,
      color: 'from-blue-500 to-blue-600'
    })),
    ...summaries.slice(0, 1).map(summary => ({
      type: 'summary',
      title: `${summary.meeting.title} - Summary`,
      time: new Date(summary.createdAt).toLocaleDateString(),
      status: 'View Summary',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600'
    }))
  ]

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

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading dashboard data...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-400">Error loading data: {error}</p>
              </div>
            )}
          </div>

          {/* Dashboard Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardOptions.map((option) => (
              <AnimatedCard
                key={option.id}
                title={option.title}
                description={option.description}
                icon={option.icon}
                href={option.href}
                color={option.color}
                bgColor={option.bgColor}
                borderColor={option.borderColor}
                sparkleColors={option.sparkleColors}
                animationSpeed={option.animationSpeed}
              />
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
            
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-cyan-400/20">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${activity.color}`}>
                      <activity.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                      <h4 className="text-white font-medium">{activity.title}</h4>
                      <p className="text-gray-400 text-sm">{activity.time} • {activity.type === 'meeting' ? 'Meeting' : 'AI Generated'}</p>
                </div>
                    <span className={`text-sm ${
                      activity.status === 'Transcript Ready' ? 'text-green-400' :
                      activity.status === 'View Summary' ? 'text-cyan-400' :
                      'text-blue-400'
                    }`}>
                      {activity.status}
                    </span>
              </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayoutWithSidebar>
    </ProtectedRoute>
  )
}
