/**
 * Main seed runner.
 *
 * Run with:
 *   npx tsx src/db/seed/index.ts
 *
 * Order matters — FK dependencies must be seeded first:
 *   exerciseTypes → equipment → muscleGroups → exercises
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../schema'
import { seedExerciseTypes } from './exercise-types'
import { seedEquipment } from './equipment'
import { seedMuscleGroups } from './muscle-groups'
import { seedExercises } from './exercises'
import { seedTestUsers } from './test-users'

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const pool = new Pool({ connectionString: databaseUrl })
  const db = drizzle(pool, { schema })

  try {
    console.log('Seeding exercise types...')
    await seedExerciseTypes(db)
    console.log('  Exercise types seeded.')

    console.log('Seeding equipment...')
    await seedEquipment(db)
    console.log('  Equipment seeded.')

    console.log('Seeding muscle groups...')
    await seedMuscleGroups(db)
    console.log('  Muscle groups seeded.')

    console.log('Seeding exercises...')
    await seedExercises(db)
    console.log('  Exercises seeded.')

    console.log('Seeding test users...')
    await seedTestUsers(db)
    console.log('  Test users seeded.')

    console.log('Seed complete.')
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
