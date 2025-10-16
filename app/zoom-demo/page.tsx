'use client'

import ClariMeetOverlay from '@/components/zoom/ClariMeetOverlay'
import { useState } from 'react'

export default function ZoomDemoPage() {
  const [showOverlay, setShowOverlay] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Demo Controls */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => setShowOverlay(!showOverlay)}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg"
        >
          {showOverlay ? 'Hide' : 'Show'} Zoom Overlay
        </button>
      </div>

      {/* Mock Zoom Meeting Background */}
      <div className="w-full h-screen bg-gray-800 relative overflow-hidden">
        {/* Mock video tiles */}
        <div className="absolute top-20 left-20 w-64 h-48 bg-gray-700 rounded-lg border-2 border-gray-600 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Kyle Wilner</p>
            <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mt-2 animate-pulse"></div>
          </div>
        </div>

        <div className="absolute top-20 right-80 w-64 h-48 bg-gray-700 rounded-lg border-2 border-gray-600 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Emma Erickson</p>
            <div className="w-3 h-3 bg-gray-500 rounded-full mx-auto mt-2"></div>
          </div>
        </div>

        {/* Mock Zoom toolbar */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Mute</button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Video</button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Share</button>
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Record</button>
        </div>

        {/* Instructions */}
        <div className="absolute top-4 right-4 bg-white/90 p-4 rounded-lg max-w-sm">
          <h3 className="font-bold text-gray-800 mb-2">Zoom Plugin Demo</h3>
          <p className="text-sm text-gray-600 mb-2">
            This simulates how ClariMeet will appear as an overlay in Zoom meetings.
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Shows live participants</li>
            <li>• Highlights current speaker</li>
            <li>• Displays meeting timer</li>
            <li>• Recording controls</li>
            <li>• Quick access to dashboard</li>
          </ul>
        </div>
      </div>

      {/* ClariMeet Overlay */}
      {showOverlay && <ClariMeetOverlay />}
    </div>
  )
}
