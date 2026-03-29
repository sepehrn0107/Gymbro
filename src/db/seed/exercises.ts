import { exercises } from '../schema/exercises'
import { EXERCISE_TYPE_IDS } from './exercise-types'
import { EQUIPMENT_IDS } from './equipment'
import { MUSCLE_GROUP_IDS } from './muscle-groups'

// ── Stable UUIDs ──────────────────────────────────────────────────────────────
// Hardcoded so re-runs are idempotent via ON CONFLICT DO NOTHING.

export const exercisesData = [
  // ── Chest ─────────────────────────────────────────────────────────────────
  {
    id: 'e0000001-0000-0000-0000-000000000001',
    name: 'Barbell Bench Press',
    slug: 'barbell-bench-press',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.BARBELL,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.CHEST,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000002-0000-0000-0000-000000000002',
    name: 'Incline Dumbbell Press',
    slug: 'incline-dumbbell-press',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.DUMBBELL,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.UPPER_CHEST,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000003-0000-0000-0000-000000000003',
    name: 'Push-up',
    slug: 'push-up',
    exerciseTypeId: EXERCISE_TYPE_IDS.BODYWEIGHT,
    equipmentId: EQUIPMENT_IDS.BODYWEIGHT,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.CHEST,
    isGlobal: true,
    userId: null,
  },

  // ── Back ──────────────────────────────────────────────────────────────────
  {
    id: 'e0000004-0000-0000-0000-000000000004',
    name: 'Pull-up',
    slug: 'pull-up',
    exerciseTypeId: EXERCISE_TYPE_IDS.BODYWEIGHT,
    equipmentId: EQUIPMENT_IDS.PULLUP_BAR,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.LATS,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000005-0000-0000-0000-000000000005',
    name: 'Barbell Row',
    slug: 'barbell-row',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.BARBELL,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.LATS,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000006-0000-0000-0000-000000000006',
    name: 'Cable Row',
    slug: 'cable-row',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.CABLE,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.RHOMBOIDS,
    isGlobal: true,
    userId: null,
  },

  // ── Shoulders ─────────────────────────────────────────────────────────────
  {
    id: 'e0000007-0000-0000-0000-000000000007',
    name: 'Overhead Press',
    slug: 'overhead-press',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.BARBELL,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.FRONT_DELTS,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000008-0000-0000-0000-000000000008',
    name: 'Lateral Raise',
    slug: 'lateral-raise',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.DUMBBELL,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.SIDE_DELTS,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000009-0000-0000-0000-000000000009',
    name: 'Face Pull',
    slug: 'face-pull',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.CABLE,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.REAR_DELTS,
    isGlobal: true,
    userId: null,
  },

  // ── Arms ──────────────────────────────────────────────────────────────────
  {
    id: 'e0000010-0000-0000-0000-000000000010',
    name: 'Dumbbell Curl',
    slug: 'dumbbell-curl',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.DUMBBELL,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.BICEPS,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000011-0000-0000-0000-000000000011',
    name: 'Tricep Pushdown',
    slug: 'tricep-pushdown',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.CABLE,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.TRICEPS,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000012-0000-0000-0000-000000000012',
    name: 'Skull Crusher',
    slug: 'skull-crusher',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.BARBELL,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.TRICEPS,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000013-0000-0000-0000-000000000013',
    name: 'Dip',
    slug: 'dip',
    exerciseTypeId: EXERCISE_TYPE_IDS.BODYWEIGHT,
    equipmentId: EQUIPMENT_IDS.DIP_BAR,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.TRICEPS,
    isGlobal: true,
    userId: null,
  },

  // ── Legs ──────────────────────────────────────────────────────────────────
  {
    id: 'e0000014-0000-0000-0000-000000000014',
    name: 'Barbell Squat',
    slug: 'barbell-squat',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.BARBELL,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.QUADRICEPS,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000015-0000-0000-0000-000000000015',
    name: 'Romanian Deadlift',
    slug: 'romanian-deadlift',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.BARBELL,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.HAMSTRINGS,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000016-0000-0000-0000-000000000016',
    name: 'Hip Thrust',
    slug: 'hip-thrust',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.BARBELL,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.GLUTES,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000017-0000-0000-0000-000000000017',
    name: 'Leg Press',
    slug: 'leg-press',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.MACHINE,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.QUADRICEPS,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000018-0000-0000-0000-000000000018',
    name: 'Leg Curl',
    slug: 'leg-curl',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.MACHINE,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.HAMSTRINGS,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000019-0000-0000-0000-000000000019',
    name: 'Calf Raise',
    slug: 'calf-raise',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.MACHINE,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.CALVES,
    isGlobal: true,
    userId: null,
  },

  // ── Full Body ─────────────────────────────────────────────────────────────
  {
    id: 'e0000020-0000-0000-0000-000000000020',
    name: 'Deadlift',
    slug: 'deadlift',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.BARBELL,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.FULL_BODY,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000021-0000-0000-0000-000000000021',
    name: "Farmer's Walk",
    slug: 'farmers-walk',
    exerciseTypeId: EXERCISE_TYPE_IDS.STRENGTH,
    equipmentId: EQUIPMENT_IDS.DUMBBELL,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.FULL_BODY,
    isGlobal: true,
    userId: null,
  },

  // ── Core ──────────────────────────────────────────────────────────────────
  {
    id: 'e0000022-0000-0000-0000-000000000022',
    name: 'Plank',
    slug: 'plank',
    exerciseTypeId: EXERCISE_TYPE_IDS.BODYWEIGHT,
    equipmentId: EQUIPMENT_IDS.BODYWEIGHT,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.ABS,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000023-0000-0000-0000-000000000023',
    name: 'Crunch',
    slug: 'crunch',
    exerciseTypeId: EXERCISE_TYPE_IDS.BODYWEIGHT,
    equipmentId: EQUIPMENT_IDS.BODYWEIGHT,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.ABS,
    isGlobal: true,
    userId: null,
  },

  // ── Cardio ────────────────────────────────────────────────────────────────
  {
    id: 'e0000024-0000-0000-0000-000000000024',
    name: 'Running',
    slug: 'running',
    exerciseTypeId: EXERCISE_TYPE_IDS.CARDIO,
    equipmentId: EQUIPMENT_IDS.BODYWEIGHT,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.FULL_BODY,
    isGlobal: true,
    userId: null,
  },
  {
    id: 'e0000025-0000-0000-0000-000000000025',
    name: 'Cycling',
    slug: 'cycling',
    exerciseTypeId: EXERCISE_TYPE_IDS.CARDIO,
    equipmentId: EQUIPMENT_IDS.MACHINE,
    primaryMuscleGroupId: MUSCLE_GROUP_IDS.FULL_BODY,
    isGlobal: true,
    userId: null,
  },
]

type DbLike = {
  insert: (table: typeof exercises) => {
    values: (
      data: typeof exercisesData,
    ) => { onConflictDoNothing: () => Promise<unknown> }
  }
}

export async function seedExercises(db: DbLike): Promise<void> {
  await db.insert(exercises).values(exercisesData).onConflictDoNothing()
}
