"use client";

import { Play } from "lucide-react";

interface VideoPlayerProps {
  videoUrl?: string
  title?: string
  className?: string
}

export function VideoPlayer({ videoUrl, title, className = "" }: VideoPlayerProps) {
  if (!videoUrl) {
    return (
      <div className={`bg-gray-900/50 rounded-lg p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Play className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Video Available</h3>
        <p className="text-gray-400">
          This meeting doesn't have a video recording yet.
        </p>
      </div>
    )
  }

  // Use our proxy endpoint to avoid CORS issues
  const proxyUrl = `/api/video-proxy?url=${encodeURIComponent(videoUrl)}`

  return (
    <div className={`bg-black rounded-lg overflow-hidden relative ${className}`}>
      <video
        src={proxyUrl}
        controls
        className="w-full h-full"
        preload="metadata"
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      >
        Your browser does not support the video tag.
      </video>
      
      {title && (
        <div className="absolute top-4 left-4 right-4">
          <h3 className="text-white font-semibold text-lg bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
            {title}
          </h3>
        </div>
      )}
    </div>
  )
}
