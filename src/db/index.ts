import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Module-level singleton with global guard for Next.js hot-reload safety.
// Without this guard, every hot reload in dev creates a new Pool and exhausts
// the connection limit. The globalThis object persists across module re-evaluations
// in the same Node.js process.
declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined
  // eslint-disable-next-line no-var
  var __pool: Pool | undefined
}

function createDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
  })
  return { pool, db: drizzle(pool, { schema }) }
}

let db: ReturnType<typeof drizzle<typeof schema>>

if (process.env.NODE_ENV === 'production') {
  const instance = createDb()
  db = instance.db
} else {
  // In development, reuse the existing connection across hot reloads
  if (!globalThis.__db) {
    const instance = createDb()
    globalThis.__pool = instance.pool
    globalThis.__db = instance.db
  }
  db = globalThis.__db
}

export { db }
export * as schema from './schema'
