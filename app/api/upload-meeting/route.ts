import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const meetingName = formData.get('meetingName') as string

    if (!file || !meetingName) {
      return NextResponse.json({ error: 'Missing file or meeting name' }, { status: 400 })
    }

    // Create data directories if they don't exist
    const dataDir = join(process.cwd(), 'data')
    const videosDir = join(dataDir, 'videos')
    const transcriptsDir = join(dataDir, 'transcripts')
    const summariesDir = join(dataDir, 'summaries')

    await mkdir(dataDir, { recursive: true })
    await mkdir(videosDir, { recursive: true })
    await mkdir(transcriptsDir, { recursive: true })
    await mkdir(summariesDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${meetingName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${fileExtension}`
    const filePath = join(videosDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create meeting record in database
    const meeting = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        email: 'demo@example.com',
        name: 'Demo User',
        givenName: 'Demo',
      },
    })

    // For now, we'll store meeting data in a simple JSON file
    // In a real app, you'd have a Meeting model
    const meetingData = {
      id: `meeting_${timestamp}`,
      title: meetingName,
      fileName: fileName,
      filePath: filePath,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      duration: '00:00:00', // Will be calculated later
      transcript: false,
      summary: false,
      createdAt: new Date().toISOString(),
    }

    // Save meeting data to a JSON file
    const meetingsFile = join(dataDir, 'meetings.json')
    let meetings = []
    try {
      const existingData = await import(meetingsFile)
      meetings = existingData.default || []
    } catch {
      // File doesn't exist yet, start with empty array
    }
    
    meetings.push(meetingData)
    await writeFile(meetingsFile, JSON.stringify(meetings, null, 2))

    return NextResponse.json({
      success: true,
      meeting: meetingData,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload meeting' },
      { status: 500 }
    )
  }
}
