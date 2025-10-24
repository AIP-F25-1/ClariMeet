import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { logAudit } from "@/lib/audit"

const createSnapshotSchema = z.object({
  meeting_id: z.string().min(1, "meeting_id is required"),
  frame_url: z.string().url("frame_url must be a valid URL"),
  ocr: z.any().optional(), // OCR results as JSON
  version: z.number().int().min(1).default(1),
})

export async function POST(request: Request) {
  try {
    const user = auth(request)
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createSnapshotSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { meeting_id, frame_url, ocr, version } = parsed.data

    // Check if meeting exists
    // @ts-expect-error Meeting model may not be present in generated Prisma types yet
    const meeting = await prisma.meeting.findFirst({
      where: { id: meeting_id },
      select: { id: true },
    })
    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      )
    }

    // @ts-expect-error WhiteboardSnapshot model may not be present in generated Prisma types yet
    const created = await prisma.whiteboardSnapshot.create({
      data: {
        meetingId: meeting_id,
        frameUrl: frame_url,
        ocr: ocr || null,
        version,
      },
    })

    await logAudit({ 
      request, 
      userId: user.id, 
      action: "WHITEBOARD_SNAPSHOT_CREATED", 
      entityType: "WhiteboardSnapshot", 
      entityId: created.id, 
      metadata: { meeting_id, version } 
    })

    return NextResponse.json({ snapshot: created }, { status: 201 })
  } catch (error) {
    console.error("Create whiteboard snapshot error:", error)
    try { 
      await logAudit({ 
        request, 
        userId: null, 
        action: "WHITEBOARD_SNAPSHOT_CREATE_ERROR", 
        entityType: "System", 
        entityId: null, 
        metadata: { error: (error as Error).message } 
      }) 
    } catch {}
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
