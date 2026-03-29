import { NextResponse } from "next/server"

import { AppError, ValidationError } from "@/lib/errors"
import type { ApiError, ApiSuccess } from "@/types/api"

/**
 * Return a successful JSON response.
 *
 * @param data    - The payload to include under `data`.
 * @param status  - HTTP status code (default 200).
 */
export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Return an error JSON response.
 *
 * Handles:
 * - ValidationError  → 422 with per-field messages
 * - AppError         → statusCode from the error instance
 * - unknown          → 500 INTERNAL_ERROR (safe message, no leak)
 */
export function err(error: AppError | unknown): NextResponse<ApiError> {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          fields: error.fields,
        },
      },
      { status: error.statusCode },
    )
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode },
    )
  }

  // Unknown / unhandled errors — do not leak internals
  console.error({ level: "error", op: "api-response", error })

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    },
    { status: 500 },
  )
}
