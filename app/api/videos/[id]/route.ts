import { readFile } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meetingsFile = join(process.cwd(), 'data', 'meetings.json')
    
    try {
      const data = await readFile(meetingsFile, 'utf-8')
      const meetings = JSON.parse(data)
      const meeting = meetings.find((m: any) => m.id === params.id)
      
      if (!meeting) {
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        )
      }
      
      const videoPath = meeting.filePath
      const videoBuffer = await readFile(videoPath)
      
      return new NextResponse(videoBuffer, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': videoBuffer.length.toString(),
        },
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error streaming video:', error)
    return NextResponse.json(
      { error: 'Failed to stream video' },
      { status: 500 }
    )
  }
}
