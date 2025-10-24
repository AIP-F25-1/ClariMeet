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

    // Check if meeting exists
    // @ts-expect-error Meeting model may not be present in generated Prisma types yet
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

    // @ts-expect-error WhiteboardSnapshot model may not be present in generated Prisma types yet
    const snapshots = await prisma.whiteboardSnapshot.findMany({
      where: { meetingId },
      orderBy: { createdAt: "desc" },
    })

    await logAudit({ 
      request, 
      userId: user.id, 
      action: "WHITEBOARD_SNAPSHOTS_LIST", 
      entityType: "WhiteboardSnapshot", 
      entityId: null, 
      metadata: { meeting_id: meetingId, count: snapshots.length } 
    })

    return NextResponse.json({ snapshots })
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
