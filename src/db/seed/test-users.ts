import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import * as schema from '../schema'

export async function seedTestUsers(db: NodePgDatabase<typeof schema>) {
  if (process.env.NODE_ENV === 'production') return

  const email = 'admin@admin.com'
  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)

  if (existing) return

  const passwordHash = await bcrypt.hash('admin', 12)
  await db.insert(schema.users).values({
    email,
    passwordHash,
    displayName: 'admin',
    emailVerified: new Date(),
  })
}
