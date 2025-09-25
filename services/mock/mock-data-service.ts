import type { TranscriptData } from "@/services/api/transcript"

/**
 * Mock data service has been removed.
 * This file is kept for compatibility but all mock functionality is disabled.
 */

// Empty mock transcripts object - no mock data available
export const MOCK_TRANSCRIPTS = {} as const

export type MockTranscriptId = never

/**
 * Mock transcript loading is disabled
 * @param transcriptId - The ID of the transcript to load
 * @returns Promise<TranscriptData>
 */
export async function loadMockTranscript(transcriptId: MockTranscriptId): Promise<TranscriptData> {
  throw new Error("Mock data functionality has been disabled. Please use live mode or upload your own transcripts.")
}

/**
 * No mock transcripts available
 * @returns Empty array
 */
export function getAvailableMockTranscripts() {
  return []
}

/**
 * Simulate API failure for testing fallback behavior
 * @returns Promise that rejects with an error
 */
export async function simulateApiFailure(): Promise<never> {
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay
  throw new Error("API service unavailable")
}
