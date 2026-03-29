# Plan

## Implementation steps

### Step 1 — Project bootstrap
- **File**: `gymbro/` (root, created by `create-next-app`)
- **Change**: Run `npx create-next-app@latest gymbro --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git` to generate the project skeleton with App Router, TypeScript, Tailwind, and `src/` directory layout.
- **Why**: Establishes the canonical Next.js 15 project structure that all subsequent files build on. Using `create-next-app` ensures `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, and `tsconfig.json` are generated consistently and correctly.

### Step 2 — `tsconfig.json` hardening
- **File**: `tsconfig.json`
- **Change**: Confirm `"strict": true` is set (create-next-app sets this by default in recent versions). Add `"baseUrl": "."` and verify `"paths": { "@/*": ["./src/*"] }` is present. These must be set before any source file is written.
- **Why**: Enabling strict TypeScript from day one prevents an entire class of type errors that would be expensive to fix retroactively. Path aliases make imports refactor-safe across the entire project.

### Step 3 — Install dependencies
- **File**: `package.json`
- **Change**: Install runtime deps: `drizzle-orm`, `pg`, `@auth/drizzle-adapter`, `next-auth@beta`, `bcryptjs`, `zod`, `lucide-react`, `nodemailer`. Install dev deps: `drizzle-kit`, `@types/pg`, `@types/bcryptjs`, `@types/nodemailer`, `eslint-config-prettier`, `prettier`, `prettier-plugin-tailwindcss`. Pin `next-auth` and `@auth/drizzle-adapter` to the same beta tag (e.g., `next-auth@5.0.0-beta.25` and matching adapter) to avoid silent session failures documented in ideation.md.
- **Why**: All runtime infrastructure (ORM, auth, hashing, validation, email) must be installed before any code referencing these packages is written. Pinning both auth packages together prevents version mismatch — the most common failure mode with Auth.js v5 beta.

### Step 4 — `.env.example` and `.env.local`
- **File**: `.env.example` (committed), `.env.local` (git-ignored)
- **Change**: Create `.env.example` with all variable names, placeholder values, and inline comments explaining each:
  ```
  # Database — use localhost:5432 when running Next.js on host with Postgres in Docker
  DATABASE_URL="postgresql://gymbro:gymbro@localhost:5432/gymbro"

  # Auth.js — used for CSRF/cookie signing (not JWT secret; session strategy is "database")
  AUTH_SECRET="generate-with-openssl-rand-base64-32"

  # Google OAuth
  GOOGLE_CLIENT_ID=""
  GOOGLE_CLIENT_SECRET=""

  # Email (nodemailer SMTP — use Ethereal in dev: https://ethereal.email)
  EMAIL_FROM="GymBro <noreply@gymbro.local>"
  SMTP_HOST="smtp.ethereal.email"
  SMTP_PORT="587"
  SMTP_USER=""
  SMTP_PASS=""
  ```
- **Why**: Security standard requires `.env.example` be committed and `.env` files with real values never committed. Ethereal (free, no sign-up required for generated test accounts) is the simplest email dev option — it works without a paid key, satisfying the "simpler option" requirement from the task spec. The comment about `localhost` vs Docker service name addresses the risk documented in ideation.md.

### Step 5 — `docker-compose.yml`
- **File**: `docker-compose.yml`
- **Change**: Define a `postgres` service using `postgres:16-alpine` image with a named volume (`gymbro_pgdata`), `POSTGRES_USER=gymbro`, `POSTGRES_PASSWORD=gymbro`, `POSTGRES_DB=gymbro`, port `5432:5432`, and a `pg_isready` health check. Add a `networks` section with a default bridge network.
- **Why**: Gives every developer a reproducible, zero-config local database. Alpine image keeps the layer small. Health check enables dependent services to wait for readiness. Named volume persists data across `docker-compose down` (only `down -v` removes it).

### Step 6 — `Dockerfile` (production multi-stage)
- **File**: `Dockerfile`
- **Change**: Three-stage build: `deps` (install production deps from lockfile), `builder` (copy source + run `next build` with `NEXT_TELEMETRY_DISABLED=1`), `runner` (copy `.next/standalone`, `.next/static`, `public`; run as non-root `nextjs` user on port 3000). Add `.dockerignore` excluding `node_modules`, `.next`, `.env*`, `.git`.
- **Why**: Multi-stage build minimizes final image size. Non-root user follows least-privilege security principle. `.dockerignore` prevents secrets in `.env.local` from leaking into the image layer.

### Step 7 — `drizzle.config.ts`
- **File**: `drizzle.config.ts`
- **Change**: Export a `defineConfig` with `dialect: "postgresql"`, `schema: "./src/db/schema/index.ts"`, `out: "./src/db/migrations"`, and `dbCredentials: { url: process.env.DATABASE_URL! }`.
- **Why**: Single source of truth for migration generation and schema location. Pointing at the barrel `index.ts` ensures all schema files are picked up by `drizzle-kit generate`.

### Step 8 — `src/db/index.ts` (Drizzle client singleton)
- **File**: `src/db/index.ts`
- **Change**: Create a module-level singleton using `drizzle(pool, { schema })` with a `pg` Pool initialized from `process.env.DATABASE_URL`. Guard with `if (!global.__db)` pattern to avoid multiple connections in Next.js hot-reload. Export typed `db` and the full `schema` re-export.
- **Why**: Database connections are expensive; a singleton prevents connection exhaustion during development hot reloads. Tying the pool to the global object is the standard Next.js pattern for stateful singletons in dev mode.

### Step 9 — `src/db/schema/auth.ts` (Auth.js adapter tables)
- **File**: `src/db/schema/auth.ts`
- **Change**: Define `users`, `accounts`, `sessions`, `verification_tokens` tables exactly matching the column names and types required by `@auth/drizzle-adapter`. Extend `users` with application-specific columns: `passwordHash text` (nullable), `displayName text` (nullable), `unitPreference text` (default `"metric"`, enum: `"metric" | "imperial"`), `age integer` (nullable), `bodyWeight numeric(8,3)` (nullable), `height numeric(6,2)` (nullable). The `emailVerified` column must be `timestamp` (not `timestamptz`) to match the adapter's expectation.
- **Why**: The adapter writes directly to these tables using exact column names. Any mismatch (e.g., `email_verified` vs `emailVerified`) causes silent auth failures. Extending the adapter-owned `users` table with application fields avoids a separate profile table join on every authenticated request.

### Step 10 — `src/db/schema/otp.ts`
- **File**: `src/db/schema/otp.ts`
- **Change**: Define `otp_tokens` table with columns: `id uuid PK default gen_random_uuid()`, `email text not null`, `userId uuid` (nullable FK to users, nullable because pre-registration verification uses email only), `type text not null` (enum: `"email_verification" | "password_reset"`), `code text not null`, `expiresAt timestamp not null`, `usedAt timestamp` (nullable), `createdAt timestamp default now()`. Add index on `expiresAt` for future cleanup queries.
- **Why**: Dedicated table with explicit `type`, `expiresAt`, and `usedAt` columns avoids coupling to Auth.js's `verification_tokens` table (which the adapter owns and may change). Index on `expiresAt` is low cost now and enables efficient cleanup later — noted as a future concern in ideation.md.

### Step 11 — `src/db/schema/exercises.ts`
- **File**: `src/db/schema/exercises.ts`
- **Change**: Define four tables:
  - `muscle_groups`: `id`, `name`, `slug`, `parentId` (self-ref FK nullable — root nodes have `null`). Depth limited to 3 levels at application layer.
  - `exercise_types`: `id`, `name` (e.g., `"strength"`, `"cardio"`, `"flexibility"`).
  - `equipment`: `id`, `name` (e.g., `"barbell"`, `"dumbbell"`, `"cable"`, `"bodyweight"`).
  - `exercises`: `id uuid PK`, `name text`, `slug text unique`, `exerciseTypeId`, `equipmentId`, `primaryMuscleGroupId`, `instructions text` (nullable), `isGlobal boolean default true`, `userId uuid` (nullable FK — null for global), `createdAt`, `updatedAt`.
  - `exercise_secondary_muscles`: composite PK `(exerciseId, muscleGroupId)`.
- **Why**: Hierarchical self-ref on `muscle_groups` enables the 3-level tree (Upper Body → Arms → Biceps) without a separate join table. The `isGlobal` + `userId` pattern from ideation.md cleanly separates seeded global exercises from user-created ones. Composite PK on the junction table enforces uniqueness without a surrogate key.

### Step 12 — `src/db/schema/workouts.ts`
- **File**: `src/db/schema/workouts.ts`
- **Change**: Define three tables:
  - `workouts`: `id uuid PK`, `userId uuid FK`, `name text` (nullable), `status text` (enum: `"active" | "completed" | "abandoned"`), `notes text` (nullable), `totalDuration integer` (seconds, nullable), `startedAt timestamp`, `completedAt timestamp` (nullable), `createdAt`, `updatedAt`.
  - `workout_exercises`: `id uuid PK`, `workoutId uuid FK`, `exerciseId uuid FK`, `order integer not null`, `notes text` (nullable), `createdAt`.
  - `sets`: `id uuid PK`, `workoutExerciseId uuid FK`, `order integer`, `reps integer` (nullable), `weight numeric(8,3)` (nullable — stored in kg), `duration integer` (nullable, seconds), `restTime integer` (nullable, seconds), `rpe integer` (nullable, 1–10), `setType text` (enum: `"normal" | "warmup" | "drop" | "failure"`), `completedAt timestamp` (nullable), `createdAt`.
- **Why**: `weight` stored as `numeric(8,3)` in kg matches the project invariant (convert on display only). `setType` covers all common set modalities. `nullable` weight supports bodyweight exercises. `order` on both `workout_exercises` and `sets` allows user reordering.

### Step 13 — `src/db/schema/index.ts` (barrel + relations)
- **File**: `src/db/schema/index.ts`
- **Change**: Re-export all tables from the four schema files. Define Drizzle `relations()` for every FK link: `users ↔ accounts`, `users ↔ sessions`, `users ↔ workouts`, `users ↔ exercises` (custom), `muscle_groups ↔ muscle_groups` (self-ref parent/children), `exercises ↔ muscle_groups` (primary), `exercises ↔ exercise_secondary_muscles`, `workouts ↔ workout_exercises`, `workout_exercises ↔ sets`, `workout_exercises ↔ exercises`.
- **Why**: Drizzle `relations()` are required for the relational query API (`db.query.*`) used in service functions. Centralizing all relations in the barrel prevents circular import issues between schema files.

### Step 14 — Generate and commit initial migration
- **File**: `src/db/migrations/0000_initial.sql` (generated)
- **Change**: Run `npm run db:generate` after all schema files are written. Review the generated SQL before committing — confirm all tables, FK constraints, indexes, and defaults are correct. Commit the migration file.
- **Why**: Migration files are the source of truth for schema history. Committing them ensures every developer and CI pipeline applies the same schema. Following the convention from ideation.md: always regenerate from a clean state, commit atomically.

### Step 15 — `src/types/domain.ts`
- **File**: `src/types/domain.ts`
- **Change**: Export TypeScript `const` enums (or string literal union types — prefer union types to avoid enum pitfalls in strict mode): `WorkoutStatus`, `SetType`, `UnitPreference`, `ExerciseTypeEnum`, `OtpType`. Also export inferred Drizzle types: `type User = typeof users.$inferSelect`, `type NewUser = typeof users.$inferInsert`, and equivalents for all tables.
- **Why**: Centralizing domain enums prevents string literals from drifting across codebase. Drizzle's `$inferSelect`/`$inferInsert` types are derived from the schema and stay in sync automatically — no manual duplication.

### Step 16 — `src/types/api.ts`
- **File**: `src/types/api.ts`
- **Change**: Export `ApiSuccess<T>` and `ApiError` response shape types that match what `api-response.ts` returns. Export `PaginatedResponse<T>` for future list endpoints.
- **Why**: Shared response types let client code (React hooks, fetch wrappers) be typed against the same shape as Route Handler output. Defined once, imported everywhere.

### Step 17 — `src/lib/errors.ts`
- **File**: `src/lib/errors.ts`
- **Change**: Define `AppError` base class extending `Error` with `statusCode: number` and `code: string`. Subclasses: `NotFoundError` (404, `"NOT_FOUND"`), `UnauthorizedError` (401, `"UNAUTHORIZED"`), `ForbiddenError` (403, `"FORBIDDEN"`), `ConflictError` (409, `"CONFLICT"`), `ValidationError` (422, `"VALIDATION_ERROR"` + `fields` map).
- **Why**: Typed error hierarchy lets Route Handlers catch `AppError` and return structured JSON with the correct HTTP status, rather than leaking internal error messages. Follows the architecture standard of keeping error handling in the service layer.

### Step 18 — `src/lib/api-response.ts`
- **File**: `src/lib/api-response.ts`
- **Change**: Export `ok<T>(data: T, status = 200)` that returns `NextResponse.json({ success: true, data })` and `err(error: AppError | unknown)` that returns `NextResponse.json({ success: false, error: { code, message, fields? } }, { status })`. The `err` function must handle both `AppError` instances and unknown errors (fallback to 500 `"INTERNAL_ERROR"`).
- **Why**: Consistent response envelope across all Route Handlers. The `success` discriminant enables TypeScript narrowing on the client. Centralizing this prevents each handler from making different decisions about status codes or error shapes.

### Step 19 — `src/lib/units.ts`
- **File**: `src/lib/units.ts`
- **Change**: Export pure functions: `kgToLb(kg: number): number`, `lbToKg(lb: number): number`, `formatWeight(kg: number, unit: UnitPreference): string` (returns e.g. `"80 kg"` or `"176.4 lb"`). Add JSDoc noting that weight is always stored server-side in kg.
- **Why**: Centralizes all unit conversion so there is one place to fix rounding behavior. The JSDoc comment documents the project invariant — weight stored in kg — at the point of use.

### Step 20 — `src/lib/email.ts` (stubbed)
- **File**: `src/lib/email.ts`
- **Change**: Define `EmailPayload` interface (`to`, `subject`, `html`, `text`). Export `sendEmail(payload: EmailPayload): Promise<void>` implemented with `nodemailer.createTransport` using SMTP env vars. In development (`NODE_ENV !== "production"`), log the email payload to console instead of sending (or use Ethereal). Add a `// TODO: swap nodemailer for Resend in production` comment.
- **Why**: Nodemailer with Ethereal works without any paid keys in dev, satisfying the spec. The function signature is stable — swapping the transport later does not change call sites. Stubbing the interface now lets OTP route handlers be written without a real SMTP server.

### Step 21 — `src/lib/auth.ts`
- **File**: `src/lib/auth.ts`
- **Change**: Configure Auth.js v5 with `DrizzleAdapter(db, { usersTable, accountsTable, sessionsTable, verificationTokensTable })`, `session: { strategy: "database" }`, providers: `Google({ clientId, clientSecret })` and `Credentials({ authorize })`. The `authorize` function: (1) fetch user by email, (2) if no user or no `passwordHash` return null, (3) compare password with `bcrypt.compare`, (4) check `emailVerified` is not null — return `null` with a typed error if unverified. Export `{ handlers, auth, signIn, signOut }`.
- **Why**: Single place that configures the entire auth system. Database sessions (not JWT) are required per ADR-004. The `emailVerified` check in `authorize` enforces that unverified users cannot log in with credentials, without needing a middleware intercept.

### Step 22 — `src/lib/auth-helpers.ts`
- **File**: `src/lib/auth-helpers.ts`
- **Change**: Export `requireSession(): Promise<Session>` — calls `auth()`, throws `UnauthorizedError` if no session. Export `getCurrentUserId(): Promise<string>` — calls `requireSession()`, returns `session.user.id`. Export `requireEmailVerified(): Promise<Session>` — guards on `session.user.emailVerified`.
- **Why**: Centralizes the auth check pattern that every protected Route Handler must call. Throwing a typed `UnauthorizedError` lets `err()` in `api-response.ts` return the correct 401 automatically.

### Step 23 — `src/app/api/auth/[...nextauth]/route.ts`
- **File**: `src/app/api/auth/[...nextauth]/route.ts`
- **Change**: Export `{ GET, POST } = handlers` from `src/lib/auth.ts`. This is the standard Auth.js v5 App Router setup.
- **Why**: Auth.js requires this catch-all route to handle OAuth redirects, credential sign-in, sign-out, and session callbacks. No custom logic belongs here — it's purely a passthrough to the configured handlers.

### Step 24 — `src/app/api/auth/verify-email/route.ts`
- **File**: `src/app/api/auth/verify-email/route.ts`
- **Change**: `POST` handler accepts `{ email, code }`. Validate with Zod. Look up unexpired, unused `otp_tokens` row matching `email + type="email_verification" + code`. If valid: set `usedAt = now()`, update `users.emailVerified = now()`. Return redirect hint `{ redirectTo: "/login?verified=1" }`. Return `ok()` on success, `err(ValidationError)` on bad/expired code.
- **Why**: OTP verification is a custom flow (not Auth.js magic links) per the ideation decision. Writing `users.emailVerified` directly ensures Auth.js respects the verified state in its callbacks. No auto-sign-in after verification (safest approach per ideation risk note).

### Step 25 — `src/app/api/auth/forgot-password/route.ts`
- **File**: `src/app/api/auth/forgot-password/route.ts`
- **Change**: `POST` handler accepts `{ email }`. Validate with Zod. Look up user by email. Always return 200 (do not leak whether email exists — security best practice). If user found: generate 6-digit OTP, insert `otp_tokens` row (`type="password_reset"`, `expiresAt = now() + 15 minutes`), call `sendEmail()` with the code. Business logic in a `forgotPassword` service function; handler only orchestrates.
- **Why**: Always returning 200 prevents user enumeration attacks (OWASP A07). 15-minute expiry is short enough to limit attack window. Logic in service layer follows architecture standard — handlers must not contain business logic.

### Step 26 — `src/app/api/auth/reset-password/route.ts`
- **File**: `src/app/api/auth/reset-password/route.ts`
- **Change**: `POST` handler accepts `{ email, code, newPassword }`. Validate with Zod (password: min 8 chars). Verify OTP token (same lookup as verify-email). Hash new password with `bcrypt.hash(newPassword, 12)`. Update `users.passwordHash`. Mark token as used. Return `ok()`.
- **Why**: bcrypt cost 12 is appropriate for password hashing per security standards (not MD5/SHA1). Marking token as used prevents replay attacks. Zod validation at the boundary enforces minimum password complexity.

### Step 27 — `src/app/api/auth/change-password/route.ts`
- **File**: `src/app/api/auth/change-password/route.ts`
- **Change**: `POST` handler — call `requireSession()` first (blocks unauthenticated access). Accept `{ currentPassword, newPassword }`. Fetch user, check `passwordHash` is not null (return `ConflictError("OAuth accounts cannot set a local password")` if null — per ideation edge case). Verify `currentPassword` with bcrypt. Hash and update `newPassword`. Return `ok()`.
- **Why**: `requireSession()` enforces authorization at the service layer, not just UI. The null `passwordHash` guard addresses the Google OAuth edge case documented in ideation.md. Verifying current password before changing prevents CSRF-style password changes.

### Step 28 — `middleware.ts`
- **File**: `middleware.ts`
- **Change**: Export `{ auth as middleware }` from `src/lib/auth.ts`. Configure `matcher` to protect `/app/*` routes and exclude `/api/auth/(.*)`, `/_next/(.*)`, `/favicon.ico`, `/(.*).(png|jpg|svg|ico)`. Redirect unauthenticated requests to `/login`.
- **Why**: App Router middleware runs at the edge before any page renders. The matcher must explicitly exclude Auth.js API routes and static assets — misconfigured matchers cause redirect loops (documented risk in ideation.md).

### Step 29 — `src/lib/validations/` (base Zod schemas)
- **Files**: `src/lib/validations/auth.ts`, `src/lib/validations/common.ts`
- **Change**: `auth.ts`: export `loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `changePasswordSchema`. `common.ts`: export `uuidSchema`, `paginationSchema`, `emailSchema`. All schemas use `.strict()` to reject extra fields.
- **Why**: Centralizing Zod schemas prevents duplication between Route Handlers and future form validation. `.strict()` follows the whitelist-over-blacklist input validation principle from security standards.

### Step 30 — Root layout and design system
- **File**: `src/app/layout.tsx`
- **Change**: Import `Barlow` and `Barlow_Condensed` from `next/font/google` with `subsets: ["latin"]`. Apply CSS variables (`--font-barlow`, `--font-barlow-condensed`) to `<html>`. Set `className="dark bg-black min-h-screen"`. Add `<meta name="theme-color" content="#000000">` for OLED mobile. Import global CSS.
- **Why**: Loading fonts via `next/font` gives zero-CLS, self-hosted font delivery (no external DNS lookup at runtime). OLED black background is the core design system decision. Theme color meta tag is needed for Android PWA behavior.

### Step 31 — `src/app/globals.css` (design system tokens)
- **File**: `src/app/globals.css`
- **Change**: Define CSS custom properties for the design system in `:root` and `.dark`: colors (`--color-background: #000`, `--color-surface: #0a0a0a`, `--color-border: #1a1a1a`, `--color-text-primary`, `--color-text-muted`, `--color-accent: #3b82f6`), spacing scale, border radius tokens. Configure Tailwind `@layer base` to apply `antialiased` text rendering. Remove default create-next-app demo styles.
- **Why**: Design tokens in CSS variables enable consistent theming and are accessible from both Tailwind utilities and plain CSS. Establishing them in Phase 0 means Phase 1+ UI work always references stable tokens.

### Step 32 — `src/app/(auth)/login/page.tsx` (stub)
- **File**: `src/app/(auth)/login/page.tsx`
- **Change**: Minimal stub returning `<main><h1>Login</h1></main>` with `export default`. No real form — just enough to prevent a 404 when the app boots.
- **Why**: Without at least one page in the `(auth)` route group, Next.js may show a 404 on the middleware redirect target. This stub is explicitly in scope per ideation.md.

### Step 33 — `src/app/(app)/` directory structure
- **Files**: `src/app/(app)/layout.tsx` (stub), `src/app/(app)/dashboard/page.tsx` (stub)
- **Change**: Root `(app)` layout with bottom nav shell — a `<nav>` with 4 placeholder tab items (Dashboard, Workout, History, Profile) using Lucide icons. Protected by middleware (no additional `requireSession()` needed in layout for MVP). Dashboard page stub returns `<main><h1>Dashboard</h1></main>`.
- **Why**: Establishes the route group and bottom nav structure that Phase 1+ pages will slot into. Bottom nav shell in layout avoids duplicating it per page.

### Step 34 — `src/db/seed/muscle-groups.ts`
- **File**: `src/db/seed/muscle-groups.ts`
- **Change**: Export `MUSCLE_GROUPS` array with 3-level hierarchy: root nodes (Upper Body, Lower Body, Core, Full Body), second-level groups (Chest, Back, Shoulders, Arms, Glutes, Quads, Hamstrings, Calves, Abs, Obliques), third-level groups (e.g., Biceps, Triceps, Front Deltoid, etc.). Use `onConflictDoNothing()` for idempotency.
- **Why**: Seeding the hierarchy first (before exercises) satisfies FK constraints. The 3-level depth is the MVP decision from ideation.md. `onConflictDoNothing()` makes re-runs safe.

### Step 35 — `src/db/seed/exercise-types.ts` and `src/db/seed/equipment.ts`
- **Files**: `src/db/seed/exercise-types.ts`, `src/db/seed/equipment.ts`
- **Change**: `exercise-types.ts`: seed `["strength", "cardio", "flexibility", "plyometric", "olympic_lifting"]`. `equipment.ts`: seed `["barbell", "dumbbell", "cable", "machine", "bodyweight", "kettlebell", "resistance_band", "smith_machine", "trap_bar"]`. Both use `onConflictDoNothing()`.
- **Why**: These are the lookup tables that every exercise row references via FK. They must be seeded before exercises. MVP set covers the most common gym equipment.

### Step 36 — `src/db/seed/exercises.ts`
- **File**: `src/db/seed/exercises.ts`
- **Change**: Export ~20 MVP exercises (not 80 — per corrected scope in task spec) covering the most common movements: Bench Press, Squat, Deadlift, Overhead Press, Barbell Row, Pull-Up, Dip, Incline Bench Press, Romanian Deadlift, Leg Press, Lat Pulldown, Cable Row, Dumbbell Curl, Tricep Pushdown, Lunges, Hip Thrust, Face Pull, Arnold Press, Plank, Running (Treadmill). Each includes `primaryMuscleGroupId`, `exerciseTypeId`, `equipmentId`, `isGlobal: true`. Secondary muscles seeded via `exercise_secondary_muscles` inserts.
- **Why**: 20 exercises covers all major movement patterns for a functional MVP without the data-entry burden of 80. The ideation.md explicitly revised scope to ~20. Global exercises form the shared library all users see.

### Step 37 — `src/db/seed/index.ts`
- **File**: `src/db/seed/index.ts`
- **Change**: Orchestrate seed in order: (1) muscle groups, (2) exercise types, (3) equipment, (4) exercises + secondary muscles. Use `db.transaction()` wrapping all inserts so a partial seed failure rolls back cleanly. Log progress to console. Export a `seed()` function and call it with `seed().catch(console.error).finally(() => process.exit())`.
- **Why**: Ordered execution respects FK constraints. Transaction ensures atomicity — a failed exercise seed won't leave orphaned equipment rows. The exit call is required because Node won't self-terminate with an open Postgres pool connection.

### Step 38 — `package.json` scripts
- **File**: `package.json`
- **Change**: Add scripts: `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"`, `"db:seed": "tsx src/db/seed/index.ts"`, `"db:studio": "drizzle-kit studio"`, `"db:reset": "drizzle-kit drop && npm run db:migrate && npm run db:seed"`. Install `tsx` as a dev dependency for running TypeScript scripts directly.
- **Why**: Standardized script names mean every developer and CI pipeline uses the same commands. `tsx` avoids a separate compile step for seed scripts. `db:reset` provides a one-command dev environment reset.

### Step 39 — ESLint and Prettier config
- **Files**: `eslint.config.mjs` (or `.eslintrc.json`), `.prettierrc`, `.prettierignore`
- **Change**: ESLint: extend Next.js defaults, add `@typescript-eslint/no-explicit-any: error`, `@typescript-eslint/no-unused-vars: error`. Prettier: `{ "semi": false, "singleQuote": true, "trailingComma": "all", "plugins": ["prettier-plugin-tailwindcss"] }`. `.prettierignore`: exclude `src/db/migrations/`.
- **Why**: Consistent formatting from day one. `no-explicit-any` enforces TypeScript strict discipline. Prettier Tailwind plugin sorts class names consistently. Migrations are excluded from Prettier because the generated SQL should never be reformatted.

### Step 40 — `README.md`
- **File**: `README.md`
- **Change**: Write project README per documentation standards: (1) what GymBro is, (2) prerequisites (Node 20+, Docker), (3) setup steps (`cp .env.example .env.local`, fill vars, `docker compose up -d`, `npm install`, `npm run db:migrate`, `npm run db:seed`, `npm run dev`), (4) available scripts, (5) key architectural decisions (database sessions, weight in kg, OTP table design, Ethereal for dev email).
- **Why**: Documentation standard requires README with setup and run instructions. This is the first file a new developer reads — getting it right in Phase 0 prevents onboarding friction in all future phases.

---

## Test strategy

### What to test and in what order

1. **Schema integrity test** (first — blocks everything): Write a Vitest test (`src/db/__tests__/schema.test.ts`) that connects to a test database, runs migrations, and asserts all expected tables exist via `SELECT table_name FROM information_schema.tables`. Run with a throwaway Docker Postgres instance. This validates Step 14 (migration correctness) before any application code is tested.

2. **Unit tests — lib functions** (can run without DB):
   - `src/lib/units.test.ts`: Test `kgToLb`, `lbToKg`, `formatWeight` with known values and edge cases (0, negative, large numbers).
   - `src/lib/errors.test.ts`: Test that each error subclass has correct `statusCode` and `code`.
   - `src/lib/api-response.test.ts`: Test that `ok()` returns `{ success: true, data }` with correct status, and `err(AppError)` returns `{ success: false, error }` with correct status.

3. **Validation schema tests** (no DB, no network):
   - `src/lib/validations/__tests__/auth.test.ts`: Test each Zod schema rejects invalid input (missing fields, short password, bad email format) and accepts valid input.

4. **Seed idempotency test**: Run `npm run db:seed` twice against the test database and assert row counts are identical after both runs. This validates `onConflictDoNothing()` on all seed tables.

5. **Auth helper unit tests** (mocked DB):
   - `src/lib/__tests__/auth-helpers.test.ts`: Mock `auth()` to return null and assert `requireSession()` throws `UnauthorizedError`. Mock a valid session and assert it returns the session.

6. **OTP route handler integration tests** (with test DB):
   - Test `POST /api/auth/verify-email` with valid code, expired code, and already-used code.
   - Test `POST /api/auth/forgot-password` always returns 200 regardless of whether email exists.
   - Test `POST /api/auth/reset-password` with valid and invalid OTP.
   - Test `POST /api/auth/change-password` with valid session, invalid current password, and Google OAuth user (no passwordHash).

### Testing infrastructure
- Use Vitest (compatible with Next.js App Router, faster than Jest for TypeScript projects).
- Use a separate `TEST_DATABASE_URL` env var pointing to a test database that is reset between test suites.
- Mock `nodemailer` in unit tests to prevent actual email sends.
- Do not test Auth.js internals — test only the application code that wraps Auth.js.

---

## Files

### New
- `gymbro/` (entire project directory — greenfield)
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `.env.example`
- `.env.local` (git-ignored, not committed)
- `.gitignore`
- `docker-compose.yml`
- `Dockerfile`
- `.dockerignore`
- `drizzle.config.ts`
- `middleware.ts`
- `README.md`
- `.prettierrc`
- `.prettierignore`
- `eslint.config.mjs`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/(auth)/login/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/verify-email/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/auth/change-password/route.ts`
- `src/db/index.ts`
- `src/db/schema/auth.ts`
- `src/db/schema/otp.ts`
- `src/db/schema/exercises.ts`
- `src/db/schema/workouts.ts`
- `src/db/schema/index.ts`
- `src/db/migrations/0000_initial.sql` (generated by drizzle-kit)
- `src/db/seed/index.ts`
- `src/db/seed/muscle-groups.ts`
- `src/db/seed/exercise-types.ts`
- `src/db/seed/equipment.ts`
- `src/db/seed/exercises.ts`
- `src/lib/auth.ts`
- `src/lib/auth-helpers.ts`
- `src/lib/api-response.ts`
- `src/lib/errors.ts`
- `src/lib/units.ts`
- `src/lib/email.ts`
- `src/lib/validations/auth.ts`
- `src/lib/validations/common.ts`
- `src/types/domain.ts`
- `src/types/api.ts`

### Modified
- None (greenfield project — no existing files to modify)

---

## Component breakdown

Grouped for parallel implementation by sub-agents. Steps within each cluster have no dependencies on other clusters unless noted.

### Cluster A — Project bootstrap (must run first, sequentially)
Prerequisite for all other clusters.
1. `create-next-app` scaffold (Step 1)
2. `tsconfig.json` hardening (Step 2)
3. Dependency installation (Step 3)
4. `.env.example` + `.env.local` (Step 4)

### Cluster B — Infrastructure (can run after Cluster A, in parallel with C and D)
- `docker-compose.yml` (Step 5)
- `Dockerfile` + `.dockerignore` (Step 6)
- `drizzle.config.ts` (Step 7)
- `src/db/index.ts` (Step 8)

### Cluster C — Schema layer (can run in parallel with B; Steps 9–12 are sequential, 13–14 depend on all of 9–12)
- `src/db/schema/auth.ts` (Step 9)
- `src/db/schema/otp.ts` (Step 10)
- `src/db/schema/exercises.ts` (Step 11)
- `src/db/schema/workouts.ts` (Step 12)
- `src/db/schema/index.ts` — relations barrel (Step 13) — depends on 9–12
- Migration generation (Step 14) — depends on Step 13

### Cluster D — Types and lib utilities (can run in parallel with B and C; no DB dependency)
Sub-agent D1: Type definitions
- `src/types/domain.ts` (Step 15)
- `src/types/api.ts` (Step 16)

Sub-agent D2: Error and response utilities
- `src/lib/errors.ts` (Step 17)
- `src/lib/api-response.ts` (Step 18)
- `src/lib/units.ts` (Step 19)
- `src/lib/email.ts` (Step 20)

Sub-agent D3: Validation schemas
- `src/lib/validations/auth.ts` (Step 29)
- `src/lib/validations/common.ts` (Step 29)

### Cluster E — Auth layer (depends on Cluster C schema + Cluster D utilities)
Sub-agent E1: Auth config
- `src/lib/auth.ts` (Step 21) — depends on schema/auth.ts, errors.ts
- `src/lib/auth-helpers.ts` (Step 22) — depends on auth.ts

Sub-agent E2: Auth route handlers
- `src/app/api/auth/[...nextauth]/route.ts` (Step 23) — depends on auth.ts
- `src/app/api/auth/verify-email/route.ts` (Step 24) — depends on auth.ts, db, validations
- `src/app/api/auth/forgot-password/route.ts` (Step 25) — depends on email.ts, db, validations
- `src/app/api/auth/reset-password/route.ts` (Step 26) — depends on db, validations
- `src/app/api/auth/change-password/route.ts` (Step 27) — depends on auth-helpers.ts, db, validations
- `middleware.ts` (Step 28) — depends on auth.ts

### Cluster F — UI shell (depends on Cluster A; no DB or auth dependency for stubs)
- `src/app/layout.tsx` + `src/app/globals.css` (Steps 30–31)
- `src/app/(auth)/login/page.tsx` (Step 32)
- `src/app/(app)/layout.tsx` + `src/app/(app)/dashboard/page.tsx` (Step 33)

### Cluster G — Seed data (depends on Cluster C migration being applied)
- `src/db/seed/muscle-groups.ts` (Step 34)
- `src/db/seed/exercise-types.ts` + `src/db/seed/equipment.ts` (Step 35, parallel)
- `src/db/seed/exercises.ts` (Step 36) — depends on muscle groups, types, equipment data being defined
- `src/db/seed/index.ts` (Step 37) — depends on all seed data files

### Cluster H — Config and docs (can run after Cluster A, in parallel with everything)
- `package.json` scripts (Step 38) — depends on Cluster G (tsx, drizzle-kit must be installed)
- ESLint + Prettier config (Step 39)
- `README.md` (Step 40)

---

## ADR draft

### ADR-006: Custom `otp_tokens` table over Auth.js `verification_tokens` for email OTP flows

**Status**: Accepted

**Context**:
GymBro requires three custom email flows not provided by Auth.js v5 out of the box: email address verification after registration, password reset, and (as a sub-flow) confirming a reset code. Auth.js ships a `verification_tokens` table managed by the Drizzle adapter, used internally for magic-link flows. Reusing it for GymBro's OTP codes is superficially appealing because the table already exists.

**Decision**:
Introduce a dedicated `otp_tokens` table with columns: `id`, `email`, `userId` (nullable), `type` (`"email_verification" | "password_reset"`), `code`, `expiresAt`, `usedAt`, `createdAt`.

**Consequences**:
- Full control over OTP semantics (`usedAt` for one-time enforcement, `type` for routing, explicit expiry).
- No coupling to Auth.js adapter internals — adapter schema changes do not affect OTP flows.
- One additional table in the schema; minor increase in complexity.
- The `type` column allows a single table to serve multiple OTP use cases without a join.
- An index on `expiresAt` enables efficient cleanup of expired tokens (future concern, low cost to add now).

**Alternatives considered**:
- **Reuse `verification_tokens`**: Rejected because the Auth.js adapter owns that table and its schema is considered an internal contract. Adding application columns risks breakage on adapter upgrades.
- **Store OTP codes in `users` table columns** (`resetToken`, `resetTokenExpiry`): Rejected because it conflates user profile data with ephemeral token state, and cannot support multiple concurrent OTP types cleanly.
- **Use a Redis cache for OTP codes**: Rejected for MVP because it adds an infrastructure dependency (Redis container) for a feature that works fine in Postgres. Can be revisited if OTP volume justifies it.

---

## Risks and mitigations

- **Auth.js v5 / `@auth/drizzle-adapter` version mismatch**: Pin both to the same beta release in `package.json` and commit `package-lock.json`. Document the pinned versions in `stack.md`. Do not run `npm update` on these packages without testing the full auth flow.

- **`emailVerified` column name mismatch**: The Auth.js adapter expects exactly `emailVerified` (camelCase) in the Drizzle schema. Use `{ column: "email_verified" }` mapping in Drizzle only if the adapter documentation explicitly states it. Default: match the adapter's expected naming exactly. Validate by running the auth flow (sign-in, session) before declaring this step complete.

- **Post-OTP sign-in UX gap**: After email verification, users are redirected to `/login?verified=1` rather than auto-signed-in. This is intentional (safest approach) but must be communicated in the UI with a success message. Phase 1 UI work must handle the `?verified=1` query param. Document this in `architecture.md`.

- **`DATABASE_URL` localhost vs Docker service name**: When Next.js runs on the host and Postgres runs in Docker, `DATABASE_URL` must be `localhost:5432`, not `postgres:5432`. This is documented in `.env.example` with an explicit comment. If both run in Docker (e.g., future CI), the service name must be used instead.

- **Seed script FK ordering**: If seed files are run in wrong order, FK constraint violations will fail the seed. The `seed/index.ts` orchestrator must enforce order: muscle_groups → exercise_types → equipment → exercises. A transaction wrapping all inserts ensures partial failures are atomic.

- **TypeScript strict mode with Auth.js types**: Auth.js v5 type definitions may have gaps or require type assertions in strict mode. Prefer `as` casts with a comment explaining why rather than disabling strict mode. Document any type workarounds in `lessons.md`.

- **bcrypt cost 12 in development**: bcrypt at cost 12 adds ~250ms per hash. This is acceptable in production but can make tests slow if many users are hashed in test setup. Use `bcrypt.hash(password, 4)` in test environments (controlled via `NODE_ENV`).

- **Migration file timestamp collisions**: If two developers generate migrations at the same second they get the same filename. Establish convention: one developer generates and commits migrations per feature branch; never merge two branches that both contain new migration files without rebasing one.

- **`otp_tokens` table growth**: Expired and used tokens accumulate indefinitely in MVP. The `expiresAt` index enables a future `DELETE WHERE expiresAt < NOW()` cleanup job. Document this as a known limitation in `README.md` under "Known limitations".

- **Google OAuth users hitting change-password**: The `change-password` Route Handler explicitly checks for `passwordHash IS NULL` and returns a `ConflictError`. The UI in Phase 1 must hide the change-password option for OAuth users — but the API-level guard is the authoritative enforcement, not the UI.
