"use client"

import { fetchTranscript, type TranscriptData, type TranscriptSegment } from "@/services/api/transcript"
import { liveTranscriptService, type LiveTranscriptEvent } from "@/services/websocket/live-transcript"
import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type TranscriptMode = "batch" | "live"

interface TranscriptContextType {
  // Current transcript data
  transcriptData: TranscriptData | null

  // Loading and error states
  isLoading: boolean
  error: string | null

  // Current video time for active segment tracking
  currentTime: number
  setCurrentTime: (time: number) => void

  // Active segment based on current time
  activeSegment: TranscriptSegment | null

  mode: TranscriptMode
  setMode: (mode: TranscriptMode) => void
  isLiveConnected: boolean

  // Methods for transcript management
  loadTranscript: (videoId: string) => Promise<void>
  clearTranscript: () => void
  startLiveMode: (meetingId: string) => Promise<void>
  stopLiveMode: () => void

  // Utility methods
  jumpToSegment: (segmentId: number) => void
  onJumpToTime?: (time: number) => void
}

const TranscriptContext = createContext<TranscriptContextType | undefined>(undefined)

interface TranscriptProviderProps {
  children: ReactNode
  onJumpToTime?: (time: number) => void
  defaultMode?: TranscriptMode
}

export function TranscriptProvider({
  children,
  onJumpToTime,
  defaultMode = "batch",
}: TranscriptProviderProps) {
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)

  const [mode, setMode] = useState<TranscriptMode>(defaultMode)
  const [isLiveConnected, setIsLiveConnected] = useState(false)
  const [liveSegments, setLiveSegments] = useState<TranscriptSegment[]>([])

  // Calculate active segment based on current time
  const activeSegment = React.useMemo(() => {
    if (!transcriptData?.segments) return null
    return transcriptData.segments.find((segment) => currentTime >= segment.start && currentTime < segment.end) || null
  }, [transcriptData?.segments, currentTime])

  useEffect(() => {
    if (mode === "live" && isLiveConnected) {
      const cleanup = liveTranscriptService.onMessage((event: LiveTranscriptEvent) => {
        switch (event.type) {
          case "segment":
            if (event.segment) {
              setLiveSegments((prev) => {
                const exists = prev.find((s) => s.id === event.segment!.id)
                if (exists) return prev
                return [...prev, event.segment!].sort((a, b) => a.start - b.start)
              })
            }
            break
          case "complete":
            break
        }
      })

      return cleanup
    }
  }, [mode, isLiveConnected])

  useEffect(() => {
    if (mode === "live" && liveSegments.length > 0) {
      setTranscriptData({
        meeting_id: "live_session",
        segments: liveSegments,
      })
    }
  }, [mode, liveSegments])

  const loadTranscript = async (videoId: string) => {
    if (mode === "live") {
      console.warn("Cannot load batch transcript in live mode")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Load from API only
      const data = await fetchTranscript(videoId)
      setTranscriptData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transcript")
      setTranscriptData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const startLiveMode = async (meetingId: string) => {
    setIsLoading(true)
    setError(null)
    setLiveSegments([])

    try {
      await liveTranscriptService.connect(meetingId)
      setIsLiveConnected(true)
      setMode("live")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to live transcript")
      setIsLiveConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const stopLiveMode = () => {
    liveTranscriptService.disconnect()
    setIsLiveConnected(false)
    setLiveSegments([])
    if (mode === "live") {
      setTranscriptData(null)
    }
  }

  const clearTranscript = () => {
    setTranscriptData(null)
    setError(null)
    setCurrentTime(0)
    setLiveSegments([])
    if (mode === "live") {
      stopLiveMode()
    }
  }

  const handleSetMode = (newMode: TranscriptMode) => {
    if (newMode === mode) return

    // Cleanup current mode
    if (mode === "live") {
      stopLiveMode()
    }

    setMode(newMode)
    setTranscriptData(null)
    setError(null)
  }

  const jumpToSegment = (segmentId: number) => {
    if (!transcriptData?.segments) return

    const segment = transcriptData.segments.find((s) => s.id === segmentId)
    if (segment && onJumpToTime) {
      onJumpToTime(segment.start)
    }
  }

  const contextValue: TranscriptContextType = {
    transcriptData,
    isLoading,
    error,
    currentTime,
    setCurrentTime,
    activeSegment,
    mode,
    setMode: handleSetMode,
    isLiveConnected,
    loadTranscript,
    clearTranscript,
    startLiveMode,
    stopLiveMode,
    jumpToSegment,
    onJumpToTime,
  }

  return <TranscriptContext.Provider value={contextValue}>{children}</TranscriptContext.Provider>
}

/**
 * Hook to consume transcript context
 * @returns TranscriptContextType
 * @throws Error if used outside of TranscriptProvider
 */
export function useTranscript(): TranscriptContextType {
  const context = useContext(TranscriptContext)

  if (context === undefined) {
    throw new Error("useTranscript must be used within a TranscriptProvider")
  }

  return context
}

/**
 * Hook to get only transcript data (for components that don't need full context)
 * @returns TranscriptData | null
 */
export function useTranscriptData(): TranscriptData | null {
  const { transcriptData } = useTranscript()
  return transcriptData
}

/**
 * Hook to get active segment and current time
 * @returns { activeSegment: TranscriptSegment | null, currentTime: number }
 */
export function useActiveSegment() {
  const { activeSegment, currentTime } = useTranscript()
  return { activeSegment, currentTime }
}
