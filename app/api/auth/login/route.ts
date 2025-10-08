import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { compare } from "bcrypt"
import { sign } from "jsonwebtoken"

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
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            )
        }

        // Verify password
        const isPasswordValid = await compare(password, user.password)
        if (!isPasswordValid) {
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
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}