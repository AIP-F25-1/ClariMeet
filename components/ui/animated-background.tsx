"use client"

import React from 'react';
import PixelBlast from './PixelBlast';

interface AnimatedBackgroundProps {
  className?: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`fixed inset-0 w-screen h-screen bg-black ${className}`} style={{ zIndex: 1 }}>
      <PixelBlast
        variant="circle"
        pixelSize={6}
        color="#00FFFF"
        className="w-full h-full"
        style={{ width: '100vw', height: '100vh' }}
        patternScale={3}
        patternDensity={1.2}
        pixelSizeJitter={0.5}
        enableRipples={true}
        rippleSpeed={0.4}
        rippleThickness={0.12}
        rippleIntensityScale={1.5}
        liquid={true}
        liquidStrength={0.12}
        liquidRadius={1.2}
        liquidWobbleSpeed={5}
        speed={0.6}
        edgeFade={0.25}
        transparent={true}
        antialias={true}
        autoPauseOffscreen={true}
      />
    </div>
  );
};

export default AnimatedBackground;
