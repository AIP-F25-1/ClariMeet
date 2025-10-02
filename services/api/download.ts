import type { TranscriptSegment } from "./transcript"

/**
 * Generate SRT format content from transcript segments
 * @param transcript - Array of transcript segments
 * @returns string - SRT formatted content
 */
export function generateSRT(transcript: TranscriptSegment[]): string {
  let srtContent = ""
  transcript.forEach((segment, index) => {
    const startTime = formatSRTTime(segment.start)
    const endTime = formatSRTTime(segment.end)
    srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`
  })
  return srtContent
}

/**
 * Format seconds to SRT time format (HH:MM:SS,mmm)
 * @param seconds - Time in seconds
 * @returns string - Formatted time string
 */
export function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`
}

/**
 * Download a file with given content
 * @param content - File content
 * @param filename - Name of the file
 * @param mimeType - MIME type of the file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Download transcript as SRT file
 * @param transcript - Array of transcript segments
 * @param filename - Optional filename (defaults to 'transcript.srt')
 */
export function downloadSRT(transcript: TranscriptSegment[], filename = "transcript.srt"): void {
  const srtContent = generateSRT(transcript)
  downloadFile(srtContent, filename, "text/plain")
}

/**
 * Download transcript as JSON file
 * @param transcript - Array of transcript segments
 * @param filename - Optional filename (defaults to 'transcript.json')
 */
export function downloadJSON(transcript: TranscriptSegment[], filename = "transcript.json"): void {
  const jsonContent = JSON.stringify(transcript, null, 2)
  downloadFile(jsonContent, filename, "application/json")
}
