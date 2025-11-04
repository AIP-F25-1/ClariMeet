import { prisma } from "@/lib/prisma"
import { compare } from "bcrypt"
import { sign } from "jsonwebtoken"
import { NextResponse } from "next/server"
import { z } from "zod"

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