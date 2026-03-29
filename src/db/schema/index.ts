import { relations } from 'drizzle-orm'

// ── Table re-exports ───────────────────────────────────────────────────────────
// All tables are exported from this barrel so Drizzle's relational query API
// (db.query.*) can access them via the single schema object passed to drizzle().
export { users, accounts, sessions, verificationTokens } from './auth'
export { otpTokens } from './otp'
export {
  muscleGroups,
  exerciseTypes,
  equipment,
  exercises,
  exerciseSecondaryMuscles,
} from './exercises'
export { workouts, workoutExercises, sets } from './workouts'

// ── Imports for relation definitions ──────────────────────────────────────────
// Relations are defined centrally here (not in each schema file) to avoid
// circular imports — each domain file only imports its direct FK dependencies.
import { users, accounts, sessions } from './auth'
import { otpTokens } from './otp'
import {
  muscleGroups,
  exerciseTypes,
  equipment,
  exercises,
  exerciseSecondaryMuscles,
} from './exercises'
import { workouts, workoutExercises, sets } from './workouts'

// ── users ──────────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  otpTokens: many(otpTokens),
  workouts: many(workouts),
  // Custom exercises created by this user (isGlobal = false)
  exercises: many(exercises),
}))

// ── accounts ───────────────────────────────────────────────────────────────────
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

// ── sessions ───────────────────────────────────────────────────────────────────
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

// ── otpTokens ──────────────────────────────────────────────────────────────────
export const otpTokensRelations = relations(otpTokens, ({ one }) => ({
  user: one(users, {
    fields: [otpTokens.userId],
    references: [users.id],
  }),
}))

// ── muscleGroups ───────────────────────────────────────────────────────────────
export const muscleGroupsRelations = relations(muscleGroups, ({ one, many }) => ({
  // Self-referential: parent node (null for root-level groups)
  parent: one(muscleGroups, {
    fields: [muscleGroups.parentId],
    references: [muscleGroups.id],
    relationName: 'muscleGroupHierarchy',
  }),
  // Self-referential: child nodes
  children: many(muscleGroups, {
    relationName: 'muscleGroupHierarchy',
  }),
  // Exercises for which this is the primary muscle group
  primaryExercises: many(exercises, {
    relationName: 'primaryMuscle',
  }),
  // Junction rows that reference this muscle group as a secondary target
  secondaryExerciseMuscles: many(exerciseSecondaryMuscles),
}))

// ── exerciseTypes ──────────────────────────────────────────────────────────────
export const exerciseTypesRelations = relations(exerciseTypes, ({ many }) => ({
  exercises: many(exercises),
}))

// ── equipment ──────────────────────────────────────────────────────────────────
export const equipmentRelations = relations(equipment, ({ many }) => ({
  exercises: many(exercises),
}))

// ── exercises ──────────────────────────────────────────────────────────────────
export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  exerciseType: one(exerciseTypes, {
    fields: [exercises.exerciseTypeId],
    references: [exerciseTypes.id],
  }),
  equipment: one(equipment, {
    fields: [exercises.equipmentId],
    references: [equipment.id],
  }),
  primaryMuscleGroup: one(muscleGroups, {
    fields: [exercises.primaryMuscleGroupId],
    references: [muscleGroups.id],
    relationName: 'primaryMuscle',
  }),
  secondaryMuscles: many(exerciseSecondaryMuscles),
  workoutExercises: many(workoutExercises),
  // User who created this exercise (null for global exercises)
  user: one(users, {
    fields: [exercises.userId],
    references: [users.id],
  }),
}))

// ── exerciseSecondaryMuscles ───────────────────────────────────────────────────
export const exerciseSecondaryMusclesRelations = relations(
  exerciseSecondaryMuscles,
  ({ one }) => ({
    exercise: one(exercises, {
      fields: [exerciseSecondaryMuscles.exerciseId],
      references: [exercises.id],
    }),
    muscleGroup: one(muscleGroups, {
      fields: [exerciseSecondaryMuscles.muscleGroupId],
      references: [muscleGroups.id],
    }),
  }),
)

// ── workouts ───────────────────────────────────────────────────────────────────
export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id],
  }),
  workoutExercises: many(workoutExercises),
}))

// ── workoutExercises ───────────────────────────────────────────────────────────
export const workoutExercisesRelations = relations(
  workoutExercises,
  ({ one, many }) => ({
    workout: one(workouts, {
      fields: [workoutExercises.workoutId],
      references: [workouts.id],
    }),
    exercise: one(exercises, {
      fields: [workoutExercises.exerciseId],
      references: [exercises.id],
    }),
    sets: many(sets),
  }),
)

// ── sets ───────────────────────────────────────────────────────────────────────
export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}))
