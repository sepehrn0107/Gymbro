import { z } from "zod"

import { uuidSchema, paginationSchema } from "@/lib/validations/common"

// ── createExerciseSchema ──────────────────────────────────────────────────────

export const createExerciseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  exerciseTypeId: uuidSchema,
  equipmentId: uuidSchema.optional().nullable(),
  primaryMuscleGroupId: uuidSchema.optional().nullable(),
  secondaryMuscleGroupIds: z
    .array(uuidSchema)
    .max(10, "Cannot have more than 10 secondary muscle groups")
    .default([]),
  instructions: z
    .string()
    .max(2000, "Instructions cannot exceed 2000 characters")
    .optional(),
})

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>

// ── exerciseQuerySchema ───────────────────────────────────────────────────────
// Extends paginationSchema with defaults for page and pageSize so that URL
// params that omit them are handled gracefully.

export const exerciseQuerySchema = paginationSchema
  .extend({
    page: z.coerce.number().min(1, "Page must be at least 1").default(1),
    pageSize: z.coerce
      .number()
      .min(1, "Page size must be at least 1")
      .max(100, "Page size cannot exceed 100")
      .default(20),
    q: z.string().max(100, "Search query cannot exceed 100 characters").optional(),
    muscleGroupId: uuidSchema.optional(),
    exerciseTypeId: uuidSchema.optional(),
    equipmentId: uuidSchema.optional(),
  })

export type ExerciseQueryInput = z.infer<typeof exerciseQuerySchema>
