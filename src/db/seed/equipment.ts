import { equipment } from '../schema/exercises'

// ── Stable UUIDs ──────────────────────────────────────────────────────────────
// Hardcoded so re-runs are idempotent via ON CONFLICT DO NOTHING.
const BARBELL_ID = 'ee000001-ee00-ee00-ee00-ee0000000001'
const DUMBBELL_ID = 'ee000002-ee00-ee00-ee00-ee0000000002'
const CABLE_ID = 'ee000003-ee00-ee00-ee00-ee0000000003'
const MACHINE_ID = 'ee000004-ee00-ee00-ee00-ee0000000004'
const RESISTANCE_BAND_ID = 'ee000005-ee00-ee00-ee00-ee0000000005'
const KETTLEBELL_ID = 'ee000006-ee00-ee00-ee00-ee0000000006'
const BODYWEIGHT_EQUIP_ID = 'ee000007-ee00-ee00-ee00-ee0000000007'
const PULLUP_BAR_ID = 'ee000008-ee00-ee00-ee00-ee0000000008'
const BENCH_ID = 'ee000009-ee00-ee00-ee00-ee0000000009'
const DIP_BAR_ID = 'ee000010-ee00-ee00-ee00-ee0000000010'
const SMITH_MACHINE_ID = 'ee000011-ee00-ee00-ee00-ee0000000011'
const TRAP_BAR_ID = 'ee000012-ee00-ee00-ee00-ee0000000012'

// ── Exported IDs for use in exercises seed ────────────────────────────────────
export const EQUIPMENT_IDS = {
  BARBELL: BARBELL_ID,
  DUMBBELL: DUMBBELL_ID,
  CABLE: CABLE_ID,
  MACHINE: MACHINE_ID,
  RESISTANCE_BAND: RESISTANCE_BAND_ID,
  KETTLEBELL: KETTLEBELL_ID,
  BODYWEIGHT: BODYWEIGHT_EQUIP_ID,
  PULLUP_BAR: PULLUP_BAR_ID,
  BENCH: BENCH_ID,
  DIP_BAR: DIP_BAR_ID,
  SMITH_MACHINE: SMITH_MACHINE_ID,
  TRAP_BAR: TRAP_BAR_ID,
}

export const equipmentData = [
  { id: BARBELL_ID, name: 'Barbell' },
  { id: DUMBBELL_ID, name: 'Dumbbell' },
  { id: CABLE_ID, name: 'Cable' },
  { id: MACHINE_ID, name: 'Machine' },
  { id: RESISTANCE_BAND_ID, name: 'Resistance Band' },
  { id: KETTLEBELL_ID, name: 'Kettlebell' },
  { id: BODYWEIGHT_EQUIP_ID, name: 'Bodyweight' },
  { id: PULLUP_BAR_ID, name: 'Pull-up Bar' },
  { id: BENCH_ID, name: 'Bench' },
  { id: DIP_BAR_ID, name: 'Dip Bar' },
  { id: SMITH_MACHINE_ID, name: 'Smith Machine' },
  { id: TRAP_BAR_ID, name: 'Trap Bar' },
]

type DbLike = {
  insert: (table: typeof equipment) => {
    values: (
      data: typeof equipmentData,
    ) => { onConflictDoNothing: () => Promise<unknown> }
  }
}

export async function seedEquipment(db: DbLike): Promise<void> {
  await db.insert(equipment).values(equipmentData).onConflictDoNothing()
}
