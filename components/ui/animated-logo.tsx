"use client"

import React, { useEffect, useRef } from 'react'

interface AnimatedLogoProps {
  className?: string
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !logoRef.current) return

    const container = containerRef.current
    const logo = logoRef.current

    // Create floating particles
    const createParticle = () => {
      const particle = document.createElement('div')
      particle.className = 'absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse'
      particle.style.left = Math.random() * 100 + '%'
      particle.style.top = Math.random() * 100 + '%'
      particle.style.animationDelay = Math.random() * 2 + 's'
      particle.style.animationDuration = (Math.random() * 3 + 2) + 's'
      container.appendChild(particle)

      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle)
        }
      }, 5000)
    }

    // Create particles periodically
    const particleInterval = setInterval(createParticle, 800)

    // Add hover effects
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height

      logo.style.transform = `translate(${(x - 0.5) * 10}px, ${(y - 0.5) * 10}px) scale(1.05)`
    }

    const handleMouseLeave = () => {
      logo.style.transform = 'translate(0, 0) scale(1)'
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    // Cleanup
    return () => {
      clearInterval(particleInterval)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden rounded-3xl ${className}`}
    >
      {/* Transparent background to match hero section */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl rounded-3xl shadow-2xl" />
      
      {/* Animated logo container */}
      <div 
        ref={logoRef}
        className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
      >
        {/* Logo SVG */}
        <div className="relative">
          {/* Main logo container */}
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            {/* Background circle with glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
            
            {/* Logo elements */}
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Speech bubble (main square) */}
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-xl shadow-lg flex items-center justify-center animate-bounce-slow">
                  {/* Speech bubble icon */}
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                  </svg>
                </div>
                
                {/* Play button triangle */}
                <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-0 h-0 border-l-[12px] md:border-l-[16px] border-l-green-400 border-t-[8px] md:border-t-[10px] border-t-transparent border-b-[8px] md:border-b-[10px] border-b-transparent animate-pulse" />
                </div>
                
                {/* User circle */}
                <div className="absolute -top-2 -left-2 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-cyan-300 to-cyan-400 rounded-full flex items-center justify-center shadow-md animate-bounce-slow">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
            
            {/* Connection lines */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Animated connection lines */}
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                <path
                  d="M20,20 Q50,40 80,20"
                  stroke="url(#lineGradient)"
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray="2,2"
                  className="animate-pulse"
                />
                <path
                  d="M20,80 Q50,60 80,80"
                  stroke="url(#lineGradient)"
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray="2,2"
                  className="animate-pulse"
                  style={{ animationDelay: '0.5s' }}
                />
                <circle cx="20" cy="20" r="2" fill="#06b6d4" className="animate-ping" />
                <circle cx="80" cy="20" r="2" fill="#10b981" className="animate-ping" style={{ animationDelay: '0.3s' }} />
                <circle cx="20" cy="80" r="2" fill="#10b981" className="animate-ping" style={{ animationDelay: '0.6s' }} />
                <circle cx="80" cy="80" r="2" fill="#06b6d4" className="animate-ping" style={{ animationDelay: '0.9s' }} />
              </svg>
            </div>
          </div>
          
          {/* ClariMeet text */}
          <div className="mt-6 text-center">
            <div className="text-2xl md:text-3xl font-bold">
              <span className="text-cyan-400">Clari</span>
              <span className="text-green-400">Meet</span>
            </div>
            <div className="text-sm text-gray-400 mt-1 animate-pulse">
              Live Transcription
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating particles will be added dynamically */}
    </div>
  )
}
