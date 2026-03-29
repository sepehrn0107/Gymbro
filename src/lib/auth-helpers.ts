/**
 * Server-side auth helper utilities.
 *
 * These are thin wrappers around auth() for use in Route Handlers and
 * Server Components. They throw typed errors so callers can rely on
 * the error-handling middleware in api-response.ts.
 */

import type { Session } from "next-auth"

import { auth } from "@/lib/auth"
import { UnauthorizedError } from "@/lib/errors"

/**
 * Assert that a valid session exists.
 *
 * @throws {UnauthorizedError} if no session is present.
 * @returns The active session.
 */
export async function requireSession(): Promise<Session> {
  const session = await auth()
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
