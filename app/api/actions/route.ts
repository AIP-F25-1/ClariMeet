import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const createActionSchema = z.object({
    meeting_id: z.string().min(1, "Meeting ID is required"),
    title: z.string().min(1, "Title is required"),
    assignee: z.string().min(1, "Assignee is required"),
    due_date: z.string().transform(str => new Date(str)),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PENDING"),
    confidence: z.number().min(0).max(1),
    evidence_span_ids: z.array(z.string()),
    external_links: z.record(z.string(), z.any()).optional()
})

export async function POST(request: Request) {
    try {
        // Authenticate user
        const userId = await auth(request)
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Validate request body
        const body = await request.json()
        const parsed = createActionSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            )
        }

        // Verify meeting belongs to user
        const meeting = await prisma.meeting.findFirst({
            where: {
                id: parsed.data.meeting_id,
                attendees: {
                    some: {
                        userId
                    }
                }
            }
        })

        if (!meeting) {
            return NextResponse.json(
                { error: "Meeting not found or access denied" },
                { status: 404 }
            )
        }

        // Create action
        const action = await prisma.action.create({
            data: {
                meetingId: parsed.data.meeting_id,
                title: parsed.data.title,
                assignee: parsed.data.assignee,
                dueDate: parsed.data.due_date,
                status: parsed.data.status,
                confidence: parsed.data.confidence,
                evidenceSpanIds: parsed.data.evidence_span_ids,
                externalLinks: parsed.data.external_links || {}
            },
            include: {
                meeting: {
                    select: {
                        title: true,
                        startedAt: true
                    }
                }
            }
        })

        return NextResponse.json(action, { status: 201 })

    } catch (error) {
        console.error("Action creation error:", error)
        return NextResponse.json(
            { error: "Failed to create action" },
            { status: 500 }
        )
    }
}

export async function GET(request: Request) {
    try {
        // Authenticate user
        const userId = await auth(request)
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Get actions for user's meetings
        const actions = await prisma.action.findMany({
            where: {
                meeting: {
                    attendees: {
                        some: {
                            userId
                        }
                    }
                }
            },
            include: {
                meeting: {
                    select: {
                        title: true,
                        startedAt: true,
                        platform: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(actions)

    } catch (error) {
        console.error("Actions fetch error:", error)
        return NextResponse.json(
            { error: "Failed to fetch actions" },
            { status: 500 }
        )
    }
}