/**
 * Video-Transcript Synchronization Utilities
 * Provides reusable functions for matching video timestamps with transcript segments
 */

/**
 * Find the active transcript segment for a given time
 * @param {Array} segments - Array of transcript segments
 * @param {number} currentTime - Current video time in seconds
 * @returns {Object|null} - Active segment or null if none found
 */
export function findActiveSegment(segments, currentTime) {
  if (!segments || !Array.isArray(segments)) return null

  return segments.find((segment) => currentTime >= segment.start && currentTime < segment.end) || null
}

/**
 * Calculate progress within a segment
 * @param {Object} segment - Transcript segment
 * @param {number} currentTime - Current video time in seconds
 * @returns {number} - Progress as percentage (0-100)
 */
export function getSegmentProgress(segment, currentTime) {
  if (!segment || currentTime < segment.start || currentTime > segment.end) {
    return 0
  }

  const segmentDuration = segment.end - segment.start
  const elapsed = currentTime - segment.start

  return Math.min(100, Math.max(0, (elapsed / segmentDuration) * 100))
}

/**
 * Check if a segment should be highlighted based on current time
 * @param {Object} segment - Transcript segment
 * @param {number} currentTime - Current video time in seconds
 * @param {number} tolerance - Time tolerance in seconds (default: 0.1)
 * @returns {boolean} - Whether segment should be highlighted
 */
export function shouldHighlightSegment(segment, currentTime, tolerance = 0.1) {
  if (!segment) return false

  return currentTime >= segment.start - tolerance && currentTime < segment.end + tolerance
}

/**
 * Get the next segment that will be active
 * @param {Array} segments - Array of transcript segments
 * @param {number} currentTime - Current video time in seconds
 * @returns {Object|null} - Next segment or null if none found
 */
export function getNextSegment(segments, currentTime) {
  if (!segments || !Array.isArray(segments)) return null

  return segments.find((segment) => segment.start > currentTime) || null
}

/**
 * Get the previous segment that was active
 * @param {Array} segments - Array of transcript segments
 * @param {number} currentTime - Current video time in seconds
 * @returns {Object|null} - Previous segment or null if none found
 */
export function getPreviousSegment(segments, currentTime) {
  if (!segments || !Array.isArray(segments)) return null

  const previousSegments = segments.filter((segment) => segment.end <= currentTime)
  return previousSegments[previousSegments.length - 1] || null
}

/**
 * Format time for display in sync with video player
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string (MM:SS or HH:MM:SS)
 */
export function formatSyncTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}
