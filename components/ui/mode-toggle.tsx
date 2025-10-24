"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranscript, type TranscriptMode } from "@/contexts/transcript-context";

export function ModeToggle() {
  const { mode, setMode, isLiveConnected, startLiveMode, stopLiveMode, loadTranscript, isLoading } = useTranscript()

  const handleModeChange = async (newMode: TranscriptMode) => {
    if (newMode === mode) return

    setMode(newMode)

    if (newMode === "live") {
      await startLiveMode("demo_meeting_001")
    } else {
      stopLiveMode()
      await loadTranscript("demo_video_001")
    }
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-black/60 rounded-lg border border-cyan-400/30">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">Mode:</span>
        <Badge variant={mode === "live" ? "default" : "secondary"}>{mode === "live" ? "Live" : "Batch"}</Badge>
        {mode === "live" && (
          <Badge variant={isLiveConnected ? "default" : "destructive"} className="text-xs">
            {isLiveConnected ? "Connected" : "Disconnected"}
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant={mode === "batch" ? "default" : "outline"}
          size="sm"
          onClick={() => handleModeChange("batch")}
          disabled={isLoading}
        >
          Batch Mode
        </Button>
        <Button
          variant={mode === "live" ? "default" : "outline"}
          size="sm"
          onClick={() => handleModeChange("live")}
          disabled={isLoading}
        >
          Live Mode
        </Button>
      </div>
    </div>
  )
}
