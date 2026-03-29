/**
 * Domain string literal union types.
 * NOTE: Do NOT import from db/schema here — these types must be standalone
 * to avoid circular dependencies with db/schema.
 */

export type WorkoutStatus = "active" | "completed" | "abandoned"

export type SetType = "normal" | "warmup" | "drop" | "failure"

export type UnitPreference = "metric" | "imperial"

export type OtpType = "email_verification" | "password_reset"
