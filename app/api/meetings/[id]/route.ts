import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateMeetingSchema = z.object({
    title: z.string().min(1).optional(),
    startedAt: z.string().transform(str => new Date(str)).optional(),
    endedAt: z.string().transform(str => new Date(str)).optional(),
    platform: z.enum(["GOOGLE_MEET", "ZOOM", "TEAMS", "OTHER"]).optional(),
    status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional()
})

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const meeting = await prisma.meeting.findUnique({
            where: { id: params.id },
            include: { attendees: true }
        })

        if (!meeting) {
            return NextResponse.json(
                { error: "Meeting not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(meeting)
    } catch (error) {
        console.error("Meeting fetch error:", error)
        return NextResponse.json(
            { error: "Failed to fetch meeting" },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const parsed = updateMeetingSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            )
        }

        const meeting = await prisma.meeting.update({
            where: { id: params.id },
            data: parsed.data,
            include: { attendees: true }
        })

        return NextResponse.json(meeting)
    } catch (error) {
        console.error("Meeting update error:", error)
        return NextResponse.json(
            { error: "Failed to update meeting" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.meeting.delete({
            where: { id: params.id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("Meeting deletion error:", error)
        return NextResponse.json(
            { error: "Failed to delete meeting" },
            { status: 500 }
        )
    }
}