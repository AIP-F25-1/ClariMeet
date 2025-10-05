"use client";

import { useEffect, useRef } from "react";

export const SimpleTracingBeam = () => {
  const progressRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;

      if (progressRef.current) {
        progressRef.current.style.height = `${scrollPercent}%`;
      }

      if (circleRef.current) {
        circleRef.current.style.top = `${scrollPercent}%`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="fixed left-4 md:left-8 top-0 h-full z-50 pointer-events-none">
      <div className="relative h-full w-1">
        {/* Background Line */}
        <div className="absolute left-0 top-0 w-full h-full bg-gray-800/30" />
        
        {/* Progress Line */}
        <div
          ref={progressRef}
          className="absolute left-0 top-0 w-full bg-gradient-to-b from-cyan-400 to-purple-500 transition-all duration-100 ease-out"
          style={{ height: "0%" }}
        />
        
        {/* Progress Circle */}
        <div
          ref={circleRef}
          className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-lg transition-all duration-100 ease-out"
          style={{ top: "0%" }}
        />
        
        {/* Top Circle */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-0 w-3 h-3 rounded-full bg-cyan-400 shadow-lg" />
        
        {/* Bottom Circle */}
        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 w-3 h-3 rounded-full bg-purple-500 shadow-lg" />
      </div>
    </div>
  );
};

