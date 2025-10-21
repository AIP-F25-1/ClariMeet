import { cloudinary } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const meetingName = formData.get('meetingName') as string
    const userId = formData.get('userId') as string || 'default-user' // Get from auth context

    if (!file || !meetingName) {
      return NextResponse.json({ error: 'Missing file or meeting name' }, { status: 400 })
    }

    // Check file size (100MB limit for free Cloudinary tier)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 100MB. Please compress your video or upgrade your Cloudinary plan.' 
      }, { status: 400 })
    }

    // Check file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Please upload a video file' }, { status: 400 })
    }

    // Upload to Cloudinary with timeout and progress handling
    const buffer = Buffer.from(await file.arrayBuffer())
    
    console.log(`📤 Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    
    const uploadResult = await cloudinary.uploader.upload(
      `data:${file.type};base64,${buffer.toString('base64')}`,
      {
        resource_type: 'video',
        folder: 'clariMeet/videos',
        public_id: `meeting_${Date.now()}`,
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ],
        timeout: 120000, // 2 minutes timeout
        chunk_size: 6000000, // 6MB chunks for better upload
      }
    )

    // Find or create a default user for uploads
    let user = await prisma.user.findFirst({
      where: { email: 'default@clariMeet.com' }
    })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'default@clariMeet.com',
          name: 'Default User',
          verified: true,
          role: 'USER'
        }
      })
    }

    // Create meeting record in database
    const meeting = await prisma.meeting.create({
      data: {
        title: meetingName,
        videoUrl: uploadResult.secure_url,
        thumbnailUrl: uploadResult.thumbnail_url,
        duration: Math.round(uploadResult.duration || 0),
        fileSize: file.size,
        status: 'ready',
        userId: user.id,
      }
    })

    console.log('📹 Video URL stored:', uploadResult.secure_url)
    console.log('🖼️ Thumbnail URL stored:', uploadResult.thumbnail_url)

    console.log('✅ Meeting uploaded successfully to Cloudinary:', meeting.title)

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        videoUrl: meeting.videoUrl,
        thumbnailUrl: meeting.thumbnailUrl,
        duration: meeting.duration,
        status: meeting.status,
        date: meeting.createdAt.toISOString().split('T')[0],
        time: meeting.createdAt.toLocaleTimeString('en-US', { hour12: false }),
        participants: ['You'],
        transcript: false,
        summary: false,
      },
      message: 'Meeting uploaded successfully to Cloudinary!',
    })
  } catch (error) {
    console.error('❌ Upload error:', error)
    
    // Handle specific Cloudinary errors
    if (error instanceof Error) {
      if (error.message.includes('Request Timeout')) {
        return NextResponse.json(
          { error: 'Upload timeout. The video file is too large or your connection is slow. Please try a smaller file or check your internet connection.' },
          { status: 408 }
        )
      }
      if (error.message.includes('Invalid Signature')) {
        return NextResponse.json(
          { error: 'Cloudinary configuration error. Please check your API credentials.' },
          { status: 401 }
        )
      }
      if (error.message.includes('File too large')) {
        return NextResponse.json(
          { error: 'File too large. Please compress your video or try a smaller file.' },
          { status: 413 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to upload meeting', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
