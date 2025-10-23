import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { compare } from "bcrypt"
import { sign } from "jsonwebtoken"
import { logAudit } from "@/lib/audit"

// Validation schema
const loginSchema = z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        console.log("Login attempt for:", { email: body.email })

        // Validate input
        const parsed = loginSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            )
        }

        const { email, password } = parsed.data

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
                role: true
            }
        })

        if (!user) {
            await logAudit({ request, userId: null, action: "AUTH_LOGIN_FAILED", entityType: "User", entityId: null, metadata: { email } })
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            )
        }

        // Verify password
        const isPasswordValid = await compare(password, user.password)
        if (!isPasswordValid) {
            await logAudit({ request, userId: user.id, action: "AUTH_LOGIN_FAILED", entityType: "User", entityId: user.id, metadata: { email } })
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            )
        }

        // Generate JWT token
        const token = sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || "",
            { expiresIn: "24h" }
        )

        // Return success response
        await logAudit({ request, userId: user.id, action: "AUTH_LOGIN_SUCCESS", entityType: "User", entityId: user.id, metadata: { email } })
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        })

    } catch (error) {
        console.error("Login error:", error)
        try { await logAudit({ request, userId: null, action: "AUTH_LOGIN_ERROR", entityType: "System", entityId: null, metadata: { error: (error as Error).message } }) } catch {}
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}