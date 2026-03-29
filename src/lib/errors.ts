/**
 * Application error hierarchy.
 * AppError is the base class for all known domain/application errors.
 * Handlers in api-response.ts use instanceof checks against these classes.
 */

export class AppError extends Error {
  readonly statusCode: number
  readonly code: string

  constructor(message: string, statusCode: number, code: string) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    // Restore prototype chain for instanceof checks in transpiled code
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND")
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED")
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403, "FORBIDDEN")
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409, "CONFLICT")
  }
}

export class ValidationError extends AppError {
  readonly fields: Record<string, string[]>

  constructor(message = "Validation failed", fields: Record<string, string[]> = {}) {
    super(message, 422, "VALIDATION_ERROR")
    this.fields = fields
  }
}
