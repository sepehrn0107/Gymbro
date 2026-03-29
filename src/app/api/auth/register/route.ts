import { randomInt } from "node:crypto"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { otpTokens, users } from "@/db/schema"
import { err, ok } from "@/lib/api-response"
import { ConflictError, ValidationError } from "@/lib/errors"
import { sendOtpEmail } from "@/lib/email"
import { registerSchema } from "@/lib/validations/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const { email, password, displayName } = parsed.data

    // Check for existing account — do not leak existence via timing
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existing) {
      throw new ConflictError("An account with that email already exists")
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const inserted = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        displayName: displayName ?? null,
      })
      .returning({ id: users.id })

    const newUserId = inserted[0]?.id

    // Generate a 6-digit email verification OTP (24-hour expiry)
    const code = randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await db.insert(otpTokens).values({
      email,
      userId: newUserId,
      type: "email_verification",
      code,
      expiresAt,
    })

    await sendOtpEmail(email, code, "email_verification")

    return ok({ message: "Check your email to verify your account" }, 201)
  } catch (error) {
    return err(error)
  }
}
