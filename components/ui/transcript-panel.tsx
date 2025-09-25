"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranscript } from "@/contexts/transcript-context"
import { cn } from "@/lib/utils"
import { formatTime } from "@/services/api/video"
import { getSegmentProgress, shouldHighlightSegment } from "@/utils/sync"
import { useEffect, useRef } from "react"

export function TranscriptPanel() {
  const { transcriptData, activeSegment, jumpToSegment, isLoading, currentTime } = useTranscript()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const activeSegmentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeSegment && activeSegmentRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        const segmentElement = activeSegmentRef.current
        const containerRect = scrollContainer.getBoundingClientRect()
        const segmentRect = segmentElement.getBoundingClientRect()

        if (segmentRect.top < containerRect.top || segmentRect.bottom > containerRect.bottom) {
          segmentElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
        }
      }
    }
  }, [activeSegment])

  if (isLoading) {
    return (
      <Card className="h-[600px] bg-black/60 shadow-lg border-cyan-400/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-white">Transcript</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[520px]">
          <p className="text-gray-300">Loading transcript...</p>
        </CardContent>
      </Card>
    )
  }

  if (!transcriptData) {
    return (
      <Card className="h-[600px] bg-black/60 shadow-lg border-cyan-400/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-white">Transcript</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[520px]">
          <p className="text-gray-300">No transcript available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] bg-black/60 shadow-lg border-cyan-400/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white">Transcript</CardTitle>
        <Badge variant="secondary" className="w-fit text-xs">
          {transcriptData.meeting_id}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[520px] px-4" ref={scrollAreaRef}>
          <div className="space-y-3 pb-4">
            {transcriptData.segments.map((segment) => {
              const isActive = activeSegment?.id === segment.id
              const shouldHighlight = shouldHighlightSegment(segment, currentTime)
              const progress = isActive ? getSegmentProgress(segment, currentTime) : 0

              return (
                <div
                  key={segment.id}
                  ref={isActive ? activeSegmentRef : null}
                  className={cn(
                    "group relative rounded-xl border bg-card/50 p-4 cursor-pointer",
                    "transition-all duration-300 ease-in-out transform",
                    "hover:bg-card hover:shadow-md hover:border-primary/20 hover:scale-[1.02]",
                    shouldHighlight && "bg-primary/5 border-primary/30 shadow-sm ring-1 ring-primary/10",
                    isActive && "bg-primary/10 border-primary/40 shadow-md ring-2 ring-primary/20 scale-[1.01]",
                  )}
                  onClick={() => jumpToSegment(segment.id)}
                >
                  {isActive && (
                    <div className="absolute top-0 left-0 h-1 bg-primary/20 rounded-t-xl overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs font-mono px-2 py-1 rounded transition-colors duration-200",
                            isActive
                              ? "text-primary bg-primary/10 border border-primary/20"
                              : "text-gray-300 bg-muted/50",
                          )}
                        >
                          {formatTime(segment.start)} - {formatTime(segment.end)}
                        </span>
                        {segment.speaker_id && (
                          <Badge
                            variant={isActive ? "default" : "outline"}
                            className={cn(
                              "text-xs transition-all duration-200",
                              isActive && "bg-primary/20 text-primary border-primary/30",
                            )}
                          >
                            {segment.speaker_id}
                          </Badge>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-sm leading-relaxed text-pretty transition-all duration-200",
                          isActive
                            ? "text-primary font-medium"
                            : shouldHighlight
                              ? "text-foreground font-medium"
                              : "text-white",
                        )}
                      >
                        {segment.text}
                      </p>
                    </div>
                    {isActive && (
                      <div className="relative flex-shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary/30 animate-ping" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
