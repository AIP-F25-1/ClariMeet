import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { logAudit } from "@/lib/audit"

const createDecisionSchema = z.object({
  meeting_id: z.string().min(1, "meeting_id is required"),
  statement: z.string().min(1, "statement is required"),
  rationale: z.string().min(1, "rationale is required"),
  evidence_span_ids: z.array(z.string()).default([]),
})

export async function GET(request: Request) {
  try {
    const user = auth(request)
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('meeting_id')

    // Build where clause
    let whereClause: any = {}
    if (meetingId) {
      whereClause.meetingId = meetingId
    }

    const decisions = await prisma.decision.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    })

    await logAudit({ 
      request, 
      userId: user.id, 
      action: "DECISION_LIST", 
      entityType: "Decision", 
      entityId: null, 
      metadata: { 
        count: decisions.length,
        filters: { meeting_id: meetingId }
      } 
    })
    
    return NextResponse.json({ 
      decisions,
      total: decisions.length,
      filters: { meeting_id: meetingId }
    })
  } catch (error) {
    console.error("Fetch decisions error:", error)
    try { 
      await logAudit({ 
        request, 
        userId: null, 
        action: "DECISION_LIST_ERROR", 
        entityType: "System", 
        entityId: null, 
        metadata: { error: (error as Error).message } 
      }) 
    } catch {}
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = auth(request)
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createDecisionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { meeting_id, statement, rationale, evidence_span_ids } = parsed.data

    // Validate meeting_id format
    if (!meeting_id || typeof meeting_id !== 'string' || meeting_id.trim() === '') {
      return NextResponse.json({ error: "Invalid meeting ID" }, { status: 400 })
    }

    // Check if meeting exists (removed user ownership check since Meeting model doesn't have userId)
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

    const created = await prisma.decision.create({
      data: {
        meetingId: meeting_id,
        statement,
        rationale,
        evidenceSpanIds: evidence_span_ids,
      },
    })

    await logAudit({ 
      request, 
      userId: user.id, 
      action: "DECISION_CREATED", 
      entityType: "Decision", 
      entityId: created.id, 
      metadata: { meeting_id } 
    })
    
    return NextResponse.json({ decision: created }, { status: 201 })
  } catch (error) {
    console.error("Create decision error:", error)
    try { 
      await logAudit({ 
        request, 
        userId: null, 
        action: "DECISION_CREATE_ERROR", 
        entityType: "System", 
        entityId: null, 
        metadata: { error: (error as Error).message } 
      }) 
    } catch {}
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


