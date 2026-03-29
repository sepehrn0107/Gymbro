import { describe, expect, it } from "vitest"

import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors"

describe("AppError", () => {
  it("should set message, statusCode, and code", () => {
    const err = new AppError("Something broke", 500, "BROKEN")
    expect(err.message).toBe("Something broke")
    expect(err.statusCode).toBe(500)
    expect(err.code).toBe("BROKEN")
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(AppError)
  })

  it("should set the name to the constructor name", () => {
    const err = new AppError("msg", 500, "CODE")
    expect(err.name).toBe("AppError")
  })
})

describe("NotFoundError", () => {
  it("should have status 404 and code NOT_FOUND", () => {
    const err = new NotFoundError()
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe("NOT_FOUND")
    expect(err).toBeInstanceOf(AppError)
    expect(err).toBeInstanceOf(NotFoundError)
  })

  it("should accept a custom message", () => {
    const err = new NotFoundError("User not found")
    expect(err.message).toBe("User not found")
  })

  it("should use default message when none provided", () => {
    const err = new NotFoundError()
    expect(err.message).toBe("Resource not found")
  })
})

describe("UnauthorizedError", () => {
  it("should have status 401 and code UNAUTHORIZED", () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe("UNAUTHORIZED")
    expect(err).toBeInstanceOf(AppError)
  })
})

describe("ForbiddenError", () => {
  it("should have status 403 and code FORBIDDEN", () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe("FORBIDDEN")
    expect(err).toBeInstanceOf(AppError)
  })
})

describe("ConflictError", () => {
  it("should have status 409 and code CONFLICT", () => {
    const err = new ConflictError()
    expect(err.statusCode).toBe(409)
    expect(err.code).toBe("CONFLICT")
    expect(err).toBeInstanceOf(AppError)
  })
})

describe("ValidationError", () => {
  it("should have status 422 and code VALIDATION_ERROR", () => {
    const err = new ValidationError()
    expect(err.statusCode).toBe(422)
    expect(err.code).toBe("VALIDATION_ERROR")
    expect(err).toBeInstanceOf(AppError)
    expect(err).toBeInstanceOf(ValidationError)
  })

  it("should store field-level error messages", () => {
    const fields = { email: ["Invalid email"], password: ["Too short"] }
    const err = new ValidationError("Validation failed", fields)
    expect(err.fields).toEqual(fields)
  })

  it("should default to empty fields when not provided", () => {
    const err = new ValidationError()
    expect(err.fields).toEqual({})
  })

  it("should accept a custom message", () => {
    const err = new ValidationError("Custom message", {})
    expect(err.message).toBe("Custom message")
  })
})
