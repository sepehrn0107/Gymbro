# Progress

## Current Phase
**Planning complete** — Ready to implement

## Status
- [x] Project brainstormed and scoped
- [x] Stack confirmed (Next.js + Drizzle + PostgreSQL + Auth.js v5 + Tailwind)
- [x] Design system established (Dark OLED, Barlow fonts, blue + orange)
- [x] Implementation plan written (4 phases)
- [x] Project scaffolded (CLAUDE.md + memory files)
- [ ] Phase 0: Scaffold & Infrastructure
- [ ] Phase 1: Exercise Library
- [ ] Phase 2: Active Workout
- [ ] Phase 3: History & Progress
- [ ] Phase 4: Polish & Production Readiness

## Next
Run `/implement` to start Phase 0:
- Bootstrap Next.js app
- Configure Drizzle + Docker Postgres
- Set up Auth.js v5
- Write schema + initial migration
- Seed global exercise data

## Open Decisions (resolved)
- Bodyweight exercises: `weight = null`, treated as reps-only
- Unit storage: always kg server-side, convert on display
- Custom vs global exercises: no promotion path in MVP
- Concurrent sessions: enforce server-side (ConflictError) + client warning
- Offline support: in-memory queue (not full PWA) for MVP
