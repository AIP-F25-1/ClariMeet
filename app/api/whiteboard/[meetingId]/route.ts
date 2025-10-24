import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

export async function GET(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const user = auth(request)
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { meetingId } = params

    // Validate meetingId parameter
    if (!meetingId || typeof meetingId !== 'string' || meetingId.trim() === '') {
      return NextResponse.json({ error: "Invalid meeting ID" }, { status: 400 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const version = searchParams.get('version')
    const latest = searchParams.get('latest') === 'true'

    // Check if meeting exists
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId },
      select: { id: true },
    })
    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      )
    }

    // Build where clause based on query parameters
    let whereClause: any = { meetingId }
    
    if (version) {
      whereClause.version = parseInt(version)
    }
    
    if (latest) {
      // Get the latest version for this meeting
      const latestSnapshot = await prisma.whiteboardSnapshot.findFirst({
        where: { meetingId },
        orderBy: { version: 'desc' },
        select: { version: true }
      })
      
      if (latestSnapshot) {
        whereClause.version = latestSnapshot.version
      }
    }

    // Fetch snapshots with proper ordering
    const snapshots = await prisma.whiteboardSnapshot.findMany({
      where: whereClause,
      orderBy: latest ? { createdAt: 'desc' } : { createdAt: 'desc' },
    })

    await logAudit({ 
      request, 
      userId: user.id, 
      action: "WHITEBOARD_SNAPSHOTS_LIST", 
      entityType: "WhiteboardSnapshot", 
      entityId: null, 
      metadata: { 
        meeting_id: meetingId, 
        count: snapshots.length,
        filters: { version, latest }
      } 
    })

    return NextResponse.json({ 
      snapshots,
      total: snapshots.length,
      meetingId,
      filters: { version, latest }
    })
  } catch (error) {
    console.error("Fetch whiteboard snapshots error:", error)
    try { 
      await logAudit({ 
        request, 
        userId: null, 
        action: "WHITEBOARD_SNAPSHOTS_LIST_ERROR", 
        entityType: "System", 
        entityId: null, 
        metadata: { error: (error as Error).message } 
      }) 
    } catch {}
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
