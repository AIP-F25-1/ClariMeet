"use client"

import { useRouter } from "next/navigation"
import { CardNav } from "./card-nav"
import { UserProfileCompact } from "./user-profile"
import { useAuth } from "@/contexts/AuthContext"
import { AccessGrantPopup } from "./access-grant-popup"
import { useState } from "react"

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

  const handleGetStarted = () => {
    setShowAccessPopup(true)
  }

  const handleDashboard = () => {
    router.push("/dashboard")
  }

  const handleClosePopup = () => {
    setShowAccessPopup(false)
  }

  // Add dashboard option to navigation items for authenticated users
  const getNavigationItems = () => {
    if (!isAuthenticated) return navigationItems

    // Add Dashboard option for authenticated users
    const dashboardItem = {
      label: "Dashboard",
      bgColor: "#8B5CF6",
      textColor: "#ffffff",
      links: [
        { label: "My Meetings", href: "/dashboard/meetings", ariaLabel: "View my meetings" },
        { label: "Transcriptions", href: "/dashboard/transcriptions", ariaLabel: "View transcriptions" },
        { label: "Summary", href: "/dashboard/summaries", ariaLabel: "View summaries" },
        { label: "AI Tools", href: "/dashboard/ai-tools", ariaLabel: "Access AI tools" },
      ],
    }

    return [dashboardItem, ...navigationItems]
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
              buttonBgColor={isAuthenticated ? "#8B5CF6" : "#00FFFF"}
              buttonTextColor="#000000"
              buttonText={isAuthenticated ? "Dashboard" : "Get Started"}
              ease="power3.out"
              onButtonClick={isAuthenticated ? handleDashboard : handleGetStarted}
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
