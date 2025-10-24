import { auth } from '@/lib/auth'
import { uploadVideo } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await auth(request)
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('video') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const meetingId = formData.get('meetingId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      )
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Upload to Cloudinary
    const uploadResult = await uploadVideo(file, {
      folder: `clarimeet/videos/${user.id}`,
      resource_type: 'video'
    })

    // First, create or get the user in the database
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email || 'demo@example.com',
        name: user.name || 'Demo User',
        password: 'demo-password', // You should handle this properly
        role: 'USER'
      }
    })

    // Check if meetingId is provided (for updating existing meeting)
    if (meetingId) {
      // Update existing meeting (without video URL for now)
      const meeting = await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          // videoUrl: uploadResult.secure_url,
          // thumbnailUrl: uploadResult.secure_url.replace(/\.[^/.]+$/, '.jpg'),
        },
        include: {
          attendees: true
        }
      })

      return NextResponse.json({
        success: true,
        meeting,
        video: {
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url,
          duration: uploadResult.duration,
          format: uploadResult.format
        }
      })
    }

    // Create new meeting record in database
    const meeting = await prisma.meeting.create({
      data: {
        orgId: 'demo-org', // You might want to get this from user's organization
        title,
        startedAt: new Date(),
        platform: 'OTHER', // Since it's an uploaded video
        status: 'COMPLETED',
        attendees: {
          create: {
            email: dbUser.email,
            name: dbUser.name,
            role: 'HOST',
            userId: dbUser.id
          }
        }
      },
      include: {
        attendees: true
      }
    })

    // Create video record separately
    const video = await prisma.video.create({
      data: {
        meetingId: meeting.id,
        videoUrl: uploadResult.secure_url,
        thumbnailUrl: uploadResult.secure_url.replace(/\.[^/.]+$/, '.jpg'),
        publicId: uploadResult.public_id,
        duration: uploadResult.duration,
        format: uploadResult.format
      }
    })

    // Store video metadata (you might want to add a Video model to your schema)
    // For now, we'll store it in the meeting record or create a separate video table

    return NextResponse.json({
      success: true,
      meeting,
      video: {
        id: video.id,
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        duration: uploadResult.duration,
        format: uploadResult.format
      }
    })

  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    )
  }
}
