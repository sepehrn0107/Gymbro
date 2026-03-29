import { and, eq, gt, isNull } from "drizzle-orm"

import { db } from "@/db"
import { otpTokens, users } from "@/db/schema"
import { err, ok } from "@/lib/api-response"
import { NotFoundError, ValidationError } from "@/lib/errors"
import { verifyEmailSchema } from "@/lib/validations/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = verifyEmailSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { email, code } = parsed.data
    const now = new Date()

    // Look up a matching, unexpired, unused OTP
    const [token] = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.email, email),
          eq(otpTokens.code, code),
          eq(otpTokens.type, "email_verification"),
          gt(otpTokens.expiresAt, now),
          isNull(otpTokens.usedAt),
        ),
      )
      .limit(1)

    if (!token) {
      throw new ValidationError("Validation failed", {
        code: ["Invalid or expired verification code"],
      })
    }

    // Mark OTP as used and update the user's emailVerified timestamp atomically
    await Promise.all([
      db
        .update(otpTokens)
        .set({ usedAt: now })
        .where(eq(otpTokens.id, token.id)),
      db
        .update(users)
        .set({ emailVerified: now })
        .where(eq(users.email, email)),
    ])

    return ok({ message: "Email verified successfully" })
  } catch (error) {
    return err(error)
  }
}
