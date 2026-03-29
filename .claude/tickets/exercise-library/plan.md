# Plan

## Implementation steps

### Infrastructure / Foundation

1. **`src/lib/slug.ts`** — New utility file.
   Create `generateCustomSlug(name: string): string` that slugifies the input and appends 4 random hex chars (e.g. `bench-press-a3f9`). This satisfies the global `unique()` constraint on `exercises.slug` for user-created exercises without requiring a composite key change. Also export `generateGlobalSlug(name: string): string` (no suffix) for seed/admin use. Isolated here so it can be unit-tested independently.
   *Why*: Slug generation is used in the service layer and must be deterministic-except-for-suffix; a dedicated module avoids leaking the strategy into the service.

2. **`src/lib/validations/exercises.ts`** — New validation module.
   Export:
   - `createExerciseSchema`: Zod object — `name` (string, min 1, max 100), `exerciseTypeId` (uuidSchema), `equipmentId` (uuidSchema.optional().nullable()), `primaryMuscleGroupId` (uuidSchema.optional().nullable()), `secondaryMuscleGroupIds` (array of uuidSchema, max 10, default `[]`), `instructions` (string, max 2000, optional).
   - `exerciseQuerySchema`: extends `paginationSchema` (import from `common.ts`) — adds optional `q` (string, max 100), `muscleGroupId` (uuidSchema.optional()), `exerciseTypeId` (uuidSchema.optional()), `equipmentId` (uuidSchema.optional()).
   - Inferred types: `CreateExerciseInput`, `ExerciseQueryInput`.
   *Why*: All input validation at the boundary (security standard); reuses existing `uuidSchema` and `paginationSchema` from `common.ts`; keeps schemas co-located by domain.

3. **`src/types/domain.ts`** — Modified.
   Append domain types (do not import from `db/schema` — keep standalone to avoid circular deps):
   - `MuscleGroup`: `{ id: string; name: string; slug: string; parentId: string | null }`
   - `ExerciseType`: `{ id: string; name: string }`
   - `EquipmentItem`: `{ id: string; name: string }`
   - `ExerciseListItem`: `{ id: string; name: string; slug: string; isGlobal: boolean; exerciseType: ExerciseType; equipment: EquipmentItem | null; primaryMuscleGroup: MuscleGroup | null }`
   - `ExerciseDetail`: extends `ExerciseListItem` with `instructions: string | null; secondaryMuscleGroups: MuscleGroup[]; userId: string | null; createdAt: Date }`
   *Why*: Domain types must live in `src/types/domain.ts` (existing pattern); decoupled from DB schema.

### Service Layer

4. **`src/services/exercise.service.ts`** — New service file.
   Export three functions:
   - `listExercises(userId: string, query: ExerciseQueryInput): Promise<PaginatedResponse<ExerciseListItem>>` — Drizzle query with `where: or(eq(exercises.isGlobal, true), eq(exercises.userId, userId))`, optional `ilike(exercises.name, ...)` for `q`, optional `eq(exercises.primaryMuscleGroupId, ...)` for `muscleGroupId`, `eq(exercises.exerciseTypeId, ...)`, `eq(exercises.equipmentId, ...)`. Join `exerciseTypes`, `equipment`, `muscleGroups` (for primary). Order: global first (`orderBy(desc(exercises.isGlobal), asc(exercises.name))`). Use `paginationSchema` defaults. Return `PaginatedResponse<ExerciseListItem>`.
   - `getExerciseById(id: string, userId: string): Promise<ExerciseDetail>` — fetch by `id`, join all related tables including `exerciseSecondaryMuscles`+`muscleGroups`. Throw `NotFoundError` if not found or if `!exercise.isGlobal && exercise.userId !== userId` (do not leak existence).
   - `createExercise(userId: string, input: CreateExerciseInput): Promise<ExerciseDetail>` — generate slug via `generateCustomSlug`, wrap insert of `exercises` + insert of `exerciseSecondaryMuscles` rows in a single Drizzle `db.transaction(...)`. Set `isGlobal = false`, `userId` unconditionally. Return full `ExerciseDetail` by calling `getExerciseById` inside the transaction.
   *Why*: Route Handler → Service → DB constraint; all business logic (scoping, visibility, transaction, slug) lives here and not in the HTTP handler.

5. **`src/services/lookup.service.ts`** — New service file.
   Export:
   - `getAllMuscleGroups(): Promise<MuscleGroup[]>` — select all from `muscleGroups`, ordered by `name`.
   - `getAllExerciseTypes(): Promise<ExerciseType[]>` — select all from `exerciseTypes`, ordered by `name`.
   - `getAllEquipment(): Promise<EquipmentItem[]>` — select all from `equipment`, ordered by `name`.
   These are simple read-all queries on static lookup tables; extracted to their own service to keep `exercise.service.ts` focused.
   *Why*: Single Responsibility; lookup data has different caching characteristics than exercises.

### API Route Handlers

6. **`src/app/api/exercises/route.ts`** — New route handler.
   - `GET`: call `requireSession()` → parse `request.nextUrl.searchParams` through `exerciseQuerySchema.safeParse(...)` → call `listExercises(userId, query)` → return `ok(result)`. On validation error throw `ValidationError`.
   - `POST`: call `requireSession()` → `parseBody(req, createExerciseSchema)` → call `createExercise(userId, input)` → return `ok(result, 201)`. Wrap in try/catch → `err(error)`.
   *Why*: Handler stays thin — no business logic, only auth guard + schema parse + service call + response formatting.

7. **`src/app/api/exercises/[id]/route.ts`** — New route handler.
   - `GET`: call `requireSession()` → `getExerciseById(params.id, userId)` → return `ok(result)`. The service throws `NotFoundError` for missing or inaccessible exercises, which `err()` maps to 404.
   *Why*: Consistent layer separation; 404 for unauthorised access (do not leak existence per ideation spec).

8. **`src/app/api/muscle-groups/route.ts`** — New route handler.
   - `GET`: `requireSession()` → `getAllMuscleGroups()` → `ok(result)`. Apply `next: { revalidate: 3600 }` (1-hour Next.js cache) — data is static.
   *Why*: Lookup data is global and rarely changes; caching reduces DB load on mobile clients re-opening the create form.

9. **`src/app/api/exercise-types/route.ts`** — New route handler.
   - `GET`: `requireSession()` → `getAllExerciseTypes()` → `ok(result)`. Apply `next: { revalidate: 3600 }`.

10. **`src/app/api/equipment/route.ts`** — New route handler.
    - `GET`: `requireSession()` → `getAllEquipment()` → `ok(result)`. Apply `next: { revalidate: 3600 }`.

### UI Components

11. **`src/components/exercises/ExerciseCard.tsx`** — New component.
    Renders a single exercise summary row/card: name, type badge (coloured chip), equipment label, primary muscle group. Accepts `exercise: ExerciseListItem` prop. Shows a "Custom" badge when `!isGlobal`. Dark OLED styling: surface `#111111`, rounded-xl, padding. Tapping navigates to `/exercises/[slug]`.
    *Why*: Smallest reusable unit of the list; isolated for independent testing and reuse in search results.

12. **`src/components/exercises/ExerciseList.tsx`** — New component.
    Renders a list of `ExerciseCard` components. Accepts `exercises: ExerciseListItem[]` and optional `emptyMessage: string`. Handles the empty state. No pagination logic here (page controls separate).
    *Why*: Separates iteration/empty-state concerns from individual card rendering.

13. **`src/components/exercises/MuscleGroupFilter.tsx`** — New client component (`"use client"`).
    Dropdown/select that accepts `muscleGroups: MuscleGroup[]` and `value: string | null` and `onChange: (id: string | null) => void`. Groups options by parent using `<optgroup>`. On change, calls `onChange` — the parent page updates the URL param via `useRouter().push`.
    *Why*: Client-interactive filter; receives pre-fetched muscle group list from server component parent to avoid redundant fetches.

14. **`src/components/exercises/ExerciseSearchBar.tsx`** — New client component (`"use client"`).
    Controlled text input with debounce (300 ms). Accepts `value: string` and `onSearch: (q: string) => void`. On change fires `onSearch` after debounce. Styled: bg `#1C1C1C`, border `#2563EB` on focus.
    *Why*: Debounce lives here; parent page drives the URL update from the callback.

15. **`src/components/exercises/CreateExerciseForm.tsx`** — New client component (`"use client"`).
    Full form: name input, exercise type select, equipment select (nullable), hierarchical muscle group cascading selects (level-1 → level-2 → level-3, built from flat `MuscleGroup[]` list), secondary muscles multi-select (checkboxes, capped at 10), instructions textarea. Accepts `exerciseTypes`, `equipment`, `muscleGroups` props (pre-fetched, passed from server page). On submit: POST to `/api/exercises`, redirect to new exercise detail page on success.
    *Why*: Keeps all form interactivity client-side; server page handles data fetching for dropdown options.

### UI Pages

16. **`src/app/(app)/exercises/page.tsx`** — New server component page.
    Reads `searchParams.q`, `searchParams.muscleGroupId`, `searchParams.exerciseTypeId`, `searchParams.equipmentId`, `searchParams.page` from URL. Calls `requireSession()` directly (server component), then calls `listExercises(userId, query)` directly (no HTTP round-trip). Fetches muscle groups for filter. Renders `ExerciseSearchBar` + `MuscleGroupFilter` (client components, value from URL params) + `ExerciseList` + pagination controls (prev/next). "Add exercise" link to `/exercises/new`.
    *Why*: Server render gives fast initial load on mobile; URL-param-driven state preserves back-button and shareability.

17. **`src/app/(app)/exercises/[slug]/page.tsx`** — New server component page.
    Receives `params.slug`. Calls `requireSession()`, then fetches exercise by slug via `getExerciseById` (need to look up by slug first — the service `getExerciseById` currently takes `id`; fetch by slug using a Drizzle `eq(exercises.slug, slug)` lookup in this page or expose a `getExerciseBySlug` variant in the service). Renders exercise name, type badge, equipment, primary muscle group breadcrumb (parent → leaf), secondary muscle group chips, instructions, "Log this exercise" placeholder button. Owner-only: shows "Delete" placeholder (wired to nothing in Phase 1 — `// TODO: Phase 2`).
    *Why*: Detail pages are read-heavy and benefit from server rendering; auth check before DB access follows project constraint.

18. **`src/app/(app)/exercises/new/page.tsx`** — New server component page.
    Calls `requireSession()`. Fetches `exerciseTypes`, `equipment`, `muscleGroups` from lookup service functions directly. Passes all three as props to `<CreateExerciseForm>`. No client-side fetching needed for form dropdowns.
    *Why*: Server component handles data loading; client component handles interactivity.

### Hook

19. **`src/hooks/useExercises.ts`** — New custom hook (client-side).
    `useExercises(query: Partial<ExerciseQueryInput>)` — manages debounced fetch to `/api/exercises?...` with SWR or manual `useState`/`useEffect`. Returns `{ exercises, total, page, isLoading, error }`. Included for completeness and future live-search UX; Phase 1 pages use server rendering, so this hook is not wired to any page yet but is ready for use.
    *Why*: Ideation specifies the hook for future client-side search-as-you-type; building it now avoids a later partial rework.

### ADR

20. **`.claude/memory/decisions/2026-03-29-exercise-slug-strategy.md`** — New ADR.
    Documents the decision: custom exercise slugs use 4-char random hex suffix (e.g. `bench-press-a3f9`) to satisfy the global unique constraint without a schema migration or composite key change. Records context, decision, consequences, and alternatives (composite unique key, UUID-only slug).
    *Why*: Documentation standard — non-trivial design choice with URL and shareability implications; must be recorded per ADR policy.

---

## Test strategy

Tests are written in the same Vitest framework used by existing tests (`src/lib/__tests__/`). Write in this order:

**1. Unit tests — service layer (pure logic, mock DB)**

- `src/services/__tests__/exercise.service.test.ts`
  - `listExercises`: assert scoping (`isGlobal=true OR userId=currentUser`), that other users' custom exercises are excluded, pagination math, filter combinations (q, muscleGroupId, exerciseTypeId, equipmentId), ordering (global before custom).
  - `getExerciseById`: assert 404 when exercise does not exist, assert 404 (not 403) when exercise belongs to different user, assert successful fetch for global exercise, assert successful fetch for owned custom exercise.
  - `createExercise`: assert `isGlobal=false` and `userId` are set regardless of input, assert `slug` ends with 4 hex chars, assert `secondaryMuscleGroupIds` capped at 10 (validated upstream but confirm no DB insert beyond 10), assert transaction rollback when secondary muscle insert fails (mock DB transaction error).

- `src/lib/__tests__/slug.test.ts`
  - `generateCustomSlug`: produces valid slug format, appends exactly 4 hex chars, handles special chars in name, consistent length regardless of input.

**2. Validation unit tests**

- `src/lib/__tests__/validations.exercise.test.ts`
  - `createExerciseSchema`: rejects missing `name`, rejects `name` > 100 chars, rejects invalid `exerciseTypeId` UUID, accepts null `equipmentId`, rejects `secondaryMuscleGroupIds` with > 10 items, rejects `instructions` > 2000 chars.
  - `exerciseQuerySchema`: accepts empty params with defaults, coerces `page`/`pageSize` strings to numbers, rejects `page < 1`, rejects `pageSize > 100`.

**3. API route handler tests (integration-style, real DB or test DB)**

- `src/app/api/exercises/__tests__/route.test.ts`
  - `GET /api/exercises`: 401 without session, 200 with session + correct shape, filters applied correctly, pagination works.
  - `POST /api/exercises`: 401 without session, 422 on invalid body, 201 on valid body with correct `isGlobal=false`/`userId` in response.
- `src/app/api/exercises/[id]/__tests__/route.test.ts`
  - `GET /api/exercises/:id`: 401 without session, 404 for unknown ID, 404 (not 403) for another user's exercise, 200 for own exercise, 200 for global exercise.
- `src/app/api/muscle-groups/__tests__/route.test.ts` — 401 without session, 200 returns array.
- (Similar lightweight 401/200 tests for `/api/exercise-types` and `/api/equipment`.)

**4. Component tests (Vitest + Testing Library)**

- `src/components/exercises/__tests__/ExerciseCard.test.tsx` — renders name, type badge, "Custom" badge when `isGlobal=false`, link href correct.
- `src/components/exercises/__tests__/ExerciseSearchBar.test.tsx` — calls `onSearch` after debounce, does not call immediately on every keystroke.
- `src/components/exercises/__tests__/CreateExerciseForm.test.tsx` — renders all fields, submits correct payload, shows validation errors on failed response, disables submit while pending.

---

## Files

### New
- `src/lib/slug.ts`
- `src/lib/validations/exercises.ts`
- `src/services/exercise.service.ts`
- `src/services/lookup.service.ts`
- `src/app/api/exercises/route.ts`
- `src/app/api/exercises/[id]/route.ts`
- `src/app/api/muscle-groups/route.ts`
- `src/app/api/exercise-types/route.ts`
- `src/app/api/equipment/route.ts`
- `src/app/(app)/exercises/page.tsx`
- `src/app/(app)/exercises/[slug]/page.tsx`
- `src/app/(app)/exercises/new/page.tsx`
- `src/components/exercises/ExerciseCard.tsx`
- `src/components/exercises/ExerciseList.tsx`
- `src/components/exercises/MuscleGroupFilter.tsx`
- `src/components/exercises/ExerciseSearchBar.tsx`
- `src/components/exercises/CreateExerciseForm.tsx`
- `src/hooks/useExercises.ts`
- `src/services/__tests__/exercise.service.test.ts`
- `src/lib/__tests__/slug.test.ts`
- `src/lib/__tests__/validations.exercise.test.ts`
- `src/app/api/exercises/__tests__/route.test.ts`
- `src/app/api/exercises/[id]/__tests__/route.test.ts`
- `src/app/api/muscle-groups/__tests__/route.test.ts`
- `src/components/exercises/__tests__/ExerciseCard.test.tsx`
- `src/components/exercises/__tests__/ExerciseSearchBar.test.tsx`
- `src/components/exercises/__tests__/CreateExerciseForm.test.tsx`
- `.claude/memory/decisions/2026-03-29-exercise-slug-strategy.md`

### Modified
- `src/types/domain.ts` — add `MuscleGroup`, `ExerciseType`, `EquipmentItem`, `ExerciseListItem`, `ExerciseDetail`

---

## Component breakdown

Group into 4 clusters for parallel implementation sub-agents:

**Cluster A — Data Layer (blocking; must finish first)**
Files: `src/lib/slug.ts`, `src/lib/validations/exercises.ts`, `src/types/domain.ts` (modifications), `src/services/exercise.service.ts`, `src/services/lookup.service.ts`
Unit tests: `src/lib/__tests__/slug.test.ts`, `src/lib/__tests__/validations.exercise.test.ts`, `src/services/__tests__/exercise.service.test.ts`
*These produce the types and functions all other clusters depend on.*

**Cluster B — API Route Handlers (depends on Cluster A)**
Files: `src/app/api/exercises/route.ts`, `src/app/api/exercises/[id]/route.ts`, `src/app/api/muscle-groups/route.ts`, `src/app/api/exercise-types/route.ts`, `src/app/api/equipment/route.ts`
Tests: `src/app/api/exercises/__tests__/route.test.ts`, `src/app/api/exercises/[id]/__tests__/route.test.ts`, `src/app/api/muscle-groups/__tests__/route.test.ts`
*Thin handlers only; all depend on Cluster A services and types.*

**Cluster C — Primitive UI Components (depends on Cluster A types; can run in parallel with Cluster B)**
Files: `src/components/exercises/ExerciseCard.tsx`, `src/components/exercises/ExerciseList.tsx`, `src/components/exercises/MuscleGroupFilter.tsx`, `src/components/exercises/ExerciseSearchBar.tsx`
Tests: `src/components/exercises/__tests__/ExerciseCard.test.tsx`, `src/components/exercises/__tests__/ExerciseSearchBar.test.tsx`
*No dependency on route handlers; needs domain types from Cluster A.*

**Cluster D — Pages, Form, and Hook (depends on Clusters A, B, C)**
Files: `src/app/(app)/exercises/page.tsx`, `src/app/(app)/exercises/[slug]/page.tsx`, `src/app/(app)/exercises/new/page.tsx`, `src/components/exercises/CreateExerciseForm.tsx`, `src/hooks/useExercises.ts`
Tests: `src/components/exercises/__tests__/CreateExerciseForm.test.tsx`
ADR: `.claude/memory/decisions/2026-03-29-exercise-slug-strategy.md`
*Full-stack integration; assembles all prior work.*

---

## Risks and mitigations

- **Slug collision on global unique constraint**: two users using the same name for a custom exercise will collide. Mitigation: `generateCustomSlug` appends 4 random hex chars, making collisions astronomically unlikely (~65k combinations per name). If a collision still occurs (DB unique violation), the service catches the Postgres `23505` error code, retries once with a new suffix, then throws `ConflictError`.

- **Secondary muscle insert atomicity**: insert of `exercises` row and `exerciseSecondaryMuscles` rows must be atomic. Mitigation: wrap both in a single `db.transaction(async (tx) => { ... })` call. If the junction insert fails, the exercise row is rolled back.

- **`getExerciseBySlug` gap**: the service is designed around `id` lookups, but the detail page URL uses `slug`. Mitigation: expose a `getExerciseBySlug(slug, userId)` variant in `exercise.service.ts` (or a single function that accepts either — pick slug). This is noted as a variant in step 17 above; the sub-agent implementing the service must include it.

- **Muscle group depth enforcement (application-layer only)**: schema allows any depth; no DB constraint. Mitigation: the service validates that provided `primaryMuscleGroupId` and each secondary muscle group ID exist (via a join/subquery). Depth enforcement beyond "exists" is deferred to Phase 2; the form UX naturally limits depth via cascading selects.

- **`exerciseQuerySchema` `page`/`pageSize` defaults**: `paginationSchema` requires both fields; URL params may omit them. Mitigation: extend `paginationSchema` with `.default(1)` and `.default(20)` overrides in `exerciseQuerySchema`, or use `.optional()` with defaults via `.transform()`. Confirm behaviour in validation tests.

- **No `src/hooks/` directory exists yet**: the hooks directory does not currently exist in the repo. Mitigation: the sub-agent implementing Cluster D creates it (`src/hooks/useExercises.ts`). No config changes needed — `@/hooks` path alias resolves via the existing `@/*` tsconfig path.

- **No `src/services/` directory exists yet**: same issue. Mitigation: Cluster A sub-agent creates the directory with the first service file.

- **Cache invalidation on lookup endpoints**: Next.js route segment cache must not bleed into user-scoped exercise list. Mitigation: lookup routes (`/api/muscle-groups`, etc.) use `next: { revalidate: 3600 }`; the exercises route explicitly uses `export const dynamic = 'force-dynamic'` to prevent any accidental static caching of user-scoped data.
