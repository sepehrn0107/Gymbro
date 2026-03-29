# Verification Report

Date: 2026-03-29
Verifier: QA sub-agent (Phase 4)
Ticket: Exercise Library — Phase 1

---

## Checklist

- [x] All planned files created
- [x] Architecture layering respected (no DB in handlers, no HTTP in services)
- [x] requireSession() called first in every API route (directly or via getCurrentUserId())
- [x] User scoping enforced (custom exercises not visible to other users)
- [x] Next.js 15 params/searchParams awaited
- [x] Edge cases covered in tests
- [x] Error paths handled correctly

---

## Detailed Findings

### 1. Architecture Layering

PASS. The Route Handler → Service → DB boundary is consistently respected across all files.

- `src/app/api/exercises/route.ts` — calls `requireSession()`, parses query/body via Zod, delegates to `listExercises` / `createExercise`. No DB imports.
- `src/app/api/exercises/[id]/route.ts` — calls `requireSession()`, delegates to `getExerciseById`. No DB imports.
- `src/app/api/muscle-groups/route.ts`, `exercise-types/route.ts`, `equipment/route.ts` — each calls `requireSession()` then one lookup-service function. No DB imports.
- `src/services/exercise.service.ts` — contains all DB access via Drizzle. No `next/*` or HTTP imports. Comment block at top explicitly declares the rule.
- `src/services/lookup.service.ts` — same pattern.
- All server component pages (`exercises/page.tsx`, `exercises/[slug]/page.tsx`, `exercises/new/page.tsx`) call service functions directly (no HTTP round-trips as intended for server rendering).

### 2. Security — requireSession() First

PASS with observation.

- All five API route handlers call `requireSession()` as the **first** awaited call inside the `try` block, before any DB access or request parsing. This matches the project's stated constraint ("All API routes must call `requireSession()` before any DB access").
- The three server component pages use `getCurrentUserId()` instead of `requireSession()`. This is **equally secure**: `getCurrentUserId()` calls `requireSession()` internally and additionally asserts `session.user.id` is present. This is a stricter check, not a weaker one. The deviation is documented in the Cluster D implementation summary.
- `exercises/new/page.tsx` calls `await getCurrentUserId()` before any data fetch. The return value (the user ID) is not stored because the new exercise page does not need the ID in the template — it only needs to confirm auth before exposing the form. This is acceptable: authentication is enforced.

### 3. Security — User Scoping

PASS.

- `getExerciseById` (line 185–194): fetches by ID, then checks `!row.isGlobal && row.userId !== userId` and throws `NotFoundError` (not `ForbiddenError`) when the exercise belongs to a different user. Existence is not leaked.
- `getExerciseBySlug` (line 224–228): identical logic using slug lookup.
- `listExercises` (line 94–97): `or(eq(exercises.isGlobal, true), eq(exercises.userId, userId))` — other users' custom exercises are excluded at the DB query level.
- `createExercise` (line 256–258): `isGlobal: false` and `userId` are hard-coded unconditionally; the caller's input cannot override them.

### 4. Next.js 15 — params and searchParams Awaited

PASS.

- `exercises/page.tsx` (line 17–28): `searchParams: Promise<{...}>` type, `const params = await searchParams`. Comment explains why.
- `exercises/[slug]/page.tsx` (line 11–16): `params: Promise<{ slug: string }>` type, `const { slug } = await params`. Comment explains why.
- `src/app/api/exercises/[id]/route.ts` (line 7, 13): `{ params }: { params: Promise<{ id: string }> }`, `const { id } = await params`.
- `exercises/new/page.tsx` does not receive dynamic params — N/A.

### 5. Domain Types — Consistency

PASS.

- `src/types/domain.ts` defines `MuscleGroup`, `ExerciseType`, `EquipmentItem`, `ExerciseListItem`, `ExerciseDetail` as standalone types with no `db/schema` import.
- All service functions, hooks, and components import from `@/types/domain`. No cross-layer type leakage detected.
- `ExerciseDetail` correctly extends `ExerciseListItem` with `instructions`, `secondaryMuscleGroups`, `userId`, `createdAt`.
- `PaginatedResponse<T>` (from `@/types/api`) is used consistently: the service returns `{ items, total, page, pageSize }`, and tests assert on `json.data.items`.

### 6. Completeness — All Planned Files

PASS. All 29 files in the "New" list of `plan.md` are present:

**Infrastructure / Services**
- `src/lib/slug.ts` — present
- `src/lib/validations/exercises.ts` — present
- `src/services/exercise.service.ts` — present
- `src/services/lookup.service.ts` — present

**API Routes**
- `src/app/api/exercises/route.ts` — present
- `src/app/api/exercises/[id]/route.ts` — present
- `src/app/api/muscle-groups/route.ts` — present
- `src/app/api/exercise-types/route.ts` — present
- `src/app/api/equipment/route.ts` — present

**Pages**
- `src/app/(app)/exercises/page.tsx` — present
- `src/app/(app)/exercises/[slug]/page.tsx` — present
- `src/app/(app)/exercises/new/page.tsx` — present

**Components**
- `src/components/exercises/ExerciseCard.tsx` — present
- `src/components/exercises/ExerciseList.tsx` — present
- `src/components/exercises/MuscleGroupFilter.tsx` — present
- `src/components/exercises/ExerciseSearchBar.tsx` — present
- `src/components/exercises/CreateExerciseForm.tsx` — present
- `src/components/exercises/ExercisePageControls.tsx` — present (unplanned addition, documented as deviation; required to keep `exercises/page.tsx` a Server Component)

**Hook**
- `src/hooks/useExercises.ts` — present

**Tests**
- `src/services/__tests__/exercise.service.test.ts` — present (16 tests)
- `src/lib/__tests__/slug.test.ts` — present (16 tests)
- `src/lib/__tests__/validations.exercise.test.ts` — present (34 tests)
- `src/app/api/exercises/__tests__/route.test.ts` — present (11 tests)
- `src/app/api/exercises/[id]/__tests__/route.test.ts` — present (6 tests)
- `src/app/api/muscle-groups/__tests__/route.test.ts` — present (4 tests)
- `src/components/exercises/__tests__/ExerciseCard.test.tsx` — present (12 tests)
- `src/components/exercises/__tests__/ExerciseSearchBar.test.tsx` — present (9 tests)
- `src/components/exercises/__tests__/CreateExerciseForm.test.tsx` — present (29 tests)

**ADR**
- `.claude/memory/decisions/2026-03-29-exercise-slug-strategy.md` — present

**Modified**
- `src/types/domain.ts` — appended with all 5 required domain types

### 7. Test Coverage — Key Paths and Edge Cases

PASS.

**Service layer (exercise.service.test.ts)**
- `listExercises`: paginated results, userId scoping verified (where clause called), page/pageSize limit+offset math
- `getExerciseById`: global exercise (200), own custom exercise (200), not found (NotFoundError), other user's exercise → NotFoundError (not ForbiddenError), secondary muscle mapping
- `getExerciseBySlug`: found by slug, slug not found, slug matches other user's exercise → NotFoundError
- `createExercise`: isGlobal=false+userId enforced, slug via generateCustomSlug, secondary muscles in transaction, retry on pg 23505, ConflictError on double collision

**Validation (validations.exercise.test.ts)**
- Schema boundary values tested (name 100, instructions 2000, secondaryMuscleGroupIds 10)
- UUID validation on all UUID fields
- Defaults: secondaryMuscleGroupIds=[], page=1, pageSize=20
- Coercion of string page/pageSize to numbers

**API routes**
- 401 without session on all tested endpoints
- 422 on invalid query params (page < 1, non-UUID muscleGroupId)
- 422 on invalid POST body (missing name, invalid UUID, >10 secondary IDs)
- 201 on valid POST with correct isGlobal=false/userId in response
- 404 for unknown ID and for other user's exercise (not 403)
- 200 for global and own custom exercise
- userId from session correctly forwarded to service calls

**Component tests**
- ExerciseCard: href, Custom badge visibility, equipment/muscle group labels, type badge (logic-level testing, documented deviation from RTL plan due to no jsdom in test environment)
- ExerciseSearchBar: debounce fires after delay, not immediately; single call per burst; clears correctly (logic-level)
- CreateExerciseForm: payload construction, cascading muscle groups, secondary limit enforcement, error handling (422 and generic), pending state, redirect path (logic-level)

### 8. Error Handling

PASS.

- All API route handlers wrap the entire body in `try/catch` and call `err(error)` for uniform error serialization.
- `NotFoundError` is thrown for missing AND for other-user exercises — 404 in both cases; no existence leakage.
- `ConflictError` thrown after double slug collision with meaningful message.
- `ValidationError` thrown with structured `fields` payload for schema failures.
- `createExercise` inner generic errors (`"Exercise insert returned no rows"`, `"Could not re-fetch created exercise"`) bubble up through the transaction and will be caught by the route handler's `err()`.
- `exercises/[slug]/page.tsx` explicitly catches `NotFoundError` and calls `notFound()` (Next.js 404 page); all other errors re-throw and propagate to Next.js error boundary.
- `useExercises` hook uses an `AbortController`-compatible cancelled flag pattern to prevent state updates on unmounted components.

### 9. Slug Implementation

PASS.

- `generateCustomSlug`: slugify (lowercase, non-alphanumeric → hyphens, collapse, trim) + 4 hex chars via `Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0")`. Matches ADR spec.
- `generateGlobalSlug`: deterministic, no suffix.
- Collision retry: service catches `code === "23505"`, retries once, throws `ConflictError` on second collision. Verified in tests.

### 10. Caching Strategy

PASS.

- `exercises/route.ts`: `export const dynamic = "force-dynamic"` prevents static caching of user-scoped data.
- `exercises/page.tsx` (server component): same `export const dynamic = "force-dynamic"`.
- Lookup routes (`muscle-groups`, `exercise-types`, `equipment`): `export const revalidate = 3600` for 1-hour cache of global static data.

---

## Issues Found

**Minor — not blocking:**

1. `src/app/(app)/exercises/new/page.tsx` — `getCurrentUserId()` return value is discarded (`await getCurrentUserId()` without assignment). This correctly enforces authentication but the user ID is not available in the template. For Phase 1 this is intentional — the page only needs auth, not the ID. However, if Phase 2 adds owner context to the create page, the pattern will need updating. **Not a defect; documented deviation.**

2. `src/app/api/exercises/route.ts` — `userId` is cast with `as string` (`session.user?.id as string`). If `session.user.id` is undefined, this would silently pass `undefined` to `listExercises`. In practice, `requireSession()` does not assert `user.id` is present (unlike `getCurrentUserId()`). This is a latent type-safety gap: a session without a user ID would reach the service as an empty/undefined string. Risk is low (Auth.js v5 always populates user.id on valid sessions) but worth hardening. Same pattern exists in `[id]/route.ts`. **Minor type-safety risk; not a functional bug under normal Auth.js operation.**

3. Component tests use logic-extraction pattern rather than RTL DOM rendering due to no jsdom in test environment. This means integration-level behaviors (actual render output, DOM structure, ARIA attributes) are not tested. This is a pre-existing infrastructure gap, documented in the Cluster C implementation summary. **Not introduced by this implementation.**

---

## Verdict

PASS
