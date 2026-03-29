# Progress

## Current Phase
**Phase 0 complete** — Ready for Phase 1: Exercise Library

## Status
- [x] Project brainstormed and scoped
- [x] Stack confirmed (Next.js + Drizzle + PostgreSQL + Auth.js v5 + Tailwind)
- [x] Design system established (Dark OLED, Barlow fonts, blue + orange)
- [x] Implementation plan written (4 phases)
- [x] Project scaffolded (CLAUDE.md + memory files)
- [x] Phase 0: Scaffold & Infrastructure
- [ ] Phase 1: Exercise Library
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

## Next
Run `/implement` to start Phase 1: Exercise Library
- Exercise list page (browse global + custom exercises)
- Exercise detail page
- Create custom exercise flow (exercise type, equipment, muscle groups)
- Exercise search + filter by muscle group
- API: GET /exercises, POST /exercises, GET /exercises/[id]

## Open Decisions (resolved)
- Bodyweight exercises: `weight = null`, treated as reps-only
- Unit storage: always kg server-side, convert on display
- Custom vs global exercises: no promotion path in MVP
- Concurrent sessions: enforce server-side (ConflictError) + client warning
- Offline support: in-memory queue (not full PWA) for MVP
