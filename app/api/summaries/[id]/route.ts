import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSummarySchema = z.object({
    type: z.enum(["KEY_POINTS", "ACTION_ITEMS", "DECISIONS", "HIGHLIGHTS", "FULL_SUMMARY"]).optional(),
    content: z.string().optional(),
    evidenceSpanIds: z.array(z.string()).optional()
})

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const summary = await prisma.summary.findUnique({
            where: { id: params.id },
            include: {
                meeting: true
            }
        })

        if (!summary) {
            return NextResponse.json(
                { error: "Summary not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(summary)
    } catch (error) {
        console.error("Summary fetch error:", error)
        return NextResponse.json(
            { error: "Failed to fetch summary" },
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
        const parsed = updateSummarySchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
                { status: 400 }
            )
        }

        const summary = await prisma.summary.update({
            where: { id: params.id },
            data: parsed.data,
            include: {
                meeting: true
            }
        })

        return NextResponse.json(summary)
    } catch (error) {
        console.error("Summary update error:", error)
        return NextResponse.json(
            { error: "Failed to update summary" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.summary.delete({
            where: { id: params.id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("Summary deletion error:", error)
        return NextResponse.json(
            { error: "Failed to delete summary" },
            { status: 500 }
        )
    }
}