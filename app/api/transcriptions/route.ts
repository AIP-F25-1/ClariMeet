import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const user = await auth(request)
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

        const transcriptions = await prisma.transcriptChunk.findMany({
            include: {
                meeting: {
                    select: {
                        title: true,
                        startedAt: true,
                        platform: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        })

    return NextResponse.json({ transcriptions })
  } catch (error) {
    console.error("Fetch transcriptions error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
  