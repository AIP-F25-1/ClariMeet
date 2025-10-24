// Simple script to update the meeting with video URL
const { PrismaClient } = require('./lib/generated/client')

const prisma = new PrismaClient()

async function updateMeeting() {
  try {
    // Get the most recent meeting
    const meetings = await prisma.meeting.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1
    })

    if (meetings.length > 0) {
      const meeting = meetings[0]
      console.log('Found meeting:', meeting.id, meeting.title)
      
      // Update with a sample video URL (you can replace this with the actual Cloudinary URL)
      const videoUrl = 'https://res.cloudinary.com/demo/video/upload/v1234567890/clarimeet/videos/demo-user-id/foedwhynihsgmxh9we3s.mp4'
      
      const updatedMeeting = await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          videoUrl: videoUrl,
          thumbnailUrl: videoUrl.replace(/\.[^/.]+$/, '.jpg')
        }
      })
      
      console.log('Updated meeting with video URL:', updatedMeeting.videoUrl)
    } else {
      console.log('No meetings found')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateMeeting()
