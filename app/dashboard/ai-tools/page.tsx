"use client"

import { DashboardLayoutWithSidebar } from "@/components/ui/dashboard-layout-with-sidebar"
import { Meteors } from "@/components/ui/meteors"
import {
    Brain,
    Clock,
    FileText,
    MessageSquare,
    Sparkles,
    TrendingUp,
    Users,
    Zap
} from "lucide-react"

const aiTools = [
  {
    id: 1,
    name: "Smart Summarizer",
    description: "Generate intelligent summaries from your meeting recordings",
    icon: FileText,
    status: "Available",
    usage: "Unlimited"
  },
  {
    id: 2,
    name: "Action Item Extractor",
    description: "Automatically identify and extract action items from meetings",
    icon: Zap,
    status: "Available",
    usage: "Unlimited"
  },
  {
    id: 3,
    name: "Sentiment Analyzer",
    description: "Analyze meeting sentiment and engagement levels",
    icon: TrendingUp,
    status: "Available",
    usage: "Unlimited"
  },
  {
    id: 4,
    name: "Meeting Insights",
    description: "Get AI-powered insights and recommendations",
    icon: Brain,
    status: "Available",
    usage: "Unlimited"
  },
  {
    id: 5,
    name: "Question Generator",
    description: "Generate follow-up questions based on meeting content",
    icon: MessageSquare,
    status: "Available",
    usage: "Unlimited"
  },
  {
    id: 6,
    name: "Meeting Optimizer",
    description: "Get suggestions to improve meeting effectiveness",
    icon: Sparkles,
    status: "Available",
    usage: "Unlimited"
  }
]

export default function AIToolsPage() {
  return (
    <DashboardLayoutWithSidebar>
      <div className="p-4 pl-16 min-h-screen">
        {/* Page Header */}
        <div className="relative bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-600/30 shadow-2xl p-6 md:p-8 mb-6 overflow-hidden">
          <Meteors number={30} />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                <Brain className="w-10 h-10 text-gray-300" />
                AI Tools
              </h1>
              <p className="text-xl text-gray-300">
                Powerful AI tools to enhance your meeting experience
              </p>
            </div>
          </div>

          {/* AI Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiTools.map((tool) => (
              <div key={tool.id} className="bg-gray-800/40 rounded-xl p-6 border border-gray-600/20 hover:border-gray-600/40 transition-all duration-300 flex flex-col group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                    <tool.icon className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{tool.name}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      {tool.status}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mb-4 flex-grow">
                  {tool.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-gray-300 text-sm font-medium">
                    {tool.usage}
                  </span>
                  <button className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                    Use Tool
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Usage Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/40 rounded-xl p-6 border border-gray-600/20">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-gray-300" />
                <h3 className="text-lg font-semibold text-white">Time Saved</h3>
              </div>
              <p className="text-3xl font-bold text-gray-300">24h</p>
              <p className="text-sm text-gray-400">This month</p>
            </div>
            
            <div className="bg-gray-800/40 rounded-xl p-6 border border-gray-600/20">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-6 h-6 text-gray-300" />
                <h3 className="text-lg font-semibold text-white">Documents Processed</h3>
              </div>
              <p className="text-3xl font-bold text-gray-300">156</p>
              <p className="text-sm text-gray-400">This month</p>
            </div>
            
            <div className="bg-gray-800/40 rounded-xl p-6 border border-gray-600/20">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-6 h-6 text-gray-300" />
                <h3 className="text-lg font-semibold text-white">Team Members</h3>
              </div>
              <p className="text-3xl font-bold text-gray-300">12</p>
              <p className="text-sm text-gray-400">Active users</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayoutWithSidebar>
  )
}