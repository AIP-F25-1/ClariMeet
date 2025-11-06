import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const createConsentSchema = z.object({
    meeting_id: z.string().min(1, "Meeting ID is required"),
    value: z.boolean()
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

        // Validate input
        const body = await request.json()
        const parsed = createConsentSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            )
        }

        // Verify user is meeting participant
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

        // Record consent event
        const consent = await prisma.consentEvent.create({
            data: {
                meetingId: parsed.data.meeting_id,
                userId,
                value: parsed.data.value
            }
        })

        return NextResponse.json(consent, { status: 201 })

    } catch (error) {
        console.error("Consent recording error:", error)
        return NextResponse.json(
            { error: "Failed to record consent" },
            { status: 500 }
        )
    }
}