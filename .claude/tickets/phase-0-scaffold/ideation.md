# Ideation Report

## Summary

Phase 0 establishes the complete infrastructure foundation for GymBro: a Next.js 15 App Router app with TypeScript, Tailwind CSS, Barlow fonts, and Lucide React; a Dockerized PostgreSQL database with Drizzle ORM schema and migrations; Auth.js v5 with Google OAuth and Credentials (database sessions), plus custom email OTP flows for verification, forgot/reset password, and authenticated change-password; and a seed script for ~80 global exercises with all lookup tables. No UI features are built in this phase — only the plumbing that every subsequent phase depends on. Getting this right is critical because schema changes after Phase 1 are expensive to migrate.

---

## Key design questions answered

- **Auth.js v5 Credentials + Google in the same app**: Both providers are supported; the Drizzle adapter is used so sessions and accounts land in the database. `session.strategy = "database"` is required (ADR-004). Email/password users are stored with a bcrypt-hashed password column on `users`; Google OAuth users have no password.

- **OTP flows are custom, not Auth.js magic links**: Auth.js v5 does not ship an OTP/email-code flow out of the box. The verification, forgot-password, and reset-password flows are implemented as custom Route Handlers that generate and store short-lived numeric codes in an `otp_tokens` table (or equivalent), then verify them on submission. Auth.js `signIn` is only called after the code is confirmed.

- **`otp_tokens` table is part of the schema**: A dedicated table (`otp_tokens`) stores `(userId | email, type: "email_verification"|"password_reset", code, expiresAt, usedAt)`; not reusing Auth.js `verification_tokens` because that table has a different semantic contract and the Drizzle adapter manages it independently.

- **Hierarchical `muscle_groups`**: Implemented as a self-referencing table (`id`, `name`, `parentId → muscle_groups.id`). Depth is fixed at 3 levels (e.g. Upper Body → Arms → Biceps) for MVP. Circular reference prevention is an application-layer concern (not a DB constraint in this phase).

- **`exercises` global vs user-scoped**: `is_global` boolean column. Global exercises are seeded; user-created exercises have `userId` set. No promotion path in MVP (ADR resolved).

- **Password column on `users`**: Auth.js Drizzle adapter creates the `users` table; we extend it with `passwordHash text` (nullable — Google OAuth users have no password), `emailVerified timestamp` (already managed by Auth.js adapter), and profile fields (`displayName`, `age`, `bodyWeight`, `height`, `unitPreference`).

- **Database sessions (not JWT)**: `session.strategy = "database"` stores sessions in the `sessions` table managed by the Drizzle adapter. No JWT secret needed; `AUTH_SECRET` is used for CSRF/cookie signing only.

- **Docker Compose for local development**: `docker-compose.yml` runs only PostgreSQL. The Next.js dev server runs on the host (not containerized) for hot reload simplicity. A `Dockerfile` exists for production builds.

- **Environment variables**: Two `.env` files — `.env.local` (local dev, git-ignored) and `.env.example` (committed). Variables include `DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `EMAIL_FROM`, and SMTP credentials.

- **Migration strategy**: `drizzle-kit generate` produces SQL migration files in `src/db/migrations/`. The seed script runs after migrations via a separate `npm run db:seed` command. CI/production applies migrations with `drizzle-kit migrate`.

- **`exercise_secondary_muscles` junction**: Composite PK on `(exerciseId, muscleGroupId)`. Seeded alongside exercises.

- **`sets` rich fields**: `reps integer`, `weight numeric(8,3)` (nullable for bodyweight), `setType text` (normal|warmup|drop|failure), `duration integer` (seconds, nullable for non-cardio), `restTime integer` (seconds), `rpe integer` (1–10, nullable).

- **Barlow fonts via `next/font`**: Loaded in `layout.tsx` using `next/font/google` for zero-CLS, self-hosted font delivery.

---

## Risks and edge cases

- **Auth.js v5 is still in active development**: API surface changed significantly from v4. The Drizzle adapter (`@auth/drizzle-adapter`) must match the exact `next-auth` v5 beta version pinned in `package.json`. Mismatched versions cause silent session failures. Pin both together and lock the lockfile.

- **Custom OTP + Auth.js session handoff**: After OTP verification the handler must call `auth()` or redirect to a sign-in flow — it cannot directly create an Auth.js session from a Route Handler without going through `signIn()`. This means post-OTP the user is redirected to a "now sign in" step, OR the OTP verification endpoint uses `signIn("credentials", ...)` internally. The latter is cleaner UX but requires the credentials provider to also accept a token-verified mode, which is non-standard. Decision: verify OTP in a Route Handler, mark the user as verified in DB, then redirect to `/login` with a `?verified=1` query param — no auto-sign-in. This is the safest approach.

- **Google OAuth users have no password**: The "change password" route must guard against Google-only accounts (no `passwordHash`). Return a clear error (`"OAuth accounts cannot set a local password"`) rather than silently failing.

- **`emailVerified` owned by Auth.js adapter**: The adapter writes to `users.emailVerified`. Our OTP verification flow must also write to this column (not a separate `isVerified` column) so Auth.js respects it in callbacks. Drizzle schema must match the adapter's expected column name exactly.

- **Seed idempotency**: The seed script must be safe to re-run (upsert, not insert). Using `onConflictDoNothing()` or `onConflictDoUpdate()` for all seeded rows. This prevents duplicate-key errors if seed is run multiple times in dev.

- **Migration file naming collisions**: If two developers generate migrations simultaneously they get the same timestamp prefix. Establish a convention: always regenerate from a clean state and commit migration files atomically.

- **`DATABASE_URL` in Docker vs host**: When running Next.js on the host and Postgres in Docker, `DATABASE_URL` must use `localhost:5432` (not the Docker service name `postgres:5432`). Document this clearly in `.env.example`.

- **bcrypt cost factor**: bcrypt with cost 12 adds ~250ms per hash on a typical server. Acceptable for login/registration but must not be used in hot paths. Confirm bcrypt is only called in auth flows.

- **`otp_tokens` cleanup**: Expired/used tokens accumulate. A `WHERE expiresAt < NOW()` cleanup job is out of scope for MVP but the table design should include an index on `expiresAt` for efficient future cleanup.

- **TypeScript strict mode**: Enabling `strict: true` in `tsconfig.json` from day one avoids technical debt. Relaxing it later is much harder than enabling it early.

- **App Router + Auth.js middleware**: The `middleware.ts` matcher must exclude `/api/auth/[...nextauth]` and static assets. Misconfigured matchers cause auth redirect loops on API routes.

---

## Recommended scope

**In scope:**
- `create-next-app` bootstrap with TypeScript, Tailwind CSS, App Router, `src/` directory
- Barlow + Barlow Condensed via `next/font/google` in root `layout.tsx`
- Lucide React installed as a dependency
- `docker-compose.yml` with PostgreSQL service, named volume, health check
- `Dockerfile` (multi-stage: deps → builder → runner) for production
- `drizzle.config.ts` pointing to `src/db/migrations/`
- Drizzle client singleton at `src/db/index.ts`
- Full schema in `src/db/schema/`: `users`, `accounts`, `sessions`, `verification_tokens` (Auth.js adapter tables), `otp_tokens`, `muscle_groups`, `exercise_types`, `equipment`, `exercises`, `exercise_secondary_muscles`, `workouts`, `workout_exercises`, `sets`
- Relations defined with Drizzle `relations()` for all FK links
- Initial migration generated and committed
- Auth.js v5 config at `src/lib/auth.ts`: Credentials provider + Google provider, Drizzle adapter, `strategy: "database"`
- `src/lib/auth-helpers.ts`: `requireSession()`, `getCurrentUserId()`
- Route Handlers for OTP flows: `POST /api/auth/verify-email`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/change-password`
- `middleware.ts` with protected route matcher
- Seed script at `src/db/seed/index.ts`: muscle_groups (3-level hierarchy), exercise_types, equipment, ~80 global exercises with secondary muscles
- `npm` scripts: `db:generate`, `db:migrate`, `db:seed`, `db:studio`
- `.env.example` with all required variable names and descriptions
- `src/types/domain.ts`: enums (`WorkoutStatus`, `SetType`, `UnitPreference`, `ExerciseType`, `OtpType`)
- `src/lib/api-response.ts`: `ok()` and `err()` response helpers
- `src/lib/errors.ts`: `AppError` base class + `NotFoundError`, `UnauthorizedError`, `ConflictError`, `ValidationError`
- `src/lib/units.ts`: `kgToLb`, `lbToKg`, `formatWeight`
- `tsconfig.json` with `strict: true`, `baseUrl: "."`, path aliases (`@/*` → `src/*`)
- ESLint + Prettier config (Next.js defaults + Tailwind plugin)
- Empty placeholder page for `(auth)/login` so the app boots without 404
- Directory structure matching `architecture.md` (empty placeholder files where needed)

**Out of scope:**
- Any UI pages beyond the minimal login placeholder (those are Phase 1+)
- Email sending implementation (SMTP/Resend client) — scaffold the interface but mock the actual send for now
- Recharts installation (Phase 3 concern)
- Offline queue / service worker / PWA manifest (Phase 4)
- Rate limiting on auth endpoints (Phase 4)
- CI/CD pipeline (Phase 4)
- Custom exercise creation UI (Phase 1)
- Any Route Handlers outside of auth flows
- `useActiveWorkout`, `useLastSession`, `useOfflineQueue` hooks (Phase 2)
- Component library implementation beyond stub files

---

## Files/areas likely to be touched

```
gymbro/
├── src/
│   ├── app/
│   │   ├── layout.tsx                          ← root layout, Barlow fonts, dark bg
│   │   ├── (auth)/
│   │   │   └── login/page.tsx                  ← stub page (app boots clean)
│   │   └── api/
│   │       └── auth/
│   │           ├── [...nextauth]/route.ts       ← Auth.js handler
│   │           ├── verify-email/route.ts        ← OTP email verification
│   │           ├── forgot-password/route.ts     ← issue reset OTP
│   │           ├── reset-password/route.ts      ← consume reset OTP
│   │           └── change-password/route.ts     ← authenticated change
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema/
│   │   │   ├── auth.ts                         ← users, accounts, sessions, verification_tokens
│   │   │   ├── otp.ts                          ← otp_tokens
│   │   │   ├── exercises.ts                    ← muscle_groups, exercise_types, equipment, exercises, exercise_secondary_muscles
│   │   │   ├── workouts.ts                     ← workouts, workout_exercises, sets
│   │   │   └── index.ts                        ← re-export all + relations
│   │   ├── migrations/                         ← generated SQL (committed)
│   │   └── seed/
│   │       ├── index.ts
│   │       ├── muscle-groups.ts
│   │       ├── exercise-types.ts
│   │       ├── equipment.ts
│   │       └── exercises.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── auth-helpers.ts
│   │   ├── api-response.ts
│   │   ├── errors.ts
│   │   ├── units.ts
│   │   └── email.ts                            ← stubbed send interface
│   └── types/
│       ├── domain.ts
│       └── api.ts
├── middleware.ts
├── docker-compose.yml
├── Dockerfile
├── drizzle.config.ts
├── .env.example
├── .env.local                                  ← git-ignored
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.ts
├── package.json
└── .eslintrc.json / eslint.config.mjs
```

---

## ADR needed?

**Yes — one new ADR is warranted:**

**ADR-006: Custom OTP table over Auth.js `verification_tokens` for email flows**
The Auth.js Drizzle adapter owns the `verification_tokens` table and uses it for its own magic-link mechanism. Storing GymBro's custom email verification and password-reset codes there would couple application logic to Auth.js internals and break if the adapter schema changes. A dedicated `otp_tokens` table with explicit `type`, `expiresAt`, and `usedAt` columns gives full control and clear semantics.

(ADR-005 should also be created to record the `next/font` + Barlow decision if not already present, but it is minor and can be captured as a note in stack.md instead.)
