import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock auth() from auth.ts before importing the module under test
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

import { auth } from "@/lib/auth"
import { requireSession, getCurrentUserId } from "@/lib/auth-helpers"
import { UnauthorizedError } from "@/lib/errors"

const mockAuth = vi.mocked(auth)

describe("requireSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return the session when one exists", async () => {
    const fakeSession = { user: { id: "user-123", email: "test@example.com" }, expires: "2099-01-01" }
    mockAuth.mockResolvedValueOnce(fakeSession as never)

    const session = await requireSession()

    expect(session).toEqual(fakeSession)
  })

  it("should throw UnauthorizedError when no session exists (null)", async () => {
    mockAuth.mockResolvedValueOnce(null as never)

    await expect(requireSession()).rejects.toThrow(UnauthorizedError)
  })

  it("should throw UnauthorizedError when auth returns undefined", async () => {
    mockAuth.mockResolvedValueOnce(undefined as never)

    await expect(requireSession()).rejects.toThrow(UnauthorizedError)
  })

  it("should throw with the correct error code", async () => {
    mockAuth.mockResolvedValueOnce(null as never)

    await expect(requireSession()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      statusCode: 401,
    })
  })
})

describe("getCurrentUserId", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return the user id from the session", async () => {
    const fakeSession = { user: { id: "user-abc", email: "test@example.com" }, expires: "2099-01-01" }
    mockAuth.mockResolvedValueOnce(fakeSession as never)

    const userId = await getCurrentUserId()

    expect(userId).toBe("user-abc")
  })

  it("should throw UnauthorizedError when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null as never)

    await expect(getCurrentUserId()).rejects.toThrow(UnauthorizedError)
  })
})
