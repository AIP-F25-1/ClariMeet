import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createMeetingSchema = z.object({
    orgId: z.string(),
    title: z.string().min(1, "Title is required"),
    startedAt: z.string().transform(str => new Date(str)),
    endedAt: z.string().optional().transform(str => str ? new Date(str) : undefined),
    platform: z.enum(["GOOGLE_MEET", "ZOOM", "TEAMS", "OTHER"]),
    attendees: z.array(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        role: z.enum(["HOST", "CO_HOST", "PARTICIPANT"]).default("PARTICIPANT")
    }))
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const parsed = createMeetingSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            )
        }

        const { attendees, ...meetingData } = parsed.data

        const meeting = await prisma.meeting.create({
            data: {
                ...meetingData,
                attendees: {
                    create: attendees
                }
            },
            include: {
                attendees: true
            }
        })

        return NextResponse.json(meeting, { status: 201 })
    } catch (error) {
        console.error("Meeting creation error:", error)
        return NextResponse.json(
            { error: "Failed to create meeting" },
            { status: 500 }
        )
    }
}

export async function GET(request: Request) {
    try {
        // For now, return all meetings (you can add filtering later)
        const meetings = await prisma.meeting.findMany({
            include: {
                attendees: true
            },
            orderBy: {
                startedAt: 'desc'
            }
        })

        return NextResponse.json(meetings)
    } catch (error) {
        console.error("Meeting fetch error:", error)
        return NextResponse.json(
            { error: "Failed to fetch meetings" },
            { status: 500 }
        )
    }
}