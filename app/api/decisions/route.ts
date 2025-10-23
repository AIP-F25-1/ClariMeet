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

    // @ts-expect-error Decision model may not be present in generated Prisma types yet
    const decisions = await prisma.decision.findMany({
      where: { meeting: { userId: user.id } },
      orderBy: { createdAt: "desc" },
    })

    await logAudit({ request, userId: user.id, action: "DECISION_LIST", entityType: "Decision", entityId: null, metadata: { count: decisions.length } })
    return NextResponse.json({ decisions })
  } catch (error) {
    console.error("Fetch decisions error:", error)
    try { await logAudit({ request, userId: null, action: "DECISION_LIST_ERROR", entityType: "System", entityId: null, metadata: { error: (error as Error).message } }) } catch { }
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

    // Ensure the meeting belongs to the authenticated user
    // @ts-expect-error Meeting model may not be present in generated Prisma types yet
    const meeting = await prisma.meeting.findFirst({
      where: { id: meeting_id, userId: user.id },
      select: { id: true },
    })
    if (!meeting) {
      return NextResponse.json(
        { error: "Forbidden: meeting does not belong to user" },
        { status: 403 }
      )
    }

    // @ts-expect-error Decision model may not be present in generated Prisma types yet
    const created = await prisma.decision.create({
      data: {
        meetingId: meeting_id,
        statement,
        rationale,
        evidenceSpanIds: evidence_span_ids,
      },
    })

    await logAudit({ request, userId: user.id, action: "DECISION_CREATED", entityType: "Decision", entityId: created.id, metadata: { meeting_id } })
    return NextResponse.json({ decision: created }, { status: 201 })
  } catch (error) {
    console.error("Create decision error:", error)
    try { await logAudit({ request, userId: null, action: "DECISION_CREATE_ERROR", entityType: "System", entityId: null, metadata: { error: (error as Error).message } }) } catch { }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


