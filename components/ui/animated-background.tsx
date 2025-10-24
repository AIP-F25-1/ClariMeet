"use client";

import React from 'react';

interface AnimatedBackgroundProps {
  className?: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`fixed inset-0 w-screen h-screen bg-black ${className}`} style={{ zIndex: 1 }}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400/30 rounded-full animate-ping"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400/30 rounded-full animate-ping delay-700"></div>
          <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-cyan-300/30 rounded-full animate-ping delay-300"></div>
          <div className="absolute top-1/3 left-2/3 w-1 h-1 bg-purple-300/30 rounded-full animate-ping delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-cyan-500/20 rounded-full animate-ping delay-500"></div>
        </div>
        
        {/* Subtle gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-400/3 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
    </div>
  );
};

export default AnimatedBackground;
