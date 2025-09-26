"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AccessGrantPopup } from "./access-grant-popup"
import { CardNav } from "./card-nav"
import { UserProfileCompact } from "./user-profile"

const navigationItems = [
  {
    label: "Features",
    bgColor: "#000000",
    textColor: "#ffffff",
    links: [
      { label: "Live Captions", href: "#live-captions", ariaLabel: "Learn about live captions" },
      { label: "Transcript Sync", href: "#transcript-sync", ariaLabel: "Learn about transcript synchronization" },
      { label: "Video Controls", href: "#video-controls", ariaLabel: "Learn about video controls" },
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
  const { isAuthenticated, isLoading } = useAuth()
  const [showAccessPopup, setShowAccessPopup] = useState(false)
  

  const handleGetStarted = async () => {
    console.log('🚀 Get Started button clicked!')
    
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

      const result = await response.json()
      console.log('✅ API Response:', result)

      // Show popup after successful API call
      setShowAccessPopup(true)
      console.log('✅ Popup opened')

    } catch (error) {
      console.error('❌ API Error:', error)
      // Still show popup even if API fails
      setShowAccessPopup(true)
    }
  }

  const handleDashboard = () => {
    router.push("/dashboard")
  }

  const handleClosePopup = () => {
    setShowAccessPopup(false)
  }

  const getNavigationItems = () => {
    return navigationItems
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <CardNav
              logo="/video-transcript-logo.jpg"
              logoAlt="ClariMeet - Video Transcript Player"
              items={getNavigationItems()}
              baseColor="rgba(0, 0, 0, 0.8)"
              menuColor="#ffffff"
              buttonBgColor="#00FFFF"
              buttonTextColor="#000000"
              buttonText="Get Started"
              ease="power3.out"
              onButtonClick={() => {
                console.log('📞 CardNav onButtonClick called')
                handleGetStarted()
              }}
            />
          </div>
          
          {/* Authentication Section */}
          {!isLoading && (
            <div className="flex-shrink-0">
              {isAuthenticated ? (
                <UserProfileCompact />
              ) : null}
            </div>
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
