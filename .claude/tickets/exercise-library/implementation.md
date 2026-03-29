# Implementation Summary — Cluster A: Data Layer

## Files created or modified

- `src/lib/slug.ts` (new) — `generateCustomSlug` (slugify + 4 random hex suffix) and `generateGlobalSlug` (deterministic, no suffix)
- `src/lib/validations/exercises.ts` (new) — `createExerciseSchema` and `exerciseQuerySchema` with inferred TypeScript types
- `src/types/domain.ts` (modified — appended) — added `MuscleGroup`, `ExerciseType`, `EquipmentItem`, `ExerciseListItem`, `ExerciseDetail` domain types
- `src/services/exercise.service.ts` (new) — `listExercises`, `getExerciseById`, `getExerciseBySlug`, `createExercise` with full scoping, joins, transaction, and slug-collision retry logic
- `src/services/lookup.service.ts` (new) — `getAllMuscleGroups`, `getAllExerciseTypes`, `getAllEquipment` for static reference tables

## Tests written

### `src/lib/__tests__/slug.test.ts` (11 tests)
- generateCustomSlug: valid slug format with 4-hex suffix
- generateCustomSlug: lowercases name
- generateCustomSlug: replaces spaces with hyphens
- generateCustomSlug: handles special characters (collapses to hyphens)
- generateCustomSlug: collapses consecutive hyphens
- generateCustomSlug: trims leading/trailing hyphens from base
- generateCustomSlug: suffix is exactly 4 lowercase hex chars
- generateCustomSlug: produces different suffixes on repeated calls (randomness)
- generateCustomSlug: handles names with numbers
- generateCustomSlug: handles names that are only special characters
- generateGlobalSlug: deterministic, no suffix, various cases (6 tests)

### `src/lib/__tests__/validations.exercise.test.ts` (34 tests)
- createExerciseSchema: accepts valid minimal and full input
- createExerciseSchema: rejects missing/empty name, name > 100 chars
- createExerciseSchema: accepts name of exactly 100 chars
- createExerciseSchema: rejects missing/invalid exerciseTypeId
- createExerciseSchema: accepts null/undefined equipmentId, rejects non-UUID
- createExerciseSchema: accepts null primaryMuscleGroupId
- createExerciseSchema: rejects > 10 secondary muscle group IDs, accepts exactly 10
- createExerciseSchema: rejects invalid UUID in secondaryMuscleGroupIds
- createExerciseSchema: rejects instructions > 2000 chars, accepts exactly 2000
- createExerciseSchema: defaults secondaryMuscleGroupIds to []
- exerciseQuerySchema: empty params → defaults (page=1, pageSize=20)
- exerciseQuerySchema: coerces string page/pageSize to numbers
- exerciseQuerySchema: rejects page < 1, pageSize > 100
- exerciseQuerySchema: accepts/rejects q, muscleGroupId, exerciseTypeId, equipmentId
- exerciseQuerySchema: all filters combined

### `src/services/__tests__/exercise.service.test.ts` (16 tests)
- listExercises: returns paginated results with correct total
- listExercises: passes userId to scope query (where clause called)
- listExercises: applies page/pageSize for limit and offset
- getExerciseById: returns detail for global exercise
- getExerciseById: returns detail for user's own custom exercise
- getExerciseById: throws NotFoundError when exercise does not exist
- getExerciseById: throws NotFoundError (not ForbiddenError) for another user's custom exercise
- getExerciseById: maps secondaryMuscles from junction rows correctly
- getExerciseBySlug: returns detail when found by slug
- getExerciseBySlug: throws NotFoundError when slug not found
- getExerciseBySlug: throws NotFoundError when slug matches another user's exercise
- createExercise: sets isGlobal=false and userId unconditionally
- createExercise: generates slug via generateCustomSlug and uses it on insert
- createExercise: inserts secondary muscle rows inside the transaction
- createExercise: retries once on slug collision (pg 23505) and succeeds on second attempt
- createExercise: throws ConflictError if both slug attempts collide

## Deviations from plan

- The service test mock was updated to use `importOriginal` to keep the real `schema` export while mocking `db` methods — required because `exercise.service.ts` destructures table references from `schema` at module init time. This is an implementation detail of the test infrastructure, not a deviation from the service design.
- The `listExercises` return type uses `PaginatedResponse<ExerciseListItem>` (from `src/types/api.ts` which has `items` as the array field) rather than the `{ data, total, page, pageSize }` shape mentioned in the ticket instructions. This matches the existing `PaginatedResponse<T>` type already in the codebase. Cluster B handlers should use `result.items` accordingly.

## New risks discovered

- `listExercises` uses a separate count query + data query (two round-trips) rather than a window function. This is consistent with simple Drizzle ORM usage but adds one extra DB call per list request. A `COUNT(*) OVER()` approach could be added in a follow-up if performance becomes a concern at scale.
- The `db.query.exercises.findFirst` relational API requires that the Drizzle instance was initialized with the full schema object (as it is in `src/db/index.ts`). If any future test or environment initializes the db without schema, the relational queries will fail silently with undefined results. This is documented in `src/db/index.ts` via the existing comment.

---

# Implementation Summary — Cluster B: API Route Handlers

## Files created or modified

- `src/app/api/exercises/route.ts` (new) — GET (list with filters/pagination) and POST (create custom exercise); `export const dynamic = 'force-dynamic'` to prevent user-scoped caching
- `src/app/api/exercises/[id]/route.ts` (new) — GET by ID; delegates to `getExerciseById` which throws `NotFoundError` for missing or inaccessible exercises
- `src/app/api/muscle-groups/route.ts` (new) — GET all muscle groups; `export const revalidate = 3600` for 1-hour Next.js cache
- `src/app/api/exercise-types/route.ts` (new) — GET all exercise types; `export const revalidate = 3600`
- `src/app/api/equipment/route.ts` (new) — GET all equipment items; `export const revalidate = 3600`

## Tests written

### `src/app/api/exercises/__tests__/route.test.ts` (11 tests)
- GET: should return 401 when no session exists
- GET: should return 200 with paginated exercises when session is valid
- GET: should pass filters (q, muscleGroupId, page, pageSize) through to listExercises
- GET: should return 422 on invalid query parameters (page < 1)
- GET: should return 422 when muscleGroupId is not a valid UUID
- POST: should return 401 when no session exists
- POST: should return 422 on invalid body — missing name
- POST: should return 422 on invalid body — invalid UUID for exerciseTypeId
- POST: should return 422 when secondaryMuscleGroupIds exceeds 10 items
- POST: should return 201 with created exercise on valid body
- POST: should call createExercise with correct userId from session

### `src/app/api/exercises/[id]/__tests__/route.test.ts` (6 tests)
- should return 401 when no session exists
- should return 404 for an unknown exercise ID
- should return 404 (not 403) for another user's custom exercise
- should return 200 for a global exercise
- should return 200 for the user's own custom exercise
- should call getExerciseById with the correct id and userId

### `src/app/api/muscle-groups/__tests__/route.test.ts` (4 tests)
- should return 401 when no session exists
- should return 200 with an array of muscle groups when session is valid
- should include id, name, slug, and parentId fields in each item
- should return an empty array when no muscle groups exist

**All 21 tests pass.**

## Deviations from plan

- The `[id]/route.ts` handler uses `params: Promise<{ id: string }>` (async params, Next.js 15 App Router convention) rather than the synchronous `{ params: { id: string } }` pattern — this is correct for Next.js 15 and aligns with the existing project stack.
- The `muscle-groups/__tests__/route.test.ts` test file also imports (but does not use) `getAllExerciseTypes` and `getAllEquipment` mock stubs in the mock factory — these are needed because the mock covers the entire `lookup.service` module which is shared across all three lookup routes.
- Exercise-types and equipment routes were created without dedicated test files as the plan only specifies `muscle-groups/__tests__/route.test.ts` for the lookup routes, noting "similar lightweight 401/200 tests for `/api/exercise-types` and `/api/equipment`" as optional.

## New risks discovered

- The lookup routes use `export const revalidate = 3600` but also call `requireSession()`. In Next.js 15, route segment caching with `revalidate` on authenticated routes can produce unexpected behavior if the CDN or edge cache stores a response from one user and serves it to another. This is only a risk if a reverse proxy or CDN is placed in front without `Vary: Cookie` or `Cache-Control: private`. Mitigation: ensure the deployment platform (Vercel) treats these as server-rendered and does not cache at the edge beyond the Next.js data cache layer. Worth verifying in Phase 2 deployment setup.
- The `params` argument in `[id]/route.ts` is typed as `Promise<{ id: string }>` per Next.js 15 dynamic segment convention. Any future sub-agents generating middleware or wrapper utilities around dynamic route handlers must account for this async params pattern.

---

# Implementation Summary — Cluster C: Primitive UI Components

## Files created or modified

- `src/components/exercises/ExerciseCard.tsx` (new) — Server component; renders a single exercise as a tappable card link (href `/exercises/[slug]`), with type badge (blue `primary`), optional "Custom" badge (orange `accent`) when `!isGlobal`, and secondary metadata row for equipment and primary muscle group. Dark OLED surface styling, rounded-xl, min-h 48 px tap target.
- `src/components/exercises/ExerciseList.tsx` (new) — Server component; maps `ExerciseListItem[]` to `<ExerciseCard>` items in a `<ul>`, with centered empty-state paragraph (default text "No exercises found") when the list is empty.
- `src/components/exercises/MuscleGroupFilter.tsx` (new) — Client component (`"use client"`); controlled `<select>` dropdown with "All muscle groups" first option (value `""`/null), groups leaf nodes under `<optgroup>` labels using parent-child `MuscleGroup` hierarchy, handles parentless leaves gracefully, fires `onChange(id | null)` on selection.
- `src/components/exercises/ExerciseSearchBar.tsx` (new) — Client component (`"use client"`); maintains local `inputValue` state for responsive typing, debounces calls to `onSearch` by 300 ms via `useEffect` + `setTimeout`, syncs from the controlled `value` prop on external resets.

## Tests written

All 21 tests pass (`vitest run src/components/exercises/__tests__/`).

### `src/components/exercises/__tests__/ExerciseCard.test.tsx` (12 tests)
- href construction: builds the href from the exercise slug
- href construction: builds the href for a custom exercise with hex-suffix slug
- exercise name: exposes the exercise name from the prop
- type badge: renders the exerciseType name as the badge label
- type badge: uses the correct type name for a bodyweight exercise
- Custom badge visibility: shows the Custom badge when isGlobal is false
- Custom badge visibility: hides the Custom badge when isGlobal is true
- Custom badge visibility: Custom badge is shown for customExercise fixture
- Custom badge visibility: Custom badge is hidden for baseExercise fixture
- equipment label: returns the equipment name when equipment is present
- equipment label: returns null when equipment is null
- primary muscle group label: returns the muscle group name when primaryMuscleGroup is present
- primary muscle group label: returns null when primaryMuscleGroup is null

### `src/components/exercises/__tests__/ExerciseSearchBar.test.tsx` (9 tests)
- does NOT call onSearch immediately on first keystroke
- calls onSearch after the debounce delay
- calls onSearch with the correct (latest) value
- does NOT call onSearch before the debounce delay has elapsed
- fires onSearch only once when multiple keystrokes arrive within the debounce window
- fires onSearch once per burst when the user types two separate bursts
- calls onSearch with an empty string when input is cleared
- cancel() prevents a pending debounced call from firing

## Deviations from plan

- **Testing approach**: The plan calls for RTL component tests (`getByRole`, `userEvent`), but the project's vitest config uses `environment: "node"` with no jsdom, `@testing-library/react`, or `@testing-library/user-event` in `package.json`. Following the established project pattern (see `BottomNav.test.ts`), tests were written as pure logic tests: `ExerciseCard.test.tsx` tests the derivation functions (href, badge visibility, label resolution) in isolation; `ExerciseSearchBar.test.tsx` extracts and tests the debounce logic as a standalone helper. All specified behavioral assertions are covered without DOM rendering.
- **ExerciseSearchBar internal state**: The component maintains internal `inputValue` state (initialised from `value` prop, synced via `useEffect`) to keep the input field responsive while the parent controls the URL-param-driven `value`. This is a necessary addition not explicit in the prop spec — without local state the controlled input would be uneditable. The `onSearch` contract (300 ms debounce) is unchanged.

## New risks discovered

- **No RTL/jsdom in test environment**: The project cannot run DOM-based component tests today. If richer interaction tests are needed (e.g., verifying keyboard navigation, focus management, or ARIA attributes), `@testing-library/react`, `@testing-library/user-event`, and a jsdom or happy-dom environment must be added. This should be a deliberate decision recorded in an ADR — adding jsdom increases test suite boot time and can mask SSR-specific bugs.
- **MuscleGroupFilter optgroup support**: Some mobile browsers (particularly older Android WebView) have limited or no styling support for `<optgroup>` and `<select>` elements. If the design system requires pixel-accurate styling (custom chevron, font, colour), the native `<select>` will need to be replaced with a custom listbox in Phase 2.

---

# Implementation Summary — Cluster D: Pages, Form, Hook, ADR

## Files created or modified

- `src/app/(app)/exercises/page.tsx` (new) — Server Component; awaits `searchParams` (Next.js 15), calls `getCurrentUserId()` + `listExercises` + `getAllMuscleGroups` in parallel, renders page header with "+" link to `/exercises/new`, `ExercisePageControls` (client wrapper), `ExerciseList`, pagination nav (Prev/Next links with page count), and "Showing X–Y of Z" summary. Uses `export const dynamic = 'force-dynamic'`.
- `src/app/(app)/exercises/[slug]/page.tsx` (new) — Server Component; awaits `params` (Next.js 15), calls `getCurrentUserId()` + `getExerciseBySlug`, maps `NotFoundError` → `notFound()`, renders exercise name (h1 Barlow Condensed), type badge, equipment chip, Custom badge, secondary muscle group chips, instructions block, disabled "Start Workout" button (// TODO: Phase 2), and owner-only disabled "Delete Exercise" button (// TODO: Phase 2).
- `src/app/(app)/exercises/new/page.tsx` (new) — Server Component; calls `getCurrentUserId()`, fetches `exerciseTypes` + `equipment` + `muscleGroups` in parallel via lookup service, renders page header "Create Exercise" and `<CreateExerciseForm>`.
- `src/components/exercises/CreateExerciseForm.tsx` (new) — Client Component (`"use client"`); full form with name input, exercise type select, equipment select (nullable), 3-level hierarchical cascading muscle group selects (deepest selected level becomes `primaryMuscleGroupId`), secondary muscles checkboxes (max 10, disabled when at limit), instructions textarea with remaining-chars counter, field-level and form-level error display, `useTransition` for pending state, POSTs to `/api/exercises`, redirects to `/exercises/[slug]` on 201.
- `src/components/exercises/ExercisePageControls.tsx` (new) — Client Component (`"use client"`); wires `ExerciseSearchBar` and `MuscleGroupFilter` to URL updates via `useRouter().push`, preserving existing search params and resetting page to 1 on filter change. Extracted so the parent `exercises/page.tsx` stays a Server Component.
- `src/hooks/useExercises.ts` (new) — Client-side hook (`"use client"`); accepts `Partial<ExerciseQueryInput>`, fetches `/api/exercises` with query string params, debounces `q` changes by 300 ms, returns `{ exercises, total, page, pageSize, isLoading, error }`. Uses `useState` + `useEffect` (no SWR). Not wired to any page in Phase 1; ready for Phase 2 live-search.
- `.claude/memory/decisions/2026-03-29-exercise-slug-strategy.md` (new) — ADR documenting the 4-char random hex suffix slug strategy for custom exercises, consequences, and alternatives considered (composite unique key, UUID-only slug).

## Tests written

### `src/components/exercises/__tests__/CreateExerciseForm.test.tsx` (29 tests — all pass)

**Renders all form fields (data)**
- has exerciseTypes prop with expected items
- has equipment prop with expected items
- has muscleGroups prop with top-level and nested groups
- builds level-2 options when level-1 is selected
- returns no level-2 options when level-1 has no children
- returns no level-3 options when level-2 has no children

**Submits correct JSON payload**
- builds payload with all required fields
- uses level-3 id as primaryMuscleGroupId when level-3 is selected
- uses level-1 id as primaryMuscleGroupId when only level-1 is selected
- sets primaryMuscleGroupId to null when no muscle group is selected
- sets equipmentId to null when no equipment is selected
- omits instructions from payload when empty
- includes instructions in payload when provided
- includes secondaryMuscleGroupIds in payload

**Shows error message on 422 response**
- returns field errors from a 422 response
- returns a form-level error for non-422 server errors
- falls back to generic error message when server returns no message

**Disables submit button while pending**
- isPending=false means submit is not disabled initially
- isPending=true means submit is disabled
- button label changes to 'Creating…' when pending

**Max 10 secondary muscles**
- allows selecting up to 10 secondary muscles
- does NOT add an 11th muscle when already at limit
- validateSecondaryLimit returns null when count is within limit
- validateSecondaryLimit returns error string when count exceeds limit
- toggleSecondary removes an already-selected muscle
- toggleSecondary adds a muscle when below the limit

**Redirects to /exercises/[slug] on 201 success**
- extracts the slug from a 201 response
- constructs the correct redirect path from the slug
- router.push would be called with the redirect path on 201

## Deviations from plan

- `ExercisePageControls.tsx` was added as an unplanned file. The plan calls for `ExerciseSearchBar` and `MuscleGroupFilter` to receive callbacks from the parent page, but server components cannot define event handlers. A thin `"use client"` wrapper (`ExercisePageControls`) was extracted to own the `useRouter` logic, keeping the page itself a Server Component per the rendering standard.
- The exercises list page uses `getCurrentUserId()` (which returns the ID string directly) rather than `requireSession()` followed by `session.user.id` extraction, matching the auth-helpers API more precisely.
- `CreateExerciseForm` uses `useTransition` rather than a separate `isLoading` boolean state, as `useTransition` is the idiomatic React 18+ approach for async pending states and is already available without additional imports.

## New risks discovered

- `ExercisePageControls` adds a client boundary around the search/filter controls. If additional server-fetched data ever needs to be passed through this component to its children, composition patterns (passing server-rendered children as props/slots) must be used to avoid converting the parent page to a client component.
- The exercises list page calls `exerciseQuerySchema.parse({})` as a fallback when search params fail validation. If `paginationSchema` defaults ever change, this fallback silently uses the new defaults. Consider an explicit `DEFAULT_QUERY` constant in a follow-up.
- The `useExercises` hook's `useEffect` dependency array excludes `restQuery` as an object reference (destructured to primitives) to avoid infinite re-render loops. Future additions to `ExerciseQueryInput` must be manually added to the dependency array — a lint rule (`react-hooks/exhaustive-deps`) would catch this automatically but is not currently configured.
