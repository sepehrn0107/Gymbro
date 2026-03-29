# Ideation Report

## Summary

Phase 1 adds a full exercise library to GymBro: a browsable, searchable list of exercises (global + user-custom), an exercise detail page, and a create-custom-exercise flow. The backing REST API exposes GET/POST on `/api/exercises`, GET `/api/exercises/[id]`, and three read-only lookup endpoints (`/api/muscle-groups`, `/api/exercise-types`, `/api/equipment`). Everything integrates into the existing Route Handler → Service → DB layering with no schema migrations required — the DB schema for exercises, muscle groups, equipment, and exercise types is already complete.

---

## Key design questions answered

- **GET /api/exercises shape — pagination vs. full list**
  Use server-side query-param filtering with pagination (`page`, `pageSize` via the existing `paginationSchema`). The exercises table can grow large (seeded global set + unlimited user customs). A full-list dump would not scale. Response shape: `ApiSuccess<PaginatedResponse<ExerciseListItem>>` using the already-typed `PaginatedResponse<T>` in `src/types/api.ts`. Supported query params: `q` (name search, ILIKE), `muscleGroupId` (filters on `primaryMuscleGroupId`), `exerciseTypeId`, `equipmentId`, `page`, `pageSize`. Ordering: global exercises first, then user-custom, both alphabetical within their group.

- **Data loading strategy — server component or client fetch**
  Use a **server component** for the initial list page render. The page at `src/app/(app)/exercises/page.tsx` reads search params from the URL (Next.js 15 `searchParams` prop), calls the service layer directly (no HTTP round-trip), and renders a static shell. A client-side `useExercises` hook is added only if live search-as-you-type is required (debounced fetch to `/api/exercises?q=...`). For Phase 1, favour the simpler server-render path; the hook can be added when the UX calls for instant search.

- **Search / filter strategy**
  Server-side. URL query params drive a Drizzle `where` clause. This keeps the payload small (mobile users), avoids sending thousands of rows to the client, and works correctly with pagination. The exercises list page updates its URL params on filter/search change (shallow router push), preserving back-button behaviour and shareability.

- **Create-custom-exercise form fields**
  Required: `name` (text, max 100 chars), `exerciseTypeId` (UUID, FK → exercise_types — required per schema `notNull`).
  Optional: `equipmentId` (UUID, FK → equipment), `primaryMuscleGroupId` (UUID, FK → muscle_groups), `secondaryMuscleGroupIds` (array of UUIDs, written to `exercise_secondary_muscles`), `instructions` (text, max 2000 chars).
  The `slug` is derived server-side from `name` (slugify + collision suffix). `isGlobal` is always `false`, `userId` is set from session. No `description` column exists in schema — `instructions` is the equivalent field.

- **Exercise detail page — what it shows**
  Exercise name, type badge, equipment, primary muscle group (with parent breadcrumb, e.g. "Upper Body > Arms > Biceps"), secondary muscle groups (chip list), instructions/description. For user-created exercises: an edit/delete affordance (owner only). "Log this exercise" CTA to initiate a workout (out of scope for Phase 1 — placeholder button is fine).

- **Hierarchical muscle group picker**
  The muscle_groups table is self-referential (max 3 levels: root → parent → leaf). For the form picker, fetch the full flat list from `GET /api/muscle-groups` (small, static data — caching appropriate) and build a nested structure client-side. Render as a two-step or cascading select: first pick a level-1 group (Upper Body / Lower Body / Core / etc.), then optionally drill into level-2, then level-3. A single `<select>` with `<optgroup>` grouping is simpler and sufficient for Phase 1; a full tree-picker modal is out of scope.

- **Auth edge cases and scoping**
  - `GET /api/exercises`: requires session (all routes must call `requireSession()`). Returns global exercises + only the caller's own custom exercises (`WHERE is_global = true OR user_id = $currentUserId`). Users never see each other's custom exercises.
  - `GET /api/exercises/[id]`: returns 404 (not 403) if the exercise exists but belongs to a different user — do not leak existence. Return `NotFoundError` whenever `exercise.userId !== null && exercise.userId !== currentUserId`.
  - `POST /api/exercises`: sets `isGlobal = false` and `userId = currentUserId` unconditionally — ignore any client-supplied values for these fields.
  - Lookup endpoints (`/api/muscle-groups`, `/api/exercise-types`, `/api/equipment`): still require a valid session (mobile app is auth-gated), but no user-scoping needed — data is global.
  - Slug uniqueness: `slug` has a `unique()` constraint. Server must handle `ConflictError` if the generated slug collides (append `-2`, `-3`, etc. before inserting, or catch the DB unique violation and retry).

---

## Risks and edge cases

- **Slug collision on custom exercises**: two users naming their exercise the same thing will collide on the global unique slug constraint. Mitigation: append a short uid or user-prefix when generating slugs for custom exercises (e.g. `bench-press-a3f9`), or make slug unique only within `(slug, isGlobal)` partition. Simplest safe path: always suffix custom exercise slugs with 4 random hex chars.
- **Secondary muscles insert atomicity**: creating an exercise with secondary muscles requires two DB operations (insert exercise, insert junction rows). Must run in a single Drizzle transaction to avoid orphaned exercises.
- **Muscle group depth enforcement**: schema comment says max 3 levels is enforced at the application layer only — service must validate depth before accepting a `primaryMuscleGroupId` or secondary muscle ID. Risk: seed data may include leaf nodes at depth 3; picker must not allow selecting a non-leaf as a "specific" target when the UX implies leaf selection.
- **Equipment is nullable**: `equipmentId` is nullable (bodyweight exercises). Form must make this field optional and the API must not reject a null value.
- **Large secondary muscle arrays**: no enforced limit on `exerciseSecondaryMuscles` rows per exercise. Should cap at a reasonable number (e.g. 10) in the validation schema.
- **Exercise name uniqueness per user**: the schema has no unique constraint on `(name, userId)`. A user could create two custom exercises named "My Press". This is not a DB error — acceptable for Phase 1, but worth noting for future deduplication.
- **Mobile performance**: the list page must be fast on low-bandwidth mobile. Server render + pagination avoids large payloads. Avoid eager-loading full instructions in the list response — return `id, name, slug, exerciseType, equipment, primaryMuscleGroup, isGlobal` only in the list; full details come from `GET /api/exercises/[id]`.
- **Cache invalidation**: lookup tables (muscle groups, exercise types, equipment) are static. Next.js route segment caching or `unstable_cache` is appropriate. Exercises list must not be cached globally (user-scoped data).

---

## Recommended scope

**In scope:**
- `GET /api/exercises` — paginated, filterable (q, muscleGroupId, exerciseTypeId, equipmentId), user-scoped
- `POST /api/exercises` — create custom exercise with secondary muscles in a transaction
- `GET /api/exercises/[id]` — full detail, visibility-checked
- `GET /api/muscle-groups` — full flat list (used client-side for picker)
- `GET /api/exercise-types` — full list
- `GET /api/equipment` — full list
- `ExerciseService` in `src/services/exercise.service.ts` (list, getById, create)
- `src/lib/validations/exercises.ts` — Zod schemas for create and query params
- Exercise list page: `src/app/(app)/exercises/page.tsx` (server component, server-rendered initial state, URL-param driven filters)
- Exercise detail page: `src/app/(app)/exercises/[slug]/page.tsx`
- Create exercise page/modal: `src/app/(app)/exercises/new/page.tsx`
- Slug generation utility (custom exercise suffix strategy)
- Unit tests for ExerciseService (list scoping, create transaction, visibility check)
- Integration/route tests for all 6 endpoints

**Out of scope:**
- Editing or deleting a custom exercise (Phase 2)
- "Log this exercise" / workout integration (Phase 2+)
- Favourite/bookmark exercises
- Admin-facing global exercise management
- Image/video attachments for exercises
- Full tree-picker UI component (use cascading selects for Phase 1)
- Infinite scroll (use next/prev pagination for Phase 1)
- Muscle group diagram / body map visualisation

---

## Files / areas likely to be touched

- `src/services/exercise.service.ts` — new file (list, getById, create)
- `src/lib/validations/exercises.ts` — new file (createExerciseSchema, exerciseQuerySchema)
- `src/app/api/exercises/route.ts` — new (GET list, POST create)
- `src/app/api/exercises/[id]/route.ts` — new (GET by ID)
- `src/app/api/muscle-groups/route.ts` — new (GET all)
- `src/app/api/exercise-types/route.ts` — new (GET all)
- `src/app/api/equipment/route.ts` — new (GET all)
- `src/app/(app)/exercises/page.tsx` — new (list page, server component)
- `src/app/(app)/exercises/[slug]/page.tsx` — new (detail page)
- `src/app/(app)/exercises/new/page.tsx` — new (create form page)
- `src/types/domain.ts` — add `ExerciseType`, `EquipmentItem`, `MuscleGroup`, `Exercise` domain types
- `src/types/api.ts` — potentially add `ExerciseListItem`, `ExerciseDetail` response types
- `src/db/schema/exercises.ts` — read-only (no changes needed)
- `src/lib/utils.ts` (or new `src/lib/slug.ts`) — slug generation helper

---

## ADR needed?

**Yes** — one ADR for the slug uniqueness strategy for user-created exercises. The choice between a global unique slug (with suffix randomisation) vs. a composite unique key `(slug, userId)` affects URL design (`/exercises/bench-press-a3f9` vs. `/exercises/bench-press`), future shareability, and how `GET /api/exercises/[id]` resolves lookups. This is a non-trivial design fork that warrants a recorded decision.
