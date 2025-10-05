import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    // Allow all requests to pass through for now
    // Authentication will be handled at the component level
    return NextResponse.next()
}

export const config = {
    matcher: "/api/:path*",
}