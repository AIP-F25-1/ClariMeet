"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Wifi } from "lucide-react"

interface DataSourceToggleProps {
  className?: string
}

export function DataSourceToggle({
  className,
}: DataSourceToggleProps) {

  return (
    <Card className={`bg-black/60 border-cyan-400/30 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-white">
          <Database className="h-4 w-4 text-cyan-400" />
          Data Source
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status Badge - Integration Only */}
        <div className="flex justify-center">
          <Badge variant="default" className="text-xs">
            <Wifi className="h-3 w-3 mr-1" />
            Live API
          </Badge>
        </div>
        
        <div className="text-xs text-gray-300 text-center">
          Transcripts are loaded from the API. Mock data has been removed.
        </div>
      </CardContent>
    </Card>
  )
}
