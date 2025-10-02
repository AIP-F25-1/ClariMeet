"use client"

import { useEffect, useRef } from 'react'

interface SplineAnimationProps {
  url?: string
  className?: string
}

export const SplineAnimation: React.FC<SplineAnimationProps> = ({ 
  url = "https://prod.spline.design/DxfB27vk5VfCNnnp/scene.splinecode", 
  className = "" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Add a small delay to prevent blocking the main thread
    const timeoutId = setTimeout(() => {
      // Check if script is already loaded
      const existingScript = document.querySelector('script[src*="spline-viewer.js"]')
      if (!existingScript) {
        // Create the embed HTML exactly as you provided
        const embedHTML = `
          <script type="module" src="https://unpkg.com/@splinetool/viewer@1.10.71/build/spline-viewer.js"></script>
          <spline-viewer url="${url}"></spline-viewer>
        `

        // Set the innerHTML to include the script and spline-viewer
        if (containerRef.current) {
          containerRef.current.innerHTML = embedHTML
        }
      } else {
        // Script already exists, just create the viewer
        if (containerRef.current) {
          const splineViewer = document.createElement('spline-viewer')
          splineViewer.setAttribute('url', url)
          containerRef.current.innerHTML = ''
          containerRef.current.appendChild(splineViewer)
        }
      }
    }, 100) // Small delay to prevent blocking

    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [url])

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{ 
        width: '100%', 
        height: '100%',
        overflow: 'hidden'
      }}
    />
  )
}
