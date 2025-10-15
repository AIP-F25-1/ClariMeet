import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

// Validation schema for creating summary
const createSummarySchema = z.object({
    meeting_id: z.string().min(1, "Meeting ID is required"),
    type: z.enum(["KEY_POINTS", "ACTION_ITEMS", "DECISIONS", "HIGHLIGHTS", "FULL_SUMMARY"]),
    content: z.string().min(1, "Content is required"),
    evidence_span_ids: z.array(z.string())
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
        const parsed = createSummarySchema.safeParse(body)
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

        // Create summary
        const summary = await prisma.summary.create({
            data: {
                meetingId: parsed.data.meeting_id,
                type: parsed.data.type,
                content: parsed.data.content,
                evidenceSpanIds: parsed.data.evidence_span_ids
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

        return NextResponse.json(summary, { status: 201 })

    } catch (error) {
        console.error("Summary creation error:", error)
        return NextResponse.json(
            { error: "Failed to create summary" },
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

        // Get summaries for user's meetings
        const summaries = await prisma.summary.findMany({
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

        return NextResponse.json(summaries)

    } catch (error) {
        console.error("Summaries fetch error:", error)
        return NextResponse.json(
            { error: "Failed to fetch summaries" },
            { status: 500 }
        )
    }
}