/**
 * Domain string literal union types.
 * NOTE: Do NOT import from db/schema here — these types must be standalone
 * to avoid circular dependencies with db/schema.
 */

export type WorkoutStatus = "active" | "completed" | "abandoned"

export type SetType = "normal" | "warmup" | "drop" | "failure"

export type UnitPreference = "metric" | "imperial"

export type OtpType = "email_verification" | "password_reset"

// ── Exercise library domain types ─────────────────────────────────────────────
// These are standalone types — do NOT import from db/schema to avoid circular deps.

export type MuscleGroup = {
  id: string
  name: string
  slug: string
  parentId: string | null
}

export type ExerciseType = {
  id: string
  name: string
}

export type EquipmentItem = {
  id: string
  name: string
}

export type ExerciseListItem = {
  id: string
  name: string
  slug: string
  isGlobal: boolean
  exerciseType: ExerciseType
  equipment: EquipmentItem | null
  primaryMuscleGroup: MuscleGroup | null
}

export type ExerciseDetail = ExerciseListItem & {
  instructions: string | null
  secondaryMuscleGroups: MuscleGroup[]
  userId: string | null
  createdAt: Date
}
