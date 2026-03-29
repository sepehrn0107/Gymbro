import {
  pgTable,
  text,
  uuid,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './auth'

// ── otp_tokens ────────────────────────────────────────────────────────────────
// Dedicated OTP table — decoupled from Auth.js's verificationToken table.
// Supports both pre-registration email verification (userId = null) and
// password-reset flows (userId present).
export const otpTokens = pgTable(
  'otp_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    // Nullable: pre-registration OTPs are issued before a user row exists
    userId: uuid('userId').references(() => users.id, { onDelete: 'cascade' }),
    // Discriminator: "email_verification" | "password_reset"
    type: text('type').notNull(),
    code: text('code').notNull(),
    expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
    // Null until the token is redeemed — prevents double-use
    usedAt: timestamp('usedAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    // Index enables efficient cleanup of expired tokens
    expiresAtIdx: index('otp_tokens_expires_at_idx').on(table.expiresAt),
  }),
)
