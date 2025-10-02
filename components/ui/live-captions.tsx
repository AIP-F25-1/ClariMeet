"use client"

import { useActiveSegment } from "@/contexts/transcript-context"

export function LiveCaptions() {
  const { activeSegment, currentTime } = useActiveSegment()

  if (!activeSegment) return null

  // Simple progress calculation
  const progress = activeSegment.start && activeSegment.end 
    ? Math.min(100, Math.max(0, ((currentTime - activeSegment.start) / (activeSegment.end - activeSegment.start)) * 100))
    : 0

  return (
    <div className="absolute bottom-16 left-4 right-4 flex justify-center">
      <div className="relative bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg max-w-2xl">
        <div className="absolute bottom-0 left-0 h-0.5 bg-white/20 w-full rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-white/60 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-1">
          {activeSegment.speaker_id && (
            <div className="text-xs text-white/70 font-medium">{activeSegment.speaker_id}</div>
          )}
          <p className="text-sm leading-relaxed text-center text-pretty animate-in fade-in duration-200">
            {activeSegment.text}
          </p>
        </div>
      </div>
    </div>
  )
}
