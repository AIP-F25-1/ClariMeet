import { verify } from "jsonwebtoken"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    // Exclude login route from authentication
    if (request.nextUrl.pathname === "/api/auth/login") {
        return NextResponse.next()
    }

    const token = request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!token) {
        return NextResponse.json(
            { error: "Missing authentication token" },
            { status: 401 }
        )
    }

    try {
        const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key")
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set("user", JSON.stringify(decoded))

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        })
    } catch (error) {
        return NextResponse.json(
            { error: "Invalid authentication token" },
            { status: 401 }
        )
    }
}

export const config = {
    matcher: "/api/:path*",
}