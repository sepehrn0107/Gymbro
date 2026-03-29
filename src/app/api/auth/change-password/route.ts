import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { users } from "@/db/schema"
import { err, ok } from "@/lib/api-response"
import { NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors"
import { requireSession } from "@/lib/auth-helpers"
import { changePasswordSchema } from "@/lib/validations/auth"

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    const userId = session.user?.id
    if (!userId) {
      throw new UnauthorizedError("Session user id is missing")
    }

    const body = await req.json()
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { currentPassword, newPassword } = parsed.data

    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new NotFoundError("User not found")
    }

    if (!user.passwordHash) {
      throw new ValidationError("Validation failed", {
        currentPassword: ["This account uses OAuth and does not have a password"],
      })
    }

    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!passwordValid) {
      throw new ValidationError("Validation failed", {
        currentPassword: ["Current password is incorrect"],
      })
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, userId))

    return ok({ message: "Password changed successfully" })
  } catch (error) {
    return err(error)
  }
}
