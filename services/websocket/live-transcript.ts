import type { TranscriptSegment } from "@/services/api/transcript"

export interface LiveTranscriptEvent {
  type: "segment" | "update" | "complete"
  segment?: TranscriptSegment
  meeting_id?: string
}

export class MockLiveTranscriptService {
  private listeners: ((event: LiveTranscriptEvent) => void)[] = []
  private isConnected = false
  private intervalId: NodeJS.Timeout | null = null
  private currentSegmentIndex = 0

  // Mock segments that will be streamed live
  private mockSegments: TranscriptSegment[] = [
    {
      id: 1,
      start: 0,
      end: 3,
      text: "Welcome to our live presentation about modern web development.",
      speaker_id: "speaker_1",
    },
    {
      id: 2,
      start: 3,
      end: 7,
      text: "Today we'll explore real-time transcript streaming capabilities.",
      speaker_id: "speaker_1",
    },
    {
      id: 3,
      start: 7,
      end: 12,
      text: "This demonstrates how captions can appear dynamically as the video plays.",
      speaker_id: "speaker_2",
    },
    {
      id: 4,
      start: 12,
      end: 16,
      text: "Live mode simulates WebSocket data streaming for real-time updates.",
      speaker_id: "speaker_1",
    },
    {
      id: 5,
      start: 16,
      end: 21,
      text: "Each segment appears with proper timing and speaker identification.",
      speaker_id: "speaker_2",
    },
  ]

  connect(meetingId: string): Promise<void> {
    return new Promise((resolve) => {
      this.isConnected = true
      this.currentSegmentIndex = 0

      // Emit initial connection event
      this.emit({
        type: "segment",
        meeting_id: meetingId,
      })

      // Start streaming segments every 3 seconds
      this.intervalId = setInterval(() => {
        if (this.currentSegmentIndex < this.mockSegments.length) {
          this.emit({
            type: "segment",
            segment: this.mockSegments[this.currentSegmentIndex],
            meeting_id: meetingId,
          })
          this.currentSegmentIndex++
        } else {
          this.emit({
            type: "complete",
            meeting_id: meetingId,
          })
          this.disconnect()
        }
      }, 3000)

      resolve()
    })
  }

  disconnect(): void {
    this.isConnected = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  onMessage(callback: (event: LiveTranscriptEvent) => void): () => void {
    this.listeners.push(callback)

    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private emit(event: LiveTranscriptEvent): void {
    this.listeners.forEach((listener) => listener(event))
  }

  get connected(): boolean {
    return this.isConnected
  }
}

// Singleton instance
export const liveTranscriptService = new MockLiveTranscriptService()
