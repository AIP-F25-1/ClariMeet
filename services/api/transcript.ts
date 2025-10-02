export interface TranscriptSegment {
  id: number
  start: number
  end: number
  text: string
  speaker_id?: string
}

export interface TranscriptData {
  meeting_id: string
  segments: TranscriptSegment[]
}

// Mock data has been removed - use actual API calls

/**
 * Fetch transcript data for a video
 * @param videoId - The ID of the video
 * @returns Promise<TranscriptData>
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptData> {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/transcripts/${videoId}`)
  // return response.json()

  // Return empty transcript for now
  return Promise.resolve({
    meeting_id: videoId,
    segments: []
  })
}

/**
 * Upload a new transcript for a video
 * @param videoId - The ID of the video
 * @param transcriptData - The transcript data including meeting_id and segments
 * @returns Promise<boolean>
 */
export async function uploadTranscript(videoId: string, transcriptData: TranscriptData): Promise<boolean> {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/transcripts/${videoId}`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(transcriptData)
  // })
  // return response.ok

  console.log("Uploading transcript for video:", videoId, transcriptData)
  return Promise.resolve(true)
}

/**
 * Find the active transcript segment for a given time
 * @param transcript - Array of transcript segments
 * @param currentTime - Current video time in seconds
 * @returns TranscriptSegment | null
 */
export function findActiveSegment(transcript: TranscriptSegment[], currentTime: number): TranscriptSegment | null {
  return transcript.find((segment) => currentTime >= segment.start && currentTime < segment.end) || null
}
