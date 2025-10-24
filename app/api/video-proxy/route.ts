import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoUrl = searchParams.get('url')
    
    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 })
    }

    // Fetch the video from Cloudinary
    const response = await fetch(videoUrl)
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch video' }, { status: response.status })
    }

    // Get the video data
    const videoBuffer = await response.arrayBuffer()
    
    // Return the video with proper headers
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.byteLength.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Range',
      },
    })
  } catch (error) {
    console.error('Video proxy error:', error)
    return NextResponse.json({ error: 'Failed to proxy video' }, { status: 500 })
  }
}
