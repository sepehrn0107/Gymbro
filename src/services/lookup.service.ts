/**
 * Lookup service — read-only queries for static reference tables.
 *
 * These tables (muscle_groups, exercise_types, equipment) are global and
 * rarely change. Extracted here for Single Responsibility and to allow
 * different caching strategies from user-scoped exercise queries.
 */

import { asc } from "drizzle-orm"

import { db, schema } from "@/db"
import type { EquipmentItem, ExerciseType, MuscleGroup } from "@/types/domain"

const { muscleGroups, exerciseTypes, equipment } = schema

/**
 * Return all muscle groups ordered by name.
 */
export async function getAllMuscleGroups(): Promise<MuscleGroup[]> {
  const rows = await db
    .select({
      id: muscleGroups.id,
      name: muscleGroups.name,
      slug: muscleGroups.slug,
      parentId: muscleGroups.parentId,
    })
    .from(muscleGroups)
    .orderBy(asc(muscleGroups.name))

  return rows
}

/**
 * Return all exercise types ordered by name.
 */
export async function getAllExerciseTypes(): Promise<ExerciseType[]> {
  const rows = await db
    .select({
      id: exerciseTypes.id,
      name: exerciseTypes.name,
    })
    .from(exerciseTypes)
    .orderBy(asc(exerciseTypes.name))

  return rows
}

/**
 * Return all equipment items ordered by name.
 */
export async function getAllEquipment(): Promise<EquipmentItem[]> {
  const rows = await db
    .select({
      id: equipment.id,
      name: equipment.name,
    })
    .from(equipment)
    .orderBy(asc(equipment.name))

  return rows
}
