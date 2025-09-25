"use client"
import { gsap } from "gsap";
import React, { useEffect, useRef } from "react";

interface AnimatedLogoProps {
  className?: string;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className = "" }) => {
  const logoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logoRef.current && textRef.current) {
      // Initial animation on mount
      gsap.fromTo(logoRef.current,
        { scale: 0, rotation: -180, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.7)" }
      );

      gsap.fromTo(textRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.3, ease: "power2.out" }
      );

      // Hover animation
      const handleMouseEnter = () => {
        gsap.to(logoRef.current, { scale: 1.1, duration: 0.3, ease: "power2.out" });
        gsap.to(textRef.current, { color: "#3b82f6", duration: 0.3 });
      };

      const handleMouseLeave = () => {
        gsap.to(logoRef.current, { scale: 1, duration: 0.3, ease: "power2.out" });
        gsap.to(textRef.current, { color: "#1e293b", duration: 0.3 });
      };

      logoRef.current.addEventListener("mouseenter", handleMouseEnter);
      logoRef.current.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        logoRef.current?.removeEventListener("mouseenter", handleMouseEnter);
        logoRef.current?.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, []);

  return (
    <div className={`flex items-center gap-3 cursor-pointer ${className}`} ref={logoRef}>
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
      <div ref={textRef} className="text-xl font-bold text-slate-900">
        ClariMeet
      </div>
    </div>
  );
};

export default AnimatedLogo;
