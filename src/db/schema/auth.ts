import {
  pgTable,
  text,
  uuid,
  integer,
  numeric,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core'

// ── users ─────────────────────────────────────────────────────────────────────
// Column names must match @auth/drizzle-adapter exactly.
// Application-specific columns are appended after the adapter-required columns.
export const users = pgTable('users', {
  // --- Auth.js adapter columns (do not rename) ---
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }), // NOT timestamptz — adapter requirement
  image: text('image'),

  // --- Application columns ---
  passwordHash: text('passwordHash'),
  displayName: text('displayName'),
  unitPreference: text('unitPreference').default('metric').notNull(),
  age: integer('age'),
  bodyWeight: numeric('bodyWeight', { precision: 8, scale: 3 }),
  height: numeric('height', { precision: 6, scale: 2 }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
})

// ── accounts ──────────────────────────────────────────────────────────────────
// OAuth provider accounts — column names must match @auth/drizzle-adapter exactly.
export const accounts = pgTable('accounts', {
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  pk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
}))

// ── sessions ──────────────────────────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

// ── verificationTokens ────────────────────────────────────────────────────────
// Used by Auth.js for magic-link / email verification tokens.
// Column names must match @auth/drizzle-adapter exactly.
export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  pk: primaryKey({ columns: [vt.identifier, vt.token] }),
}))
