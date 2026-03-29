/**
 * Server-side auth helper utilities.
 *
 * These are thin wrappers around auth() for use in Route Handlers and
 * Server Components. They throw typed errors so callers can rely on
 * the error-handling middleware in api-response.ts.
 */

import type { Session } from "next-auth"
import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { UnauthorizedError } from "@/lib/errors"
import { db } from "@/db"
import { users } from "@/db/schema"

/**
 * Returns the current session.
 *
 * In non-production environments, if DEV_AUTOLOGIN_EMAIL is set, skips real
 * auth and returns a synthetic session for that user so you can develop
 * without going through the login flow.
 */
export async function getSession(): Promise<Session | null> {
  const devEmail = process.env.DEV_AUTOLOGIN_EMAIL
  if (devEmail && process.env.NODE_ENV !== "production") {
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.displayName, image: users.image })
      .from(users)
      .where(eq(users.email, devEmail))
      .limit(1)

    if (user) {
      return {
        user: { id: user.id, email: user.email ?? "", name: user.name, image: user.image },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    }
  }

  return auth()
}

/**
 * Assert that a valid session exists.
 *
 * @throws {UnauthorizedError} if no session is present.
 * @returns The active session.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) {
    throw new UnauthorizedError("Authentication required")
  }
  return session
}

/**
 * Return the authenticated user's ID.
 *
 * @throws {UnauthorizedError} if no session is present.
 * @returns The user's UUID string.
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await requireSession()
  const id = session.user?.id
  if (!id) {
    throw new UnauthorizedError("Session user id is missing")
  }
  return id
}
