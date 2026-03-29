import { exerciseTypes } from '../schema/exercises'

// ── Stable UUIDs ──────────────────────────────────────────────────────────────
// Hardcoded so re-runs are idempotent via ON CONFLICT DO NOTHING.
const STRENGTH_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const CARDIO_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const FLEXIBILITY_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
const BODYWEIGHT_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd'

// ── Exported IDs for use in exercises seed ────────────────────────────────────
export const EXERCISE_TYPE_IDS = {
  STRENGTH: STRENGTH_ID,
  CARDIO: CARDIO_ID,
  FLEXIBILITY: FLEXIBILITY_ID,
  BODYWEIGHT: BODYWEIGHT_ID,
}

export const exerciseTypesData = [
  { id: STRENGTH_ID, name: 'strength' },
  { id: CARDIO_ID, name: 'cardio' },
  { id: FLEXIBILITY_ID, name: 'flexibility' },
  { id: BODYWEIGHT_ID, name: 'bodyweight' },
]

type DbLike = {
  insert: (table: typeof exerciseTypes) => {
    values: (
      data: typeof exerciseTypesData,
    ) => { onConflictDoNothing: () => Promise<unknown> }
  }
}

export async function seedExerciseTypes(db: DbLike): Promise<void> {
  await db.insert(exerciseTypes).values(exerciseTypesData).onConflictDoNothing()
}
