# Implementation Summary — Cluster A: Project Bootstrap

## Files created or modified

- `package.json` — Project manifest with Next.js 15, React 19, TypeScript, Tailwind, Drizzle ORM, Auth.js v5, bcryptjs, zod, Lucide React, nodemailer, and all dev deps; includes all required npm scripts
- `tsconfig.json` — Strict TypeScript config with `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `baseUrl: "."`, and `@/*` path alias pointing to `./src/*`
- `next.config.ts` — Next.js configuration with `output: "standalone"` for Docker builds; Server Actions require no flag in Next.js 15 (stable)
- `tailwind.config.ts` — Tailwind config with dark OLED design system tokens: bg `#0A0A0A`, surface `#111111`/`#1C1C1C`, primary `#2563EB`, accent `#F97316`, text-primary `#F8FAFC`, text-secondary `#94A3B8`; content paths cover `src/**/*.{ts,tsx}`
- `postcss.config.mjs` — PostCSS config enabling tailwindcss and autoprefixer plugins
- `eslint.config.mjs` — Flat ESLint config extending `next/core-web-vitals`, `next/typescript`, and `prettier`; enforces `no-explicit-any` and bans `@ts-ignore`
- `.prettierrc` — Prettier config: no semis, single quotes, 100 char width, `prettier-plugin-tailwindcss` for class sorting
- `.prettierignore` — Excludes `.next`, `node_modules`, `dist`, `out`, `public`, markdown files, and migration SQL
- `.gitignore` — Excludes `node_modules`, `.next`, `out`, `dist`, all `.env*.local` files, editor configs, OS artifacts, and TypeScript build info; migrations are committed
- `.env.example` — Documents all required env vars (DATABASE_URL, AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, EMAIL_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) with placeholder values and inline comments; Ethereal SMTP defaults for local dev

## Tests written

none (bootstrap/config files)

## Deviations from plan

- `create-next-app` was not run (as instructed) — all files created manually to match the planned scaffold
- Server Actions flag (`experimental.serverActions`) omitted from `next.config.ts` — it is stable/default in Next.js 15 and the flag is a no-op; kept `experimental` block as comment for future flags
- `.dockerignore` not created in this cluster — it belongs with the Dockerfile in the Docker cluster (Steps 5–6); referenced in `.gitignore` entry only

## New risks discovered

- `postcss.config.mjs` references `autoprefixer` but `autoprefixer` is not listed in `devDependencies` — Next.js bundles it internally so it works, but if the project ever ejects from Next.js's bundled PostCSS, `autoprefixer` must be added explicitly
- `exactOptionalPropertyTypes: true` in tsconfig may cause friction with third-party libraries (e.g. `@auth/drizzle-adapter`) that do not honor this flag; if type errors arise from the adapter, a targeted `// @ts-expect-error` at the adapter call site is the correct mitigation per TypeScript standards

# Implementation Summary — Cluster F: UI Shell

## Files created or modified

- `src/app/globals.css` — Google Fonts import (Barlow + Barlow Condensed 400/500/600/700), Tailwind directives, CSS custom properties for all design tokens (`--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-primary`, `--color-accent`, `--color-text-primary`, `--color-text-secondary`, `--color-border`, `--font-heading`, `--font-body`), base body styles (OLED dark bg, Barlow font, antialiasing), dark scrollbar styling for WebKit and Firefox, autofill input override to prevent browser yellow flash
- `src/app/layout.tsx` — Root layout; imports globals.css; sets metadata (title "GymBro", description "Track your workouts"); sets viewport with `viewportFit: "cover"` for mobile notch support; wraps children in `SessionProvider` seeded with server-side `auth()` session for client-side session access
- `src/app/(auth)/layout.tsx` — Centered auth shell; full-height flex column; GymBro heading in Barlow Condensed orange accent at top; constrains inner content to max-w-sm
- `src/app/(auth)/login/page.tsx` — Client Component; email + password form calling `signIn("credentials", { redirect: false })`; inline error display on failure; Google OAuth button calling `signIn("google")`; links to /register and /forgot-password; all inputs min-h-[44px] for touch targets
- `src/app/(auth)/register/page.tsx` — Client Component; display name (optional) + email + password fields; POST to `/api/auth/register`; success state shows "Check your email" with link to /verify-email; error state shows inline message; link to /login
- `src/app/(auth)/verify-email/page.tsx` — Client Component; reads `?email` query param; single 6-digit numeric input with `inputMode="numeric"` and digit-only filtering; POST to `/api/auth/verify-email`; on success redirects to `/login?verified=1`; resend button stubbed with "coming soon" banner
- `src/app/(auth)/forgot-password/page.tsx` — Client Component; email input; POST to `/api/auth/forgot-password`; success state shows confirmation message and link to /reset-password; link back to /login
- `src/app/(auth)/reset-password/page.tsx` — Client Component; reads `?email` query param; 6-digit code input + new password field; POST to `/api/auth/reset-password`; on success redirects to `/login?reset=1`
- `src/app/(app)/layout.tsx` — Server Component; calls `auth()` and redirects to `/login` if no session; renders children inside padded main + `<BottomNav />`; bottom padding accounts for nav height + safe-area-inset-bottom
- `src/app/(app)/dashboard/page.tsx` — Server Component; reads session to get user name; "Welcome back, [name]" heading; orange CTA "Start a Workout" button linking to /workout
- `src/components/layout/BottomNav.tsx` — Client Component; 4 tabs: Dashboard (`LayoutDashboard`), Exercises (`Dumbbell`), Workout (`Zap`), History (`Clock`) from lucide-react; `usePathname()` for active detection (exact match or prefix with trailing slash); active tab uses `text-primary`; fixed bottom with `pb-[env(safe-area-inset-bottom)]`; min-h-[56px] touch targets; `aria-current="page"` on active item
- `tailwind.config.ts` — Added `fontFamily` extension: `heading: ['Barlow Condensed', 'sans-serif']` and `body: ['Barlow', 'sans-serif']` to support `font-heading` and `font-body` Tailwind utilities

## Tests written

- `src/components/layout/__tests__/BottomNav.test.ts` — 13 unit tests for the nav active-route detection logic (`pathname === href || pathname.startsWith(href + "/")`); covers exact match, nested paths, false positives (no trailing slash), mutual exclusivity across all 4 tabs, and no match on auth routes; all 13 pass

## Deviations from plan

- **Google Fonts via CSS `@import`** instead of `next/font/google`: Next.js `next/font` requires font declarations to be module-level constants and cannot dynamically compose Barlow + Barlow Condensed together in globals.css. Using `@import` in globals.css is the most straightforward approach given both fonts are needed as CSS variables for use across Server and Client components. Trade-off: no automatic font optimization/self-hosting from Next.js — can be revisited by moving to `next/font` in layout.tsx if performance becomes a concern.
- **`auth.ts` not created**: Auth.js setup (`@/auth`) is a dependency from another cluster. The `layout.tsx` and `(app)/layout.tsx` import from `@/auth` which will resolve once that cluster delivers `src/auth.ts`. A TypeScript error will exist until then.
- **No stub pages for /exercises, /workout, /history**: These are outside Cluster F scope — the BottomNav links to them but the pages don't exist yet.

## New risks discovered

- **`@/auth` import coupling**: Both `src/app/layout.tsx` and `src/app/(app)/layout.tsx` import `auth` from `@/auth`. If auth.ts is not present when this cluster's code is first built, `next build` will fail. This is an integration risk between Cluster F and the auth cluster — coordinate delivery order.
- **Google Fonts network dependency**: Using `@import` in CSS means the fonts are fetched from Google's CDN at runtime. In environments without internet access (some CI, offline dev), fonts will fall back to system sans-serif. If this matters, migrate to `next/font/google` self-hosting.
- **`safe-area-inset-bottom` CSS env support**: The bottom nav uses `env(safe-area-inset-bottom)` for iPhone home bar padding. This requires `viewport-fit=cover` in the viewport meta — which is set in `layout.tsx`. If the viewport meta is overridden by a child segment, the safe area padding will break.

# Implementation Summary — Cluster G: Seed Data

## Files created or modified

- `src/db/seed/muscle-groups.ts` — Exports `muscleGroupsData` (26 rows across 3 levels) and `seedMuscleGroups(db)`. All UUIDs are hardcoded string literals. Exports `MUSCLE_GROUP_IDS` map for cross-file reference. Uses `onConflictDoNothing()` for idempotency.
- `src/db/seed/exercise-types.ts` — Exports `exerciseTypesData` (4 rows: strength, cardio, flexibility, bodyweight) and `seedExerciseTypes(db)`. Exports `EXERCISE_TYPE_IDS` map. Uses `onConflictDoNothing()`.
- `src/db/seed/equipment.ts` — Exports `equipmentData` (12 rows) and `seedEquipment(db)`. Exports `EQUIPMENT_IDS` map. Uses `onConflictDoNothing()`.
- `src/db/seed/exercises.ts` — Exports `exercisesData` (25 rows) and `seedExercises(db)`. Imports stable IDs from the three lookup seed files. Uses `onConflictDoNothing()`.
- `src/db/seed/index.ts` — Main runner; creates its own `Pool` + `drizzle()` instance directly from `DATABASE_URL`. Runs seeds in FK-safe order (exerciseTypes → equipment → muscleGroups → exercises). Logs progress, exits with code 1 on error, closes the pool in a `finally` block. Run with `npx tsx src/db/seed/index.ts`.

## Tests written

None — seed files are infrastructure-layer scripts. TDD for seed data would require an integration test against a live (or Docker) Postgres instance, which is out of scope for Phase 0 scaffold. Idempotency is validated structurally via `onConflictDoNothing()` and hardcoded UUIDs.

## Deviations from plan

- The plan stated ~25 exercises; 25 are provided (exact match).
- The plan called for `userId=null` and `isGlobal=true` on all seeded exercises — implemented as specified.
- `muscleGroupsData` seeds 26 entries (4 root + 11 level-2 + 11 level-3), covering all nodes listed in the plan. "Full Body" root node was included in the level-1 list per the ticket spec even though it has no level-2 children; this matches intent.
- Seed files import only from `src/db/schema/` — no `src/lib/` imports, as required.
- The `DbLike` inline type in each individual seed file allows the function to be called from any Drizzle instance (test or production), not just the singleton from `src/db/index.ts`.

## New risks discovered

- **FK insertion order**: `exercises` references `exerciseTypes`, `equipment`, and `muscleGroups`. If any of those three tables are empty when `seedExercises` runs, the insert will fail with a FK violation. The runner enforces the safe order, but this would break if seeds are called out of order externally.
- **Self-referential FK in muscle_groups**: Level-2 and level-3 rows reference level-1/level-2 `parentId` values. Since the entire `muscleGroupsData` array is inserted in a single batch, Postgres must resolve the self-ref constraint lazily (which it does for deferred FK checks) or the parent rows must appear first in the values list. The data array is ordered root → level-2 → level-3 to avoid any constraint-ordering issues at the DB level.
- **UUID format**: Hardcoded UUIDs use a non-random but valid UUID-v4 hex pattern. They will pass Postgres `uuid` type validation. No collision risk exists for seed data since all IDs are globally unique within the dataset.
