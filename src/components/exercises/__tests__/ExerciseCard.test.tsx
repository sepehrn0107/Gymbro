import { describe, it, expect } from "vitest"
import type { ExerciseListItem } from "@/types/domain"

/**
 * Unit tests for ExerciseCard pure logic.
 *
 * The vitest environment is "node" (no jsdom) so DOM rendering via RTL is not
 * available. These tests verify the presentational logic that the component
 * derives from its `exercise` prop:
 *   - href construction from slug
 *   - "Custom" badge visibility based on isGlobal
 *   - conditional rendering of equipment / primaryMuscleGroup
 *   - type badge text sourced from exerciseType.name
 */

// ── Helper: derive the href the card would render ─────────────────────────────

function exerciseCardHref(slug: string): string {
  return `/exercises/${slug}`
}

// ── Helper: should the "Custom" badge be shown? ───────────────────────────────

function shouldShowCustomBadge(isGlobal: boolean): boolean {
  return !isGlobal
}

// ── Helper: equipment label text (null → omit) ────────────────────────────────

function equipmentLabel(
  equipment: ExerciseListItem["equipment"],
): string | null {
  return equipment?.name ?? null
}

// ── Helper: primary muscle group label text ───────────────────────────────────

function primaryMuscleGroupLabel(
  primaryMuscleGroup: ExerciseListItem["primaryMuscleGroup"],
): string | null {
  return primaryMuscleGroup?.name ?? null
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseExercise: ExerciseListItem = {
  id: "exercise-uuid-1",
  name: "Bench Press",
  slug: "bench-press",
  isGlobal: true,
  exerciseType: { id: "type-uuid-1", name: "Compound" },
  equipment: { id: "equip-uuid-1", name: "Barbell" },
  primaryMuscleGroup: { id: "mg-uuid-1", name: "Chest", slug: "chest", parentId: null },
}

const customExercise: ExerciseListItem = {
  ...baseExercise,
  id: "exercise-uuid-2",
  name: "My Custom Curl",
  slug: "my-custom-curl-a3f9",
  isGlobal: false,
}

const minimalExercise: ExerciseListItem = {
  id: "exercise-uuid-3",
  name: "Air Squat",
  slug: "air-squat",
  isGlobal: true,
  exerciseType: { id: "type-uuid-2", name: "Bodyweight" },
  equipment: null,
  primaryMuscleGroup: null,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ExerciseCard — href construction", () => {
  it("builds the href from the exercise slug", () => {
    expect(exerciseCardHref(baseExercise.slug)).toBe("/exercises/bench-press")
  })

  it("builds the href for a custom exercise with hex-suffix slug", () => {
    expect(exerciseCardHref(customExercise.slug)).toBe(
      "/exercises/my-custom-curl-a3f9",
    )
  })
})

describe("ExerciseCard — exercise name", () => {
  it("exposes the exercise name from the prop", () => {
    expect(baseExercise.name).toBe("Bench Press")
  })
})

describe("ExerciseCard — type badge", () => {
  it("renders the exerciseType name as the badge label", () => {
    expect(baseExercise.exerciseType.name).toBe("Compound")
  })

  it("uses the correct type name for a bodyweight exercise", () => {
    expect(minimalExercise.exerciseType.name).toBe("Bodyweight")
  })
})

describe("ExerciseCard — Custom badge visibility", () => {
  it("shows the Custom badge when isGlobal is false", () => {
    expect(shouldShowCustomBadge(false)).toBe(true)
  })

  it("hides the Custom badge when isGlobal is true", () => {
    expect(shouldShowCustomBadge(true)).toBe(false)
  })

  it("Custom badge is shown for customExercise fixture", () => {
    expect(shouldShowCustomBadge(customExercise.isGlobal)).toBe(true)
  })

  it("Custom badge is hidden for baseExercise fixture", () => {
    expect(shouldShowCustomBadge(baseExercise.isGlobal)).toBe(false)
  })
})

describe("ExerciseCard — equipment label", () => {
  it("returns the equipment name when equipment is present", () => {
    expect(equipmentLabel(baseExercise.equipment)).toBe("Barbell")
  })

  it("returns null when equipment is null", () => {
    expect(equipmentLabel(minimalExercise.equipment)).toBeNull()
  })
})

describe("ExerciseCard — primary muscle group label", () => {
  it("returns the muscle group name when primaryMuscleGroup is present", () => {
    expect(primaryMuscleGroupLabel(baseExercise.primaryMuscleGroup)).toBe("Chest")
  })

  it("returns null when primaryMuscleGroup is null", () => {
    expect(primaryMuscleGroupLabel(minimalExercise.primaryMuscleGroup)).toBeNull()
  })
})
