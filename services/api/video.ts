/**
 * Video player utilities and API functions
 */

export interface VideoMetadata {
  id: string
  title: string
  duration: number
  thumbnail: string
  url: string
}

/**
 * Fetch video metadata
 * @param videoId - The ID of the video
 * @returns Promise<VideoMetadata>
 */
export async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/videos/${videoId}`)
  // return response.json()

  // For now, return mock data
  return Promise.resolve({
    id: videoId,
    title: "Modern Web Development Presentation",
    duration: 36,
    thumbnail: "/video-player-thumbnail.png",
    url: "/placeholder.mp4",
  })
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS format
 * @param seconds - Time in seconds
 * @returns string - Formatted time string
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

/**
 * Calculate video progress percentage
 * @param currentTime - Current time in seconds
 * @param duration - Total duration in seconds
 * @returns number - Progress percentage (0-100)
 */
export function calculateProgress(currentTime: number, duration: number): number {
  if (duration === 0) return 0
  return (currentTime / duration) * 100
}
