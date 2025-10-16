import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        console.log("Login attempt for:", { email: body.email })

        // For now, return a simple success response
        // In production, you would implement proper authentication
        return NextResponse.json({
            success: true,
            user: {
                id: "demo-user",
                email: body.email,
                name: "Demo User"
            },
            token: "demo-token"
        })

    } catch (error) {
        console.error("Login error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}