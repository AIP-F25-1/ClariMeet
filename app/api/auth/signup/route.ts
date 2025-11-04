import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"
import { sign } from "jsonwebtoken"
import { NextResponse } from "next/server"
import { z } from "zod"

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
        
        // Handle Prisma errors with better messages
        if (error instanceof Error) {
            // Check for connection errors
            if (error.message.includes("Can't reach database server") || 
                error.message.includes("P1001") ||
                error.message.includes("connection")) {
                console.error("❌ Database connection failed. Make sure:")
                console.error("   1. Docker Desktop is running (if using Docker)")
                console.error("   2. Database container is started: npm run db:up")
                console.error("   3. DATABASE_URL is correct in .env.local")
                return NextResponse.json(
                    { 
                        error: "Database connection failed. Please ensure Docker Desktop is running and the database is started.",
                        details: "Run 'npm run db:up' to start the database container."
                    },
                    { status: 500 }
                )
            }
            
            if (error.message.includes('DATABASE_URL')) {
                return NextResponse.json(
                    { error: "Database configuration error. Please check your DATABASE_URL in .env.local." },
                    { status: 500 }
                )
            }
            
            if (error.message.includes('PrismaClient')) {
                return NextResponse.json(
                    { error: "Database connection error. Please check if Docker Desktop is running." },
                    { status: 500 }
                )
            }
        }
        
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
