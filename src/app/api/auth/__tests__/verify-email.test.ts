import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}))

import { db } from "@/db"

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/verify-email", {
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

function mockUpdateChain() {
  const chain = { set: vi.fn(), where: vi.fn().mockResolvedValue([]) }
  chain.set.mockReturnValue(chain)
  vi.mocked(db.update).mockReturnValue(chain as never)
  return chain
}

describe("POST /api/auth/verify-email", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return 422 for invalid body", async () => {
    const { POST } = await import("../verify-email/route")
    const req = makeRequest({ email: "bad", code: "123" }) // code too short
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error.code).toBe("VALIDATION_ERROR")
  })

  it("should return 422 when OTP not found or expired", async () => {
    mockSelectChain([]) // no matching token

    const { POST } = await import("../verify-email/route")
    const req = makeRequest({ email: "user@example.com", code: "123456" })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error.fields?.code).toBeDefined()
  })

  it("should return 200 and mark OTP used when valid", async () => {
    const fakeToken = {
      id: "token-id",
      email: "user@example.com",
      code: "123456",
      type: "email_verification",
      expiresAt: new Date(Date.now() + 10000),
      usedAt: null,
    }
    mockSelectChain([fakeToken])
    mockUpdateChain()

    const { POST } = await import("../verify-email/route")
    const req = makeRequest({ email: "user@example.com", code: "123456" })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.message).toBe("Email verified successfully")
  })
})
