import { err, ok } from "@/lib/api-response"
import { requireSession } from "@/lib/auth-helpers"
import { getExerciseById } from "@/services/exercise.service"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession()
    const userId = session.user?.id as string

    const { id } = await params

    const result = await getExerciseById(id, userId)
    return ok(result)
  } catch (error) {
    return err(error)
  }
}
