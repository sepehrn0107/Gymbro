import { describe, expect, it } from "vitest"

import { createExerciseSchema, exerciseQuerySchema } from "@/lib/validations/exercises"

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000"
const VALID_UUID_2 = "550e8400-e29b-41d4-a716-446655440001"

// ── createExerciseSchema ──────────────────────────────────────────────────────

describe("createExerciseSchema", () => {
  it("should accept a valid minimal input", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      exerciseTypeId: VALID_UUID,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.secondaryMuscleGroupIds).toEqual([])
    }
  })

  it("should accept a fully specified input", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      exerciseTypeId: VALID_UUID,
      equipmentId: VALID_UUID_2,
      primaryMuscleGroupId: VALID_UUID,
      secondaryMuscleGroupIds: [VALID_UUID_2],
      instructions: "Lie flat on the bench.",
    })
    expect(result.success).toBe(true)
  })

  it("should reject missing name", () => {
    const result = createExerciseSchema.safeParse({
      exerciseTypeId: VALID_UUID,
    })
    expect(result.success).toBe(false)
  })

  it("should reject empty name", () => {
    const result = createExerciseSchema.safeParse({
      name: "",
      exerciseTypeId: VALID_UUID,
    })
    expect(result.success).toBe(false)
  })

  it("should reject name longer than 100 characters", () => {
    const result = createExerciseSchema.safeParse({
      name: "a".repeat(101),
      exerciseTypeId: VALID_UUID,
    })
    expect(result.success).toBe(false)
  })

  it("should accept name of exactly 100 characters", () => {
    const result = createExerciseSchema.safeParse({
      name: "a".repeat(100),
      exerciseTypeId: VALID_UUID,
    })
    expect(result.success).toBe(true)
  })

  it("should reject missing exerciseTypeId", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
    })
    expect(result.success).toBe(false)
  })

  it("should reject invalid exerciseTypeId (not a UUID)", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      exerciseTypeId: "not-a-uuid",
    })
    expect(result.success).toBe(false)
  })

  it("should accept null equipmentId", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      exerciseTypeId: VALID_UUID,
      equipmentId: null,
    })
    expect(result.success).toBe(true)
  })

  it("should accept undefined equipmentId (treated as absent)", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      exerciseTypeId: VALID_UUID,
    })
    expect(result.success).toBe(true)
  })

  it("should reject equipmentId that is not a UUID", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      exerciseTypeId: VALID_UUID,
      equipmentId: "bad",
    })
    expect(result.success).toBe(false)
  })

  it("should accept null primaryMuscleGroupId", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      exerciseTypeId: VALID_UUID,
      primaryMuscleGroupId: null,
    })
    expect(result.success).toBe(true)
  })

  it("should reject secondaryMuscleGroupIds with more than 10 items", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      exerciseTypeId: VALID_UUID,
      secondaryMuscleGroupIds: Array(11).fill(VALID_UUID),
    })
    expect(result.success).toBe(false)
  })

  it("should accept secondaryMuscleGroupIds with exactly 10 items", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      exerciseTypeId: VALID_UUID,
      secondaryMuscleGroupIds: Array(10).fill(VALID_UUID),
    })
    expect(result.success).toBe(true)
  })

  it("should reject invalid UUID in secondaryMuscleGroupIds", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      exerciseTypeId: VALID_UUID,
      secondaryMuscleGroupIds: ["not-a-uuid"],
    })
    expect(result.success).toBe(false)
  })

  it("should reject instructions longer than 2000 characters", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      exerciseTypeId: VALID_UUID,
      instructions: "a".repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it("should accept instructions of exactly 2000 characters", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      exerciseTypeId: VALID_UUID,
      instructions: "a".repeat(2000),
    })
    expect(result.success).toBe(true)
  })

  it("should default secondaryMuscleGroupIds to empty array when not provided", () => {
    const result = createExerciseSchema.safeParse({
      name: "Bench Press",
      exerciseTypeId: VALID_UUID,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.secondaryMuscleGroupIds).toEqual([])
    }
  })
})

// ── exerciseQuerySchema ───────────────────────────────────────────────────────

describe("exerciseQuerySchema", () => {
  it("should accept empty params and apply defaults", () => {
    const result = exerciseQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(20)
    }
  })

  it("should coerce string page and pageSize to numbers", () => {
    const result = exerciseQuerySchema.safeParse({ page: "2", pageSize: "50" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it("should reject page less than 1", () => {
    const result = exerciseQuerySchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })

  it("should reject pageSize greater than 100", () => {
    const result = exerciseQuerySchema.safeParse({ pageSize: 101 })
    expect(result.success).toBe(false)
  })

  it("should accept optional q filter", () => {
    const result = exerciseQuerySchema.safeParse({ q: "squat" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.q).toBe("squat")
    }
  })

  it("should reject q longer than 100 characters", () => {
    const result = exerciseQuerySchema.safeParse({ q: "a".repeat(101) })
    expect(result.success).toBe(false)
  })

  it("should accept optional muscleGroupId as UUID", () => {
    const result = exerciseQuerySchema.safeParse({ muscleGroupId: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it("should reject muscleGroupId that is not a UUID", () => {
    const result = exerciseQuerySchema.safeParse({ muscleGroupId: "not-a-uuid" })
    expect(result.success).toBe(false)
  })

  it("should accept optional exerciseTypeId as UUID", () => {
    const result = exerciseQuerySchema.safeParse({ exerciseTypeId: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it("should accept optional equipmentId as UUID", () => {
    const result = exerciseQuerySchema.safeParse({ equipmentId: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it("should accept all filters combined", () => {
    const result = exerciseQuerySchema.safeParse({
      page: "1",
      pageSize: "20",
      q: "press",
      muscleGroupId: VALID_UUID,
      exerciseTypeId: VALID_UUID,
      equipmentId: VALID_UUID_2,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.q).toBe("press")
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(20)
    }
  })
})
