"use client"

import { Card } from "@/components/ui/card"
import { TranscriptProvider, useTranscript } from "@/contexts/transcript-context"
import { useEffect, useRef, useState } from "react"
import { DataSourceToggle } from "./data-source-toggle"
import { DownloadButtons } from "./download-buttons"
import { LiveCaptions } from "./live-captions"
import { ModeToggle } from "./mode-toggle"
import { TranscriptPanel } from "./transcript-panel"
import { VideoControls } from "./video-controls"

function VideoPlayerContent() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  const {
    currentTime,
    setCurrentTime,
    mode,
    loadTranscript,
  } = useTranscript()

  useEffect(() => {
    if (mode === "batch") {
      loadTranscript("demo-video-001")
    }
  }, [loadTranscript, mode])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (time: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current
    if (!video) return

    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      video.requestFullscreen()
    }
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <ModeToggle />
          <DataSourceToggle className="sm:w-80" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <Card className="relative overflow-hidden bg-black/60 shadow-xl border-0 ring-1 ring-cyan-400/30">
            <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster="/video-player-thumbnail.png"
              >
                Your browser does not support the video tag.
              </video>

              <LiveCaptions />

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                <VideoControls
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  volume={volume}
                  isMuted={isMuted}
                  onTogglePlay={togglePlay}
                  onSeek={handleSeek}
                  onVolumeChange={handleVolumeChange}
                  onToggleMute={toggleMute}
                  onToggleFullscreen={toggleFullscreen}
                />
              </div>
            </div>
          </Card>

          <DownloadButtons />
        </div>

        <div className="xl:col-span-2">
          <TranscriptPanel />
        </div>
      </div>
    </div>
  )
}

export function VideoPlayer() {
  const handleSeek = (time: number) => {
    console.log("[v0] Seek request received:", time)
  }

  return (
    <TranscriptProvider onJumpToTime={handleSeek} defaultMode="batch" defaultDataSourceMode="mock">
      <VideoPlayerContent />
    </TranscriptProvider>
  )
}
