import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

/**
 * Auth middleware — protects all routes under /app/*.
 *
 * Public routes (auth pages, API auth callbacks) are excluded via the
 * matcher config below so Next.js never invokes this middleware for them.
 * All other matched routes require an active session; unauthenticated
 * requests are redirected to /login.
 */
export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all /app/* routes (the authenticated app shell).
     * Exclude:
     *  - /auth/*          — login, register, forgot-password pages
     *  - /api/auth/*      — Auth.js route handlers (callbacks, csrf, etc.)
     *  - /_next/*         — Next.js internal routes
     *  - /favicon.ico     — static asset
     *  - /public assets   — images, fonts, etc.
     */
    "/app/:path*",
  ],
}
