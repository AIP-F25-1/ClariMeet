import { prisma } from "@/lib/prisma"
import { compare } from "bcrypt"
import { createHmac } from "crypto"
import { NextResponse } from "next/server"
import { z } from "zod"

// Validation schema
const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validate input
        const result = loginSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid input", details: result.error.issues },
                { status: 400 }
            )
        }

        const { email, password } = result.data

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            )
        }

        // Verify password
        const isPasswordValid = await compare(password, user.password || "")
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            )
        }

        // Generate simple token using HMAC
        const payload = JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 24 * 60 * 60 * 1000 })
        const token = createHmac('sha256', process.env.JWT_SECRET || "your-secret-key")
            .update(payload)
            .digest('hex')

        // Return success response
        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        })

    } catch (error) {
        console.error("Login error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
