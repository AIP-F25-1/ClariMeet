"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AccessGrantPopup } from "./access-grant-popup"
import CardNav from "./card-nav"

const navigationItems = [
  {
    label: "Features",
    bgColor: "#000000",
    textColor: "#ffffff",
    links: [
      { label: "Transcript Sync", href: "#transcript-sync", ariaLabel: "Learn about transcript synchronization" },
    ],
  },
  {
    label: "Integrations",
    bgColor: "#000000",
    textColor: "#ffffff",
    links: [
      { label: "API Access", href: "#api", ariaLabel: "Learn about API access" },
      { label: "WebSocket", href: "#websocket", ariaLabel: "Learn about WebSocket integration" },
      { label: "Mock Data", href: "#mock-data", ariaLabel: "Learn about mock data" },
    ],
  },
  {
    label: "Resources",
    bgColor: "#000000",
    textColor: "#ffffff",
    links: [
      { label: "Documentation", href: "#docs", ariaLabel: "View documentation" },
      { label: "Examples", href: "#examples", ariaLabel: "View examples" },
      { label: "Support", href: "#support", ariaLabel: "Get support" },
    ],
  },
]

export function Header() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user, signOut } = useAuth()
  const [showAccessPopup, setShowAccessPopup] = useState(false)


  const handleGetStarted = async () => {
    if (isAuthenticated) {
      // If user is authenticated, go to dashboard
      router.push('/dashboard')
      return
    }

    try {
      // Call API endpoint
      const response = await fetch('/api/get-started', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'header_button',
          userAgent: navigator.userAgent
        })
      })

      await response.json()
      // Show popup after successful API call
      setShowAccessPopup(true)

    } catch (error) {
      // Still show popup even if API fails
      setShowAccessPopup(true)
    }
  }

  const handleDashboard = () => {
    router.push("/dashboard")
  }

  const handleLogout = () => {
    signOut()
    router.push('/')
  }

  const handleClosePopup = () => {
    setShowAccessPopup(false)
  }

  const getNavigationItems = () => {
    return navigationItems
  }

  const getUserInitials = (name: string) => {
    if (!name) return 'U'
    
    const names = name.trim().split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Navigation */}
          <div className="flex-1">
            <CardNav
              logo="/video-transcript-logo.jpg"
              logoAlt="ClariMeet - Video Transcript Player"
              items={getNavigationItems()}
              baseColor="rgba(0, 0, 0, 0.8)"
              menuColor="#ffffff"
              buttonBgColor="transparent"
              buttonTextColor="#ffffff"
              buttonText=""
              ease="power3.out"
              onButtonClick={() => {}}
            />
          </div>
          
          {/* Right side - User Profile and Logout */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 ml-4">
              {/* User Profile Circle */}
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl rounded-full px-3 py-2 border border-cyan-400/30">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {getUserInitials(user.name || user.email)}
                  </span>
                </div>
                <span className="text-white text-sm font-medium hidden sm:block">
                  {user.name || user.email.split('@')[0]}
                </span>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-400 hover:text-red-300 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-xl"
              >
                Logout
              </button>
            </div>
          )}
          
          {/* Get Started Button for non-authenticated users */}
          {!isAuthenticated && (
            <button
              onClick={handleGetStarted}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-xl ml-4"
            >
              Get Started
            </button>
          )}
        </div>
      </div>

      {/* Access Grant Popup */}
      <AccessGrantPopup
        isOpen={showAccessPopup}
        onClose={handleClosePopup}
      />
    </div>
  )
}
