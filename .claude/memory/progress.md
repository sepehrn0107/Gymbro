# Progress

## Current Phase
**Phase 1 complete** — Ready for Phase 2: Active Workout

## Status
- [x] Project brainstormed and scoped
- [x] Stack confirmed (Next.js + Drizzle + PostgreSQL + Auth.js v5 + Tailwind)
- [x] Design system established (Dark OLED, Barlow fonts, blue + orange)
- [x] Implementation plan written (4 phases)
- [x] Project scaffolded (CLAUDE.md + memory files)
- [x] Phase 0: Scaffold & Infrastructure
- [x] Phase 1: Exercise Library
- [ ] Phase 2: Active Workout
- [ ] Phase 3: History & Progress
- [ ] Phase 4: Polish & Production Readiness

## Phase 0 Delivered (2026-03-29)
- Next.js 15 project: package.json, tsconfig, next.config.ts, tailwind (dark OLED design tokens), postcss, ESLint, Prettier
- Docker Compose + PostgreSQL 16 + multi-stage Dockerfile
- Drizzle ORM: drizzle.config.ts, db singleton (pg Pool with hot-reload guard)
- Full schema: auth (Auth.js adapter-compatible), otp_tokens, exercises (hierarchical muscle_groups), workouts/sets
- Auth.js v5: Google OAuth + Credentials, database sessions, DrizzleAdapter
- Auth flows: register, email OTP verification, forgot/reset password, change password
- Lib utilities: errors.ts, api-response.ts, units.ts, email.ts (nodemailer/Ethereal), validations/
- Types: domain.ts (union types), api.ts (response envelope)
- UI shell: root layout, globals.css (Barlow fonts), (auth) group pages (login, register, verify-email, forgot/reset password), (app) shell with BottomNav, dashboard stub
- Seed: 25 global exercises, full muscle group tree, exercise types, equipment
- Tests: 81 tests passing (units, errors, validations, BottomNav, auth routes)

## Phase 1 Delivered (2026-03-29)
- API: GET/POST /api/exercises, GET /api/exercises/[id], GET /api/muscle-groups, GET /api/exercise-types, GET /api/equipment
- Services: exercise.service.ts (list, getById, getBySlug, create with slug collision retry), lookup.service.ts
- Lib: slug.ts (generateCustomSlug/generateGlobalSlug), validations/exercises.ts (createExerciseSchema, exerciseQuerySchema)
- Domain types: MuscleGroup, ExerciseType, EquipmentItem, ExerciseListItem, ExerciseDetail
- Pages: /exercises (server, search+filter+pagination), /exercises/[slug] (detail), /exercises/new (create form)
- Components: ExerciseCard, ExerciseList, MuscleGroupFilter, ExerciseSearchBar, CreateExerciseForm, ExercisePageControls
- Hook: useExercises.ts (client-side, ready for Phase 2)
- ADR: .claude/memory/decisions/2026-03-29-exercise-slug-strategy.md
- Tests: 137 new tests (service, validation, API routes, components)

## Retrospective (2026-03-29)
- Ran retro on Playwright setup
- toolbox PR #24: new `/add-e2e-playwright` skill + Next.js `testing.md` standard
- Global memory: `playwright_cli_pattern.md`

## Next
Run `/implement` to start Phase 2: Active Workout
- Start / finish a workout session
- Add exercises to active workout
- Log sets with last-session pre-fill hint (reps, weight, duration, restTime, RPE)
- Concurrent session enforcement (ConflictError)
- API: POST /workouts, PATCH /workouts/[id], POST /workouts/[id]/exercises, POST /workouts/[id]/exercises/[exId]/sets

## Open Decisions (resolved)
- Bodyweight exercises: `weight = null`, treated as reps-only
- Unit storage: always kg server-side, convert on display
- Custom vs global exercises: no promotion path in MVP
- Concurrent sessions: enforce server-side (ConflictError) + client warning
- Offline support: in-memory queue (not full PWA) for MVP
