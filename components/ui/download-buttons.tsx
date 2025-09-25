"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Code } from "lucide-react"
import { downloadSRT, downloadJSON } from "@/services/api/download"
import { useTranscriptData } from "@/contexts/transcript-context"

export function DownloadButtons() {
  const transcriptData = useTranscriptData()

  const handleDownloadSRT = () => {
    if (transcriptData?.segments) {
      downloadSRT(transcriptData.segments)
    }
  }

  const handleDownloadJSON = () => {
    if (transcriptData?.segments) {
      downloadJSON(transcriptData.segments)
    }
  }

  if (!transcriptData?.segments) {
    return null
  }

  return (
    <Card className="bg-card shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-card-foreground mb-2">Download Transcript</h3>
            <p className="text-xs text-muted-foreground text-pretty">Export the transcript in your preferred format</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadSRT}
              className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              SRT
            </Button>
            <Button
              onClick={handleDownloadJSON}
              variant="outline"
              className="border-border hover:bg-muted transition-colors bg-transparent"
              size="sm"
            >
              <Code className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
