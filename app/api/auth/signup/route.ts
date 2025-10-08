import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"
import { createHmac } from "crypto"

const signupSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const parsed = signupSchema.safeParse(body)
        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(issue => issue.message).join(', ')
            return NextResponse.json(
                { error: errorMessages, details: parsed.error.issues },
                { status: 400 }
            )
        }

        const { name, email, password } = parsed.data

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
                name,
                email,
                password: passwordHash,
            },
        })

        // Generate simple token using HMAC
        const payload = JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 24 * 60 * 60 * 1000 })
        const token = createHmac('sha256', process.env.JWT_SECRET || "your-secret-key")
            .update(payload)
            .digest('hex')

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
            },
            token,
        }, { status: 201 })
    } catch (error: unknown) {
        // Handle Prisma unique constraint error (email already exists)
        if (
            error &&
            typeof error === "object" &&
            "code" in (error as any) &&
            (error as any).code === "P2002"
        ) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 409 }
            )
        }

        console.error("Signup error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
