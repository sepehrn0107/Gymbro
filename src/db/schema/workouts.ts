import {
  pgTable,
  text,
  uuid,
  integer,
  numeric,
  timestamp,
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { exercises } from './exercises'

// ── workouts ───────────────────────────────────────────────────────────────────
// status: "active" (in progress) | "completed" | "abandoned"
export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name'),
  // Application must validate: "active" | "completed" | "abandoned"
  status: text('status').notNull().default('active'),
  notes: text('notes'),
  // Total workout duration in seconds — populated on completion
  totalDuration: integer('totalDuration'),
  startedAt: timestamp('startedAt', { mode: 'date' }).defaultNow().notNull(),
  completedAt: timestamp('completedAt', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
})

// ── workout_exercises ──────────────────────────────────────────────────────────
// Ordered list of exercises within a workout session.
export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutId: uuid('workoutId')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exerciseId')
    .notNull()
    .references(() => exercises.id, { onDelete: 'restrict' }),
  // Display order within the workout — supports user reordering
  order: integer('order').notNull(),
  notes: text('notes'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
})

// ── sets ───────────────────────────────────────────────────────────────────────
// Individual sets within a workout exercise.
// weight is always stored in kg (convert to lbs on display only).
// setType: "normal" | "warmup" | "drop" | "failure"
export const sets = pgTable('sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutExerciseId: uuid('workoutExerciseId')
    .notNull()
    .references(() => workoutExercises.id, { onDelete: 'cascade' }),
  // Display order within the exercise — supports user reordering
  order: integer('order').notNull(),
  reps: integer('reps'),
  // Stored in kg — numeric(8,3) supports up to 99999.999 kg
  weight: numeric('weight', { precision: 8, scale: 3 }),
  // Duration in seconds — for timed sets (planks, holds, cardio intervals)
  duration: integer('duration'),
  // Rest time after this set, in seconds
  restTime: integer('restTime'),
  // Rate of Perceived Exertion — application must validate range 1–10
  rpe: integer('rpe'),
  // Application must validate: "normal" | "warmup" | "drop" | "failure"
  setType: text('setType').notNull().default('normal'),
  completedAt: timestamp('completedAt', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
})
