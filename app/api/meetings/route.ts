import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { z } from "zod"

// Validation schema
const createMeetingSchema = z.object({
    orgId: z.string().min(1),
    title: z.string().min(1, "Title is required"),
    startedAt: z.string().transform(str => new Date(str)),
    endedAt: z.string().optional().transform(str => str ? new Date(str) : undefined),
    platform: z.enum(["GOOGLE_MEET", "ZOOM", "TEAMS", "OTHER"]),
    attendees: z.array(
        z.object({
            email: z.string().email(),
            name: z.string().optional(),
            role: z.enum(["HOST", "CO_HOST", "PARTICIPANT"]).default("PARTICIPANT")
        })
    )
})

export async function POST(request: Request) {
    try {
        // Authenticate user
        const userId = await auth(request)
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Parse & validate JSON
        const body = await request.json()
        const parsed = createMeetingSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            )
        }

        const { attendees, ...meetingData } = parsed.data

        // 👉 Force authenticated user to be added as HOST
        const secureAttendees = [
            {
                userId,
                email: "owner@system.com", // optional dummy or real email
                name: "Owner",
                role: "HOST" as const
            },
            ...attendees
        ]

        const meeting = await prisma.meeting.create({
            data: {
                ...meetingData,
                attendees: {
                    create: secureAttendees
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
        // Authenticate user
        const userId = await auth(request)
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Secure GET — only meetings that the user is attending
        const meetings = await prisma.meeting.findMany({
            where: {
                attendees: {
                    some: { userId }
                }
            },
            include: {
                attendees: true
            },
            orderBy: {
                startedAt: "desc"
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
