import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks (must be hoisted before imports) ──────────────────────────────────
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}))

vi.mock("@/lib/email", () => ({
  sendOtpEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
  },
}))

vi.mock("node:crypto", () => ({
  randomInt: vi.fn().mockReturnValue(123456),
}))

import { db } from "@/db"
import { sendOtpEmail } from "@/lib/email"

// Helper to build a Request with JSON body
function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

// Helper: chain mock that handles select().from().where().limit()
function mockSelectChain(result: unknown[]) {
  const chain = { from: vi.fn(), where: vi.fn(), limit: vi.fn().mockResolvedValue(result) }
  chain.from.mockReturnValue(chain)
  chain.where.mockReturnValue(chain)
  vi.mocked(db.select).mockReturnValue(chain as never)
  return chain
}

// Helper: chain mock that handles insert().values().returning()
function mockInsertChain(result: unknown[]) {
  const chain = { values: vi.fn(), returning: vi.fn().mockResolvedValue(result) }
  chain.values.mockReturnValue(chain)
  vi.mocked(db.insert).mockReturnValue(chain as never)
  return chain
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return 422 for invalid body", async () => {
    const { POST } = await import("../register/route")
    const req = makeRequest({ email: "not-an-email", password: "short" })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe("VALIDATION_ERROR")
  })

  it("should return 409 when email already exists", async () => {
    mockSelectChain([{ id: "existing-user-id" }])

    const { POST } = await import("../register/route")
    const req = makeRequest({ email: "taken@example.com", password: "password123" })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.error.code).toBe("CONFLICT")
  })

  it("should create user, insert OTP, and send email on success", async () => {
    // First select (check existing) returns empty
    mockSelectChain([])
    // Insert user returning
    const insertChain = mockInsertChain([{ id: "new-user-id" }])

    // Second insert for OTP — we need db.insert to be called twice
    // Override for the second call
    const otpInsertChain = { values: vi.fn().mockResolvedValue([]) }
    vi.mocked(db.insert)
      .mockReturnValueOnce(insertChain as never)
      .mockReturnValueOnce(otpInsertChain as never)

    const { POST } = await import("../register/route")
    const req = makeRequest({ email: "new@example.com", password: "password123" })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data.message).toBe("Check your email to verify your account")
    expect(sendOtpEmail).toHaveBeenCalledWith("new@example.com", "123456", "email_verification")
  })
})
