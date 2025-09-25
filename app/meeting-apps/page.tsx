"use client"

import AnimatedBackground from "@/components/ui/animated-background"
import { Header } from "@/components/ui/header"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const meetingApps = [
  { id: "google-meet", name: "Google Meet", icon: "📹" },
  { id: "zoom", name: "Zoom", icon: "🔗" },
  { id: "teams", name: "Microsoft Teams", icon: "👥" },
]

export default function MeetingAppsPage() {
  const [selectedApps, setSelectedApps] = useState<string[]>([])

  const toggleApp = (appId: string) => {
    setSelectedApps(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    )
  }

  const handleContinue = () => {
    // Handle continue logic here
    console.log("Selected apps:", selectedApps)
  }

  return (
    <div className="min-h-screen relative bg-black">
      {/* Animated Background Component */}
      <AnimatedBackground />

      <Header />

      <main className="pt-24 pb-12 relative z-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Back Button */}
          <div className="mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Meeting Apps Selection */}
            <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl">
                  ☁️
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
                Choose your meeting apps
              </h1>

              {/* Meeting Apps List */}
              <div className="space-y-4 mb-8">
                {meetingApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{app.icon}</span>
                      <span className="text-white font-medium">{app.name}</span>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleApp(app.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black ${
                        selectedApps.includes(app.id)
                          ? 'bg-cyan-400'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          selectedApps.includes(app.id) ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedApps.length === 0}
              >
                Continue
              </button>
            </div>

            {/* Right side - Anime Laptop Mockup */}
            <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl p-8 md:p-12 hover:bg-black/70 transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
              <div className="flex justify-center">
                {/* Laptop Mockup */}
                <div className="relative">
                  {/* Laptop Base */}
                  <div className="w-80 h-48 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg shadow-2xl relative overflow-hidden">
                    {/* Screen */}
                    <div className="absolute inset-2 bg-black rounded-md overflow-hidden">
                      {/* Meeting Screen Content */}
                      <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 relative">
                        {/* Video Grid - Anime Style */}
                        <div className="grid grid-cols-2 gap-1 p-2 h-full">
                          {/* Person 1 */}
                          <div className="bg-gradient-to-br from-pink-400 to-pink-600 rounded-md relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-2xl">👩</span>
                              </div>
                            </div>
                            <div className="absolute bottom-1 left-1 text-xs text-white font-bold bg-black/50 px-1 rounded">
                              Sarah
                            </div>
                          </div>
                          
                          {/* Person 2 */}
                          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-md relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-2xl">👨</span>
                              </div>
                            </div>
                            <div className="absolute bottom-1 left-1 text-xs text-white font-bold bg-black/50 px-1 rounded">
                              Mike
                            </div>
                          </div>
                          
                          {/* Person 3 */}
                          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-md relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-2xl">👩‍💼</span>
                              </div>
                            </div>
                            <div className="absolute bottom-1 left-1 text-xs text-white font-bold bg-black/50 px-1 rounded">
                              Emma
                            </div>
                          </div>
                          
                          {/* Person 4 */}
                          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-2xl">👨‍💻</span>
                              </div>
                            </div>
                            <div className="absolute bottom-1 left-1 text-xs text-white font-bold bg-black/50 px-1 rounded">
                              Alex
                            </div>
                          </div>
                        </div>
                        
                        {/* Meeting Controls */}
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                          <div className="w-6 h-6 bg-red-500 rounded-full"></div>
                          <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
                          <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Laptop Keyboard */}
                  <div className="w-80 h-4 bg-gradient-to-br from-gray-600 to-gray-800 rounded-b-lg shadow-lg"></div>
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-cyan-400/20 rounded-lg blur-xl -z-10"></div>
                </div>
              </div>
              
              {/* Description */}
              <div className="text-center mt-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  Seamless Video Meetings
                </h3>
                <p className="text-gray-300 text-sm">
                  Experience crystal-clear video calls with ClariMeet integration
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
