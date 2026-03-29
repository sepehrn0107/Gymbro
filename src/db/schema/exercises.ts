import {
  pgTable,
  text,
  uuid,
  boolean,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { users } from './auth'

// ── muscle_groups ──────────────────────────────────────────────────────────────
// Self-referential hierarchy (max 3 levels enforced at application layer):
//   Level 1: Upper Body, Lower Body, Core
//   Level 2: Arms, Chest, Back, …
//   Level 3: Biceps, Triceps, …
export const muscleGroups = pgTable('muscle_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  // Null for root-level nodes
  parentId: uuid('parentId').references((): ReturnType<typeof uuid> => muscleGroups.id, {
    onDelete: 'set null',
  }),
})

// ── exercise_types ─────────────────────────────────────────────────────────────
// Lookup table: "strength", "cardio", "flexibility", "bodyweight"
export const exerciseTypes = pgTable('exercise_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
})

// ── equipment ──────────────────────────────────────────────────────────────────
// Lookup table: "barbell", "dumbbell", "cable", "bodyweight", …
export const equipment = pgTable('equipment', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
})

// ── exercises ─────────────────────────────────────────────────────────────────
// isGlobal = true  → seeded, shared by all users
// isGlobal = false → user-created (userId is set)
export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  exerciseTypeId: uuid('exerciseTypeId')
    .notNull()
    .references(() => exerciseTypes.id, { onDelete: 'restrict' }),
  equipmentId: uuid('equipmentId').references(() => equipment.id, {
    onDelete: 'set null',
  }),
  primaryMuscleGroupId: uuid('primaryMuscleGroupId').references(
    () => muscleGroups.id,
    { onDelete: 'set null' },
  ),
  instructions: text('instructions'),
  isGlobal: boolean('isGlobal').default(true).notNull(),
  // Null for global exercises; set for user-created exercises
  userId: uuid('userId').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
})

// ── exercise_secondary_muscles ─────────────────────────────────────────────────
// Junction table — composite PK enforces uniqueness without a surrogate key.
export const exerciseSecondaryMuscles = pgTable(
  'exercise_secondary_muscles',
  {
    exerciseId: uuid('exerciseId')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    muscleGroupId: uuid('muscleGroupId')
      .notNull()
      .references(() => muscleGroups.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.exerciseId, t.muscleGroupId] }),
  }),
)
