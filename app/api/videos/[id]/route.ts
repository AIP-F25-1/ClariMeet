import { readFile } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In a real app, you would fetch the video from storage based on meeting ID
    // For now, return a placeholder video
    const placeholderPath = path.join(process.cwd(), 'public', 'placeholder.mp4')
    
    try {
      const videoBuffer = await readFile(placeholderPath)
      
      return new NextResponse(videoBuffer, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': videoBuffer.length.toString(),
        },
      })
    } catch (fileError) {
      // If placeholder doesn't exist, return 404
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
