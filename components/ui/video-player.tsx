'use client'

import { useEffect, useState } from 'react'

interface VideoPlayerProps {
  videoUrl: string
  thumbnailUrl?: string
  title: string
  className?: string
}

export function VideoPlayer({ videoUrl, thumbnailUrl, title, className = "" }: VideoPlayerProps) {
  const [videoError, setVideoError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [useProxy, setUseProxy] = useState(false)

  useEffect(() => {
    setVideoError(false)
    setIsLoading(true)
    setUseProxy(false)
  }, [videoUrl])

  const handleVideoError = () => {
    console.error('Video failed to load:', videoUrl)
    
    // Try proxy route as fallback
    if (!useProxy && videoUrl.includes('cloudinary.com')) {
      console.log('🔄 Trying proxy route for Cloudinary video...')
      setUseProxy(true)
      setIsLoading(true)
      setVideoError(false)
    } else {
      setVideoError(true)
      setIsLoading(false)
    }
  }

  const handleVideoLoad = () => {
    setIsLoading(false)
    setVideoError(false)
  }

  // Use proxy URL for Cloudinary videos if direct URL failed
  const getVideoSrc = () => {
    if (useProxy && videoUrl.includes('cloudinary.com')) {
      return `/api/video-proxy?url=${encodeURIComponent(videoUrl)}`
    }
    return videoUrl
  }

  if (videoError) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Video Failed to Load</h3>
          <p className="text-gray-400 mb-4">Unable to load the video from Cloudinary</p>
          <div className="text-sm text-gray-500 space-y-1">
            <p><strong>Original URL:</strong> {videoUrl}</p>
            <p><strong>Proxy Attempted:</strong> {useProxy ? 'Yes' : 'No'}</p>
            <p><strong>Current Source:</strong> {getVideoSrc()}</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-2 text-center">{title}</p>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      {isLoading && (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading video...</p>
        </div>
      )}
      <video
        controls
        preload="metadata"
        poster={thumbnailUrl}
        className="w-full rounded-lg shadow-lg"
        style={{ maxHeight: '500px', display: isLoading ? 'none' : 'block' }}
        onError={handleVideoError}
        onLoadedData={handleVideoLoad}
        onCanPlay={handleVideoLoad}
        key={useProxy ? 'proxy' : 'direct'}
      >
        <source src={getVideoSrc()} type="video/mp4" />
        <source src={getVideoSrc()} type="video/webm" />
        <source src={getVideoSrc()} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
      <p className="text-gray-400 text-sm mt-2 text-center">{title}</p>
    </div>
  )
}
