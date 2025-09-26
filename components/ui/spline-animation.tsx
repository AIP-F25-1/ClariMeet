"use client"

import { useEffect, useState } from 'react'

interface SplineAnimationProps {
  url: string
  className?: string
}

export const SplineAnimation: React.FC<SplineAnimationProps> = ({ url, className = "" }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Set a timeout to show error if loading takes too long
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Spline loading timeout - switching to fallback')
        setHasError(true)
        setIsLoading(false)
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [isLoading])

  useEffect(() => {
    // Check if spline-viewer is available after a short delay
    const checkSpline = () => {
      if (typeof window !== 'undefined' && (window as any).customElements?.get('spline-viewer')) {
        console.log('✅ Spline viewer is available')
        setIsLoading(false)
        setHasError(false)
      } else {
        console.log('⏳ Spline viewer not ready yet')
      }
    }

    // Check immediately and then every 500ms
    checkSpline()
    const interval = setInterval(checkSpline, 500)

    // Clear interval after 15 seconds
    const clearIntervalTimeout = setTimeout(() => {
      clearInterval(interval)
      if (isLoading) {
        console.log('❌ Spline viewer failed to load')
        setHasError(true)
        setIsLoading(false)
      }
    }, 15000)

    return () => {
      clearInterval(interval)
      clearTimeout(clearIntervalTimeout)
    }
  }, [])

  if (hasError) {
    return (
      <div className={`relative ${className} flex items-center justify-center`}>
        {/* Fallback 3D-looking placeholder */}
        <div className="w-full h-full bg-black rounded-xl flex items-center justify-center relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-cyan-300/20 rounded-full blur-lg animate-pulse delay-500"></div>
          </div>
          
          {/* 3D-looking elements */}
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl mx-auto mb-4 transform rotate-45 animate-spin-slow"></div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-lg mx-auto mb-2 transform -rotate-12 animate-bounce"></div>
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-300 to-purple-300 rounded-full mx-auto transform rotate-45 animate-pulse"></div>
          </div>
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
            <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-700"></div>
            <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping delay-300"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <spline-viewer 
        url={url}
        className="w-full h-full"
        onLoad={() => {
          console.log('✅ Spline animation loaded successfully!')
          setIsLoading(false)
        }}
        onError={(error) => {
          console.error('❌ Spline animation error:', error)
          setHasError(true)
          setIsLoading(false)
        }}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-cyan-400 text-sm">Loading 3D Animation...</p>
          </div>
        </div>
      )}
    </div>
  )
}
