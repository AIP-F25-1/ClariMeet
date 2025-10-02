"use client"

import React from 'react'

interface CompactAnimatedLogoProps {
  className?: string
}

export const CompactAnimatedLogo: React.FC<CompactAnimatedLogoProps> = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-2 bg-black/80 backdrop-blur-xl rounded-lg px-3 py-2 ${className}`}>
      {/* Compact logo container */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 to-purple-500/30 rounded-lg blur-sm animate-pulse" />
        
        {/* Logo elements */}
        <div className="relative flex items-center gap-1">
          {/* Speech bubble (main square) */}
          <div className="w-4 h-4 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-sm shadow-sm flex items-center justify-center animate-bounce-slow">
            <div className="w-2 h-2 bg-white rounded-sm" />
          </div>
          
          {/* Play button triangle */}
          <div className="w-0 h-0 border-l-[6px] border-l-green-400 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent animate-pulse" />
        </div>
        
        {/* User circle */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-gradient-to-br from-cyan-300 to-cyan-400 rounded-full animate-bounce-slow" />
      </div>
      
      {/* Text */}
      <div className="text-lg font-bold">
        <span className="text-cyan-400">Clari</span>
        <span className="text-green-400">Meet</span>
      </div>
    </div>
  )
}
