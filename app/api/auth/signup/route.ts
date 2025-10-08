import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"
import { sign } from "jsonwebtoken" // Change from createHmac to sign

const signupSchema = z.object({
    fullName: z.string().min(1, "Name is required").max(100), // Changed from name to fullName
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        console.log("Received signup request:", { ...body, password: '***' }) // Add logging

        const parsed = signupSchema.safeParse(body)
        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(issue => issue.message).join(', ')
            return NextResponse.json(
                { error: errorMessages, details: parsed.error.issues },
                { status: 400 }
            )
        }

        const { fullName, email, password } = parsed.data

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 409 }
            )
        }

        const passwordHash = await hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name: fullName, // Map fullName to name
                email,
                password: passwordHash,
                verified: true, // Set to true for testing
            },
        })

        // Generate JWT token instead of HMAC
        const token = sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
        )

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token,
        }, { status: 201 })
    } catch (error: unknown) {
        console.error("Signup error:", error) // Add detailed error logging
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
