import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"
import { sign } from "jsonwebtoken"

const signupSchema = z.object({
    name: z.string().min(1, "Name is required").max(100).optional(),
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/, "Password must include upper, lower, and number"),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const parsed = signupSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.issues },
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

        const token = sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
        )

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                verified: user.verified,
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


