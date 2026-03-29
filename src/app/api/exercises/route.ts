import { err, ok } from "@/lib/api-response"
import { requireSession } from "@/lib/auth-helpers"
import { ValidationError } from "@/lib/errors"
import {
  createExerciseSchema,
  exerciseQuerySchema,
} from "@/lib/validations/exercises"
import { createExercise, listExercises } from "@/services/exercise.service"

// Prevent accidental caching of user-scoped data
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await requireSession()
    const userId = session.user?.id as string

    const { searchParams } = new URL(req.url)
    const rawParams = Object.fromEntries(searchParams.entries())

    const parsed = exerciseQuerySchema.safeParse(rawParams)
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid query parameters",
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      )
    }

    const result = await listExercises(userId, parsed.data)
    return ok(result)
  } catch (error) {
    return err(error)
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    const userId = session.user?.id as string

    const body = await req.json()
    const parsed = createExerciseSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError(
        "Validation failed",
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      )
    }

    const result = await createExercise(userId, parsed.data)
    return ok(result, 201)
  } catch (error) {
    return err(error)
  }
}
