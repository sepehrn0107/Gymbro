import { err, ok } from "@/lib/api-response"
import { requireSession } from "@/lib/auth-helpers"
import { getAllMuscleGroups } from "@/services/lookup.service"

// Cache for 1 hour — muscle group data is global and rarely changes
export const revalidate = 3600

export async function GET() {
  try {
    await requireSession()
    const result = await getAllMuscleGroups()
    return ok(result)
  } catch (error) {
    return err(error)
  }
}
