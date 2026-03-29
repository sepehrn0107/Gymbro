# Ticket Context

## Ticket
Implement Phase 1: Exercise Library. Add the exercise browse/search page showing global and user-created custom exercises, an exercise detail page, a create-custom-exercise flow (with exercise type, equipment, and muscle group selection), search and filter by muscle group, and the backing REST API endpoints: GET /api/exercises, POST /api/exercises, GET /api/exercises/[id]. Also expose GET /api/muscle-groups, GET /api/exercise-types, and GET /api/equipment for the create flow dropdowns.

## Stack
Next.js 15 (App Router, TypeScript) + Drizzle ORM + PostgreSQL + Auth.js v5 + Tailwind CSS (Dark OLED design system)

## Index available
false

## Project summary
- project_context: GymBro — mobile-first gym workout tracker; users log exercises, sets, reps, weight during gym sessions on a phone
- stack: Next.js 15 App Router + REST Route Handlers + Drizzle ORM + PostgreSQL + Auth.js v5 + Tailwind CSS (Dark OLED)
- architecture: Route Handler → Service → DB layering; exercises are global (is_global=true) or user-scoped; hierarchical muscle_groups; exercises page already stubbed under src/app/(app)/exercises/
- progress: Phase 0 scaffold complete (Next.js, Drizzle, Auth.js, schema, seed, 81 passing tests); Phase 1 is next
