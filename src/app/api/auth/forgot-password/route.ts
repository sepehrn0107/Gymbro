import { randomInt } from "node:crypto"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { otpTokens, users } from "@/db/schema"
import { err, ok } from "@/lib/api-response"
import { ValidationError } from "@/lib/errors"
import { sendOtpEmail } from "@/lib/email"
import { forgotPasswordSchema } from "@/lib/validations/auth"

// Always return this message regardless of whether the email exists —
// prevents email enumeration attacks.
const GENERIC_MESSAGE = "If that email exists, a reset code was sent"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { email } = parsed.data

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    // Do not reveal whether the email exists — always return the same message
    if (!user) {
      return ok({ message: GENERIC_MESSAGE })
    }

    const code = randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.insert(otpTokens).values({
      email,
      userId: user.id,
      type: "password_reset",
      code,
      expiresAt,
    })

    await sendOtpEmail(email, code, "password_reset")

    return ok({ message: GENERIC_MESSAGE })
  } catch (error) {
    return err(error)
  }
}
