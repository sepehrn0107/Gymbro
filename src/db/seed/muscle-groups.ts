import { muscleGroups } from '../schema/exercises'

// ── Stable UUIDs ──────────────────────────────────────────────────────────────
// All UUIDs are hardcoded so re-runs are idempotent via ON CONFLICT DO NOTHING.

// Level 1 — Root muscle groups
const UPPER_BODY_ID = '11111111-1111-1111-1111-111111111001'
const LOWER_BODY_ID = '11111111-1111-1111-1111-111111111002'
const CORE_ID = '11111111-1111-1111-1111-111111111003'
const FULL_BODY_ID = '11111111-1111-1111-1111-111111111004'

// Level 2 — Sub-groups
const CHEST_ID = '22222222-2222-2222-2222-222222222001'
const BACK_ID = '22222222-2222-2222-2222-222222222002'
const SHOULDERS_ID = '22222222-2222-2222-2222-222222222003'
const ARMS_ID = '22222222-2222-2222-2222-222222222004'
const QUADRICEPS_ID = '22222222-2222-2222-2222-222222222005'
const HAMSTRINGS_ID = '22222222-2222-2222-2222-222222222006'
const GLUTES_ID = '22222222-2222-2222-2222-222222222007'
const CALVES_ID = '22222222-2222-2222-2222-222222222008'
const ABS_ID = '22222222-2222-2222-2222-222222222009'
const OBLIQUES_ID = '22222222-2222-2222-2222-222222222010'
const LOWER_BACK_ID = '22222222-2222-2222-2222-222222222011'

// Level 3 — Specific muscles
const UPPER_CHEST_ID = '33333333-3333-3333-3333-333333333001'
const LOWER_CHEST_ID = '33333333-3333-3333-3333-333333333002'
const LATS_ID = '33333333-3333-3333-3333-333333333003'
const TRAPS_ID = '33333333-3333-3333-3333-333333333004'
const RHOMBOIDS_ID = '33333333-3333-3333-3333-333333333005'
const FRONT_DELTS_ID = '33333333-3333-3333-3333-333333333006'
const SIDE_DELTS_ID = '33333333-3333-3333-3333-333333333007'
const REAR_DELTS_ID = '33333333-3333-3333-3333-333333333008'
const BICEPS_ID = '33333333-3333-3333-3333-333333333009'
const TRICEPS_ID = '33333333-3333-3333-3333-333333333010'
const FOREARMS_ID = '33333333-3333-3333-3333-333333333011'

// ── Exported IDs for use in exercises seed ────────────────────────────────────
export const MUSCLE_GROUP_IDS = {
  UPPER_BODY: UPPER_BODY_ID,
  LOWER_BODY: LOWER_BODY_ID,
  CORE: CORE_ID,
  FULL_BODY: FULL_BODY_ID,
  CHEST: CHEST_ID,
  BACK: BACK_ID,
  SHOULDERS: SHOULDERS_ID,
  ARMS: ARMS_ID,
  QUADRICEPS: QUADRICEPS_ID,
  HAMSTRINGS: HAMSTRINGS_ID,
  GLUTES: GLUTES_ID,
  CALVES: CALVES_ID,
  ABS: ABS_ID,
  OBLIQUES: OBLIQUES_ID,
  LOWER_BACK: LOWER_BACK_ID,
  UPPER_CHEST: UPPER_CHEST_ID,
  LOWER_CHEST: LOWER_CHEST_ID,
  LATS: LATS_ID,
  TRAPS: TRAPS_ID,
  RHOMBOIDS: RHOMBOIDS_ID,
  FRONT_DELTS: FRONT_DELTS_ID,
  SIDE_DELTS: SIDE_DELTS_ID,
  REAR_DELTS: REAR_DELTS_ID,
  BICEPS: BICEPS_ID,
  TRICEPS: TRICEPS_ID,
  FOREARMS: FOREARMS_ID,
}

export const muscleGroupsData = [
  // ── Level 1: Root groups ─────────────────────────────────────────────────
  { id: UPPER_BODY_ID, name: 'Upper Body', slug: 'upper-body', parentId: null },
  { id: LOWER_BODY_ID, name: 'Lower Body', slug: 'lower-body', parentId: null },
  { id: CORE_ID, name: 'Core', slug: 'core', parentId: null },
  { id: FULL_BODY_ID, name: 'Full Body', slug: 'full-body', parentId: null },

  // ── Level 2: Sub-groups (Upper Body) ─────────────────────────────────────
  { id: CHEST_ID, name: 'Chest', slug: 'chest', parentId: UPPER_BODY_ID },
  { id: BACK_ID, name: 'Back', slug: 'back', parentId: UPPER_BODY_ID },
  { id: SHOULDERS_ID, name: 'Shoulders', slug: 'shoulders', parentId: UPPER_BODY_ID },
  { id: ARMS_ID, name: 'Arms', slug: 'arms', parentId: UPPER_BODY_ID },

  // ── Level 2: Sub-groups (Lower Body) ─────────────────────────────────────
  { id: QUADRICEPS_ID, name: 'Quadriceps', slug: 'quadriceps', parentId: LOWER_BODY_ID },
  { id: HAMSTRINGS_ID, name: 'Hamstrings', slug: 'hamstrings', parentId: LOWER_BODY_ID },
  { id: GLUTES_ID, name: 'Glutes', slug: 'glutes', parentId: LOWER_BODY_ID },
  { id: CALVES_ID, name: 'Calves', slug: 'calves', parentId: LOWER_BODY_ID },

  // ── Level 2: Sub-groups (Core) ───────────────────────────────────────────
  { id: ABS_ID, name: 'Abs', slug: 'abs', parentId: CORE_ID },
  { id: OBLIQUES_ID, name: 'Obliques', slug: 'obliques', parentId: CORE_ID },
  { id: LOWER_BACK_ID, name: 'Lower Back', slug: 'lower-back', parentId: CORE_ID },

  // ── Level 3: Specific muscles (Chest) ────────────────────────────────────
  { id: UPPER_CHEST_ID, name: 'Upper Chest', slug: 'upper-chest', parentId: CHEST_ID },
  { id: LOWER_CHEST_ID, name: 'Lower Chest', slug: 'lower-chest', parentId: CHEST_ID },

  // ── Level 3: Specific muscles (Back) ─────────────────────────────────────
  { id: LATS_ID, name: 'Lats', slug: 'lats', parentId: BACK_ID },
  { id: TRAPS_ID, name: 'Traps', slug: 'traps', parentId: BACK_ID },
  { id: RHOMBOIDS_ID, name: 'Rhomboids', slug: 'rhomboids', parentId: BACK_ID },

  // ── Level 3: Specific muscles (Shoulders) ────────────────────────────────
  { id: FRONT_DELTS_ID, name: 'Front Delts', slug: 'front-delts', parentId: SHOULDERS_ID },
  { id: SIDE_DELTS_ID, name: 'Side Delts', slug: 'side-delts', parentId: SHOULDERS_ID },
  { id: REAR_DELTS_ID, name: 'Rear Delts', slug: 'rear-delts', parentId: SHOULDERS_ID },

  // ── Level 3: Specific muscles (Arms) ─────────────────────────────────────
  { id: BICEPS_ID, name: 'Biceps', slug: 'biceps', parentId: ARMS_ID },
  { id: TRICEPS_ID, name: 'Triceps', slug: 'triceps', parentId: ARMS_ID },
  { id: FOREARMS_ID, name: 'Forearms', slug: 'forearms', parentId: ARMS_ID },
]

type DbLike = {
  insert: (table: typeof muscleGroups) => {
    values: (
      data: typeof muscleGroupsData,
    ) => { onConflictDoNothing: () => Promise<unknown> }
  }
}

export async function seedMuscleGroups(db: DbLike): Promise<void> {
  await db.insert(muscleGroups).values(muscleGroupsData).onConflictDoNothing()
}
