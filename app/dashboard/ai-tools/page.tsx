"use client"

import AnimatedBackground from "@/components/ui/animated-background"
import { Header } from "@/components/ui/header"
import { useAuth } from "@/contexts/AuthContext"
import { 
  Brain, 
  Sparkles, 
  MessageSquare, 
  Search,
  FileText,
  BarChart3,
  Zap,
  Target,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Play,
  Settings,
  Star
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const aiTools = [
  {
    id: "chat",
    title: "AI Chat Assistant",
    description: "Ask questions about your meetings and get instant answers",
    icon: MessageSquare,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-400/30",
    credits: 5,
    popular: true
  },
  {
    id: "search",
    title: "Smart Search",
    description: "Search across all your meetings with natural language",
    icon: Search,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-400/30",
    credits: 2,
    popular: false
  },
  {
    id: "insights",
    title: "Meeting Insights",
    description: "Get AI-powered insights and recommendations",
    icon: TrendingUp,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-400/30",
    credits: 8,
    popular: true
  },
  {
    id: "action-items",
    title: "Action Item Extractor",
    description: "Automatically identify and track action items",
    icon: Target,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-400/30",
    credits: 3,
    popular: false
  },
  {
    id: "sentiment",
    title: "Sentiment Analysis",
    description: "Analyze the mood and tone of your meetings",
    icon: BarChart3,
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-400/30",
    credits: 4,
    popular: false
  },
  {
    id: "translation",
    title: "Language Translation",
    description: "Translate meetings to different languages",
    icon: FileText,
    color: "from-cyan-500 to-cyan-600",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-400/30",
    credits: 6,
    popular: false
  }
]

const recentActivity = [
  {
    id: 1,
    tool: "AI Chat Assistant",
    action: "Asked about team productivity trends",
    time: "2 hours ago",
    credits: 5
  },
  {
    id: 2,
    tool: "Meeting Insights",
    action: "Generated insights for weekly standup",
    time: "1 day ago",
    credits: 8
  },
  {
    id: 3,
    tool: "Smart Search",
    action: "Searched for 'project deadlines'",
    time: "2 days ago",
    credits: 2
  }
]

export default function AIToolsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

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
                  <Brain className="w-10 h-10 text-cyan-400" />
                  AI Tools
                </h1>
                <p className="text-xl text-gray-300">
                  Advanced AI features and analysis tools
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">47</div>
                  <div className="text-sm text-gray-400">AI Credits</div>
                </div>
                <button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Buy Credits
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search AI tools and features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-cyan-400/30 rounded-xl text-white placeholder-gray-400 focus:border-cyan-400/60 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* AI Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiTools.map((tool) => (
              <div
                key={tool.id}
                className={`bg-black/60 backdrop-blur-xl rounded-3xl border ${tool.borderColor} shadow-2xl p-8 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] group cursor-pointer`}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${tool.bgColor} p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${tool.color}`}>
                        <tool.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    {tool.popular && (
                      <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-2 py-1 rounded-full text-xs font-medium">
                        <Star className="w-3 h-3" />
                        Popular
                      </div>
                    )}
                  </div>

                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                      {tool.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400 text-sm">
                      <Zap className="w-4 h-4" />
                      <span>{tool.credits} credits</span>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105">
                      Use Tool
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Activity Feed */}
            <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
              <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-cyan-400/20">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{activity.tool}</h4>
                      <p className="text-gray-400 text-sm">{activity.action}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">{activity.time}</span>
                        <span className="text-xs text-cyan-400">{activity.credits} credits used</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
              <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
              
              <div className="space-y-4">
                <button className="w-full flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium">Start AI Chat</h4>
                    <p className="text-gray-400 text-sm">Ask questions about your meetings</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium">Smart Search</h4>
                    <p className="text-gray-400 text-sm">Search across all meetings</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium">Generate Insights</h4>
                    <p className="text-gray-400 text-sm">Get AI-powered recommendations</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium">AI Settings</h4>
                    <p className="text-gray-400 text-sm">Configure AI preferences</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
