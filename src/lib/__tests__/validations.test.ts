import { describe, expect, it } from "vitest"

import { ValidationError } from "@/lib/errors"
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "@/lib/validations/auth"
import { parseBody, paginationSchema, uuidSchema } from "@/lib/validations/common"

// ---- Auth schemas ----

describe("loginSchema", () => {
  it("should parse valid credentials", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "secret" })
    expect(result.success).toBe(true)
  })

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "secret" })
    expect(result.success).toBe(false)
  })

  it("should reject missing password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" })
    expect(result.success).toBe(false)
  })
})

describe("registerSchema", () => {
  it("should parse with required fields only", () => {
    const result = registerSchema.safeParse({ email: "a@b.com", password: "12345678" })
    expect(result.success).toBe(true)
  })

  it("should parse with optional displayName", () => {
    const result = registerSchema.safeParse({
      email: "a@b.com",
      password: "12345678",
      displayName: "Alice",
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.displayName).toBe("Alice")
  })

  it("should reject password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ email: "a@b.com", password: "short" })
    expect(result.success).toBe(false)
  })

  it("should reject invalid email", () => {
    const result = registerSchema.safeParse({ email: "bad", password: "12345678" })
    expect(result.success).toBe(false)
  })
})

describe("verifyEmailSchema", () => {
  it("should parse valid input", () => {
    const result = verifyEmailSchema.safeParse({ email: "a@b.com", code: "123456" })
    expect(result.success).toBe(true)
  })

  it("should reject code not exactly 6 chars", () => {
    const result = verifyEmailSchema.safeParse({ email: "a@b.com", code: "12345" })
    expect(result.success).toBe(false)
  })

  it("should reject code longer than 6 chars", () => {
    const result = verifyEmailSchema.safeParse({ email: "a@b.com", code: "1234567" })
    expect(result.success).toBe(false)
  })
})

describe("forgotPasswordSchema", () => {
  it("should parse valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "a@b.com" })
    expect(result.success).toBe(true)
  })

  it("should reject invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "nope" })
    expect(result.success).toBe(false)
  })
})

describe("resetPasswordSchema", () => {
  it("should parse valid input", () => {
    const result = resetPasswordSchema.safeParse({
      email: "a@b.com",
      code: "654321",
      newPassword: "newpassword1",
    })
    expect(result.success).toBe(true)
  })

  it("should reject short new password", () => {
    const result = resetPasswordSchema.safeParse({
      email: "a@b.com",
      code: "654321",
      newPassword: "short",
    })
    expect(result.success).toBe(false)
  })
})

describe("changePasswordSchema", () => {
  it("should parse valid input", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass",
      newPassword: "newpassword1",
    })
    expect(result.success).toBe(true)
  })

  it("should reject new password shorter than 8 chars", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass",
      newPassword: "short",
    })
    expect(result.success).toBe(false)
  })
})

// ---- Common schemas ----

describe("uuidSchema", () => {
  it("should accept a valid UUID v4", () => {
    const result = uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000")
    expect(result.success).toBe(true)
  })

  it("should reject a non-UUID string", () => {
    const result = uuidSchema.safeParse("not-a-uuid")
    expect(result.success).toBe(false)
  })
})

describe("paginationSchema", () => {
  it("should parse numeric page and pageSize", () => {
    const result = paginationSchema.safeParse({ page: 1, pageSize: 20 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(20)
    }
  })

  it("should coerce string numbers", () => {
    const result = paginationSchema.safeParse({ page: "2", pageSize: "50" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it("should reject page < 1", () => {
    const result = paginationSchema.safeParse({ page: 0, pageSize: 10 })
    expect(result.success).toBe(false)
  })

  it("should reject pageSize > 100", () => {
    const result = paginationSchema.safeParse({ page: 1, pageSize: 101 })
    expect(result.success).toBe(false)
  })

  it("should reject pageSize < 1", () => {
    const result = paginationSchema.safeParse({ page: 1, pageSize: 0 })
    expect(result.success).toBe(false)
  })
})

describe("parseBody", () => {
  function makeRequest(body: unknown): Request {
    return new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  it("should return parsed data for valid input", async () => {
    const req = makeRequest({ email: "a@b.com", password: "12345678" })
    const result = await parseBody(req, registerSchema)
    expect(result.email).toBe("a@b.com")
  })

  it("should throw ValidationError for invalid input", async () => {
    const req = makeRequest({ email: "bad-email", password: "short" })
    await expect(parseBody(req, registerSchema)).rejects.toThrow(ValidationError)
  })

  it("should throw ValidationError with field-level messages", async () => {
    const req = makeRequest({ email: "bad-email", password: "short" })
    try {
      await parseBody(req, registerSchema)
      expect.fail("Should have thrown")
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError)
      const ve = err as ValidationError
      expect(Object.keys(ve.fields).length).toBeGreaterThan(0)
    }
  })

  it("should throw ValidationError for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json {{{",
    })
    await expect(parseBody(req, registerSchema)).rejects.toThrow(ValidationError)
  })
})
