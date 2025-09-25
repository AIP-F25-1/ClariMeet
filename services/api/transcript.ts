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

// Mock transcript data - replace with actual API calls
export const mockTranscriptData: TranscriptData = {
  meeting_id: "meeting_2024_001",
  segments: [
    {
      id: 1,
      start: 0,
      end: 3,
      text: "Welcome to our video presentation about modern web development.",
      speaker_id: "speaker_1",
    },
    {
      id: 2,
      start: 3,
      end: 7,
      text: "Today we'll explore the latest trends in React and Next.js development.",
      speaker_id: "speaker_1",
    },
    {
      id: 3,
      start: 7,
      end: 12,
      text: "We'll cover server components, app router, and performance optimization techniques.",
      speaker_id: "speaker_2",
    },
    {
      id: 4,
      start: 12,
      end: 16,
      text: "Let's start by understanding the fundamentals of modern React architecture.",
      speaker_id: "speaker_1",
    },
    {
      id: 5,
      start: 16,
      end: 21,
      text: "Server components allow us to render components on the server side for better performance.",
      speaker_id: "speaker_2",
    },
    {
      id: 6,
      start: 21,
      end: 26,
      text: "This reduces the JavaScript bundle size and improves initial page load times.",
      speaker_id: "speaker_2",
    },
    {
      id: 7,
      start: 26,
      end: 31,
      text: "Next.js 13 introduced the app directory with a new routing system.",
      speaker_id: "speaker_1",
    },
    {
      id: 8,
      start: 31,
      end: 36,
      text: "This new system provides better developer experience and more flexibility.",
      speaker_id: "speaker_1",
    },
  ],
}

export const mockTranscript = mockTranscriptData.segments

/**
 * Fetch transcript data for a video
 * @param videoId - The ID of the video
 * @returns Promise<TranscriptData>
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptData> {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/transcripts/${videoId}`)
  // return response.json()

  // For now, return mock data
  return Promise.resolve(mockTranscriptData)
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
