import { z, type ZodSchema } from "zod"

import { ValidationError } from "@/lib/errors"

export const uuidSchema = z.string().uuid("Invalid UUID format")

export const paginationSchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1"),
  pageSize: z.coerce.number().min(1, "Page size must be at least 1").max(100, "Page size cannot exceed 100"),
})

export type PaginationInput = z.infer<typeof paginationSchema>

/**
 * Parse and validate the JSON body of an incoming Request using the provided Zod schema.
 *
 * Throws a ValidationError (422) with per-field messages if validation fails.
 * Throws a ValidationError with a generic message if the body is not valid JSON.
 */
export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    throw new ValidationError("Request body must be valid JSON", {
      body: ["Invalid JSON"],
    })
  }

  const result = schema.safeParse(body)

  if (!result.success) {
    const fields: Record<string, string[]> = {}

    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_root"
      if (!fields[key]) {
        fields[key] = []
      }
      fields[key].push(issue.message)
    }

    throw new ValidationError("Validation failed", fields)
  }

  return result.data
}
