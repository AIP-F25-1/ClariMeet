"use client"

import { fetchTranscript, type TranscriptData, type TranscriptSegment } from "@/services/api/transcript"
import { loadMockTranscript, type MockTranscriptId } from "@/services/mock/mock-data-service"
import { liveTranscriptService, type LiveTranscriptEvent } from "@/services/websocket/live-transcript"
import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type TranscriptMode = "batch" | "live"
export type DataSourceMode = "integration" | "mock"

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

  dataSourceMode: DataSourceMode
  setDataSourceMode: (mode: DataSourceMode) => void
  selectedMockId: MockTranscriptId
  setSelectedMockId: (id: MockTranscriptId) => void

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
  defaultDataSourceMode?: DataSourceMode
}

export function TranscriptProvider({
  children,
  onJumpToTime,
  defaultMode = "batch",
  defaultDataSourceMode = "mock",
}: TranscriptProviderProps) {
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)

  const [mode, setMode] = useState<TranscriptMode>(defaultMode)
  const [isLiveConnected, setIsLiveConnected] = useState(false)
  const [liveSegments, setLiveSegments] = useState<TranscriptSegment[]>([])

  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>(defaultDataSourceMode)
  const [selectedMockId, setSelectedMockId] = useState<MockTranscriptId>("meeting-1")

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
            console.log("[v0] Live transcript streaming completed")
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
      console.warn("[v0] Cannot load batch transcript in live mode")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let data: TranscriptData

      if (dataSourceMode === "mock") {
        // Load from mock data
        data = await loadMockTranscript(selectedMockId)
        console.log("Loaded mock transcript:", selectedMockId)
      } else {
        // Try integration first, fallback to mock if API fails
        try {
          data = await fetchTranscript(videoId)
          console.log("Loaded transcript from API")
        } catch (apiError) {
          console.warn("API failed, falling back to mock data:", apiError)
          data = await loadMockTranscript(selectedMockId)
          setError("API unavailable - using mock data")
        }
      }

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
    dataSourceMode,
    setDataSourceMode,
    selectedMockId,
    setSelectedMockId,
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
