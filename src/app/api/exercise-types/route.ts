import { err, ok } from "@/lib/api-response"
import { requireSession } from "@/lib/auth-helpers"
import { getAllExerciseTypes } from "@/services/lookup.service"

// Cache for 1 hour — exercise type data is global and rarely changes
export const revalidate = 3600

export async function GET() {
  try {
    await requireSession()
    const result = await getAllExerciseTypes()
    return ok(result)
  } catch (error) {
    return err(error)
  }
}
