import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"
import { sign } from "jsonwebtoken"

const signupSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        console.log("Received signup request:", { ...body, password: '***' })

        const parsed = signupSchema.safeParse(body)
        if (!parsed.success) {
            console.log("Validation failed:", parsed.error.issues)
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.issues },
                { status: 400 }
            )
        }

        const { name, email, password } = parsed.data

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 409 }
            )
        }

        const hashedPassword = await hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                verified: true,
                role: "USER"
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        })

        const token = sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || "",
            { expiresIn: "24h" }
        )

        return NextResponse.json({
            success: true,
            user,
            token
        })

    } catch (error) {
        console.error("Signup error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
