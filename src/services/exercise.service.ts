/**
 * Exercise service — all business logic for exercise CRUD and retrieval.
 *
 * Rules:
 * - No HTTP imports; no Next.js imports.
 * - All DB access goes through the db instance — never in route handlers.
 * - isGlobal + userId scoping enforced here, not in handlers.
 */

import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm"

import { db, schema } from "@/db"
import { NotFoundError, ConflictError } from "@/lib/errors"
import { generateCustomSlug } from "@/lib/slug"
import type { CreateExerciseInput, ExerciseQueryInput } from "@/lib/validations/exercises"
import type {
  ExerciseDetail,
  ExerciseListItem,
  MuscleGroup,
} from "@/types/domain"
import type { PaginatedResponse } from "@/types/api"

const {
  exercises,
  exerciseTypes,
  equipment,
  muscleGroups,
  exerciseSecondaryMuscles,
} = schema

// ── Internal row → domain type mappers ───────────────────────────────────────

type ExerciseRow = typeof exercises.$inferSelect & {
  exerciseType: typeof exerciseTypes.$inferSelect
  equipment: typeof equipment.$inferSelect | null
  primaryMuscleGroup: typeof muscleGroups.$inferSelect | null
  secondaryMuscles: Array<{
    muscleGroup: typeof muscleGroups.$inferSelect
  }>
}

function rowToListItem(row: ExerciseRow): ExerciseListItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isGlobal: row.isGlobal,
    exerciseType: { id: row.exerciseType.id, name: row.exerciseType.name },
    equipment: row.equipment
      ? { id: row.equipment.id, name: row.equipment.name }
      : null,
    primaryMuscleGroup: row.primaryMuscleGroup
      ? {
          id: row.primaryMuscleGroup.id,
          name: row.primaryMuscleGroup.name,
          slug: row.primaryMuscleGroup.slug,
          parentId: row.primaryMuscleGroup.parentId,
        }
      : null,
  }
}

function rowToDetail(row: ExerciseRow): ExerciseDetail {
  const secondaryMuscleGroups: MuscleGroup[] = row.secondaryMuscles.map((sm) => ({
    id: sm.muscleGroup.id,
    name: sm.muscleGroup.name,
    slug: sm.muscleGroup.slug,
    parentId: sm.muscleGroup.parentId,
  }))

  return {
    ...rowToListItem(row),
    instructions: row.instructions,
    secondaryMuscleGroups,
    userId: row.userId,
    createdAt: row.createdAt,
  }
}

// ── listExercises ─────────────────────────────────────────────────────────────

/**
 * List exercises visible to the given user (global + their own customs).
 * Supports optional text search, muscle group, exercise type, and equipment filters.
 * Returns paginated results.
 */
export async function listExercises(
  userId: string,
  query: ExerciseQueryInput,
): Promise<PaginatedResponse<ExerciseListItem>> {
  const { page, pageSize, q, muscleGroupId, exerciseTypeId, equipmentId } = query

  // Build the shared where condition
  const scopeFilter = or(
    eq(exercises.isGlobal, true),
    eq(exercises.userId, userId),
  )

  const filters = [
    scopeFilter,
    q ? ilike(exercises.name, `%${q}%`) : undefined,
    muscleGroupId ? eq(exercises.primaryMuscleGroupId, muscleGroupId) : undefined,
    exerciseTypeId ? eq(exercises.exerciseTypeId, exerciseTypeId) : undefined,
    equipmentId ? eq(exercises.equipmentId, equipmentId) : undefined,
  ].filter(Boolean) as Parameters<typeof and>

  const whereClause = and(...filters)

  // Count query
  const [countRow] = await db
    .select({ count: count() })
    .from(exercises)
    .where(whereClause)

  const total = Number(countRow?.count ?? 0)

  // Data query
  const rows = await db
    .select({
      exercise: exercises,
      exerciseType: exerciseTypes,
      equipment: equipment,
      primaryMuscleGroup: muscleGroups,
    })
    .from(exercises)
    .leftJoin(exerciseTypes, eq(exercises.exerciseTypeId, exerciseTypes.id))
    .leftJoin(equipment, eq(exercises.equipmentId, equipment.id))
    .leftJoin(muscleGroups, eq(exercises.primaryMuscleGroupId, muscleGroups.id))
    .where(whereClause)
    .orderBy(desc(exercises.isGlobal), asc(exercises.name))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const items: ExerciseListItem[] = rows.map((row) => {
    // exerciseType is NOT NULL in schema — cast is safe
    const exerciseType = row.exerciseType as typeof exerciseTypes.$inferSelect
    return {
      id: row.exercise.id,
      name: row.exercise.name,
      slug: row.exercise.slug,
      isGlobal: row.exercise.isGlobal,
      exerciseType: { id: exerciseType.id, name: exerciseType.name },
      equipment: row.equipment
        ? { id: row.equipment.id, name: row.equipment.name }
        : null,
      primaryMuscleGroup: row.primaryMuscleGroup
        ? {
            id: row.primaryMuscleGroup.id,
            name: row.primaryMuscleGroup.name,
            slug: row.primaryMuscleGroup.slug,
            parentId: row.primaryMuscleGroup.parentId,
          }
        : null,
    }
  })

  return { items, total, page, pageSize }
}

// ── getExerciseById ───────────────────────────────────────────────────────────

/**
 * Fetch a single exercise by ID with full relations.
 * Throws NotFoundError if the exercise does not exist or if it is a custom
 * exercise that belongs to a different user (do not leak existence).
 */
export async function getExerciseById(
  id: string,
  userId: string,
): Promise<ExerciseDetail> {
  const row = await db.query.exercises.findFirst({
    where: eq(exercises.id, id),
    with: {
      exerciseType: true,
      equipment: true,
      primaryMuscleGroup: true,
      secondaryMuscles: {
        with: {
          muscleGroup: true,
        },
      },
    },
  })

  if (!row) {
    throw new NotFoundError("Exercise not found")
  }

  // Do not leak existence of other users' custom exercises
  if (!row.isGlobal && row.userId !== userId) {
    throw new NotFoundError("Exercise not found")
  }

  return rowToDetail(row as ExerciseRow)
}

// ── getExerciseBySlug ─────────────────────────────────────────────────────────

/**
 * Fetch a single exercise by slug with full relations.
 * Same access rules as getExerciseById.
 */
export async function getExerciseBySlug(
  slug: string,
  userId: string,
): Promise<ExerciseDetail> {
  const row = await db.query.exercises.findFirst({
    where: eq(exercises.slug, slug),
    with: {
      exerciseType: true,
      equipment: true,
      primaryMuscleGroup: true,
      secondaryMuscles: {
        with: {
          muscleGroup: true,
        },
      },
    },
  })

  if (!row) {
    throw new NotFoundError("Exercise not found")
  }

  if (!row.isGlobal && row.userId !== userId) {
    throw new NotFoundError("Exercise not found")
  }

  return rowToDetail(row as ExerciseRow)
}

// ── createExercise ────────────────────────────────────────────────────────────

/**
 * Create a new custom exercise for a user.
 *
 * - Always sets isGlobal=false and userId=userId.
 * - Generates a unique slug via generateCustomSlug.
 * - Wraps the exercise insert and secondary muscle inserts in a transaction.
 * - On pg unique violation (code 23505), retries once with a new slug.
 * - Throws ConflictError if the retry also fails.
 */
export async function createExercise(
  userId: string,
  input: CreateExerciseInput,
): Promise<ExerciseDetail> {
  async function attempt(slug: string): Promise<ExerciseDetail> {
    return db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(exercises)
        .values({
          name: input.name,
          slug,
          exerciseTypeId: input.exerciseTypeId,
          equipmentId: input.equipmentId ?? null,
          primaryMuscleGroupId: input.primaryMuscleGroupId ?? null,
          instructions: input.instructions ?? null,
          isGlobal: false,
          userId,
        })
        .returning({ id: exercises.id })

      if (!inserted) {
        throw new Error("Exercise insert returned no rows")
      }

      const exerciseId = inserted.id

      if (input.secondaryMuscleGroupIds.length > 0) {
        await tx.insert(exerciseSecondaryMuscles).values(
          input.secondaryMuscleGroupIds.map((muscleGroupId) => ({
            exerciseId,
            muscleGroupId,
          })),
        )
      }

      // Fetch the complete row inside the transaction so the return value
      // is consistent even if the caller re-reads outside later.
      const row = await tx.query.exercises.findFirst({
        where: eq(exercises.id, exerciseId),
        with: {
          exerciseType: true,
          equipment: true,
          primaryMuscleGroup: true,
          secondaryMuscles: {
            with: {
              muscleGroup: true,
            },
          },
        },
      })

      if (!row) {
        throw new Error("Could not re-fetch created exercise")
      }

      return rowToDetail(row as ExerciseRow)
    })
  }

  const firstSlug = generateCustomSlug(input.name)

  try {
    return await attempt(firstSlug)
  } catch (err) {
    // Postgres unique constraint violation
    if (isPgUniqueViolation(err)) {
      const retrySlug = generateCustomSlug(input.name)
      try {
        return await attempt(retrySlug)
      } catch (retryErr) {
        if (isPgUniqueViolation(retryErr)) {
          throw new ConflictError(
            "Could not generate a unique slug for this exercise. Please try again.",
          )
        }
        throw retryErr
      }
    }
    throw err
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPgUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  )
}
