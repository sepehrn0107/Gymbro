import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}))

vi.mock("@/lib/email", () => ({
  sendOtpEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("node:crypto", () => ({
  randomInt: vi.fn().mockReturnValue(654321),
}))

import { db } from "@/db"
import { sendOtpEmail } from "@/lib/email"

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function mockSelectChain(result: unknown[]) {
  const chain = { from: vi.fn(), where: vi.fn(), limit: vi.fn().mockResolvedValue(result) }
  chain.from.mockReturnValue(chain)
  chain.where.mockReturnValue(chain)
  vi.mocked(db.select).mockReturnValue(chain as never)
  return chain
}

function mockInsertChain() {
  const chain = { values: vi.fn().mockResolvedValue([]) }
  vi.mocked(db.insert).mockReturnValue(chain as never)
  return chain
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return 422 for invalid email", async () => {
    const { POST } = await import("../forgot-password/route")
    const req = makeRequest({ email: "not-an-email" })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error.code).toBe("VALIDATION_ERROR")
  })

  it("should return 200 with generic message when email not found (no leak)", async () => {
    mockSelectChain([]) // user not found

    const { POST } = await import("../forgot-password/route")
    const req = makeRequest({ email: "unknown@example.com" })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data.message).toBe("If that email exists, a reset code was sent")
    expect(sendOtpEmail).not.toHaveBeenCalled()
  })

  it("should insert OTP and send email when user exists, still returning generic message", async () => {
    mockSelectChain([{ id: "user-id" }])
    mockInsertChain()

    const { POST } = await import("../forgot-password/route")
    const req = makeRequest({ email: "existing@example.com" })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data.message).toBe("If that email exists, a reset code was sent")
    expect(sendOtpEmail).toHaveBeenCalledWith("existing@example.com", "654321", "password_reset")
    expect(vi.mocked(db.insert)).toHaveBeenCalled()
  })
})
