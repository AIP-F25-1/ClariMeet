import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSummarySchema = z.object({
    meetingId: z.string(),
    type: z.enum(["KEY_POINTS", "ACTION_ITEMS", "DECISIONS", "HIGHLIGHTS", "FULL_SUMMARY"]),
    content: z.string(),
    evidenceSpanIds: z.array(z.string())
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const parsed = createSummarySchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            )
        }

        // Verify meeting exists
        const meeting = await prisma.meeting.findUnique({
            where: { id: parsed.data.meetingId }
        })

        if (!meeting) {
            return NextResponse.json(
                { error: "Meeting not found" },
                { status: 404 }
            )
        }

        const summary = await prisma.summary.create({
            data: parsed.data,
            include: {
                meeting: true
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
        const { searchParams } = new URL(request.url)
        const meetingId = searchParams.get('meetingId')

        const where = meetingId ? { meetingId } : {}

        const summaries = await prisma.summary.findMany({
            where,
            include: {
                meeting: {
                    select: {
                        title: true,
                        startedAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(summaries)
    } catch (error) {
        console.error("Summary fetch error:", error)
        return NextResponse.json(
            { error: "Failed to fetch summaries" },
            { status: 500 }
        )
    }
}