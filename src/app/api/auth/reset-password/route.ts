import bcrypt from "bcryptjs"
import { and, eq, gt, isNull } from "drizzle-orm"

import { db } from "@/db"
import { otpTokens, users } from "@/db/schema"
import { err, ok } from "@/lib/api-response"
import { ValidationError } from "@/lib/errors"
import { resetPasswordSchema } from "@/lib/validations/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { email, code, newPassword } = parsed.data
    const now = new Date()

    // Look up a matching, unexpired, unused password-reset OTP
    const [token] = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.email, email),
          eq(otpTokens.code, code),
          eq(otpTokens.type, "password_reset"),
          gt(otpTokens.expiresAt, now),
          isNull(otpTokens.usedAt),
        ),
      )
      .limit(1)

    if (!token) {
      throw new ValidationError("Validation failed", {
        code: ["Invalid or expired reset code"],
      })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Mark OTP as used and update password atomically
    await Promise.all([
      db
        .update(otpTokens)
        .set({ usedAt: now })
        .where(eq(otpTokens.id, token.id)),
      db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.email, email)),
    ])

    return ok({ message: "Password reset successfully" })
  } catch (error) {
    return err(error)
  }
}
